const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to calculate dforce keep3r strategies harvest?');

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
          const dforceStrategyKeep3r = await ethers.getContractAt('DforceStrategyKeep3r', config.contracts.mainnet.dforceStrategyKeep3r.address, deployer);

          const strategies = { 'dforce-usdc': {}, 'dforce-usdt': {} };
          // Setup crv strategies
          for (const strategy in strategies) {
            strategies[strategy].contract = await ethers.getContractAt('StrategyDForceUSDC', config.contracts.mainnet[strategy].address, deployer);
          }

          console.time('current strategist')
          for (const strategy in strategies) {
            const strategist = await strategies[strategy].contract.strategist()
            console.log(`${strategy}.strategist()`, strategist == dforceStrategyKeep3r.address ? 'dforceStrategyKeep3r' : strategist)
          }
          console.timeEnd('current strategist')

          console.log(`calculating harvest for: ${Object.keys(strategies)}. please wait ...`)
          console.time('calculateHarvest')
          for (const strategy in strategies) {
            console.log(
              `calculateHarvest(${strategy})`,
              (await dforceStrategyKeep3r.callStatic.calculateHarvest(strategies[strategy].contract.address)).div(e18).toString()
            )
          }
          console.timeEnd('calculateHarvest')

          console.log('checking if workable for: dforce-usdc, dforce-usdt. please wait ...')
          console.time('workable')
          for (const strategy in strategies) {
            console.log(
              `workable(${strategy})`,
              await dforceStrategyKeep3r.callStatic.workable(strategies[strategy].contract.address)
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
