const { Confirm } = require('enquirer');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { gwei, e18, bnToDecimal } = require('../../utils/web3-utils');

const prompt = new Confirm({
  message: 'Do you wish to work on v2 harvests contract?',
});

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise((resolve, reject) => {
    try {
      prompt.run().then(async (answer) => {
        if (answer) {
          // Setup deployer
          const [owner] = await ethers.getSigners();
          let deployer;
          if (owner.address == config.accounts.mainnet.deployer) {
            deployer = owner;
          } else {
            await hre.network.provider.request({
              method: 'hardhat_impersonateAccount',
              params: [config.accounts.mainnet.deployer],
            });
            deployer = owner.provider.getUncheckedSigner(
              config.accounts.mainnet.deployer
            );
          }

          const v2Strategies = [
            { address: '0xebfC9451d19E8dbf36AAf547855b4dC789CA793C' },
            { address: '0x4D7d4485fD600c61d840ccbeC328BfD76A050F87' },
            { address: '0x4031afd3B0F71Bace9181E554A9E680Ee4AbE7dF' },
          ];

          for (const strategy of v2Strategies) {
            strategy.contract = await ethers.getContractAt(
              'IBaseStrategy',
              strategy.address,
              deployer
            );
            strategy.vault = await strategy.contract.callStatic.vault();
            strategy.keeper = await strategy.contract.callStatic.keeper();
            strategy.want = await strategy.contract.callStatic.want();
            strategy.name = await strategy.contract.callStatic.name();
            strategy.wantContract = await ethers.getContractAt(
              'ERC20Mock',
              strategy.want,
              deployer
            );
            strategy.decimals = await strategy.wantContract.callStatic.decimals();
            strategy.vaultContract = await ethers.getContractAt(
              'VaultAPI',
              strategy.vault,
              deployer
            );
            strategy.vaultTotalAssets = await strategy.vaultContract.callStatic.totalAssets();
          }

          // TODO get fast gas from api or LINK on-chain oracle (see Keep3rHelper)
          const gasPrice = gwei.mul(200);
          const gasLimit = 2_000_000;
          for (const strategy of v2Strategies) {
            const harvestable = await strategy.contract.callStatic.harvestTrigger(
              gasPrice.mul(gasLimit)
            );
            console.log(strategy.address, 'harvestable:', harvestable);
            if (harvestable)
              console.log(
                `harvest with ${strategy.keeper} on: https://etherscan.io/address/${strategy.address}#writeContract`
              );
          }

          for (const strategy of v2Strategies) {
            const params = await strategy.vaultContract.callStatic.strategies(
              strategy.address
            );
            strategy.paramsPre = {
              performanceFee: params.performanceFee,
              activation: params.activation,
              debtRatio: params.debtRatio,
              rateLimit: params.rateLimit,
              lastReport: params.lastReport,
              totalDebt: params.totalDebt,
              totalGain: params.totalGain,
              totalLoss: params.totalLoss,
            };
          }

          for (const strategy of v2Strategies) {
            await strategy.contract.harvest();
          }

          for (const strategy of v2Strategies) {
            const params = await strategy.vaultContract.callStatic.strategies(
              strategy.address
            );
            strategy.paramsPost = {
              performanceFee: params.performanceFee,
              activation: params.activation,
              debtRatio: params.debtRatio,
              rateLimit: params.rateLimit,
              lastReport: params.lastReport,
              totalDebt: params.totalDebt,
              totalGain: params.totalGain,
              totalLoss: params.totalLoss,
            };
          }

          for (const strategy of v2Strategies) {
            logData(strategy, strategy.paramsPre);
            logVaultData(strategy, strategy.paramsPre);
            logParams(strategy, strategy.paramsPre);
            logParams(strategy, strategy.paramsPost);
            logVaultData(strategy, strategy.paramsPost);
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

function logData(strategy, params) {
  console.log(
    `strategy ${strategy.name}:`,
    strategy.address,
    'performanceFee:',
    params.performanceFee.toNumber(),
    'activation:',
    new Date(params.activation.toNumber()).toUTCString(),
    'lastReport:',
    new Date(params.lastReport.toNumber()).toUTCString()
  );
}

function logVaultData(strategy, params) {
  console.log(
    'vault:',
    strategy.vault,
    'vaultTotalAssets:',
    bnToDecimal(strategy.vaultTotalAssets, strategy.decimals),
    'debtRatio:',
    params.debtRatio.toNumber(),
    'availableDebt:',
    bnToDecimal(
      strategy.vaultTotalAssets
        .sub(params.totalDebt)
        .mul(10_000)
        .div(params.debtRatio),
      strategy.decimals
    )
  );
}
function logParams(strategy, params) {
  console.log(
    'rateLimit:',
    bnToDecimal(params.rateLimit, strategy.decimals),
    'totalDebt:',
    bnToDecimal(params.totalDebt, strategy.decimals),
    'totalGain:',
    bnToDecimal(params.totalGain, strategy.decimals),
    'totalLoss:',
    bnToDecimal(params.totalLoss, strategy.decimals)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
