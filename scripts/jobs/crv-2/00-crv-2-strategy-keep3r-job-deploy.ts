import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../../utils/web3-utils';
import config from '../../../.config.json';
const mainnetContracts = config.contracts.mainnet;
const mechanicsContracts = mainnetContracts.mechanics;

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy crv keep3r contract?');

async function main() {
  await run('compile');
  const CrvStrategyKeep3rJob2: ContractFactory =
    await ethers.getContractFactory('CrvStrategyKeep3rJob2');
  await promptAndSubmit(CrvStrategyKeep3rJob2);
}

function promptAndSubmit(
  CrvStrategyKeep3rJob2: ContractFactory
): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    const [owner] = await ethers.getSigners();
    console.log('using address:', owner.address);
    prompt.run().then(async (answer: any) => {
      if (answer) {
        console.time('CrvStrategyKeep3rJob2 deployed');
        try {
          const v2Keeper = await ethers.getContractAt(
            'V2Keeper',
            config.contracts.mainnet.proxyJobs.v2Keeper
          );

          console.log(
            mechanicsContracts.registry,
            mainnetContracts.keep3r.address,
            ZERO_ADDRESS,
            e18.mul(50).toString(), // 50 KP3R required
            0,
            0,
            true,
            2 * 24 * 60 * 60, // 2 days maxHarvestPeriod,
            30 * 60, // 30 minutes harvestCooldown
            v2Keeper.address
          );
          const crvStrategyKeep3rJob2 = await CrvStrategyKeep3rJob2.deploy(
            mechanicsContracts.registry,
            mainnetContracts.keep3r.address,
            ZERO_ADDRESS,
            e18.mul(50), // 50 KP3R required
            0,
            0,
            true,
            2 * 24 * 60 * 60, // 2 days maxHarvestPeriod,
            30 * 60, // 30 minutes harvestCooldown
            v2Keeper.address
          );
          console.timeEnd('CrvStrategyKeep3rJob2 deployed');
          console.log(
            'CrvStrategyKeep3rJob2 address:',
            crvStrategyKeep3rJob2.address
          );
          console.log(
            'PLEASE: change .config.json & example.config.json proxyJobs.crvStrategyKeep3rJob2 address to:',
            crvStrategyKeep3rJob2.address
          );
          resolve();
        } catch (err) {
          reject(`Error while deploying crv keep3r contract: ${err.message}`);
        }
      } else {
        console.error('Aborted!');
        resolve();
      }
    });
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
