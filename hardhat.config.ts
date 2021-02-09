import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ganache';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-solhint';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import config from './.config.json';

let hardhat = {};

if (process.env.FORK) { 
  hardhat = {
    forking: { 
      url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemy.mainnet.apiKey}`
    }
  };
}

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat,
    localMainnet: {
      url: 'http://127.0.0.1:8545',
      accounts: [config.accounts.mainnet.privateKey],
      gasMultiplier: 1.1,
    },
    ganache: {
      url: "http://127.0.0.1:8545",
      gasLimit: 6000000000,
      defaultBalanceEther: 100,
      fork: `https://mainnet.infura.io/v3/${config.infura.apiKey}`,
      unlocked_accounts: ['0x1ea056C13F8ccC981E51c5f1CDF87476666D0A74'],
      keepAliveTimeout: 100000,
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemy.mainnet.apiKey}`,
      accounts: [config.accounts.mainnet.privateKey],
      gasMultiplier: 1.1,
      gasPrice: 'auto'
    }
  },
  solidity: {
    compilers: [
      {
        version: '0.6.12',
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
    timeout: 10 * 60 * 1000 // 10 minutes
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false,
    currency: 'USD',
    gasPrice: 200,
    coinmarketcap: `${config.coinmarketcap.apiKey}`
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== 'hardhat' && hre.network.name !== 'localhost'),
  },
  etherscan: {
    apiKey: `${config.etherscan.apiKey}`
  }
};
