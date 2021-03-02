const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to deploy dforce keep3r contract?',
});

async function main() {
  await hre.run('compile');
  const DforceStrategyKeep3r = await ethers.getContractFactory(
    'DforceStrategyKeep3r'
  );

  await promptAndSubmit(DforceStrategyKeep3r);
}

function promptAndSubmit(DforceStrategyKeep3r) {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          console.time('DforceStrategyKeep3r deployed');
          const dforceStrategyKeep3r = await DforceStrategyKeep3r.deploy(
            config.contracts.mainnet.keep3r.address,
            ZERO_ADDRESS,
            0,
            0,
            0,
            true
          );
          console.timeEnd('DforceStrategyKeep3r deployed');
          console.log(
            'DforceStrategyKeep3r address:',
            dforceStrategyKeep3r.address
          );

          console.log(
            'PLEASE: change .config.json & example.config.json dforceStrategyKeep3r address to:',
            dforceStrategyKeep3r.address
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
