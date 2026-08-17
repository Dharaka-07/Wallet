const wallet = require("./wallet");
const network = require("./network");
const balance = require("./balance");
const transaction = require("./transaction");
const config = require("./config");

module.exports = {
    ...wallet,
    ...network,
    ...balance,
    ...transaction,
    ...config
};