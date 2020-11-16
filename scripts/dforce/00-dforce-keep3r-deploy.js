const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to deploy dforce keep3r contract?');

async function main() {
  await hre.run('compile');
  const DforceStrategyKeep3r = await ethers.getContractFactory('DforceStrategyKeep3r');

  await promptAndSubmit(DforceStrategyKeep3r);
}

function promptAndSubmit(DforceStrategyKeep3r) {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          console.time('DforceStrategyKeep3r deployed');
          const dforceStrategyKeep3r = await DforceStrategyKeep3r.deploy(config.contracts.mainnet.keep3r.address);
          console.timeEnd('DforceStrategyKeep3r deployed');
          console.log('DforceStrategyKeep3r address:', dforceStrategyKeep3r.address);
          
          console.time('dforceStrategyKeep3r addStrategy');
          const requiredHarvestAmount = e18.mul(2000); // 2k dforce rewards
          console.log('dforceStrategyKeep3r.addStrategy(dforce-usdc)', config.contracts.mainnet['dforce-usdc'].address, requiredHarvestAmount.toString());
          await dforceStrategyKeep3r.addStrategy(config.contracts.mainnet['dforce-usdc'].address, requiredHarvestAmount);
          console.log('dforceStrategyKeep3r.addStrategy(dforce-usdt)', config.contracts.mainnet['dforce-usdt'].address, requiredHarvestAmount.toString());
          await dforceStrategyKeep3r.addStrategy(config.contracts.mainnet['dforce-usdt'].address, requiredHarvestAmount);
          console.timeEnd('dforceStrategyKeep3r addStrategy');

          console.log('TODO from multisig:')
          console.log(`dforce-usdc: ${config.contracts.mainnet['dforce-usdc'].address}.setStrategist(${dforceStrategyKeep3r.address})`)
          console.log(`dforce-usdt: ${config.contracts.mainnet['dforce-usdt'].address}.setStrategist(${dforceStrategyKeep3r.address})`)

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
