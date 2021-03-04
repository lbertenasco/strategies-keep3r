// function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredAmounts) external override onlyGovernorOrMechanic {
import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import { bnToDecimal } from '../../../utils/web3-utils';
import config from '../../../.config.json';
import { v1CrvStrategies } from '../../../utils/v1-crv-strategies';
const mainnetContracts = config.contracts.mainnet;

async function main() {
  await run('compile');
  await promptAndSubmit();
}

function promptAndSubmit(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    console.log('checking workable strategies on HarvestV2Keep3rJob contract');
    try {
      // Setup HarvestV2Keep3rJob
      const harvestV2Keep3rJob = await ethers.getContractAt(
        'HarvestV2Keep3rJob',
        mainnetContracts.proxyJobs.harvestV2Keep3rJob
      );

      const workable = await harvestV2Keep3rJob.callStatic.workable();
      const getWorkData = await harvestV2Keep3rJob.callStatic.getWorkData();
      console.log('workable:', workable);
      console.log('workData:', getWorkData);
      const strategies = await harvestV2Keep3rJob.callStatic.strategies();
      console.log('strategies:', strategies);
      for (const strategy of strategies) {
        const workableStrategy = await harvestV2Keep3rJob.callStatic.workableStrategy(
          strategy
        );
        console.log(strategy, 'workable:', workableStrategy);
      }
      resolve();
    } catch (err) {
      reject(
        `Error while checking workable strategies on HarvestV2Keep3rJob contract: ${err.message}`
      );
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
