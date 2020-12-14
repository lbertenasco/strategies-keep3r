const Confirm = require('prompt-confirm');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { gwei, e18 } = require('../../utils/web3-utils');
const taichi = require('../../utils/taichi');


const prompt = new Confirm('Do you wish to calculate crv busd strategy harvest?');

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve) => {
    try {
      prompt.ask(async (answer) => {
        if (answer) {
          const [owner] = await ethers.getSigners();
          const provider = ethers.getDefaultProvider();
          const signer = new ethers.Wallet('0x' + config.accounts.mainnet.privateKey).connect(provider);

          // Setup crv strategy keep3r
          const crvStrategyKeep3r = await ethers.getContractAt('CrvStrategyKeep3r', config.contracts.mainnet.crvStrategyKeep3r.address, signer);

          const strategy = 'busd';

          // Setup crv strategy
          const strategyContract = await ethers.getContractAt('StrategyCurveYVoterProxy', config.contracts.mainnet[strategy].address, signer);

          console.time('current strategist')
          const strategist = await strategyContract.strategist()
          console.log(`${strategy}.strategist()`, strategist == crvStrategyKeep3r.address ? 'crvStrategyKeep3r' : strategist)
          console.timeEnd('current strategist')

          console.log(`calculating harvest for: ${strategy}. please wait ...`)
          console.time('calculateHarvest')
          console.log(
            `calculateHarvest(${strategy})`,
            (await crvStrategyKeep3r.callStatic.calculateHarvest(strategyContract.address)).div(e18).toString()
          )
          console.timeEnd('calculateHarvest')


          const gasResponse = await taichi.getGasPrice();
          const gasPrice = ethers.BigNumber.from(gasResponse.data.fast);
          if (gasPrice.gt(gwei.mul(100))) {console.error('gas price > 100gwei'); return;}
          
          const nonce = ethers.BigNumber.from(await signer.getTransactionCount());

          console.log({
            gasPrice: gasPrice.toString(),
            nonce: nonce.toString(),
          })
          const rawMessage = await crvStrategyKeep3r.populateTransaction.forceHarvest(strategyContract.address, {
            gasPrice,
            nonce,
          });
          
          const signedMessage = await signer.signTransaction(rawMessage);
   
          const res = await taichi.sendPrivateTransaction(signedMessage);
          const privateTxHash = res.result;
          if (!privateTxHash) {
            console.error('!privateTxHash');
            return;
          }
          let mined;
          while (!mined) {
            const query = await taichi.queryPrivateTransaction(privateTxHash);
            mined = query.success && query.obj.status == 'success';
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
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
