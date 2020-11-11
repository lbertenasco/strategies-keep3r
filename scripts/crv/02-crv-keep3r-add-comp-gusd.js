const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const config = require('../../.config.json');
const ethers = hre.ethers;
const e18 = ethers.BigNumber.from(10).pow(18);


const prompt = new Confirm('Do you wish to add comp & gusd as keep3r strategies?');

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

          // Setup crv strategy keep3r
          const crvStrategyKeep3r = await ethers.getContractAt('CrvStrategyKeep3r', config.contracts.mainnet.crvStrategyKeep3r.address);

          const requiredHarvestAmount = e18.mul(10000); // 10k CRV
          // Add crv comp strategy
          console.log('crvStrategyKeep3r.addStrategy(comp)', config.contracts.mainnet.comp.address, requiredHarvestAmount.toString());
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.comp.address, requiredHarvestAmount);
          // Add crv gusd strategy
          console.log('crvStrategyKeep3r.addStrategy(gusd)', config.contracts.mainnet.gusd.address, requiredHarvestAmount.toString());
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.gusd.address, requiredHarvestAmount);


          console.log('TODO from multisig:')
          console.log(`COMP: ${config.contracts.mainnet.comp.address}.setStrategist(${crvStrategyKeep3r.address})`)
          console.log(`GUSD: ${config.contracts.mainnet.gusd.address}.setStrategist(${crvStrategyKeep3r.address})`)

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
