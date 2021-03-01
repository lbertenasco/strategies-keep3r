const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, e18ToDecimal, ZERO_ADDRESS } = require('../../utils/web3-utils');
const registryData = require('../../utils/v1-registry-data.json');
const { v1CrvStrategies } = require('../../utils/v1-crv-strategies');

async function main() {
  await hre.run('compile');
  await run();
}

function run() {
  return new Promise(async (resolve) => {
    const escrowContracts = config.contracts.mainnet.escrow;
    const [owner] = await ethers.getSigners();
    // Setup deployer
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.deployer],
    });
    const deployer = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.deployer
    );
    // impersonate keeper
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keeper],
    });
    const keeper = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.keeper
    );
    (await ethers.getContractFactory('ForceETH')).deploy(keeper._address, {
      value: e18,
    });
    // impersonate keep3rGovernance
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keep3rGovernance],
    });
    const keep3rGovernance = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.keep3rGovernance
    );

    const crvStrategyKeep3rJob = await ethers.getContractAt(
      'CrvStrategyKeep3rJob',
      escrowContracts.jobs.crvStrategyKeep3rJob,
      deployer
    );

    const newV1CrvStrategies = v1CrvStrategies.filter(
      (strategy) => !strategy.added
    );
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
