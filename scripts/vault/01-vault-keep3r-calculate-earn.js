const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, ZERO_ADDRESS, SIX_HOURS } = require('../../utils/web3-utils');

const prompt = new Confirm('Do you wish to calculate keep3r vaults earn?');

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
          await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.deployer] });
          const deployer = owner.provider.getUncheckedSigner(config.accounts.mainnet.deployer);
          

          // TODO REMOE
          console.time('VaultKeep3r deployed');
          const VaultKeep3r = await ethers.getContractFactory('VaultKeep3r');
          const vaultKeep3rC = await VaultKeep3r.deploy(config.contracts.mainnet.keep3r.address, ZERO_ADDRESS, 0, 0, 0, SIX_HOURS);
          console.timeEnd('VaultKeep3r deployed');

          console.log('VaultKeep3r address:', vaultKeep3rC.address);

          console.time('vaultKeep3rC addVault');
          const requiredEarnAmount = e18.mul(20000); // 20k earn amount

          const vaultsC = {
            'ycrvVault': { requiredEarnAmount },
            'busdVault': { requiredEarnAmount },
            'sbtcVault': { requiredEarnAmount: e18.mul(3) },
            'pool3Vault': { requiredEarnAmount },
            'compVault': { requiredEarnAmount }
          };
          // Setup vaultsC
          for (const vault in vaultsC) {
            console.log(`vaultKeep3rC.addVault(${vault})`, config.contracts.mainnet[vault].address, requiredEarnAmount.div(e18).toNumber());
            await vaultKeep3rC.addVault(config.contracts.mainnet[vault].address, requiredEarnAmount);
          }
          console.timeEnd('vaultKeep3rC addVault');
          config.contracts.mainnet.vaultKeep3r.address = vaultKeep3rC.address;
          // TODO END REMOE

          // Setup crv vault keep3r
          const vaultKeep3r = await ethers.getContractAt('VaultKeep3r', config.contracts.mainnet.vaultKeep3r.address, deployer);

          const vaults = { 'ycrvVault': {}, 'busdVault': {}, 'sbtcVault': {}, 'pool3Vault': {}, 'compVault': {} };
          // Setup vaults
          for (const vault in vaults) {
            vaults[vault].contract = await ethers.getContractAt('yVault', config.contracts.mainnet[vault].address, deployer);
          }

          console.log(`calculating earn for: ${Object.keys(vaults)}. please wait ...`)
          console.time('calculateEarn')
          for (const vault in vaults) {
            console.log(
              `calculateEarn(${vault})`,
              (await vaultKeep3r.callStatic.calculateEarn(vaults[vault].contract.address)).div(e18).toNumber()
            )
          }
          console.timeEnd('calculateEarn')

          console.log(`checking if workable for: ${Object.keys(vaults).join(', ').slice(0, -2)}. please wait ...`)
          console.time('workable')
          for (const vault in vaults) {
            console.log(
              `workable(${vault})`,
              await vaultKeep3r.callStatic.workable(vaults[vault].contract.address)
            )
          }
          console.timeEnd('workable')

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
