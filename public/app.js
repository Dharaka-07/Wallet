// ==========================================
// ZUNOX CLIENT WALLET
// ==========================================

let currentWallet = null;
let currentAddress = null;

const SEPOLIA_RPC =
    "https://ethereum-sepolia-rpc.publicnode.com";

let provider = null;


// ==========================================
// SCREENS
// ==========================================

const welcomeScreen =
    document.getElementById("welcomeScreen");

const phraseScreen =
    document.getElementById("phraseScreen");

const passwordScreen =
    document.getElementById("passwordScreen");

const unlockScreen =
    document.getElementById("unlockScreen");

const dashboardScreen =
    document.getElementById("dashboardScreen");


// ==========================================
// BUTTONS
// ==========================================

const createBtn =
    document.getElementById("createBtn");

const importBtn =
    document.getElementById("importBtn");

const confirmBtn =
    document.getElementById("confirmBtn");

const savePasswordBtn =
    document.getElementById("savePasswordBtn");

const unlockBtn =
    document.getElementById("unlockBtn");


// ==========================================
// PROVIDER
// ==========================================

function getProvider() {

    if (!provider) {

        provider =
            new ethers.JsonRpcProvider(
                SEPOLIA_RPC
            );
    }

    return provider;
}


// ==========================================
// SHOW SCREEN
// ==========================================

function showScreen(screen) {

    welcomeScreen.classList.add("hidden");
    phraseScreen.classList.add("hidden");
    passwordScreen.classList.add("hidden");
    unlockScreen.classList.add("hidden");
    dashboardScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}


// ==========================================
// INITIALIZE
// ==========================================

async function initializeZunoX() {

    try {

        const exists =
            await hasLocalWallet();

        if (exists) {

            showScreen(
                unlockScreen
            );

        } else {

            showScreen(
                welcomeScreen
            );
        }

    } catch (error) {

        console.error(
            "INITIALIZATION ERROR:",
            error
        );

        showScreen(
            welcomeScreen
        );
    }
}


// ==========================================
// CREATE NEW WALLET
// ==========================================

createBtn.addEventListener(
    "click",
    async () => {

        try {

            // Generate wallet completely
            // inside the browser.

            const wallet =
                ethers.Wallet.createRandom();

            currentWallet =
                wallet;

            currentAddress =
                wallet.address;


            // ==================================
            // DISPLAY RECOVERY PHRASE
            // ==================================

            const phraseGrid =
                document.getElementById(
                    "phraseGrid"
                );

            const phrase =
                wallet.mnemonic.phrase;

            const words =
                phrase
                    .trim()
                    .split(/\s+/);


            phraseGrid.innerHTML =
                words
                    .map(
                        (word, index) => `
                            <div class="word">
                                <span class="word-number">
                                    ${index + 1}
                                </span>

                                <span>
                                    ${word}
                                </span>
                            </div>
                        `
                    )
                    .join("");


            showScreen(
                phraseScreen
            );

        } catch (error) {

            console.error(
                "CREATE WALLET ERROR:",
                error
            );

            alert(
                error.message
            );
        }
    }
);


// ==========================================
// CONFIRM RECOVERY PHRASE
// ==========================================

confirmBtn.addEventListener(
    "click",
    () => {

        if (!currentWallet) {

            alert(
                "Wallet session expired. Please create the wallet again."
            );

            showScreen(
                welcomeScreen
            );

            return;
        }

        showScreen(
            passwordScreen
        );
    }
);


// ==========================================
// CREATE PASSWORD
// ==========================================

