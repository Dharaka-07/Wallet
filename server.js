const express = require("express");
const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");

const {
    createWallet,
    importWallet,
    encryptWallet,
    connectNetwork,
    getBalance
} = require("./src");

const app = express();

const PORT = 3000;

const WALLET_FILE =
    path.join(__dirname, "wallet.json");

const HISTORY_FILE =
    path.join(__dirname, "transaction-history.json");

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ==========================================
// TEMPORARY WALLET STATES
// ==========================================

let pendingWallet = null;
let unlockedWallet = null;


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ==========================================
// CREATE NEW WALLET
// ==========================================

app.post("/api/create-wallet", (req, res) => {

    try {

        // Do not create another account
        if (fs.existsSync(WALLET_FILE)) {

            return res.status(409).json({
                error: "Wallet already exists"
            });

        }

        const wallet =
            createWallet();

        // Keep wallet temporarily
        // until user confirms phrase
        pendingWallet = wallet;

        res.json({

            success: true,

            address:
                wallet.address,

            mnemonic:
                wallet.mnemonic.phrase

        });

    } catch (error) {

        console.error(
            "CREATE WALLET ERROR:",
            error
        );

        res.status(500).json({
            error: error.message
        });

    }

});


// ==========================================
// CONFIRM WALLET + PASSWORD
// ==========================================

app.post(
    "/api/confirm-wallet",
    async (req, res) => {

        try {

            const {
                password
            } = req.body;


            if (!pendingWallet) {

                return res.status(400).json({
                    error:
                        "No wallet is waiting for confirmation"
                });

            }


            if (
                !password ||
                password.length < 8
            ) {

                return res.status(400).json({
                    error:
                        "Password must contain at least 8 characters"
                });

            }


            // Encrypt wallet
            const encryptedWallet =
                await encryptWallet(
                    pendingWallet,
                    password
                );


            // Save encrypted wallet
            fs.writeFileSync(
                WALLET_FILE,
                encryptedWallet
            );


            const address =
                pendingWallet.address;


            // Unlock current wallet
            unlockedWallet =
                await ethers.Wallet.fromEncryptedJson(
                    encryptedWallet,
                    password
                );


            // Clear temporary wallet
            pendingWallet = null;


            res.json({

                success: true,

                address: address

            });

        } catch (error) {

            console.error(
                "CONFIRM WALLET ERROR:",
                error
            );

            res.status(500).json({
                error: error.message
            });

        }

    }
);


// ==========================================
// IMPORT EXISTING WALLET
// ==========================================

app.post(
    "/api/import-wallet",
    async (req, res) => {

        try {

            const {
                mnemonic,
                password
            } = req.body;


            if (!mnemonic) {

                return res.status(400).json({
                    error:
                        "Recovery phrase is required"
                });

            }


            if (
                !password ||
                password.length < 8
            ) {

                return res.status(400).json({
                    error:
                        "Password must contain at least 8 characters"
                });

            }


            const words =
                mnemonic
                    .trim()
                    .split(/\s+/);


            if (words.length !== 12) {

                return res.status(400).json({
                    error:
                        "Recovery phrase must contain 12 words"
                });

            }


            // Recover wallet
            const wallet =
                importWallet(
                    mnemonic.trim()
                );


            // Encrypt recovered wallet
            const encryptedWallet =
                await encryptWallet(
                    wallet,
                    password
                );


            // Save encrypted wallet
            fs.writeFileSync(
                WALLET_FILE,
                encryptedWallet
            );


            // Unlock imported wallet
            unlockedWallet =
                await ethers.Wallet.fromEncryptedJson(
                    encryptedWallet,
                    password
                );


            res.json({

                success: true,

                address:
                    wallet.address

            });

        } catch (error) {

            console.error(
                "IMPORT WALLET ERROR:",
                error
            );

            res.status(400).json({
                error:
                    "Invalid recovery phrase"
            });

        }

    }
);


// ==========================================
// CHECK WALLET STATUS
// ==========================================

app.get(
    "/api/wallet-status",
    (req, res) => {

        if (!fs.existsSync(WALLET_FILE)) {

            return res.json({
                exists: false
            });

        }


        try {

            const encryptedWallet =
                JSON.parse(
                    fs.readFileSync(
                        WALLET_FILE,
                        "utf8"
                    )
                );


            res.json({

                exists: true,

                address:
                    "0x" +
                    encryptedWallet.address

            });

        } catch (error) {

            res.status(500).json({
                error:
                    "Invalid wallet file"
            });

        }

    }
);


// ==========================================
// UNLOCK WALLET
// ==========================================

