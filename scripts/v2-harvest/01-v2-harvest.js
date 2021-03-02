const axios = require('axios');
const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { gwei, e18, bnToDecimal } = require('../../utils/web3-utils');

const vaultAPIVersions = {
  default: 'contracts/interfaces/yearn/IVaultAPI.sol:VaultAPI',
  '0.3.0': 'contracts/interfaces/yearn/IVaultAPI.sol:VaultAPI',
  '0.3.2': 'contracts/interfaces/yearn/IVaultAPI_0_3_2.sol:VaultAPI',
};

async function main() {
  await hre.run('compile');
  await promptAndSubmit();
}

function promptAndSubmit() {
  return new Promise(async (resolve, reject) => {
    try {
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

      console.log('using vaults.finance/all API as registry');
      const response = await axios.get('https://vaults.finance/all');
      const vaults = response.data
        .filter((vault) => vault.type === 'v2')
        .map((vault) => ({
          address: vault.address,
          strategies: vault.strategies,
          decimals: vault.decimals,
          name: vault.name,
          endorsed: vault.endorsed,
          symbol: vault.symbol,
          token: {
            address: vault.token.address,
            name: vault.token.name,
            symbol: vault.token.symbol,
            decimals: vault.token.decimals,
          },
        }));
      const endorsedVaults = vaults.filter((vault) => vault.endorsed);
      console.log(endorsedVaults.length, 'endorsed v2 vaults');

      // HARDCODED v2 Strats
      const v2Strategies = [
        { address: '0x979843B8eEa56E0bEA971445200e0eC3398cdB87' },
        { address: '0x4D7d4485fD600c61d840ccbeC328BfD76A050F87' },
        { address: '0x4031afd3B0F71Bace9181E554A9E680Ee4AbE7dF' },
        { address: '0xeE697232DF2226c9fB3F02a57062c4208f287851' },
        { address: '0x32b8C26d0439e1959CEa6262CBabC12320b384c4' },
      ];
      // const v2Strategies = endorsedVaults
      //   .map((vault) => vault.strategies)
      //   .flat();

      for (const strategy of v2Strategies) {
        strategy.contract = await ethers.getContractAt(
          'IBaseStrategy',
          strategy.address,
          deployer
        );

        // keep3r setup and contract overwrite
        strategy.keeper = await strategy.contract.callStatic.keeper();
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [strategy.keeper],
        });
        strategy.keeperAccount = owner.provider.getUncheckedSigner(
          strategy.keeper
        );
        strategy.contract = await ethers.getContractAt(
          'IBaseStrategy',
          strategy.address,
          strategy.keeperAccount
        );
        (await ethers.getContractFactory('ForceETH')).deploy(strategy.keeper, {
          value: e18.mul(100),
        });

        strategy.vault = await strategy.contract.callStatic.vault();
        strategy.want = await strategy.contract.callStatic.want();
        strategy.name = await strategy.contract.callStatic.name();
        strategy.wantContract = await ethers.getContractAt(
          'ERC20Mock',
          strategy.want,
          strategy.keeperAccount
        );
        strategy.wantSymbol = await strategy.wantContract.callStatic.symbol();
        strategy.decimals = await strategy.wantContract.callStatic.decimals();
        strategy.vaultContract = await ethers.getContractAt(
          vaultAPIVersions['default'],
          strategy.vault,
          strategy.keeperAccount
        );
        strategy.vaultAPIVersion = await strategy.vaultContract.apiVersion();
        strategy.vaultContract = await ethers.getContractAt(
          vaultAPIVersions[strategy.vaultAPIVersion],
          strategy.vault,
          strategy.keeperAccount
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
        const tendable = await strategy.contract.callStatic.tendTrigger(
          gasPrice.mul(gasLimit)
        );

        console.log(
          strategy.address,
          'harvestable:',
          harvestable,
          'tendable:',
          tendable
        );

        if (harvestable)
          console.log(
            `harvest with ${strategy.keeper} on: https://etherscan.io/address/${strategy.address}#writeContract`
          );
        if (tendable)
          console.log(
            `tend with ${strategy.keeper} on: https://etherscan.io/address/${strategy.address}#writeContract`
          );
        console.log();
      }

      for (const strategy of v2Strategies) {
        strategy.paramsPre = await getStrategyParams(strategy);
      }

      for (const strategy of v2Strategies) {
        await strategy.contract.harvest();
      }

      for (const strategy of v2Strategies) {
        const params = await strategy.vaultContract.callStatic.strategies(
          strategy.address
        );
        strategy.paramsPost = await getStrategyParams(strategy);
      }

      for (const strategy of v2Strategies) {
        logData(strategy, strategy.paramsPre);
        logVaultData(strategy, strategy.paramsPre);
        logParams(strategy, strategy.paramsPre);
        logParams(strategy, strategy.paramsPost);
        logCompare(strategy, strategy.paramsPre, strategy.paramsPost);
        logVaultData(strategy, strategy.paramsPost);
        console.log();
      }

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function logData(strategy, params) {
  console.log(
    strategy.wantSymbol,
    `strategy ${strategy.name}:`,
    strategy.address,
    'performanceFee:',
    params.performanceFee.toNumber(),
    'activation:',
    new Date(parseInt(params.activation.mul(1000).toString())).toUTCString(),
    'lastReport:',
    new Date(parseInt(params.lastReport.mul(1000).toString())).toUTCString()
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
        .div(params.debtRatio.eq(0) ? 10_000 : params.debtRatio),
      strategy.decimals
    )
  );
}
function logParams(strategy, params) {
  if (strategy.vaultAPIVersion === '0.3.2') {
    console.log(
      'minDebtPerHarvest:',
      bnToDecimal(params.minDebtPerHarvest, strategy.decimals),
      'maxDebtPerHarvest:',
      params.maxDebtPerHarvest.gt(e18.mul(e18))
        ? 'infinity'
        : bnToDecimal(params.maxDebtPerHarvest, strategy.decimals),
      'totalDebt:',
      bnToDecimal(params.totalDebt, strategy.decimals),
      'totalGain:',
      bnToDecimal(params.totalGain, strategy.decimals),
      'totalLoss:',
      bnToDecimal(params.totalLoss, strategy.decimals)
    );
  } else {
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
}
function logCompare(strategy, paramsPre, paramsPost) {
  const params = ['totalDebt', 'totalGain', 'totalLoss'];
  let paramsCompare = '';
  for (const param of params) {
    if (Object.keys(paramsPre).indexOf(param) == -1) continue;
    paramsCompare +=
      param +
      ': ' +
      bnToDecimal(paramsPost[param].sub(paramsPre[param]), strategy.decimals) +
      ' ';
  }
  console.log(paramsCompare);
}

async function getStrategyParams(strategy) {
  const params = await strategy.vaultContract.callStatic.strategies(
    strategy.address
  );
  if (strategy.vaultAPIVersion === '0.3.2')
    return {
      performanceFee: params.performanceFee,
      activation: params.activation,
      debtRatio: params.debtRatio,
      minDebtPerHarvest: params.minDebtPerHarvest,
      maxDebtPerHarvest: params.maxDebtPerHarvest,
      lastReport: params.lastReport,
      totalDebt: params.totalDebt,
      totalGain: params.totalGain,
      totalLoss: params.totalLoss,
    };
  return {
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