savePasswordBtn.addEventListener(
    "click",
    async () => {

        const password =
            document.getElementById(
                "walletPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        if (!password) {

            alert(
                "Please create a password."
            );

            return;
        }


        if (password.length < 8) {

            alert(
                "Password must contain at least 8 characters."
            );

            return;
        }


        if (password !== confirmPassword) {

            alert(
                "Passwords do not match."
            );

            return;
        }


        if (!currentWallet) {

            alert(
                "Wallet session expired."
            );

            return;
        }


        try {

            savePasswordBtn.disabled =
                true;

            savePasswordBtn.textContent =
                "Encrypting Wallet...";


            // ==================================
            // ENCRYPT WALLET LOCALLY
            // ==================================

            const encryptedJson =
                await currentWallet.encrypt(
                    password
                );


            // ==================================
            // SAVE ONLY ENCRYPTED JSON
            // ==================================

            await saveEncryptedWallet(
                encryptedJson
            );


            // ==================================
            // CLEAR SENSITIVE TEMP DATA
            // ==================================

            document.getElementById(
                "walletPassword"
            ).value = "";

            document.getElementById(
                "confirmPassword"
            ).value = "";


            // ==================================
            // LOAD DASHBOARD
            // ==================================

            await loadDashboard();

        } catch (error) {

            console.error(
                "PASSWORD ERROR:",
                error
            );

            alert(
                error.message
            );

        } finally {

            savePasswordBtn.disabled =
                false;

            savePasswordBtn.textContent =
                "Create Wallet";
        }
    }
);


// ==========================================
// UNLOCK EXISTING WALLET
// ==========================================

unlockBtn.addEventListener(
    "click",
    async () => {

        const password =
            document.getElementById(
                "unlockPassword"
            ).value;


        if (!password) {

            alert(
                "Enter your password."
            );

            return;
        }


        try {

            unlockBtn.disabled =
                true;

            unlockBtn.textContent =
                "Unlocking...";


            // ==================================
            // GET LOCAL ENCRYPTED WALLET
            // ==================================

            const encryptedJson =
                await getEncryptedWallet();


            if (!encryptedJson) {

                throw new Error(
                    "No wallet found on this device."
                );
            }


            // ==================================
            // DECRYPT LOCALLY
            // ==================================

            const wallet =
                await ethers.Wallet.fromEncryptedJson(
                    encryptedJson,
                    password
                );


            currentWallet =
                wallet;

            currentAddress =
                wallet.address;


            document.getElementById(
                "unlockPassword"
            ).value = "";


            await loadDashboard();

        } catch (error) {

            console.error(
                "UNLOCK ERROR:",
                error
            );

            alert(
                "Incorrect password or corrupted wallet."
            );

        } finally {

            unlockBtn.disabled =
                false;

            unlockBtn.textContent =
                "Unlock";
        }
    }
);


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    if (!currentWallet) {

        alert(
            "Wallet is locked."
        );

        return;
    }


    try {

        currentAddress =
            currentWallet.address;


        // ==================================
        // FULL ADDRESS
        // ==================================

        const addressElement =
            document.getElementById(
                "address"
            );

        if (addressElement) {

            addressElement.textContent =
                currentAddress;
        }


        // ==================================
        // SHORT ADDRESS
        // ==================================

        const shortAddress =
            document.getElementById(
                "shortAddress"
            );

        if (shortAddress) {

            shortAddress.textContent =
                shortenAddress(
                    currentAddress
                );
        }


        // ==================================
        // RECEIVE ADDRESS
        // ==================================

        const receiveAddress =
            document.getElementById(
                "receiveAddress"
            );

        if (receiveAddress) {

            receiveAddress.textContent =
                currentAddress;
        }


        // ==================================
        // BALANCE
        // ==================================

        await refreshBalance();


        // ==================================
        // SHOW DASHBOARD
        // ==================================

        showScreen(
            dashboardScreen
        );


        // ==================================
        // LOAD BLOCKCHAIN HISTORY
        // ==================================

        await loadHistory();

    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

        alert(
            error.message
        );
    }
}


// ==========================================
// REFRESH BALANCE
// ==========================================

async function refreshBalance() {

    if (!currentAddress) {
        return;
    }


    try {

        const networkProvider =
            getProvider();


        const balance =
            await networkProvider.getBalance(
                currentAddress
            );


        const ethBalance =
            ethers.formatEther(
                balance
            );


        const balanceElement =
            document.getElementById(
                "balance"
            );

        if (balanceElement) {

            balanceElement.textContent =
                `${Number(ethBalance).toFixed(4)} ETH`;
        }


        const availableBalance =
            document.getElementById(
                "availableBalance"
            );

        if (availableBalance) {

            availableBalance.textContent =
                `Available: ${Number(ethBalance).toFixed(6)} ETH`;
        }


        return ethBalance;

    } catch (error) {

        console.error(
            "BALANCE ERROR:",
            error
        );
    }
}


