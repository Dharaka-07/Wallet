const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const walletFile = path.join(__dirname, "..", "wallet.json");

function loadWallet() {
    if (!fs.existsSync(walletFile)) {
        throw new Error("Wallet not found");
    }

    return JSON.parse(
        fs.readFileSync(walletFile, "utf8")
    );
}

async function sendTransaction(provider, to, amount) {
    const walletData = loadWallet();

    if (!ethers.isAddress(to)) {
        throw new Error("Invalid receiver address");
    }

    if (!amount || Number(amount) <= 0) {
        throw new Error("Invalid ETH amount");
    }

    const wallet = new ethers.Wallet(
        walletData.privateKey,
        provider
    );

    const balance = await provider.getBalance(wallet.address);
    const value = ethers.parseEther(amount);

    if (balance < value) {
        throw new Error("Insufficient ETH balance");
    }

    const tx = await wallet.sendTransaction({
        to: to,
        value: value
    });

    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    return {
        hash: tx.hash,
        from: wallet.address,
        to: to,
        amount: amount
    };
}

module.exports = {
    sendTransaction
};