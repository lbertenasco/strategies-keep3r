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

          // TODO Remove after adding comp
          // Add comp crv strategy
          const requiredHarvestAmount = e18.mul(10000); // 10k CRV
          await crvStrategyKeep3r.addStrategy(config.contracts.mainnet.comp.address, requiredHarvestAmount);


          const strategies = { 'ycrv': {}, 'busd': {}, 'sbtc': {}, 'pool3': {}, 'comp': {} };
          // Setup crv strategies
          for (const strategy in strategies) {
            strategies[strategy].contract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet[strategy].address, deployer);
          }

          console.time('current strategist')
          for (const strategy in strategies) {
            const strategist = await strategies[strategy].contract.strategist()
            console.log(`${strategy}.strategist()`, strategist == crvStrategyKeep3r.address ? 'crvStrategyKeep3r' : strategist)
          }
          console.timeEnd('current strategist')

          console.log(`calculating harvest for: ${Object.keys(strategies)}. please wait ...`)
          console.time('calculateHarvest')
          for (const strategy in strategies) {
            console.log(
              `calculateHarvest(${strategy})`,
              (await crvStrategyKeep3r.callStatic.calculateHarvest(strategies[strategy].contract.address)).div(e18).toString()
            )
          }
          console.timeEnd('calculateHarvest')

          console.log('checking if workable for: ycrv, busd, sbtc, 3pool. please wait ...')
          console.time('workable')
          for (const strategy in strategies) {
            console.log(
              `workable(${strategy})`,
              await crvStrategyKeep3r.callStatic.workable(strategies[strategy].contract.address)
            )
          }
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
