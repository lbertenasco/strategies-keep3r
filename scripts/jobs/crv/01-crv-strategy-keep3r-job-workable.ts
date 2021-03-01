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
    console.log(
      'checking workable strategies on CrvStrategyKeep3rJob contract'
    );
    try {
      // Setup CrvStrategyKeep3rJob
      const crvStrategyKeep3rJob = await ethers.getContractAt(
        'CrvStrategyKeep3rJob',
        mainnetContracts.proxyJobs.crvStrategyKeep3rJob
      );

      const strategies = await crvStrategyKeep3rJob.callStatic.strategies();
      for (const strategy of strategies) {
        const harvest = await crvStrategyKeep3rJob.callStatic.calculateHarvest(
          strategy
        );
        const strategyData = v1CrvStrategies.find(
          (strategyData: any) => strategyData.address == strategy
        );
        if (!strategyData) continue;
        console.log(
          'strategy',
          strategyData.name,
          'harvests:',
          bnToDecimal(harvest)
        );
      }
      resolve();
    } catch (err) {
      reject(`Error while deploying crv strategy keeper: ${err.message}`);
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
