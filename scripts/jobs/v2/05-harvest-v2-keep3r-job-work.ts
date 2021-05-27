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
      config.contracts.mainnet.proxyJobs.v2Keeper,
      signer
    );
    const harvestV2Keep3rJob = await ethers.getContractAt(
      'HarvestV2Keep3rJob',
      config.contracts.mainnet.oldJobs.harvestV2Keep3rJob
    );
    let strategiesAddresses = await harvestV2Keep3rJob.callStatic.strategies();
    const strategies = strategiesAddresses.map((address: string) => ({
      address,
    }));

    try {
      const now = Math.round(new Date().valueOf() / 1000);

      for (const strategy of strategies) {
        console.log('strategy', strategy.address);
        strategy.contract = await ethers.getContractAt(
          'IBaseStrategy',
          strategy.address,
          signer
        );
        strategy.maxReportDelay = await strategy.contract.callStatic.maxReportDelay();
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
        const cooldown = strategy.lastReport <= now - strategy.maxReportDelay;
        console.log(
          'maxReportDelay hrs:',
          strategy.maxReportDelay.div(60 * 60).toNumber()
        );
        console.log('strategy over cooldown:', cooldown);
        if (!cooldown) continue;
        const workable = await strategy.contract.harvestTrigger(1_000_000);
        console.log('workabe:', workable);
        await v2Keeper.callStatic.harvest(strategy.address);
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

        const rawMessage = await v2Keeper.populateTransaction.harvest(
          strategy.address,
          {
            gasPrice,
            nonce,
            gasLimit: 3000000,
          }
        );
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
