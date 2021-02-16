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
      deployer._address = owner.address;
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
    const vaultsToEdit = [
      // {
      //   name: 'yearn Curve.fi bBTC / sbtcCRV',
      //   address: '0xA8B1Cb4ed612ee179BDeA16CCa6Ba596321AE52D',
      //   requiredEarn: 2,
      // },
      // {
      //   name: 'yearn Curve.fi hBTC / wBTC',
      //   address: '0x46AFc2dfBd1ea0c0760CAD8262A5838e803A37e5',
      //   requiredEarn: 2,
      // },
      // {
      //   name: 'yearn Curve.fi oBTC / sbtcCRV',
      //   address: '0x7F83935EcFe4729c4Ea592Ab2bC1A32588409797',
      //   requiredEarn: 2,
      // },
      // {
      //   name: 'yearn Curve.fi pBTC / sbtcCRV',
      //   address: '0x123964EbE096A920dae00Fb795FFBfA0c9Ff4675',
      //   requiredEarn: 2,
      // },
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
        name: 'yearn Curve.fi tBTC / sbtcCrv',
        address: '0x07FB4756f67bD46B748b16119E802F1f880fb2CC',
        requiredEarn: 2,
      },
    ];

    const vaultsToAdd = [
      {
        name: 'yearn Curve.fi aDai / aUSDC / aUSDT',
        address: '0x03403154afc09Ce8e44C3B185C82C6aD5f86b9ab',
      },
      {
        name: 'yearn Curve.fi ETH / aETH',
        address: '0xE625F5923303f1CE7A43ACFEFd11fd12f30DbcA4',
      },
    ];

    const vaultsToRemove = [
      {
        name: 'yearn USD//C ',
        address: '0x597aD1e0c13Bfe8025993D9e79C69E1c0233522e',
        requiredEarn: 200000,
      },
    ];
    let nonce = await ethers.provider.getTransactionCount(deployer._address);
    console.log({ nonce });

    if (nonce != 267) {
      console.log('WRONG NONCE!');
      return;
    }

    const lowGas = 70000000000; // 70 gwei
    const mid1Gas = 100000000000; // 100 gwei
    const mid2Gas = 110000000000; // 110 gwei
    const highGas = 180000000000; // 180 gwei

    // setup required earn decimals
    console.time('setupDecimals');
    for (const vault of [...vaultsToEdit, ...vaultsToAdd, ...vaultsToRemove]) {
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
    }
    console.timeEnd('setupDecimals');

    console.time('editVaults');

    // for (const vault of vaultsToEdit) {
    //   if (vault.address === vaultsToEdit[0].address) {
    //     // await vaultKeep3rJob.updateRequiredEarnAmount(vault.address, vault.requiredEarn, { nonce, gasPrice: mid2Gas });
    //   } else if (vault.address === vaultsToEdit[1].address) {
    //     // await vaultKeep3rJob.updateRequiredEarnAmount(vault.address, vault.requiredEarn, { nonce, gasPrice: mid2Gas });
    //   } else if (vault.address === vaultsToEdit[2].address) {
    //     // await vaultKeep3rJob.updateRequiredEarnAmount(vault.address, vault.requiredEarn, { nonce, gasPrice: mid1Gas });
    //   } else {
    //     await vaultKeep3rJob.updateRequiredEarnAmount(vault.address, vault.requiredEarn, { nonce, gasPrice: lowGas });
    //   }
    //   nonce++;
    // }
    nonce = 271;
    for (const vault of vaultsToEdit) {
      await vaultKeep3rJob.updateRequiredEarnAmount(
        vault.address,
        vault.requiredEarn,
        { nonce, gasPrice: highGas }
      );
      return;
      nonce++;
    }
    return;
    console.timeEnd('editVaults');

    console.time('addVaults');
    await vaultKeep3rJob.addVaults(
      vaultsToAdd.map((vault) => vault.address),
      vaultsToAdd.map((vault) => vault.requiredEarn),
      { nonce, gasPrice: lowGas }
    );
    nonce++;
    console.timeEnd('addVaults');

    console.time('removeVaults');
    for (const vault of vaultsToRemove) {
      await vaultKeep3rJob.removeVault(vault.address, {
        nonce,
        gasPrice: lowGas,
      });
      nonce++;
    }
    console.timeEnd('removeVaults');

    console.time('forceHighGasInclution');
    await deployer.sendTransaction({
      to: deployer._address,
      value: 0,
      nonce,
      gasPrice: highGas,
    });
    console.timeEnd('forceHighGasInclution');

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