// ==========================================
// SHORTEN ADDRESS
// ==========================================

function shortenAddress(address) {

    if (!address) {
        return "0x...";
    }

    if (address.length < 12) {
        return address;
    }

    return (
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );
}


// ==========================================
// COPY WALLET ADDRESS
// ==========================================

const copyAddressBtn =
    document.getElementById(
        "copyAddressBtn"
    );


if (copyAddressBtn) {

    copyAddressBtn.addEventListener(
        "click",
        async () => {

            if (!currentAddress) {
                return;
            }

            try {

                await navigator.clipboard.writeText(
                    currentAddress
                );

                copyAddressBtn.textContent =
                    "✓";

                setTimeout(() => {

                    copyAddressBtn.textContent =
                        "⧉";

                }, 1200);

            } catch (error) {

                console.error(
                    "COPY ERROR:",
                    error
                );
            }
        }
    );
}


// ==========================================
// TRANSACTION HISTORY
// ==========================================

async function loadHistory() {

    const historyContainer =
        document.getElementById(
            "history"
        );


    if (!historyContainer ||
        !currentAddress) {

        return;
    }


    try {

        historyContainer.innerHTML = `
            <div class="empty">
                Loading blockchain activity...
            </div>
        `;


        // ==================================
        // NOTE:
        // A normal Ethereum JSON-RPC provider
        // does NOT expose complete historical
        // transactions for an address.
        //
        // We therefore don't fake history.
        // ==================================

        historyContainer.innerHTML = `
            <div class="empty">
                Blockchain transaction history
                will be shown here.
            </div>
        `;

    } catch (error) {

        console.error(
            "HISTORY ERROR:",
            error
        );

        historyContainer.innerHTML = `
            <div class="empty">
                Unable to load activity.
            </div>
        `;
    }
}


// ==========================================
// RECEIVE
// ==========================================

const sendBtn =
    document.getElementById(
        "sendBtn"
    );

const receiveBtn =
    document.getElementById(
        "receiveBtn"
    );

const sendPanel =
    document.getElementById(
        "sendPanel"
    );

const receivePanel =
    document.getElementById(
        "receivePanel"
    );

const confirmSendPanel =
    document.getElementById(
        "confirmSendPanel"
    );


receiveBtn.addEventListener(
    "click",
    () => {

        receivePanel.classList.remove(
            "hidden"
        );

        sendPanel.classList.add(
            "hidden"
        );

        confirmSendPanel.classList.add(
            "hidden"
        );


        const receiveAddress =
            document.getElementById(
                "receiveAddress"
            );

        receiveAddress.textContent =
            currentAddress || "0x...";
    }
);


// ==========================================
// CLOSE RECEIVE
// ==========================================

document
    .getElementById(
        "closeReceiveBtn"
    )
    .addEventListener(
        "click",
        () => {

            receivePanel.classList.add(
                "hidden"
            );
        }
    );


// ==========================================
// COPY RECEIVE ADDRESS
// ==========================================

document
    .getElementById(
        "copyReceiveBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!currentAddress) {

                alert(
                    "Wallet address not available"
                );

                return;
            }


            await navigator.clipboard.writeText(
                currentAddress
            );

            alert(
                "Wallet address copied!"
            );
        }
    );


// ==========================================
// OPEN SEND
// ==========================================

sendBtn.addEventListener(
    "click",
    async () => {

        sendPanel.classList.remove(
            "hidden"
        );

        receivePanel.classList.add(
            "hidden"
        );

        confirmSendPanel.classList.add(
            "hidden"
        );


        document.getElementById(
            "receiverAddress"
        ).value = "";


        document.getElementById(
            "sendAmount"
        ).value = "";


        await refreshBalance();
    }
);


// ==========================================
// CLOSE SEND
// ==========================================

document
    .getElementById(
        "closeSendBtn"
    )
    .addEventListener(
        "click",
        () => {

            sendPanel.classList.add(
                "hidden"
            );
        }
    );


// ==========================================
// CONTINUE SEND
// ==========================================

