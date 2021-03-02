const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../../.config.json');
const {
  e18,
  e18ToDecimal,
  ZERO_ADDRESS,
} = require('../../../utils/web3-utils');
const { v1CrvStrategies } = require('../../../utils/v1-crv-strategies');

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy crv keep3r contract?');

async function main() {
  await hre.run('compile');
  await run();
}

function run() {
  return new Promise(async (resolve) => {
    const escrowContracts = config.contracts.mainnet.escrow;
    // Setup deployer
    const [owner] = await ethers.getSigners();
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
    console.log('using address:', deployer.address);

    const crvStrategyKeep3rJob = await ethers.getContractAt(
      'CrvStrategyKeep3rJob',
      escrowContracts.jobs.crvStrategyKeep3rJob,
      deployer
    );

    const newV1CrvStrategies = v1CrvStrategies.filter(
      (strategy) => !strategy.added
    );
    console.log('adding', newV1CrvStrategies.length, 'new v1CrvStrategies');
    console.log(newV1CrvStrategies.map((strategy) => strategy.name).join(', '));
    // Add crv strategies to crv keep3r
    console.time('addStrategies');
    await crvStrategyKeep3rJob.addStrategies(
      newV1CrvStrategies.map((strategy) => strategy.address),
      newV1CrvStrategies.map((strategy) => strategy.requiredHarvestAmount),
      newV1CrvStrategies.map((strategy) => strategy.earn.amount)
    );
    console.timeEnd('addStrategies');

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
