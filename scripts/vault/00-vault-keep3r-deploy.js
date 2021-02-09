const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS, SIX_HOURS } = require('../../utils/web3-utils');

const prompt = new Confirm('Do you wish to deploy vault keep3r contract?');

async function main() {
  await hre.run('compile');
  const VaultKeep3r = await ethers.getContractFactory('VaultKeep3r');

  await promptAndSubmit(VaultKeep3r);
}

function promptAndSubmit(VaultKeep3r) {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          console.time('VaultKeep3r deployed');
          const vaultKeep3r = await VaultKeep3r.deploy(
            config.contracts.mainnet.keep3r.address,
            ZERO_ADDRESS,
            0,
            0,
            0,
            true,
            SIX_HOURS
          );
          console.timeEnd('VaultKeep3r deployed');

          console.log('VaultKeep3r address:', vaultKeep3r.address);

          console.log(
            'TODO: change .config.json & example.config.json vaultKeep3r address to:',
            vaultKeep3r.address
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
