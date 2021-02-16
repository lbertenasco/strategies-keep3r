const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');

const prompt = new Confirm(
  'Do you wish to add strategies to GenericV2Keep3rJob contract?'
);

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          // Setup deployer
          const [owner] = await ethers.getSigners();
          let deployer;
          if (owner.address == config.accounts.mainnet.deployer) {
            deployer = owner;
          } else {
            await hre.network.provider.request({
              method: 'hardhat_impersonateAccount',
              params: [config.accounts.mainnet.deployer],
            });
            deployer = owner.provider.getUncheckedSigner(
              config.accounts.mainnet.deployer
            );
          }

          console.time('GenericV2Keep3rJob add strategies');
          const escrowContracts = config.contracts.mainnet.escrow;

          genericV2Keep3rJob = await ethers.getContractAt(
            'GenericV2Keep3rJob',
            escrowContracts.jobs.genericV2Keep3rJob,
            deployer
          );

          // Add strategies to genericV2Keep3rJob
          const strategies = [
            {
              address: '0x4031afd3B0F71Bace9181E554A9E680Ee4AbE7dF',
              harvest: 2_000_000,
              tend: 2_000_000,
              name: 'DAI Lev Comp',
            },
            {
              address: '0x4D7d4485fD600c61d840ccbeC328BfD76A050F87',
              harvest: 2_000_000,
              tend: 2_000_000,
              name: 'USDC Lev Comp',
            },
            {
              address: '0x7D960F3313f3cB1BBB6BF67419d303597F3E2Fa8',
              harvest: 1_000_000,
              tend: 0,
              name: 'DAI AH Earn',
            },
            {
              address: '0x86Aa49bf28d03B1A4aBEb83872cFC13c89eB4beD',
              harvest: 1_000_000,
              tend: 0,
              name: 'USDC AH Earn',
            },
            {
              address: '0xebfC9451d19E8dbf36AAf547855b4dC789CA793C',
              harvest: 1_500_000,
              tend: 0,
              name: 'stETH Curve',
            },
            {
              address: '0x414D8F5c21dAF33105eE6416bcdA99a50A47C0e5',
              harvest: 2_500_000,
              tend: 0,
              name: 'Idle USDC',
            },
            {
              address: '0x71041489ddAb466de443eC4Ea39D60b54193BcA1',
              harvest: 2_500_000,
              tend: 0,
              name: 'Idle WBTC',
            },
          ];

          await genericV2Keep3rJob.addStrategies(
            strategies.map((strategy) => strategy.address),
            strategies.map((strategy) => e18.mul(strategy.harvest)),
            strategies.map((strategy) => e18.mul(strategy.tend))
          );

          console.timeEnd('GenericV2Keep3rJob add strategies');

          resolve();
        } else {
          console.error('Aborted!');
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
