require('@nomiclabs/hardhat-waffle');
require("@nomiclabs/hardhat-ganache");
require('hardhat-gas-reporter');

const config = require('./.config.json');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemy.mainnet.apiKey}`,
      }
    },
    ganache: {
      url: "http://127.0.0.1:8545",
      gasLimit: 6000000000,
      defaultBalanceEther: 100,
      fork: `https://mainnet.infura.io/v3/${config.infura.apiKey}`,
      unlocked_accounts: ['0x1ea056C13F8ccC981E51c5f1CDF87476666D0A74'],
      keepAliveTimeout: 100000,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.6.8',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: '0.5.17',
      }
    ]
  },
  mocha: {
    timeout: 10*60*1000 // 10 minutes
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false,
    currency: 'USD',
    gasPrice: 100
  },
};