document
    .getElementById(
        "continueSendBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const receiver =
                document.getElementById(
                    "receiverAddress"
                ).value.trim();

            const amount =
                document.getElementById(
                    "sendAmount"
                ).value.trim();


            // ==================================
            // VALIDATE ADDRESS
            // ==================================

            if (!receiver) {

                alert(
                    "Enter the receiver address."
                );

                return;
            }


            if (
                !ethers.isAddress(
                    receiver
                )
            ) {

                alert(
                    "Enter a valid Ethereum address."
                );

                return;
            }


            // ==================================
            // VALIDATE AMOUNT
            // ==================================

            if (
                !amount ||
                Number(amount) <= 0
            ) {

                alert(
                    "Enter a valid ETH amount."
                );

                return;
            }


            try {

                const provider =
                    getProvider();


                const balance =
                    await provider.getBalance(
                        currentAddress
                    );


                const amountWei =
                    ethers.parseEther(
                        amount
                    );


                if (
                    amountWei >= balance
                ) {

                    alert(
                        "Insufficient ETH balance."
                    );

                    return;
                }


                // ==================================
                // CONFIRMATION
                // ==================================

                document.getElementById(
                    "confirmAmount"
                ).textContent =
                    `${amount} ETH`;


                document.getElementById(
                    "confirmReceiver"
                ).textContent =
                    receiver;


                sendPanel.classList.add(
                    "hidden"
                );

                confirmSendPanel.classList.remove(
                    "hidden"
                );

            } catch (error) {

                console.error(
                    "SEND VALIDATION ERROR:",
                    error
                );

                alert(
                    error.message
                );
            }
        }
    );


// ==========================================
// BACK TO SEND
// ==========================================

document
    .getElementById(
        "backToSendBtn"
    )
    .addEventListener(
        "click",
        () => {

            confirmSendPanel.classList.add(
                "hidden"
            );

            sendPanel.classList.remove(
                "hidden"
            );
        }
    );


// ==========================================
// CONFIRM & SEND
// ==========================================

document
    .getElementById(
        "confirmSendBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!currentWallet) {

                alert(
                    "Wallet is locked."
                );

                return;
            }


            const receiver =
                document.getElementById(
                    "receiverAddress"
                ).value.trim();

            const amount =
                document.getElementById(
                    "sendAmount"
                ).value.trim();


            const button =
                document.getElementById(
                    "confirmSendBtn"
                );


            try {

                button.disabled =
                    true;

                button.textContent =
                    "Sending...";


                // ==================================
                // CONNECT WALLET TO PROVIDER
                // ==================================

                const signer =
                    currentWallet.connect(
                        getProvider()
                    );


                // ==================================
                // CREATE TRANSACTION
                // ==================================

                const transaction = {

                    to: receiver,

                    value:
                        ethers.parseEther(
                            amount
                        )
                };


                // ==================================
                // SIGN + BROADCAST
                // ==================================

                const tx =
                    await signer.sendTransaction(
                        transaction
                    );


                // ==================================
                // WAIT FOR CONFIRMATION
                // ==================================

                button.textContent =
                    "Confirming...";


                const receipt =
                    await tx.wait();


                console.log(
                    "TRANSACTION RECEIPT:",
                    receipt
                );


                alert(
                    `Transaction confirmed!\n\nTX Hash:\n${tx.hash}`
                );


                confirmSendPanel.classList.add(
                    "hidden"
                );


                document.getElementById(
                    "receiverAddress"
                ).value = "";

                document.getElementById(
                    "sendAmount"
                ).value = "";


                await loadDashboard();

            } catch (error) {

                console.error(
                    "SEND ERROR:",
                    error
                );


                let message =
                    "Transaction failed.";


                if (error?.reason) {
                    message =
                        error.reason;
                } else if (error?.shortMessage) {
                    message =
                        error.shortMessage;
                } else if (error?.message) {
                    message =
                        error.message;
                }


                alert(message);

            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "Confirm & Send";
            }
        }
    );


// ==========================================
// REFRESH BALANCE
// ==========================================

document
    .getElementById(
        "refreshBtn"
    )
    .addEventListener(
        "click",
        async () => {

            await refreshBalance();

            await loadHistory();
        }
    );


// ==========================================
// START ZUNOX
// ==========================================

initializeZunoX();