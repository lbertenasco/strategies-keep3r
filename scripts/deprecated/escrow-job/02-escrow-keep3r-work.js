const hre = require('hardhat');
const ethers = hre.ethers;
const config = require('../../.config.json');
const { e18, e18ToDecimal, ZERO_ADDRESS } = require('../../utils/web3-utils');

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

    // impersonate keeper
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keeper],
    });
    const keeper = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.keeper
    );

    // Setup UniswapV2 Sliding Oracle
    const UV2SO = await ethers.getContractAt(
      'IUniswapV2SlidingOracle',
      escrowContracts.UV2SO,
      keeper
    );
    // Setup deployed keep3rEscrow
    const keep3rEscrow1 = await ethers.getContractAt(
      'Keep3rEscrow',
      escrowContracts.escrow1,
      deployer
    );
    const keep3rEscrow2 = await ethers.getContractAt(
      'Keep3rEscrow',
      escrowContracts.escrow2,
      deployer
    );

    // Setup deployed keep3rEscrowJob
    const keep3rEscrowJob = await ethers.getContractAt(
      'Keep3rEscrowJob',
      escrowContracts.jobs.escrowJob,
      keeper
    );

    const Actions = {
      0: 'none',
      1: 'addLiquidityToJob',
      2: 'applyCreditToJob',
      3: 'removeLiquidityFromJob',
    };
    let nextAction;
    const getEscrow = (address) =>
      address == keep3rEscrow1.address ? 'Escrow1' : 'Escrow2';

    // Increase time
    console.log('waiting 3 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [3 * 24 * 60 * 60],
    }); // 3 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    console.log('work');
    await keep3rEscrowJob.work();
    console.log('');

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 3 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [3 * 24 * 60 * 60],
    }); // 3 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    console.log('work');
    await keep3rEscrowJob.work();
    console.log('');

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 3 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [3 * 24 * 60 * 60],
    }); // 3 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    console.log('work');
    await keep3rEscrowJob.work();
    console.log('');

    console.log('=====');
    const _liquidityProvided = await keep3r.liquidityProvided(
      keep3rEscrow2.address,
      escrowContracts.lpToken,
      keep3rSugarMommy.address
    );
    console.log('_liquidityProvided:', e18ToDecimal(_liquidityProvided));
    const _liquidityAmount = await keep3r.liquidityAmount(
      keep3rEscrow2.address,
      escrowContracts.lpToken,
      keep3rSugarMommy.address
    );
    console.log('_liquidityAmount:', e18ToDecimal(_liquidityAmount));
    const liquidityAmountsUnbonding1 = await keep3r.liquidityAmountsUnbonding(
      keep3rEscrow1.address,
      escrowContracts.lpToken,
      keep3rSugarMommy.address
    );
    console.log(
      'liquidityAmountsUnbonding1:',
      e18ToDecimal(liquidityAmountsUnbonding1)
    );
    const liquidityUnbonding1 = await keep3r.liquidityUnbonding(
      keep3rEscrow1.address,
      escrowContracts.lpToken,
      keep3rSugarMommy.address
    );
    console.log('liquidityUnbonding1:', liquidityUnbonding1.toNumber());
    console.log('=====');
    console.log();

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 3 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [3 * 24 * 60 * 60],
    }); // 3 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 11 more days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [11 * 24 * 60 * 60],
    }); // 11 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    console.log('work');
    await keep3rEscrowJob.work();
    console.log('');

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 3 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [3 * 24 * 60 * 60],
    }); // 3 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    console.log('work');
    await keep3rEscrowJob.work();
    console.log('');

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 14 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [14 * 24 * 60 * 60],
    }); // 14 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    console.log('work');
    await keep3rEscrowJob.work();
    console.log('');

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

    // Increase time
    console.log('waiting 3 days...');
    await hre.network.provider.request({
      method: 'evm_increaseTime',
      params: [3 * 24 * 60 * 60],
    }); // 3 days
    await hre.network.provider.request({ method: 'evm_mine', params: [] });
    await UV2SO.updatePair(escrowContracts.lpTokenUni);

    console.log('workable:', await keep3rEscrowJob.workable());
    nextAction = await keep3rEscrowJob.getNextAction();
    console.log(
      'nextAction:',
      Actions[nextAction._action],
      getEscrow(nextAction.Escrow)
    );

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
