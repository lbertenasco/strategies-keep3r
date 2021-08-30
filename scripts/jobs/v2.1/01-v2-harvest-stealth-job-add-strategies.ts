import { run, ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../../utils/web3-utils';
import * as contracts from '../../../utils/contracts';
import * as accounts from '../../../utils/accounts';
import { v2StealthStrategies } from '../../../utils/v2-stealth-harvest-strategies';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

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
    let signer = owner;
    if (owner.address != accounts.yKeeper) {
      console.log('on fork mode, impersonating yKeeper');
      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [accounts.yKeeper],
      });
      const yKeeper: any = ethers.provider.getUncheckedSigner(
        accounts.yKeeper
      ) as any as SignerWithAddress;
      yKeeper.address = yKeeper._address;
      signer = yKeeper;
    }

    console.log('using address:', signer.address);
    prompt.run().then(async (answer: any) => {
      if (answer) {
        try {
          const harvestV2Keep3rStealthJob = await ethers.getContractAt(
            'HarvestV2Keep3rStealthJob',
            contracts.harvestV2Keep3rStealthJob.mainnet,
            signer
          );

          const jobStrategies =
            await harvestV2Keep3rStealthJob.callStatic.strategies();

          const strategiesAdded = v2StealthStrategies
            .filter((strategy) => strategy.added)
            .map((strategy) => strategy.address);

          const strategiesNotYetAdded = v2StealthStrategies
            .filter((strategy) => !strategy.added)
            .map((strategy) => strategy.address);

          for (const strategyAdded of strategiesAdded) {
            if (jobStrategies.indexOf(strategyAdded) == -1)
              console.log(
                `strategy: ${strategyAdded} should be added: false, or removed from config`
              );
          }

          for (const strategyNotYetAdded of strategiesNotYetAdded) {
            if (jobStrategies.indexOf(strategyNotYetAdded) != -1)
              console.log(
                `strategy: ${strategyNotYetAdded} should be added: true, or removed from job and config`
              );
          }

          for (const jobStrategy of jobStrategies) {
            if (strategiesAdded.indexOf(jobStrategy) == -1)
              console.log(
                `strategy: ${jobStrategy} should not be on job, or is missing from config`
              );
          }

          const strategiesToAdd = v2StealthStrategies
            .filter((strategy) => !strategy.added)
            .map((strategy) => ({
              name: strategy.name,
              address: strategy.address,
              amount: strategy.amount,
              costToken: strategy.costToken ? strategy.costToken : ZERO_ADDRESS,
              costPair: strategy.costPair ? strategy.costPair : ZERO_ADDRESS,
            }));

          console.log('strategiesToAdd');
          console.log(strategiesToAdd);
          if (!(await confirm.run())) return;

          await harvestV2Keep3rStealthJob.callStatic.addStrategies(
            strategiesToAdd.map((strategy) => strategy.address), // address _strategy,
            strategiesToAdd.map((strategy) => strategy.amount), // uint256 _requiredAmount,
            strategiesToAdd.map((strategy) => strategy.costToken), // address _costToken,
            strategiesToAdd.map((strategy) => strategy.costPair) // address _costPair
          );
          await harvestV2Keep3rStealthJob.addStrategies(
            strategiesToAdd.map((strategy) => strategy.address), // address _strategy,
            strategiesToAdd.map((strategy) => strategy.amount), // uint256 _requiredAmount,
            strategiesToAdd.map((strategy) => strategy.costToken), // address _costToken,
            strategiesToAdd.map((strategy) => strategy.costPair), // address _costPair
            {
              nonce: 53,
            }
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
