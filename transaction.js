const { ethers } = require("ethers");
const fs = require("fs");
const readline = require("readline");

const walletData = JSON.parse(
    fs.readFileSync("wallet.json", "utf8")
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function main() {

    try {

        // User inputs
        const rpcUrl = await ask("Enter RPC URL: ");
        const fromAddress = await ask("Enter FROM Address: ");
        const toAddress = await ask("Enter TO Address: ");
        const amount = await ask("Enter Amount in ETH: ");
        const message = await ask("Enter Message: ");

        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Check FROM address
        if (
            fromAddress.toLowerCase() !==
            walletData.address.toLowerCase()
        ) {
            console.log("\nERROR: FROM address does not match wallet.json");
            rl.close();
            return;
        }

        // Create wallet
        const wallet = new ethers.Wallet(
            walletData.privateKey,
            provider
        );

        // Check balance
        const balance = await provider.getBalance(wallet.address);

        console.log("\nWallet Address:", wallet.address);
        console.log(
            "Balance:",
            ethers.formatEther(balance),
            "ETH"
        );

        // Create message containing FROM and TO
        const signatureMessage =
            `FROM: ${fromAddress}\n` +
            `TO: ${toAddress}\n` +
            `MESSAGE: ${message}`;

        // Sign message
        const signature = await wallet.signMessage(signatureMessage);

        console.log("\nMessage signed successfully!");
        console.log("Signature:", signature);

        // Create transaction
        const tx = {
            to: toAddress,
            value: ethers.parseEther(amount)
        };

        console.log("\nSending transaction...");

        // Send transaction
        const transaction = await wallet.sendTransaction(tx);

        console.log("\nTransaction sent!");
        console.log("Transaction Hash:", transaction.hash);

        // Wait for confirmation
        const receipt = await transaction.wait();

        console.log("\nTransaction confirmed!");
        console.log("Block Number:", receipt.blockNumber);
        console.log("Transaction Hash:", receipt.hash);

    } catch (error) {

        console.log("\nTransaction failed!");

        if (error.shortMessage) {
            console.log("Error:", error.shortMessage);
        } else {
            console.log("Error:", error.message);
        }

    } finally {
        rl.close();
    }
}

main();