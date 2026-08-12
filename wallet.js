const { ethers } = require("ethers");
const fs = require("fs");

const wallet = ethers.Wallet.createRandom();

const walletData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    publicKey: wallet.publicKey
};

// Save wallet information to wallet.json
fs.writeFileSync(
    "wallet.json",
    JSON.stringify(walletData, null, 4)
);

// Display output
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("Mnemonic:", wallet.mnemonic.phrase);
console.log("Public Key:", wallet.publicKey);

console.log("\nWallet details saved to wallet.json");