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
  const SugarMommy = await ethers.getContractFactory('SugarMommy');

  await promptAndSubmit(SugarMommy);
}

function promptAndSubmit(SugarMommy) {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          console.time('SugarMommy deployed');
          const escrowContracts = config.contracts.mainnet.escrow;
          // Setup SugarMommy
          const keep3rSugarMommy = await Keep3rSugarMommy.deploy(
            escrowContracts.keep3r,
            ZERO_ADDRESS, // // KP3R bond
            e18.mul(50), // 50 KP3Rs bond requirement
            0,
            0,
            true
          );
          escrowContracts.sugarMommy = keep3rSugarMommy.address;
          console.timeEnd('SugarMommy deployed');
          console.log('SugarMommy address:', sugarMommy.address);
          console.log(
            'PLEASE: change .config.json & example.config.json sugarMommy address to:',
            sugarMommy.address
          );
          // Setup SugarMommy as a keep3r job
          console.log('keep3r governance needs to do:');
          console.log(
            `${escrowContracts.keep3r}.addJob(${keep3rSugarMommy.address})`
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
