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
          const vaultKeep3r = await VaultKeep3r.deploy(config.contracts.mainnet.keep3r.address, ZERO_ADDRESS, 0, 0, 0, SIX_HOURS);
          console.timeEnd('VaultKeep3r deployed');

          console.log('VaultKeep3r address:', vaultKeep3r.address);
          
          console.time('vaultKeep3r addVault');
          const requiredEarnAmount = e18.mul(20000); // 20k earn amount
          
          const vaults = {
            'ycrvVault': { requiredEarnAmount },
            'busdVault': { requiredEarnAmount },
            'sbtcVault': { requiredEarnAmount: e18.mul(3) },
            'pool3Vault': { requiredEarnAmount },
            'compVault': { requiredEarnAmount }
          };
          // Setup vaults
          for (const vault in vaults) {
            console.log(`vaultKeep3r.addVault(${vault})`, config.contracts.mainnet[vault].address, requiredEarnAmount.div(e18).toNumber());
            await vaultKeep3r.addVault(config.contracts.mainnet[vault].address, requiredEarnAmount);
          }
          console.timeEnd('vaultKeep3r addVault');

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
