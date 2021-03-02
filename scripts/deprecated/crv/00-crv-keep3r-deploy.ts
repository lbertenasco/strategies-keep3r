import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import config from '../../.config.json';
import { ZERO_ADDRESS } from '../../utils/web3-utils';

const { Confirm } = require('enquirer');
const prompt = new Confirm('Do you wish to deploy crv keep3r contract?');

async function main() {
  await run('compile');
  const crvStrategyKeep3rContract: ContractFactory = await ethers.getContractFactory(
    'CrvStrategyKeep3r'
  );
  await promptAndSubmit(crvStrategyKeep3rContract);
}

function promptAndSubmit(
  crvStrategyKeep3rContract: ContractFactory
): Promise<void | Error> {
  return new Promise((resolve, reject) => {
    prompt.run().then(async (answer: any) => {
      if (answer) {
        console.time('CrvStrategyKeep3r deployed');
        try {
          const crvStrategyKeep3r = await crvStrategyKeep3rContract.deploy(
            config.contracts.mainnet.keep3r.address,
            ZERO_ADDRESS,
            0,
            0,
            0,
            true
          );
          console.timeEnd('CrvStrategyKeep3r deployed');
          console.log('CrvStrategyKeep3r address:', crvStrategyKeep3r.address);
          console.log(
            'PLEASE: change .config.json & example.config.json crvStrategyKeep3r address to:',
            crvStrategyKeep3r.address
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
