import 'dotenv/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

module.exports = {
  defaultNetwork: 'hardhat',
  networks:
    !process.env.FORK && process.env.TEST
      ? {}
      : {
          hardhat: {
            forking: {
              enabled: process.env.FORK ? true : false,
              url: process.env.MAINNET_HTTPS_URL,
            },
          },
          // localMainnet: {
          //   url: process.env.LOCAL_MAINNET_HTTPS_URL,
          //   accounts: [process.env.LOCAL_MAINNET_PRIVATE_KEY],
          // },
          mainnet: {
            url: process.env.MAINNET_HTTPS_URL,
            accounts: [process.env.MAINNET_PRIVATE_KEY],
            gasPrice: 82000000000, // 82 gwei
          },
          staticMainnet: {
            url: process.env.MAINNET_HTTPS_URL,
            accounts: [
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            ],
            gasPrice: 1, // 1 wei
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
