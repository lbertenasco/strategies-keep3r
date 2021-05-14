const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const mainnetContracts = config.contracts.mainnet;

const prompt = new Confirm({
  message: 'Do you wish to deploy YOracleV1 contract?',
});

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise(async (resolve) => {
    const [owner] = await ethers.getSigners();
    console.log('using address:', owner.address);
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          console.time('YOracleV1 deployed');
          // Setup YOracleV1
          console.log(mainnetContracts.oracle.yearnKeep3rV2OracleFactory);
          const YOracleV1 = await ethers.getContractFactory('YOracleV1');
          const yOracleV1 = await YOracleV1.deploy(
            mainnetContracts.oracle.yearnKeep3rV2OracleFactory
          );

          console.timeEnd('YOracleV1 deployed');
          console.log('YOracleV1 address:', yOracleV1.address);
          console.log(
            'PLEASE: change .config.json & example.config.json oracle.yOracleV1 address to:',
            yOracleV1.address
          );
          resolve();
        } else {
          console.error('Aborted!');
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
