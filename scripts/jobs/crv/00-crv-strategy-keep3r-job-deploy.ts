import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import { e18 } from '../../../utils/web3-utils';
import config from '../../../.config.json';
const escrowContracts = config.contracts.mainnet.escrow;
const mechanicsContracts = config.contracts.mainnet.mechanics;

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy crv keep3r contract?');

async function main() {
  await run('compile');
  const CrvStrategyKeep3rJob: ContractFactory = await ethers.getContractFactory(
    'CrvStrategyKeep3rJob'
  );
  await promptAndSubmit(CrvStrategyKeep3rJob);
}

function promptAndSubmit(
  CrvStrategyKeep3rJob: ContractFactory
): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    const [owner] = await ethers.getSigners();
    console.log('using address:', owner.address);
    prompt.run().then(async (answer: any) => {
      if (answer) {
        console.time('CrvStrategyKeep3rJob deployed');
        try {
          const crvStrategyKeep3rJob = await CrvStrategyKeep3rJob.deploy(
            mechanicsContracts.registry,
            escrowContracts.proxyJob,
            e18.mul(10) // 10 credits
          );
          console.timeEnd('CrvStrategyKeep3rJob deployed');
          console.log(
            'CrvStrategyKeep3rJob address:',
            crvStrategyKeep3rJob.address
          );
          console.log(
            'PLEASE: change .config.json & example.config.json proxyJobs.crvStrategyKeep3rJob address to:',
            crvStrategyKeep3rJob.address
          );
          resolve();
        } catch (err) {
          reject(`Error while deploying crv strategy keeper: ${err.message}`);
        }
      } else {
        console.error('Aborted!');
        resolve();
      }
    });
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
