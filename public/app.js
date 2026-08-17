initializeZunoX();
let currentAddress = null;

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
// CHECK WALLET ON START
// ==========================================

async function initializeZunoX() {

    try {

        const response =
            await fetch("/api/wallet-status");

        const data =
            await response.json();

        if (data.exists) {

            // Existing wallet
            // Don't create another wallet
            showScreen(unlockScreen);

        } else {

            // First time
            showScreen(welcomeScreen);
        }

    } catch (error) {

        console.error(
            "INITIALIZATION ERROR:",
            error
        );

        showScreen(welcomeScreen);
    }
}


// ==========================================
// CREATE NEW WALLET
// ==========================================

createBtn.addEventListener(
    "click",
    async () => {

        try {

            const response =
                await fetch(
                    "/api/create-wallet",
                    {
                        method: "POST"
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to create wallet"
                );
            }


            // Store address temporarily
            currentAddress =
                data.address;


            // ==================================
            // SHOW 12 WORD RECOVERY PHRASE
            // ==================================

            const phraseGrid =
                document.getElementById(
                    "phraseGrid"
                );


            const words =
                data.mnemonic
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


            // Go to recovery phrase screen
            showScreen(
                phraseScreen
            );

        } catch (error) {

            console.error(
                "CREATE WALLET ERROR:",
                error
            );

            alert(error.message);
        }
    }
);


// ==========================================
// CONFIRM RECOVERY PHRASE
// ==========================================

confirmBtn.addEventListener(
    "click",
    () => {

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


        // Password validation
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


        try {

            const response =
                await fetch(
                    "/api/confirm-wallet",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to save wallet"
                );
            }


            currentAddress =
                data.address;


            // Clear password fields
            document.getElementById(
                "walletPassword"
            ).value = "";

            document.getElementById(
                "confirmPassword"
            ).value = "";


            // Load wallet dashboard
            await loadDashboard();

        } catch (error) {

            console.error(
                "PASSWORD ERROR:",
                error
            );

            alert(error.message);
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

            const response =
                await fetch(
                    "/api/unlock",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Incorrect password"
                );
            }


            currentAddress =
                data.address;


            // Clear password
            document.getElementById(
                "unlockPassword"
            ).value = "";


            // Open dashboard
            await loadDashboard();

        } catch (error) {

            console.error(
                "UNLOCK ERROR:",
                error
            );

            alert(error.message);
        }
    }
);


