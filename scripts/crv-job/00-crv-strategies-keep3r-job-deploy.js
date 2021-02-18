const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to deploy CrvStrategyKeep3rJob contract?',
});

async function main() {
  await hre.run('compile');
  const CrvStrategyKeep3rJob = await ethers.getContractFactory(
    'CrvStrategyKeep3rJob'
  );

  await promptAndSubmit(CrvStrategyKeep3rJob);
}

function promptAndSubmit(CrvStrategyKeep3rJob) {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          console.time('CrvStrategyKeep3rJob deployed');
          const escrowContracts = config.contracts.mainnet.escrow;

          const crvStrategyKeep3rJob = await CrvStrategyKeep3rJob.deploy(
            escrowContracts.sugarMommy
          );

          console.timeEnd('CrvStrategyKeep3rJob deployed');
          console.log(
            'CrvStrategyKeep3rJob address:',
            crvStrategyKeep3rJob.address
          );
          console.log(
            'TODO: change .config.json & example.config.json crvStrategyKeep3rJob address to:',
            crvStrategyKeep3rJob.address
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
