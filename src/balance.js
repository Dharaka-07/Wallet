const { ethers } = require("ethers");

async function getBalance(provider, address) {

    if (!ethers.isAddress(address)) {
        throw new Error("Invalid wallet address");
    }

    const balance =
        await provider.getBalance(address);

    return ethers.formatEther(balance);
}

module.exports = {
    getBalance
};