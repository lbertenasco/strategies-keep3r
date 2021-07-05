const hre = require('hardhat');
const ethers = hre.ethers;
const {
  bn,
  e18,
  e18ToDecimal,
  ZERO_ADDRESS,
} = require('../../../utils/web3-utils');
const { v2CrvStrategies } = require('../../../utils/v2-crv-strategies');
const config = require('../../../.config.json');
const jobs = config.contracts.mainnet.jobs;

const { Confirm } = require('enquirer');
const confirm = new Confirm(
  'Do you want to modify strategies on crv keep3r job?'
);

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

    const crvStrategyKeep3rJob2 = await ethers.getContractAt(
      'CrvStrategyKeep3rJob2',
      jobs.crvStrategyKeep3rJob2,
      deployer
    );

    const chainStrategies = await crvStrategyKeep3rJob2.callStatic.strategies();
    const strategyAddressess = v2CrvStrategies.map(
      (strategy) => strategy.address
    );
    // Checks if there are strategies to remove
    for (const chainStrategyAddress of chainStrategies) {
      if (strategyAddressess.indexOf(chainStrategyAddress) != -1) continue;
      // else, chain strategy is not on local config. remove it!
      console.log(
        'chain strategy:',
        chainStrategyAddress,
        'is not on the local config file'
      );
      console.log(
        `https://etherscan.io/address/${crvStrategyKeep3rJob2.address}#writeContract`
      );
      console.log(`removeStrategy(${chainStrategyAddress})`);
    }

    // Checks if local data matches chain data
    for (const strategy of v2CrvStrategies) {
      const requiredHarvest = await crvStrategyKeep3rJob2.requiredHarvest(
        strategy.address
      );
      const requiredEarn = await crvStrategyKeep3rJob2.requiredEarn(
        strategy.address
      );
      if (!strategy.requiredHarvestAmount.eq(requiredHarvest)) {
        console.log(strategy.name, strategy.address);
        console.log('chain harvest:', requiredHarvest.toString());
        console.log(
          'local harvest:',
          strategy.requiredHarvestAmount.toString()
        );
        strategy.update = true;
      }

      if (
        !bn
          .from(10)
          .pow(strategy.requiredEarn.decimals)
          .mul(strategy.requiredEarn.amount)
          .eq(requiredEarn)
      ) {
        console.log(strategy.name, strategy.address);
        console.log('chain earn:', requiredEarn.toString());
        console.log(
          'local earn:',
          bn
            .from(10)
            .pow(strategy.requiredEarn.decimals)
            .mul(strategy.requiredEarn.amount)
            .toString()
        );
        strategy.update = true;
      }
    }

    const outdatedV1CrvStrategies = v2CrvStrategies.filter(
      (strategy) => strategy.update
    );
    console.log('updating', outdatedV1CrvStrategies.length, 'v2CrvStrategies');
    console.log(
      outdatedV1CrvStrategies.map((strategy) => strategy.name).join(', ')
    );

    if (!(await confirm.run())) return;

    // Update crv strategies on crv keep3r
    console.time('updateStrategies');
    for (const strategy of outdatedV1CrvStrategies) {
      await crvStrategyKeep3rJob2.updateStrategy(
        strategy.address,
        strategy.requiredHarvestAmount,
        bn
          .from(10)
          .pow(strategy.requiredEarn.decimals)
          .mul(strategy.requiredEarn.amount)
      );
    }
    console.timeEnd('updateStrategies');

    resolve();
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
