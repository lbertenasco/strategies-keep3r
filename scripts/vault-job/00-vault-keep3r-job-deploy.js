const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to deploy VaultKeep3rJob contract?');

async function main() {
  await hre.run('compile');
  const VaultKeep3rJob = await ethers.getContractFactory('VaultKeep3rJob');

  await promptAndSubmit(VaultKeep3rJob);
}

function promptAndSubmit(VaultKeep3rJob) {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          console.time('VaultKeep3rJob deployed');
          const escrowContracts = config.contracts.mainnet.escrow;

          const vaultKeep3rJob = await VaultKeep3rJob.deploy(escrowContracts.sugarMommy);
          
          console.timeEnd('VaultKeep3rJob deployed');
          console.log('VaultKeep3rJob address:', vaultKeep3rJob.address);
          console.log('TODO: change .config.json & example.config.json vaultKeep3rJob address to:', vaultKeep3rJob.address);
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
