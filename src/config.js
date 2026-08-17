const networks = {
    sepolia: {
        name: "Sepolia",
        chainId: 11155111,
        rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com"
    }
};

function getNetworkConfig(name = "sepolia") {
    const config = networks[name];

    if (!config) {
        throw new Error(`Network "${name}" is not supported`);
    }

    return config;
}

module.exports = {
    getNetworkConfig
};