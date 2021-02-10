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

    const keep3r = await ethers.getContractAt(
      'IKeep3rV1',
      escrowContracts.keep3r,
      keep3rGovernance
    );
    const Keep3rEscrow = await ethers.getContractFactory('Keep3rEscrow');
    const Keep3rSugarMommy = await ethers.getContractFactory(
      'Keep3rSugarMommy'
    );
    const Keep3rEscrowJob = await ethers.getContractFactory('Keep3rEscrowJob');

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

    // Setup SugarMommy
    const keep3rSugarMommy = await Keep3rSugarMommy.deploy(
      escrowContracts.keep3r,
      ZERO_ADDRESS,
      0, // e18.mul(50), on mainnet
      0,
      0,
      true
    );
    escrowContracts.sugarMommy = keep3rSugarMommy.address;

    // Setup SugarMommy as a keep3r job
    await keep3r.addJob(keep3rSugarMommy.address);
    await keep3r.addKPRCredit(keep3rSugarMommy.address, e18.mul(100));

    const keep3rEscrowJob = (
      await Keep3rEscrowJob.deploy(
        escrowContracts.keep3r,
        escrowContracts.sugarMommy,
        escrowContracts.lpToken,
        escrowContracts.escrow1,
        escrowContracts.escrow2
      )
    ).connect(keeper);
    // Setup keep3rEscrowJob as governor of escrows
    await keep3rEscrow1.setPendingGovernor(keep3rEscrowJob.address);
    await keep3rEscrow2.setPendingGovernor(keep3rEscrowJob.address);
    await keep3rEscrowJob
      .connect(owner)
      .acceptGovernorOnEscrow(keep3rEscrow1.address);
    await keep3rEscrowJob
      .connect(owner)
      .acceptGovernorOnEscrow(keep3rEscrow2.address);

    const Actions = {
      0: 'none',
      1: 'addLiquidityToJob',
      2: 'applyCreditToJob',
      3: 'removeLiquidityFromJob',
    };
    let nextAction;
    const getEscrow = (address) =>
      address == keep3rEscrow1.address ? 'Escrow1' : 'Escrow2';

    await keep3rSugarMommy.addValidJob(keep3rEscrowJob.address);

    console.log('------------------');

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
