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

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// LOCAL FILES
// ==========================================

const WALLET_FILE = path.join(
    __dirname,
    "wallet.json"
);

const HISTORY_FILE = path.join(
    __dirname,
    "transaction-history.json"
);

// ==========================================
// TEMPORARY WALLET STATE
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
// CREATE WALLET
// ==========================================

app.post("/api/create-wallet", (req, res) => {
    try {

        // Don't create another wallet
        if (fs.existsSync(WALLET_FILE)) {
            return res.status(409).json({
                error: "Wallet already exists"
            });
        }

        const wallet = createWallet();

        pendingWallet = wallet;

        res.json({
            success: true,
            address: wallet.address,
            mnemonic: wallet.mnemonic.phrase
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
// CONFIRM WALLET + CREATE PASSWORD
// ==========================================

app.post(
    "/api/confirm-wallet",
    async (req, res) => {

        try {

            const { password } = req.body;

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

            const encryptedWallet =
                await encryptWallet(
                    pendingWallet,
                    password
                );

            fs.writeFileSync(
                WALLET_FILE,
                encryptedWallet
            );

            const address =
                pendingWallet.address;

            unlockedWallet =
                await ethers.Wallet.fromEncryptedJson(
                    encryptedWallet,
                    password
                );

            pendingWallet = null;

            res.json({
                success: true,
                address
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
// IMPORT WALLET
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

            const wallet =
                importWallet(
                    mnemonic.trim()
                );

            const encryptedWallet =
                await encryptWallet(
                    wallet,
                    password
                );

            fs.writeFileSync(
                WALLET_FILE,
                encryptedWallet
            );

            unlockedWallet =
                await ethers.Wallet.fromEncryptedJson(
                    encryptedWallet,
                    password
                );

            res.json({
                success: true,
                address: wallet.address
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
// WALLET STATUS
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
                    encryptedWallet.address
                        ? "0x" +
                          encryptedWallet.address
                        : null
            });

        } catch (error) {

            console.error(
                "WALLET STATUS ERROR:",
                error
            );

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

            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    error:
                        "Password is required"
                });
            }

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

            console.error(
                "UNLOCK ERROR:",
                error
            );

            res.status(401).json({
                error:
                    "Incorrect password"
            });
        }
    }
);

// ==========================================
// GET LIVE WALLET BALANCE
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
                connectNetwork("sepolia");

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
                balance
            });

        } catch (error) {

            console.error(
                "WALLET API ERROR:",
                error
            );

            res.status(500).json({
                error: error.message
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
                connectNetwork("sepolia");

            const balance =
                await getBalance(
                    provider,
                    unlockedWallet.address
                );

            res.json({
                address:
                    unlockedWallet.address,
                balance
            });

        } catch (error) {

            console.error(
                "BALANCE ERROR:",
                error
            );

            res.status(500).json({
                error: error.message
            });
        }
    }
);

// ==========================================
// SAVE HISTORY
// ==========================================

function saveHistory(transaction) {

    let history = [];

    try {

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

    } catch (error) {

        console.error(
            "READ HISTORY ERROR:",
            error
        );

        history = [];
    }

    history.unshift(transaction);

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
// GET HISTORY
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

            console.error(
                "HISTORY ERROR:",
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

            // Validate receiver
            if (!to || !ethers.isAddress(to)) {
                return res.status(400).json({
                    error:
                        "Invalid receiver address"
                });
            }

            // Validate amount
            if (
                amount === undefined ||
                amount === null ||
                amount === "" ||
                Number(amount) <= 0
            ) {
                return res.status(400).json({
                    error:
                        "Invalid ETH amount"
                });
            }

            let value;

            try {

                value =
                    ethers.parseEther(
                        String(amount)
                    );

            } catch (error) {

                return res.status(400).json({
                    error:
                        "Invalid ETH amount"
                });
            }

            const provider =
                connectNetwork("sepolia");

            const signer =
                unlockedWallet.connect(
                    provider
                );

            // Current balance
            const balance =
                await provider.getBalance(
                    signer.address
                );

            // Gas estimate
            const feeData =
                await provider.getFeeData();

            const gasPrice =
                feeData.gasPrice || 0n;

            const estimatedGas =
                21000n;

            const estimatedFee =
                gasPrice *
                estimatedGas;

            const required =
                value +
                estimatedFee;

            if (balance < required) {
                return res.status(400).json({
                    error:
                        "Insufficient ETH balance for amount + gas fee"
                });
            }

            // Send transaction
            const tx =
                await signer.sendTransaction({
                    to,
                    value
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

                to,

                amount:
                    String(amount),

                hash:
                    tx.hash,

                status:
                    receipt &&
                    receipt.status === 1
                        ? "confirmed"
                        : "failed",

                timestamp:
                    new Date().toISOString()
            };

            saveHistory(transaction);

            res.json({
                success: true,
                transaction
            });

        } catch (error) {

            console.error(
                "SEND ERROR:",
                error
            );

            res.status(500).json({
                error:
                    error.reason ||
                    error.shortMessage ||
                    error.message
            });
        }
    }
);

// ==========================================
// VERCEL / SERVER START
// ==========================================

// IMPORTANT:
// Do NOT use app.listen() on Vercel.

if (require.main === module) {

    const PORT =
        process.env.PORT || 3000;

    app.listen(
        PORT,
        () => {
            console.log(
                `ZunoX running at http://localhost:${PORT}`
            );
        }
    );
}

// Export Express app for Vercel
module.exports = app;