const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to add dforce strategies as keep3r strategies?');

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          const [owner] = await ethers.getSigners();

          // Setup deployer
          await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.deployer] });
          const deployer = owner.provider.getUncheckedSigner(config.accounts.mainnet.deployer);

          // Setup dforce strategy keep3r
          const dforceStrategyKeep3r = await ethers.getContractAt('CrvStrategyKeep3r', config.contracts.mainnet.dforceStrategyKeep3r.address, deployer);      

          const strategies = { 'dforce-usdc': {}, 'dforce-usdt': {} };
          const requiredHarvestAmount = e18.mul(50000); // 50k dforce rewards

          console.time('dforceStrategyKeep3r addStrategies');
          for (const strategy in strategies) {
            console.log(`addings: ${strategy}`)
            await dforceStrategyKeep3r.addStrategy(config.contracts.mainnet[strategy].address, requiredHarvestAmount);
          }
          console.timeEnd('dforceStrategyKeep3r addStrategy');

          console.log('TODO from multisig:')
          for (const strategy in strategies) {
            console.log(`${strategy}: ${config.contracts.mainnet[strategy].address}.setStrategist(${dforceStrategyKeep3r.address})`)
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
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
