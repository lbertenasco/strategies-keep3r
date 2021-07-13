import { run, ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../../utils/web3-utils';
import * as contracts from '../../../utils/contracts';
import { v2StealthStrategies } from '../../../utils/v2-stealth-harvest-strategies';

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy v2 keep3r jobs contracts?');

async function main() {
  await run('compile');
  await promptAndSubmit();
}

function promptAndSubmit(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    const [owner] = await ethers.getSigners();
    console.log('using address:', owner.address);
    prompt.run().then(async (answer: any) => {
      if (answer) {
        try {
          const harvestV2Keep3rStealthJob = await ethers.getContractAt(
            'HarvestV2Keep3rStealthJob',
            contracts.harvestV2Keep3rStealthJob.mainnet
          );

          const strategies =
            await harvestV2Keep3rStealthJob.callStatic.strategies();
          console.log('strategies:', strategies);
          for (const strategy of strategies) {
            const workableStrategy =
              await harvestV2Keep3rStealthJob.callStatic.workable(strategy);
            console.log(strategy, 'workable:', workableStrategy);
          }

          resolve();
        } catch (err) {
          reject(
            `Error while deploying v2 keep3r job contracts: ${err.message}`
          );
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
