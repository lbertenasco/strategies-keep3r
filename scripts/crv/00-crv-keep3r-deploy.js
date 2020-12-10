const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');


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
          const crvStrategyKeep3r = await CrvStrategyKeep3r.deploy(config.contracts.mainnet.keep3r.address, ZERO_ADDRESS, 0, 0, 0, true);
          console.timeEnd('CrvStrategyKeep3r deployed');
          console.log('CrvStrategyKeep3r address:', crvStrategyKeep3r.address);
          console.log('TODO: change .config.json & example.config.json crvStrategyKeep3r address to:', crvStrategyKeep3r.address);
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
