import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import { bnToDecimal } from '../../../utils/web3-utils';
import config from '../../../.config.json';
import { v2CrvStrategies } from '../../../utils/v2-crv-strategies';
const mainnetContracts = config.contracts.mainnet;

async function main() {
  await run('compile');
  await promptAndSubmit();
}

function promptAndSubmit(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    console.log('');
    try {
      // Setup CrvStrategyKeep3rJob2
      const crvStrategyKeep3rJob2 = await ethers.getContractAt(
        'CrvStrategyKeep3rJob2',
        mainnetContracts.jobs.crvStrategyKeep3rJob2
      );

      const strategies = await crvStrategyKeep3rJob2.callStatic.strategies();

      for (const strategy of strategies) {
        const requiredHarvest = await crvStrategyKeep3rJob2.callStatic.requiredHarvest(
          strategy
        );
        const requiredEarn = await crvStrategyKeep3rJob2.callStatic.requiredEarn(
          strategy
        );
        const strategyData = v2CrvStrategies.find(
          (strategyData: any) => strategyData.address == strategy
        );
        const strategyContract = await ethers.getContractAt(
          'IBaseStrategy',
          strategy
        );
        const profitFactor = await strategyContract.profitFactor();

        console.log(
          strategyData?.name,
          strategy,
          requiredHarvest.toString(),
          requiredEarn.toString(),
          profitFactor.toString()
        );
      }
      resolve();
    } catch (err) {
      reject(
        `Error while checking workable strategies on CrvStrategyKeep3rJob2 contract: ${err.message}`
      );
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
