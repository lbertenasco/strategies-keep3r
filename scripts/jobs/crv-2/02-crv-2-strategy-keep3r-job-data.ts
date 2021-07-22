import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import { bnToDecimal } from '../../../utils/web3-utils';
import config from '../../../contracts.json';
import { v2CrvStrategies } from '../../../utils/v2-crv-strategies';
import { v1CrvStrategies } from '../../../utils/v1-crv-strategies';
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

      const crvStrategies = [...v2CrvStrategies, ...v1CrvStrategies];

      const strategies = await crvStrategyKeep3rJob2.callStatic.strategies();

      for (const strategy of strategies) {
        const requiredHarvest =
          await crvStrategyKeep3rJob2.callStatic.requiredHarvest(strategy);
        const requiredEarn =
          await crvStrategyKeep3rJob2.callStatic.requiredEarn(strategy);
        const strategyData = crvStrategies.find(
          (strategyData: any) => strategyData.address == strategy
        );
        const strategyContract = await ethers.getContractAt(
          'IBaseStrategy',
          strategy
        );
        const profitFactor = await strategyContract.profitFactor();
        const want = await strategyContract.callStatic.want();
        const wantContract = await ethers.getContractAt(
          'IV1Vault', // Using vault as detailed IERC20
          want
        );
        const symbol = await wantContract.callStatic.symbol();

        console.log(
          strategyData?.name,
          symbol,
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
