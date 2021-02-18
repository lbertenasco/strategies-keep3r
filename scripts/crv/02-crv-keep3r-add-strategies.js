const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to add crv strategies as keep3r strategies?',
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
          const [owner] = await ethers.getSigners();
          // Setup deployer
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

          // Setup crv strategy keep3r
          const crvStrategyKeep3r = await ethers.getContractAt(
            'CrvStrategyKeep3r',
            config.contracts.mainnet.crvStrategyKeep3r.address,
            deployer
          );

          const strategies = {
            // 'ycrv': {}, 'busd': {}, 'sbtc': {}, 'pool3': {}, 'comp': {}, 'gusd': {},
            // 'gusdVoter': {}, 'musd': {},
          };
          const requiredHarvestAmount = e18.mul(5000); // 5k CRV

          console.time('crvStrategyKeep3r addStrategies');
          for (const strategy in strategies) {
            console.log(`adding: ${strategy}`);
            await crvStrategyKeep3r.addStrategy(
              config.contracts.mainnet[strategy].address,
              requiredHarvestAmount
            );
          }
          console.timeEnd('crvStrategyKeep3r addStrategy');

          console.log('TODO from multisig:');
          for (const strategy in strategies) {
            console.log(
              `${strategy}: ${config.contracts.mainnet[strategy].address}.setStrategist(${crvStrategyKeep3r.address})`
            );
          }

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
