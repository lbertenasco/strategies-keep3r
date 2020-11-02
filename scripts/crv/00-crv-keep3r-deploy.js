const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const config = require('../../.config.json');
const ethers = hre.ethers;
const e18 = ethers.BigNumber.from(10).pow(18);


const prompt = new Confirm('Do you wish to deploy crv keep3r contract?');

async function main() {
  await hre.run('compile');
  const CrvStrategyKeep3r = await ethers.getContractFactory('CrvStrategyKeep3r');

  await promptAndSubmit(CrvStrategyKeep3r);
}

function promptAndSubmit(CrvStrategyKeep3r) {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          console.time('CrvStrategyKeep3r deployed');
          const crvStrategyKeep3r = await CrvStrategyKeep3r.deploy(config.contracts.mainnet.keep3r.address);
          console.timeEnd('CrvStrategyKeep3r deployed');
          console.log('CrvStrategyKeep3r address:', crvStrategyKeep3r.address);
          
          console.time('crvStrategyKeep3r addStrategy');
          const requiredHarvestAmount = e18.mul(10000); // 10k CRV
          console.log('ycrvContract')
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.ycrv.address, requiredHarvestAmount);
          console.log('busdContract')
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.busd.address, requiredHarvestAmount);
          console.log('sbtcContract')
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.sbtc.address, requiredHarvestAmount);
          console.log('pool3Contract')
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.pool3.address, requiredHarvestAmount);
          console.timeEnd('crvStrategyKeep3r addStrategy');

          console.log('TODO from multisig:')
          console.log(`ycrvContract.setStrategist(${crvStrategyKeep3r.address})`)
          console.log(`busdContract.setStrategist(${crvStrategyKeep3r.address})`)
          console.log(`sbtcContract.setStrategist(${crvStrategyKeep3r.address})`)
          console.log(`pool3Contract.setStrategist(${crvStrategyKeep3r.address})`)

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
