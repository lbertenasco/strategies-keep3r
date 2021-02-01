const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to deploy keep3r escrow contract?');

async function main() {
  await hre.run('compile');
  const Keep3rEscrowJob = await ethers.getContractFactory('Keep3rEscrowJob');

  await promptAndSubmit(Keep3rEscrowJob);
}

function promptAndSubmit(Keep3rEscrowJob) {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          console.time('Keep3rEscrowJob deployed');
          const escrowContracts = config.contracts.mainnet.escrow;
          address _keep3r,
          address _keep3rSugarMommy,
          address _liquidity,
          address _escrow1,
          address _escrow2
          const keep3rEscrowJob = await Keep3rEscrowJob.deploy(
            escrowContracts.keep3r,
            escrowContracts.keep3r,
            escrowContracts.lpToken
          );
          console.timeEnd('Keep3rEscrowJob deployed');
          console.log('Keep3rEscrowJob address:', keep3rEscrowJob.address);
          console.log('TODO: change .config.json & example.config.json keep3rEscrowJob address to:', keep3rEscrowJob.address);
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
