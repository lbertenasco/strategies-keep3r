import { run, ethers } from 'hardhat';
import config from '../../../.config.json';
import { gwei } from '../../../utils/web3-utils';
import * as taichi from '../../../utils/taichi';
const { Confirm } = require('enquirer');
const sendTxPrompt = new Confirm({ message: 'Send tx?' });

async function main() {
  await run('compile');
  await promptAndSubmit();
}
const vaultAPIVersions = {
  default: 'contracts/interfaces/yearn/IVaultAPI.sol:VaultAPI',
  '0.3.0': 'contracts/interfaces/yearn/IVaultAPI.sol:VaultAPI',
  '0.3.2': 'contracts/interfaces/yearn/IVaultAPI_0_3_2.sol:VaultAPI',
};

function promptAndSubmit(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    const [owner] = await ethers.getSigners();
    const provider = ethers.getDefaultProvider();
    const signer = new ethers.Wallet(
      '0x' + config.accounts.mainnet.privateKey
    ).connect(provider);
    console.log('working v2 harvest strategies as:', signer.address);
    const v2Keeper = await ethers.getContractAt(
      'V2Keeper',
      config.contracts.mainnet.proxyJobs.v2Keeper
    );
    const harvestV2Keep3rJob = await ethers.getContractAt(
      'HarvestV2Keep3rJob',
      config.contracts.mainnet.oldJobs.harvestV2Keep3rJob
    );
    let strategies = await harvestV2Keep3rJob.callStatic.strategies();

    try {
      const now = Math.round(new Date().valueOf() / 1000);
      const strategies: any[] = [
        {
          address: '0x6107add73f80AC6015E85103D2f016C6373E4bDc',
          cooldown: 180 * 60,
        }, //weth
        {
          address: '0xFc403fd9E7A916eC38437807704e92236cA1f7A5',
          cooldown: 180 * 60,
        }, //dai
        {
          address: '0x063303D9584Ac9A67855086e16Ca7212C109b7b4',
          cooldown: 180 * 60,
        }, //usdc
        {
          address: '0xF0252a99691D591A5A458b9b4931bF1025BF6Ac3',
          cooldown: 12 * 60 * 60,
        }, //wbtc
      ];

      for (const strategy of strategies) {
        console.log('strategy', strategy.address);
        strategy.contract = await ethers.getContractAt(
          'IBaseStrategy',
          strategy.address,
          signer
        );
        strategy.vault = await strategy.contract.callStatic.vault();
        strategy.vaultContract = await ethers.getContractAt(
          vaultAPIVersions['default'],
          strategy.vault,
          strategy.keeperAccount
        );
        strategy.vaultAPIVersion = await strategy.vaultContract.apiVersion();
        strategy.vaultContract = await ethers.getContractAt(
          vaultAPIVersions[strategy.vaultAPIVersion as '0.3.0' | '0.3.2'] ||
            vaultAPIVersions['0.3.2'],
          strategy.vault,
          strategy.keeperAccount
        );
        const params = await strategy.vaultContract.callStatic.strategies(
          strategy.address
        );
        strategy.lastReport = params.lastReport.toNumber();
        const cooldown = strategy.lastReport <= now - strategy.cooldown;
        console.log('90 minutes elapsed', cooldown);
        const workable = await strategy.contract.harvestTrigger(1_000_000);
        console.log('workabe:', workable);
        if (!cooldown) continue;
        await strategy.contract.callStatic.harvest();
        console.log('working...');

        // continue;

        const gasResponse = await taichi.getGasPrice();
        console.log('taichi gasPrices:', {
          fast: Math.floor(gasResponse.data.fast / 10 ** 9),
          standard: Math.floor(gasResponse.data.standard / 10 ** 9),
          slow: Math.floor(gasResponse.data.slow / 10 ** 9),
        });
        const gasPrice = ethers.BigNumber.from(gasResponse.data.fast);
        console.log('gasPrice in gwei:', gasPrice.div(gwei).toNumber());

        const maxGwei = 150;
        if (gasPrice.gt(gwei.mul(maxGwei))) {
          reject(`gas price > ${maxGwei}gwei`);
        }

        const nonce = ethers.BigNumber.from(await signer.getTransactionCount());
        console.log('using account nonce:', nonce.toNumber());

        const rawMessage = await v2Keeper.populateTransaction.harvest({
          gasPrice,
          nonce,
          gasLimit: 3000000,
        });
        console.log(rawMessage);

        const signedMessage = await signer.signTransaction(rawMessage);

        // if ((await sendTxPrompt.run()) == false) {
        //   console.log('not sending tx, bye :)');
        //   return resolve();
        // }
        const res = await taichi.sendPrivateTransaction(signedMessage);
        if (res.error) {
          return reject(res.error.message);
        }

        const privateTxHash = res.result;
        console.log({ privateTxHash });

        if (!privateTxHash) {
          return reject('no privateTxHash from taichi');
        }
        let received;
        while (!received) {
          await new Promise((r) => setTimeout(r, 2000)); // sleeps 2s
          const query = await taichi.queryPrivateTransaction(privateTxHash);
          received = query.success && query.obj.status == 'pending';
          if (received) {
            console.log('received tx:');
            console.log(query.obj);
          }
        }
      }
      console.log('waiting 10 minutes...');
    } catch (err) {
      reject(`working v2 harvest strategies: ${err.message}`);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
