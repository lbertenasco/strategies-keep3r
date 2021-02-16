import 'dotenv/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { utils } from 'ethers';

module.exports = {
  defaultNetwork: 'hardhat',
  networks: process.env.TEST
    ? {}
    : {
        hardhat: {
          enabled: process.env.FORK ? true : false,
          forking: {
            url: process.env.MAINNET_HTTPS_URL,
          },
        },
        localMainnet: {
          url: process.env.LOCAL_MAINNET_HTTPS_URL,
          accounts: [process.env.LOCAL_MAINNET_PRIVATE_KEY],
        },
        mainnet: {
          url: process.env.MAINNET_HTTPS_URL,
          accounts: [process.env.MAINNET_PRIVATE_KEY],
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
    timeout: process.env.MOCHA_TIMEOUT,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: process.env.COINMARKETCAP_DEFAULT_CURRENCY,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== 'hardhat'),
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
