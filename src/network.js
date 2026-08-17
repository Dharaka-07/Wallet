const { ethers } = require("ethers");

const SEPOLIA_RPC =
    "https://ethereum-sepolia-rpc.publicnode.com";

function connectNetwork(network) {

    if (network !== "sepolia") {
        throw new Error("Unsupported network");
    }

    return new ethers.JsonRpcProvider(
        SEPOLIA_RPC,
        {
            chainId: 11155111,
            name: "sepolia"
        }
    );
}

module.exports = {
    connectNetwork
};