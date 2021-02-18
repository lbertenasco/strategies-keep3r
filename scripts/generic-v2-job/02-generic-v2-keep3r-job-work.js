const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, e18ToDecimal } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to work on GenericV2Keep3rJob contract?',
});

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
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

          // impersonate keeper
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [config.accounts.mainnet.keeper],
          });
          const keeper = owner.provider.getUncheckedSigner(
            config.accounts.mainnet.keeper
          );

          const escrowContracts = config.contracts.mainnet.escrow;

          genericV2Keep3rJob = await ethers.getContractAt(
            'GenericV2Keep3rJob',
            escrowContracts.jobs.genericV2Keep3rJob,
            keeper
          );

          const strategies = await genericV2Keep3rJob.strategies();
          console.log(strategies);

          // mommy credits
          console.log(
            'maxCredits:',
            e18ToDecimal(await genericV2Keep3rJob.maxCredits())
          );
          console.log(
            'usedCredits:',
            e18ToDecimal(await genericV2Keep3rJob.usedCredits())
          );

          for (const strategy of strategies) {
            try {
              const harvestable = await genericV2Keep3rJob.harvestable(
                strategy
              );
              if (harvestable) {
                await genericV2Keep3rJob.callStatic.harvest(strategy);
                await genericV2Keep3rJob.harvest(strategy);
                console.log(strategy, 'harvested');
              }
            } catch (error) {
              console.log(error);
            }
            try {
              const tendable = await genericV2Keep3rJob.tendable(strategy);
              if (tendable) {
                await genericV2Keep3rJob.callStatic.tend(strategy);
                await genericV2Keep3rJob.tend(strategy);
                console.log(strategy, 'tended');
              }
            } catch (error) {
              if (
                error.message.indexOf(
                  'generic-keep3r-v2::tendable:strategy-not-added'
                ) == -1
              ) {
                console.log(error);
              }
            }
          }

          // mommy credits
          console.log(
            'usedCredits:',
            e18ToDecimal(await genericV2Keep3rJob.usedCredits())
          );

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
