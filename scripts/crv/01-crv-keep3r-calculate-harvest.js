const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const config = require('../../.config.json');
const ethers = hre.ethers;
const e18 = ethers.BigNumber.from(10).pow(18);


const prompt = new Confirm('Do you wish to calculate crv keep3r strategies harvest?');

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

          // Setup crv strategy keep3r
          const crvStrategyKeep3r = await ethers.getContractAt('CrvStrategyKeep3r', config.contracts.mainnet.crvStrategyKeep3r.address, deployer);

          // Setup crv strategies
          const ycrvContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.ycrv.address, deployer);
          const busdContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.busd.address, deployer);
          const sbtcContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.sbtc.address, deployer);
          const pool3Contract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet.pool3.address, deployer);

          console.log('calculating harvest for: ycrv, busd, sbtc, 3pool. please wait ...')
          console.time('calculateHarvest')
          console.log('calculateHarvest(ycrv)', (await crvStrategyKeep3r.callStatic.calculateHarvest(ycrvContract.address)).div(e18).toString())
          console.log('calculateHarvest(busd)', (await crvStrategyKeep3r.callStatic.calculateHarvest(busdContract.address)).div(e18).toString())
          console.log('calculateHarvest(sbtc)', (await crvStrategyKeep3r.callStatic.calculateHarvest(sbtcContract.address)).div(e18).toString())
          console.log('calculateHarvest(pool3)', (await crvStrategyKeep3r.callStatic.calculateHarvest(pool3Contract.address)).div(e18).toString())
          console.timeEnd('calculateHarvest')

          console.log('checking if workable for: ycrv, busd, sbtc, 3pool. please wait ...')
          console.time('workable')
          console.log('workable(ycrv)', await crvStrategyKeep3r.callStatic.workable(ycrvContract.address))
          console.log('workable(busd)', await crvStrategyKeep3r.callStatic.workable(busdContract.address))
          console.log('workable(sbtc)', await crvStrategyKeep3r.callStatic.workable(sbtcContract.address))
          console.log('workable(pool3)', await crvStrategyKeep3r.callStatic.workable(pool3Contract.address))
          console.timeEnd('workable')

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
