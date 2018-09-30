require('dotenv').config()
const PrivateKeyProvider = require('truffle-privatekey-provider')

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 500
    },

    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode', 'evm.gasEstimates']
      }
    },
  },

  mocha: {
    useColors: true,
    ui: 'bdd',
  },

  networks: {
    rinkeby: {
      provider: new PrivateKeyProvider(process.env.PRIVATE_KEY, "https://rinkeby.infura.io/"),
      network_id: 4
    },
    mainnet: {
      provider: new PrivateKeyProvider(process.env.PRIVATE_KEY, "https://mainnet.infura.io/"),
      network_id: 1
    }
  },
};
