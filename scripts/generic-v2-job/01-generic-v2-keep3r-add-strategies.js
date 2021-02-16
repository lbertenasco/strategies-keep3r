const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, e18ToDecimal, SIX_HOURS } = require('../../utils/web3-utils');

async function main() {
  await hre.run('compile');
  await run();
}

function run() {
  return new Promise(async (resolve) => {
    const escrowContracts = config.contracts.mainnet.escrow;
    const [owner] = await ethers.getSigners();
    // Setup deployer
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.deployer],
    });
    const deployer = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.deployer
    );
    // impersonate keeper
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keeper],
    });
    const keeper = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.keeper
    );
    (await ethers.getContractFactory('ForceETH')).deploy(keeper._address, {
      value: e18,
    });
    // impersonate keep3rGovernance
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keep3rGovernance],
    });
    const keep3rGovernance = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.keep3rGovernance
    );

    const genericV2Keep3rJob = await ethers.getContractAt(
      'GenericV2Keep3rJob',
      escrowContracts.jobs.genericV2Keep3rJob,
      deployer
    );

    // Setup v2 strategies
    const requiredEarn = 100000;
    const v2Strategies = [];

    // for (const strategy of strategies) {
    //   console.log(await (await ethers.getContractAt('yVault', strategy.address, owner)).name());
    // }

    // setup required earn decimals
    console.time('setupDecimals');
    for (const strategy of strategies) {
      const strategyContract = await ethers.getContractAt(
        'yVault',
        strategy.address
      );
      const tokenAddress = await strategyContract.token();
      const tokenContract = await ethers.getContractAt(
        'ERC20Detailed',
        tokenAddress
      );
      const decimals = await tokenContract.callStatic.decimals();
      strategy.requiredEarn = ethers.BigNumber.from(10)
        .pow(decimals)
        .mul(strategy.requiredEarn || requiredEarn);
    }
    console.timeEnd('setupDecimals');

    // Add crv strategies to crv keep3r
    console.time('addVaults');
    await strategyKeep3rJob.addVaults(
      strategies.map((strategy) => strategy.address),
      strategies.map((strategy) => strategy.requiredEarn)
    );
    console.timeEnd('addVaults');

    resolve();
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
