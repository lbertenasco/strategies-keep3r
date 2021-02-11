const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');

const prompt = new Confirm(
  'Do you wish to deploy GenericV2Keep3rJob contract?'
);

async function main() {
  await hre.run('compile');
  const GenericV2Keep3rJob = await ethers.getContractFactory(
    'GenericV2Keep3rJob'
  );

  await promptAndSubmit(GenericV2Keep3rJob);
}

function promptAndSubmit(GenericV2Keep3rJob) {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          console.time('GenericV2Keep3rJob deployed');
          const escrowContracts = config.contracts.mainnet.escrow;
          const genericV2Keep3rJobContracts =
            config.contracts.mainnet.genericV2Keep3rJob;

          const genericV2Keep3rJob = await GenericV2Keep3rJob.deploy(
            escrowContracts.sugarMommy,
            genericV2Keep3rJobContracts.keep3rHelper,
            genericV2Keep3rJobContracts.slidingOracle
          );

          console.timeEnd('GenericV2Keep3rJob deployed');
          console.log(
            'GenericV2Keep3rJob address:',
            genericV2Keep3rJob.address
          );
          console.log(
            'TODO: change .config.json & example.config.json genericV2Keep3rJob address to:',
            genericV2Keep3rJob.address
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
