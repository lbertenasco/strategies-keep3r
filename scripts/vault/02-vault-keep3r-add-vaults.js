const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18 } = require('../../utils/web3-utils');


const prompt = new Confirm('Do you wish to add vaults to vault keep3r?');

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          const [owner] = await ethers.getSigners();
          // Setup deployer
          let deployer;
          if (owner.address == config.accounts.mainnet.deployer) {
            deployer = owner;
          } else {
            await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.deployer] });
            deployer = owner.provider.getUncheckedSigner(config.accounts.mainnet.deployer);
          }

          // Setup dforce strategy keep3r
          const vaultKeep3r = await ethers.getContractAt('VaultKeep3r', config.contracts.mainnet.vaultKeep3r.address, deployer);
          // const vaultKeep3r = await ethers.getContractAt('VaultKeep3r', config.contracts.mainnet.vaultKeep3r.address);      

          console.time('vaultKeep3r addVault');
          const requiredEarnAmount = e18.mul(20000); // 20k earn amount

          const vaults = {
            // 'ycrvVault': { requiredEarnAmount },
            // 'busdVault': { requiredEarnAmount },
            // 'sbtcVault': { requiredEarnAmount: e18.mul(3) },
            // 'pool3Vault': { requiredEarnAmount },
            // 'compVault': { requiredEarnAmount },
            // 'usdtVault': { requiredEarnAmount },
            // 'tusdVault': { requiredEarnAmount },
            // 'musdVault': { requiredEarnAmount },
            // 'gusdVault': { requiredEarnAmount },
            'yvUSDC': { requiredEarnAmount },
          };

          // Setup vaults
          for (const vault in vaults) {
            console.log(`vaultKeep3r.addVault(${vault})`, config.contracts.mainnet[vault].address, vaults[vault].requiredEarnAmount.div(e18).toNumber());
            await vaultKeep3r.addVault(config.contracts.mainnet[vault].address, vaults[vault].requiredEarnAmount);
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
