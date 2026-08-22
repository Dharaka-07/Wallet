const { ethers } = require("ethers");
const { getNetworkConfig } = require("./config");

function connectNetwork(network = "sepolia") {

    const config = getNetworkConfig(network);

    return new ethers.JsonRpcProvider(
        config.rpcUrl,
        {
            chainId: config.chainId,
            name: config.name
        }
    );
}

module.exports = {
    connectNetwork
};