// ==========================================
// LOAD WALLET DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/wallet"
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load wallet"
            );
        }


        // ==================================
        // STORE CURRENT ADDRESS
        // ==================================

        currentAddress =
            data.address;


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
        // BALANCE
        // ==================================

        const balanceElement =
            document.getElementById(
                "balance"
            );

        if (balanceElement) {

            balanceElement.textContent =
                `${data.balance} ETH`;
        }


        // ==================================
        // AVAILABLE BALANCE
        // ==================================

        const availableBalance =
            document.getElementById(
                "availableBalance"
            );

        if (availableBalance) {

            availableBalance.textContent =
                `Available: ${data.balance} ETH`;
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
        // SHOW DASHBOARD
        // ==================================

        showScreen(
            dashboardScreen
        );


        // Load transaction history
        loadHistory();

    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

        alert(error.message);
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

                copyAddressBtn.textContent = "✓";

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
// LOAD TRANSACTION HISTORY
// ==========================================

async function loadHistory() {

    try {

        const response =
            await fetch(
                "/api/history"
            );


        if (!response.ok) {
            return;
        }


        const history =
            await response.json();


        const historyContainer =
            document.getElementById(
                "history"
            );


        if (!historyContainer) {
            return;
        }


        if (!history.length) {

            historyContainer.innerHTML = `
                <div class="empty">
                    No transactions yet
                </div>
            `;

            return;
        }


        historyContainer.innerHTML =
            history
                .map(
                    transaction => `

                        <div class="transaction-item">

                            <div>
                                <strong>
                                    ${transaction.type === "sent"
                                        ? "↑ Sent"
                                        : "↓ Received"}
                                </strong>

                                <small>
                                    ${transaction.timestamp
                                        ? new Date(
                                            transaction.timestamp
                                          ).toLocaleString()
                                        : ""}
                                </small>
                            </div>

                            <div>
                                ${transaction.amount || "0"} ETH
                            </div>

                        </div>

                    `
                )
                .join("");


    } catch (error) {

        console.error(
            "HISTORY ERROR:",
            error
        );
    }
}


// ==========================================
// START ZUNOX
// ==========================================

initializeZunoX();

// ==========================================
// SEND / RECEIVE BUTTONS
// ==========================================

const sendBtn =
    document.getElementById("sendBtn");

const receiveBtn =
    document.getElementById("receiveBtn");

const sendPanel =
    document.getElementById("sendPanel");

const receivePanel =
    document.getElementById("receivePanel");

const confirmSendPanel =
    document.getElementById("confirmSendPanel");


// ==========================================
// OPEN RECEIVE
// ==========================================

receiveBtn.addEventListener("click", () => {

    receivePanel.classList.remove("hidden");

    sendPanel.classList.add("hidden");

    confirmSendPanel.classList.add("hidden");

    const receiveAddress =
        document.getElementById("receiveAddress");

    receiveAddress.textContent =
        currentAddress || "0x...";

});


// ==========================================
// CLOSE RECEIVE
// ==========================================

document
    .getElementById("closeReceiveBtn")
    .addEventListener("click", () => {

        receivePanel.classList.add("hidden");

    });


// ==========================================
// COPY RECEIVE ADDRESS
// ==========================================

document
    .getElementById("copyReceiveBtn")
    .addEventListener("click", async () => {

        if (!currentAddress) {
            alert("Wallet address not available");
            return;
        }

        await navigator.clipboard.writeText(
            currentAddress
        );

        alert("Wallet address copied!");
    });


// ==========================================
// OPEN SEND
// ==========================================

sendBtn.addEventListener("click", async () => {

    sendPanel.classList.remove("hidden");

    receivePanel.classList.add("hidden");

    confirmSendPanel.classList.add("hidden");

    document.getElementById(
        "receiverAddress"
    ).value = "";

    document.getElementById(
        "sendAmount"
    ).value = "";

    // Get latest balance
    try {

        const response =
            await fetch("/api/balance");

        const data =
            await response.json();

        if (response.ok) {

            document.getElementById(
                "availableBalance"
            ).textContent =
                `Available: ${data.balance} ETH`;

        }

    } catch (error) {

        console.error(
            "BALANCE ERROR:",
            error
        );

    }

});


// ==========================================
// CLOSE SEND
// ==========================================

document
    .getElementById("closeSendBtn")
    .addEventListener("click", () => {

        sendPanel.classList.add("hidden");

    });


// ==========================================
// CONTINUE SEND
// ==========================================

document
    .getElementById("continueSendBtn")
    .addEventListener("click", () => {

        const receiver =
            document.getElementById(
                "receiverAddress"
            ).value.trim();

        const amount =
            document.getElementById(
                "sendAmount"
            ).value.trim();


        if (!receiver) {

            alert(
                "Enter the receiver address."
            );

            return;
        }


        if (!receiver.startsWith("0x") ||
            receiver.length !== 42) {

            alert(
                "Enter a valid Ethereum address."
            );

            return;
        }


        if (!amount ||
            Number(amount) <= 0) {

            alert(
                "Enter a valid ETH amount."
            );

            return;
        }


        // Show confirmation
        document.getElementById(
            "confirmAmount"
        ).textContent =
            `${amount} ETH`;


        document.getElementById(
            "confirmReceiver"
        ).textContent =
            receiver;


        sendPanel.classList.add("hidden");

        confirmSendPanel.classList.remove(
            "hidden"
        );

    });


// ==========================================
// BACK TO SEND
// ==========================================

document
    .getElementById("backToSendBtn")
    .addEventListener("click", () => {

        confirmSendPanel.classList.add(
            "hidden"
        );

        sendPanel.classList.remove(
            "hidden"
        );

    });


// ==========================================
// CONFIRM & SEND
// ==========================================

document
    .getElementById("confirmSendBtn")
    .addEventListener("click", async () => {

        const receiver =
            document.getElementById(
                "receiverAddress"
            ).value.trim();

        const amount =
            document.getElementById(
                "sendAmount"
            ).value.trim();


        try {

            const button =
                document.getElementById(
                    "confirmSendBtn"
                );

            button.disabled = true;

            button.textContent =
                "Sending...";


            const response =
                await fetch(
                    "/api/send",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            to: receiver,
                            amount: amount
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Transaction failed"
                );

            }


            alert(
                "Transaction sent successfully!"
            );


            confirmSendPanel.classList.add(
                "hidden"
            );


            // Clear fields
            document.getElementById(
                "receiverAddress"
            ).value = "";

            document.getElementById(
                "sendAmount"
            ).value = "";


            // Refresh wallet
            await loadDashboard();


        } catch (error) {

            console.error(
                "SEND ERROR:",
                error
            );

            alert(
                error.message
            );

        } finally {

            const button =
                document.getElementById(
                    "confirmSendBtn"
                );

            button.disabled = false;

            button.textContent =
                "Confirm & Send";

        }

    });


// ==========================================
// REFRESH BALANCE
// ==========================================

document
    .getElementById("refreshBtn")
    .addEventListener("click", async () => {

        await loadDashboard();

    });