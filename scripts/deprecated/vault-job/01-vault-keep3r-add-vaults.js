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

    const vaultKeep3rJob = await ethers.getContractAt(
      'VaultKeep3rJob',
      escrowContracts.jobs.vaultKeep3rJob,
      deployer
    );

    // Setup crv vaults
    const requiredEarn = 100_000;
    const vaults = [
      {
        name: 'yearn Curve.fi DAI / USDC / USDT',
        address: '0x9cA85572E6A3EbF24dEDd195623F188735A5179f',
        requiredEarn: 200000,
      },
      {
        name: 'yearn Curve.fi bBTC / sbtcCRV',
        address: '0xA8B1Cb4ed612ee179BDeA16CCa6Ba596321AE52D',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi yDAI / yUSDC / yUSDT / yBUSD',
        address: '0x2994529C0652D127b7842094103715ec5299bBed',
      },
      {
        name: 'yearn Curve.fi cDAI / cUSDC',
        address: '0x629c759D1E83eFbF63d84eb3868B564d9521C129',
      },
      {
        name: 'yearn Curve.fi DUSD / 3Crv',
        address: '0x8e6741b456a074F0Bc45B8b82A755d4aF7E965dF',
      },
      {
        name: 'yearn Curve.fi EURS / sEUR',
        address: '0x98B058b2CBacF5E99bC7012DF757ea7CFEbd35BC',
      },
      {
        name: 'yearn Curve.fi GUSD / 3Crv',
        address: '0xcC7E70A958917cCe67B4B87a8C30E6297451aE98',
      },
      {
        name: 'yearn Curve.fi hBTC / wBTC',
        address: '0x46AFc2dfBd1ea0c0760CAD8262A5838e803A37e5',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi HUSD / 3Crv',
        address: '0x39546945695DCb1c037C836925B355262f551f55',
      },
      {
        name: 'yearn Curve.fi MUSD / 3Crv',
        address: '0x0FCDAeDFb8A7DfDa2e9838564c5A1665d856AFDF',
      },
      {
        name: 'yearn Curve.fi oBTC / sbtcCRV',
        address: '0x7F83935EcFe4729c4Ea592Ab2bC1A32588409797',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi pBTC / sbtcCRV',
        address: '0x123964EbE096A920dae00Fb795FFBfA0c9Ff4675',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi renBTC / wBTC',
        address: '0x5334e150B938dd2b6bd040D9c4a03Cff0cED3765',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi renBTC / wBTC / sBTC',
        address: '0x7Ff566E1d69DEfF32a7b244aE7276b9f90e9D0f6',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi DAI / USDC / USDT / sUSD',
        address: '0x5533ed0a3b83F70c3c4a1f69Ef5546D3D4713E44',
      },
      {
        name: 'yearn Curve.fi tBTC / sbtcCrv',
        address: '0x07FB4756f67bD46B748b16119E802F1f880fb2CC',
        requiredEarn: 2,
      },
      {
        name: 'yearn Curve.fi USDN / 3Crv',
        address: '0xFe39Ce91437C76178665D64d7a2694B0f6f17fE3',
      },
      {
        name: 'yearn Curve.fi UST / 3Crv',
        address: '0xF6C9E9AF314982A4b38366f4AbfAa00595C5A6fC',
      },
      {
        name: 'yearn Curve.fi yDAI / yUSDC / yUSDT / yTUSD',
        address: '0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c',
        requiredEarn: 200000,
      },
      // { // removed
      //   name: 'yearn USD//C ',
      //   address: '0x597aD1e0c13Bfe8025993D9e79C69E1c0233522e',
      //   requiredEarn: 200000,
      // },
      {
        name: 'yearn Curve.fi aDai / aUSDC / aUSDT',
        address: '0x03403154afc09Ce8e44C3B185C82C6aD5f86b9ab',
      },
      {
        name: 'yearn Curve.fi ETH / aETH',
        address: '0xE625F5923303f1CE7A43ACFEFd11fd12f30DbcA4',
      },
    ];

    // for (const vault of vaults) {
    //   console.log(await (await ethers.getContractAt('yVault', vault.address, owner)).name());
    // }

    // setup required earn decimals
    console.time('setupDecimals');
    for (const vault of vaults) {
      const vaultContract = await ethers.getContractAt('yVault', vault.address);
      const tokenAddress = await vaultContract.token();
      const tokenContract = await ethers.getContractAt(
        'ERC20Detailed',
        tokenAddress
      );
      const decimals = await tokenContract.callStatic.decimals();
      vault.requiredEarn = ethers.BigNumber.from(10)
        .pow(decimals)
        .mul(vault.requiredEarn || requiredEarn);

      vault.requiredEarnString = vault.requiredEarn.toString();
    }
    console.timeEnd('setupDecimals');

    console.log(vaults);
    // Add crv vaults to crv keep3r
    console.time('addVaults');
    await vaultKeep3rJob.addVaults(
      vaults.map((vault) => vault.address),
      vaults.map((vault) => vault.requiredEarn)
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
