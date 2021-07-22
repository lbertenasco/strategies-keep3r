import { run, ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../../utils/web3-utils';
import * as contracts from '../../../utils/contracts';
import { v2StealthStrategies } from '../../../utils/v2-stealth-harvest-strategies';

const { Confirm } = require('enquirer');
const prompt = new Confirm({ message: 'correct address?' });
const confirm = new Confirm({
  message: 'Do you want to add strategies on v2 harvest stalth keep3r job?',
});
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

          const strategiesToAdd = v2StealthStrategies
            .filter((strategy) => !strategy.added)
            .map((strategy) => ({
              name: strategy.name,
              address: strategy.address,
              amount: strategy.amount,
              costToken: strategy.costToken ? strategy.costToken : ZERO_ADDRESS,
              costPair: strategy.costPair ? strategy.costPair : ZERO_ADDRESS,
            }));

          console.log(strategiesToAdd);
          if (!(await confirm.run())) return;

          await harvestV2Keep3rStealthJob.addStrategies(
            strategiesToAdd.map((strategy) => strategy.address), // address _strategy,
            strategiesToAdd.map((strategy) => strategy.amount), // uint256 _requiredAmount,
            strategiesToAdd.map((strategy) => strategy.costToken), // address _costToken,
            strategiesToAdd.map((strategy) => strategy.costPair) // address _costPair
          );

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
