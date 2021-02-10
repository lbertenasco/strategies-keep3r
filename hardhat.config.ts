import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-solhint';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import config from './.config.json';
import { utils } from 'ethers';

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      enabled: process.env.FORK ? true : false,
      accounts: [
        {
          privateKey: config.accounts.mainnet.privateKey,
          balance: utils.parseEther('1000').toString(),
        },
      ],
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemy.mainnet.apiKey}`,
      },
    },
    localMainnet: {
      url: 'http://127.0.0.1:8545',
      accounts: [config.accounts.mainnet.privateKey],
      gasMultiplier: 1.1,
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemy.mainnet.apiKey}`,
      accounts: [config.accounts.mainnet.privateKey],
      gasMultiplier: 1.1,
      gasPrice: 'auto',
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.5.17',
      },
    ],
  },
  mocha: {
    timeout: 10 * 60 * 1000, // 10 minutes
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: 'USD',
    gasPrice: 200,
    coinmarketcap: `${config.coinmarketcap.apiKey}`,
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== 'hardhat'),
  },
  etherscan: {
    apiKey: `${config.etherscan.apiKey}`,
  },
};
