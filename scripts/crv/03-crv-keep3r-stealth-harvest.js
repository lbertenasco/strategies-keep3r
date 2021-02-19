const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { gwei, e18 } = require('../../utils/web3-utils');
const taichi = require('../../utils/taichi');

const prompt = new Confirm({
  message: 'Do you wish to calculate crv busd strategy harvest?',
});

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          const [owner] = await ethers.getSigners();
          const provider = ethers.getDefaultProvider();
          const signer = new ethers.Wallet(
            '0x' + config.accounts.mainnet.privateKey
          ).connect(provider);

          // Setup crv strategy keep3r
          const crvStrategyKeep3r = await ethers.getContractAt(
            'CrvStrategyKeep3r',
            config.contracts.mainnet.crvStrategyKeep3r.address,
            signer
          );

          if (!process.env.STRATEGY) {
            console.info(
              'use STRATEGY=busd to set a strategy from config.json'
            );
            return;
          }
          const strategy = process.env.STRATEGY;
          console.log('using strategy:', strategy);

          // Setup crv strategy
          const strategyContract = await ethers.getContractAt(
            'StrategyCurveYVoterProxy',
            config.contracts.mainnet[strategy].address,
            signer
          );

          // console.time('current strategist')
          const strategist = await strategyContract.strategist();
          console.log(
            `${strategy}.strategist()`,
            strategist == crvStrategyKeep3r.address
              ? 'crvStrategyKeep3r'
              : strategist
          );
          // console.timeEnd('current strategist')

          console.log(`calculating harvest for: ${strategy}. please wait ...`);
          // console.time('calculateHarvest')
          console.log(
            `calculateHarvest(${strategy})`,
            (
              await crvStrategyKeep3r.callStatic.calculateHarvest(
                strategyContract.address
              )
            )
              .div(e18)
              .toString()
          );
          // console.timeEnd('calculateHarvest')

          if (process.env.GAS_PRICE) {
            console.log('using env gasPrice in gwei:', process.env.GAS_PRICE);
            gasPrice = gwei.mul(process.env.GAS_PRICE);
          } else {
            const gasResponse = await taichi.getGasPrice();
            gasPrice = ethers.BigNumber.from(gasResponse.data.fast);
            console.log('gasPrice in gwei:', gasPrice.div(gwei).toNumber());
          }

          const maxGwei = 200;
          if (gasPrice.gt(gwei.mul(maxGwei))) {
            console.error(`gas price > ${maxGwei}gwei`);
            return;
          }

          let nonce;
          if (process.env.NONCE) {
            console.log('using env nonce:', process.env.NONCE);
            nonce = ethers.BigNumber.from(process.env.NONCE);
          } else {
            nonce = ethers.BigNumber.from(await signer.getTransactionCount());
            console.log('using account nonce:', nonce.toNumber());
          }

          const rawMessage = await crvStrategyKeep3r.populateTransaction.forceHarvest(
            strategyContract.address,
            {
              gasPrice,
              nonce,
            }
          );

          const signedMessage = await signer.signTransaction(rawMessage);

          if (process.env.SEND != true) {
            console.info('use SEND=true to boardcast to taichi');
            return;
          }

          const res = await taichi.sendPrivateTransaction(signedMessage);
          const privateTxHash = res.result;

          console.log({ privateTxHash });

          if (!privateTxHash) {
            console.error('!privateTxHash');
            return;
          }
          let received;
          while (!received) {
            const query = await taichi.queryPrivateTransaction(privateTxHash);
            received = query.success && query.obj.status == 'pending';
            // TODO Wait a few seconds
          }

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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
