import { Contract, ContractFactory, utils, BigNumber, Signer } from 'ethers';
import { run, ethers, network } from 'hardhat';
import {
  FlashbotsBundleProvider,
  FlashbotsBundleResolution,
  FlashbotsTransaction,
  FlashbotsTransactionResponse,
  SimulationResponse,
} from '@flashbots/ethers-provider-bundle';
import * as contracts from '../../utils/contracts';
import * as taichi from '../../utils/taichi';
import { gwei } from '../../utils/web3-utils';
import { makeid } from '../../utils/hash';

const { Confirm } = require('enquirer');
const prompt = new Confirm({
  message: 'Do you wish to stealth-mint though flashbots on mainnet?',
});

async function main() {
  await run('compile');
  await prompt.run().then(async (answer: any) => {
    if (answer) await mainExecute();
  });
}

function mainExecute(): Promise<void | Error> {
  return new Promise(async (resolve, reject) => {
    const [owner] = await ethers.getSigners();
    console.log('using address:', owner.address);

    const network = await ethers.provider.getNetwork();
    if (network.chainId != 1)
      return reject('not on mainnet network. please use --network mainnet');
    const provider = ethers.provider;

    const stealthRelayer = await ethers.getContractAt(
      'IStealthRelayer',
      contracts.stealthRelayer.mainnet
    );
    const harvestV2Keep3rStealthJob = await ethers.getContractAt(
      'HarvestV2Keep3rStealthJob',
      contracts.harvestV2Keep3rStealthJob.mainnet
    );
    console.log('creating signer');
    const signer = new ethers.Wallet(
      process.env.MAINNET_PRIVATE_KEY as string
    ).connect(provider);

    // `authSigner` is an Ethereum private key that does NOT store funds and is NOT your bot's primary key.
    // This is an identifying key for signing payloads to establish reputation and whitelisting
    // In production, this should be used across multiple bundles to build relationship. In this example, we generate a new wallet each time
    console.log('creating flashbotSigner');
    const flashbotSigner = new ethers.Wallet(
      process.env.FLASHBOTS_PRIVATE_KEY as string
    ).connect(provider);

    // Flashbots provider requires passing in a standard provider
    console.log('creating flashbotsProvider');
    const flashbotsProvider = await FlashbotsBundleProvider.create(
      provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
      flashbotSigner // ethers.js signer wallet, only for signing request payloads, not transactions
    );

    // build work tx
    const strategy = '0x32b8C26d0439e1959CEa6262CBabC12320b384c4';
    const workTx = await harvestV2Keep3rStealthJob.populateTransaction.work(
      strategy
    );

    const stealthHash = ethers.utils.solidityKeccak256(
      ['string'],
      [makeid(32)]
    );
    console.log('stealthHash');
    console.log(stealthHash);
    const blockNumber = await ethers.provider.getBlockNumber();
    const targetBlockNumber = blockNumber + 2;

    // NOTE: get this dynamically though estimated gas used + average fast gas price (check simulation)
    const coinbasePayment = utils.parseEther('1').div(100);

    const pendingBlock = await ethers.provider.send('eth_getBlockByNumber', [
      'latest',
      false,
    ]);
    const blockGasLimit = BigNumber.from(pendingBlock.gasLimit);

    // get fast gas price
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

    // build stealth tx
    let nonce = ethers.BigNumber.from(await signer.getTransactionCount());
    const executeAndPayTx =
      await stealthRelayer.populateTransaction.executeAndPay(
        harvestV2Keep3rStealthJob.address, // address _job,
        workTx.data, // bytes memory _callData,
        stealthHash, // bytes32 _stealthHash,
        targetBlockNumber, // uint256 _blockNumber
        coinbasePayment, // uint256 _payment
        {
          nonce,
          gasPrice: 0,
          gasLimit: blockGasLimit.sub(15_000),
          value: coinbasePayment,
        }
      );
    // console.log('executeAndPayTx');
    // console.log(executeAndPayTx);

    const signedTransaction = await signer.signTransaction(executeAndPayTx);
    // console.log('signedTransaction');
    // console.log(signedTransaction);

    // build bundle
    const bundle = [
      {
        signedTransaction,
      },
    ];
    const signedBundle = await flashbotsProvider.signBundle(bundle);
    let simulation: SimulationResponse;
    try {
      simulation = await flashbotsProvider.simulate(
        signedBundle,
        targetBlockNumber
      );
    } catch (error) {
      if ('body' in error && 'message' in JSON.parse(error.body).error) {
        console.log(
          '[Simulation Error] Message:',
          JSON.parse(error.body).error.message
        );
      } else {
        console.log(error);
      }
      return reject('simulation error');
    }
    if ('error' in simulation) {
      return reject(`Simulation Error: ${simulation.error.message}`);
    } else {
      console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`);
    }

    // NOTE: here you can rebalance payment using (results[0].gasPrice * gasUsed) + a % as miner bonus
    const fairPayment = gasPrice
      .mul(100 + 10)
      .div(100)
      .mul(simulation.totalGasUsed); // + 10%

    const executeAndPayTxRepriced =
      await stealthRelayer.populateTransaction.executeAndPay(
        harvestV2Keep3rStealthJob.address, // address _job,
        workTx.data, // bytes memory _callData,
        stealthHash, // bytes32 _stealthHash,
        targetBlockNumber, // uint256 _blockNumber
        fairPayment, // uint256 _payment
        {
          nonce,
          gasPrice: 0,
          gasLimit: blockGasLimit.sub(15_000),
          value: fairPayment,
        }
      );

    simulation = await flashbotsProvider.simulate(
      await flashbotsProvider.signBundle([
        {
          signedTransaction: await signer.signTransaction(
            executeAndPayTxRepriced
          ),
        },
      ]),
      targetBlockNumber
    );
    console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`);

    // send bundle
    const flashbotsTransactionResponse: FlashbotsTransaction =
      await flashbotsProvider.sendBundle(
        [
          {
            signedTransaction: await signer.signTransaction(
              executeAndPayTxRepriced
            ),
          },
        ],
        targetBlockNumber
      );

    const resolution = await (
      flashbotsTransactionResponse as FlashbotsTransactionResponse
    ).wait();

    if (resolution == FlashbotsBundleResolution.BundleIncluded) {
      console.log('BundleIncluded, sucess!');
      return resolve();
    }
    if (resolution == FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
      console.log(
        'BlockPassedWithoutInclusion, re-build and re-send bundle...'
      );
      return await mainExecute();
    }
    if (resolution == FlashbotsBundleResolution.AccountNonceTooHigh) {
      return reject('AccountNonceTooHigh, adjust nonce');
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
