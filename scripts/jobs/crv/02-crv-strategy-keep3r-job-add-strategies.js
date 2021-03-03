const hre = require('hardhat');
const ethers = hre.ethers;
const {
  e18,
  e18ToDecimal,
  ZERO_ADDRESS,
} = require('../../../utils/web3-utils');
const { v1CrvStrategies } = require('../../../utils/v1-crv-strategies');
const config = require('../../../.config.json');
const proxyJobs = config.contracts.mainnet.proxyJobs;

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy crv keep3r contract?');

async function main() {
  await hre.run('compile');
  await run();
}

function run() {
  return new Promise(async (resolve) => {
    // Setup deployer
    const [owner] = await ethers.getSigners();
    let deployer;
    if (owner.address == config.accounts.mainnet.deployer) {
      deployer = owner;
      deployer._address = owner.address;
    } else {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [config.accounts.mainnet.deployer],
      });
      deployer = owner.provider.getUncheckedSigner(
        config.accounts.mainnet.deployer
      );
    }
    console.log('using address:', deployer._address);

    const crvStrategyKeep3rJob = await ethers.getContractAt(
      'CrvStrategyKeep3rJob',
      proxyJobs.crvStrategyKeep3rJob,
      deployer
    );

    // Checks if local data matches chain data
    const addedStrategies = await crvStrategyKeep3rJob.strategies();
    for (const strategy of v1CrvStrategies) {
      const added = addedStrategies.indexOf(strategy.address) != -1;
      if (added && strategy.added) continue;
      if (!added && !strategy.added) continue;
      console.log(strategy.name, strategy.address);
      if (!added && strategy.added)
        throw new Error('strategy set as added but not on job');
      if (added && !strategy.added)
        throw new Error('strategy set as not-added but added on job');
    }

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
