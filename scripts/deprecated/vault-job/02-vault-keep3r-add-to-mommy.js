const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, e18ToDecimal, ZERO_ADDRESS } = require('../../utils/web3-utils');

async function main() {
  await hre.run('compile');
  await run();
}

function run() {
  return new Promise(async (resolve) => {
    const escrowContracts = config.contracts.mainnet.escrow;
    const [owner] = await ethers.getSigners();
    // Setup deployer
    // Setup deployer
    let deployer;
    if (owner.address == config.accounts.mainnet.deployer) {
      deployer = owner;
    } else {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [config.accounts.mainnet.deployer],
      });
      deployer = owner.provider.getUncheckedSigner(
        config.accounts.mainnet.deployer
      );
    }

    const keep3rSugarMommy = await ethers.getContractAt(
      'Keep3rSugarMommy',
      escrowContracts.sugarMommy,
      deployer
    );
    const vaultKeep3rJob = await ethers.getContractAt(
      'VaultKeep3rJob',
      escrowContracts.jobs.vaultKeep3rJob,
      deployer
    );

    await keep3rSugarMommy.addValidJob(vaultKeep3rJob.address);
    console.log(await keep3rSugarMommy.jobs());
    resolve();
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
