// function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredAmounts) external override onlyGovernorOrMechanic {
import { ContractFactory } from 'ethers';
import { run, ethers } from 'hardhat';
import { bnToDecimal } from '../../../utils/web3-utils';
import config from '../../../.config.json';
import { v1CrvStrategies } from '../../../utils/v1-crv-strategies';
const mainnetContracts = config.contracts.mainnet;
const escrowContracts = config.contracts.mainnet.escrow;

async function main() {
  await run('compile');
  await promptAndSubmit();
}

function promptAndSubmit(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    console.log('adding strategies on HarvestV2Keep3rJob contract');
    try {
      const harvestV2Keep3rJob = await ethers.getContractAt(
        'HarvestV2Keep3rJob',
        mainnetContracts.proxyJobs.harvestV2Keep3rJob
      );
      const keep3rProxyJob = await ethers.getContractAt(
        'Keep3rProxyJob',
        escrowContracts.proxyJob
      );
      const v2Keeper = await ethers.getContractAt(
        'V2Keeper',
        config.contracts.mainnet.proxyJobs.v2Keeper
      );

      await v2Keeper.addJob(harvestV2Keep3rJob.address);
      await keep3rProxyJob.addValidJob(harvestV2Keep3rJob.address);
      resolve();
    } catch (err) {
      reject(
        `Error while adding strategies on HarvestV2Keep3rJob contract: ${err.message}`
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
