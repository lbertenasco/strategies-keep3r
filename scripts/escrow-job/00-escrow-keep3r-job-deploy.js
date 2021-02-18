const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to deploy keep3r escrow contract?',
});

async function main() {
  await hre.run('compile');
  const Keep3rEscrowJob = await ethers.getContractFactory('Keep3rEscrowJob');

  await promptAndSubmit(Keep3rEscrowJob);
}

function promptAndSubmit(Keep3rEscrowJob) {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          console.time('Keep3rEscrowJob deployed');
          const escrowContracts = config.contracts.mainnet.escrow;

          const keep3rEscrowJob = await Keep3rEscrowJob.deploy(
            escrowContracts.keep3r,
            escrowContracts.sugarMommy,
            escrowContracts.lpToken,
            escrowContracts.escrow1,
            escrowContracts.escrow2
          );
          console.timeEnd('Keep3rEscrowJob deployed');
          console.log('Keep3rEscrowJob address:', keep3rEscrowJob.address);
          console.log(
            'TODO: change .config.json & example.config.json keep3rEscrowJob address to:',
            keep3rEscrowJob.address
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
