const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS, SIX_HOURS } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to deploy vault keep3r contract?',
});

async function main() {
  await hre.run('compile');
  const VaultKeep3rJob = await ethers.getContractFactory('VaultKeep3rJob');

  await promptAndSubmit(VaultKeep3rJob);
}

function promptAndSubmit(VaultKeep3rJob) {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          console.time('VaultKeep3rJob deployed');
          const escrowContracts = config.contracts.mainnet.escrow;
          const vaultKeep3rJob = await VaultKeep3rJob.deploy(
            escrowContracts.sugarMommy,
            SIX_HOURS
          );
          console.timeEnd('VaultKeep3rJob deployed');

          console.log('VaultKeep3rJob address:', vaultKeep3rJob.address);

          console.log(
            'TODO: change .config.json & example.config.json vaultKeep3rJob address to:',
            vaultKeep3rJob.address
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
