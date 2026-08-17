const { ethers } = require("ethers");

function createWallet() {
    return ethers.Wallet.createRandom();
}

function importWallet(mnemonic) {
    return ethers.Wallet.fromPhrase(mnemonic);
}

async function encryptWallet(wallet, password) {
    if (!password || password.length < 8) {
        throw new Error("Password must contain at least 8 characters");
    }

    return await wallet.encrypt(password);
}

module.exports = {
    createWallet,
    importWallet,
    encryptWallet
};