app.post(
    "/api/unlock",
    async (req, res) => {

        try {

            const {
                password
            } = req.body;


            if (!fs.existsSync(WALLET_FILE)) {

                return res.status(404).json({
                    error:
                        "No wallet found"
                });

            }


            const encryptedWallet =
                fs.readFileSync(
                    WALLET_FILE,
                    "utf8"
                );


            // Decrypt wallet
            unlockedWallet =
                await ethers.Wallet.fromEncryptedJson(
                    encryptedWallet,
                    password
                );


            res.json({

                success: true,

                address:
                    unlockedWallet.address

            });

        } catch (error) {

            unlockedWallet = null;


            res.status(401).json({
                error:
                    "Incorrect password"
            });

        }

    }
);


// ==========================================
// GET WALLET + LIVE SEPOLIA BALANCE
// ==========================================

app.get(
    "/api/wallet",
    async (req, res) => {

        try {

            if (!unlockedWallet) {

                return res.status(401).json({
                    error:
                        "Wallet is locked"
                });

            }


            const provider =
                connectNetwork(
                    "sepolia"
                );


            const balance =
                await getBalance(
                    provider,
                    unlockedWallet.address
                );


            res.json({

                success: true,

                walletExists: true,

                address:
                    unlockedWallet.address,

                balance:
                    balance

            });

        } catch (error) {

            console.error(
                "WALLET API ERROR:",
                error
            );

            res.status(500).json({
                error:
                    error.message
            });

        }

    }
);


// ==========================================
// GET BALANCE
// ==========================================

app.get(
    "/api/balance",
    async (req, res) => {

        try {

            if (!unlockedWallet) {

                return res.status(401).json({
                    error:
                        "Wallet is locked"
                });

            }


            const provider =
                connectNetwork(
                    "sepolia"
                );


            const balance =
                await getBalance(
                    provider,
                    unlockedWallet.address
                );


            res.json({

                address:
                    unlockedWallet.address,

                balance:
                    balance

            });

        } catch (error) {

            res.status(500).json({
                error:
                    error.message
            });

        }

    }
);


// ==========================================
// SAVE TRANSACTION HISTORY
// ==========================================

function saveHistory(transaction) {

    let history = [];


    if (
        fs.existsSync(
            HISTORY_FILE
        )
    ) {

        history =
            JSON.parse(
                fs.readFileSync(
                    HISTORY_FILE,
                    "utf8"
                )
            );

    }


    history.unshift(
        transaction
    );


    fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(
            history,
            null,
            4
        )
    );

}


// ==========================================
// TRANSACTION HISTORY
// ==========================================

app.get(
    "/api/history",
    (req, res) => {

        try {

            if (
                !fs.existsSync(
                    HISTORY_FILE
                )
            ) {

                return res.json([]);

            }


            const history =
                JSON.parse(
                    fs.readFileSync(
                        HISTORY_FILE,
                        "utf8"
                    )
                );


            res.json(history);

        } catch (error) {

            res.status(500).json({
                error:
                    error.message
            });

        }

    }
);


// ==========================================
// SEND ETH
// ==========================================

app.post(
    "/api/send",
    async (req, res) => {

        try {

            if (!unlockedWallet) {

                return res.status(401).json({
                    error:
                        "Wallet is locked"
                });

            }


            const {
                to,
                amount
            } = req.body;


            if (!ethers.isAddress(to)) {

                return res.status(400).json({
                    error:
                        "Invalid receiver address"
                });

            }


            if (
                !amount ||
                Number(amount) <= 0
            ) {

                return res.status(400).json({
                    error:
                        "Invalid ETH amount"
                });

            }


            const provider =
                connectNetwork(
                    "sepolia"
                );


            // Connect unlocked wallet
            const signer =
                unlockedWallet.connect(
                    provider
                );


            // Check balance
            const balance =
                await provider.getBalance(
                    signer.address
                );


            const value =
                ethers.parseEther(
                    amount.toString()
                );


            if (balance < value) {

                return res.status(400).json({
                    error:
                        "Insufficient ETH balance"
                });

            }


            // Send transaction
            const tx =
                await signer.sendTransaction({

                    to: to,

                    value: value

                });


            console.log(
                "Transaction sent:",
                tx.hash
            );


            // Wait for confirmation
            const receipt =
                await tx.wait();


            const transaction = {

                type: "sent",

                from:
                    signer.address,

                to:
                    to,

                amount:
                    amount.toString(),

                hash:
                    tx.hash,

                status:
                    receipt.status === 1
                        ? "confirmed"
                        : "failed",

                timestamp:
                    new Date().toISOString()

            };


            saveHistory(
                transaction
            );


            res.json({

                success: true,

                transaction:
                    transaction

            });

        } catch (error) {

            console.error(
                "SEND ERROR:",
                error
            );


            res.status(500).json({
                error:
                    error.message
            });

        }

    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `ZunoX running at http://localhost:${PORT}`
        );

    }
);