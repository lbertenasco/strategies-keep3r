const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const escrowContracts = config.contracts.mainnet.escrow;

const { e18, ZERO_ADDRESS } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to check workable jobs on Keep3rProxyJob contract?',
});

async function main() {
  await hre.run('compile');

  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise(async (resolve) => {
    console.log('checking workable jobs on Keep3rProxyJob contract');
    try {
      // Setup Keep3rProxyJob
      const keep3rProxyJob = await ethers.getContractAt(
        'Keep3rProxyJob',
        escrowContracts.proxyJob
      );
      // Important! use callStatic for all methods (even work) to avoid spending gas
      // only send work transaction if callStatic.work succedded,
      // even if workable is true, the job might not have credits to pay and the work tx will revert
      const jobs = await keep3rProxyJob.callStatic.jobs();
      for (const job of jobs) {
        const workable = await keep3rProxyJob.callStatic.workable(job);
        const jobContract = await ethers.getContractAt('IKeep3rJob', job);
        const workData = await jobContract.callStatic.getWorkData();
        console.log({ job, workable, workData });
        if (!workable) continue;
        await keep3rProxyJob.connect(keeper).callStatic.work(job, workData);
        await keep3rProxyJob.connect(keeper).work(job, workData);
        console.log('worked!');
        console.log('workable', await keep3rProxyJob.callStatic.workable(job));
      }
      resolve();
    } catch (err) {
      reject(err);
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
