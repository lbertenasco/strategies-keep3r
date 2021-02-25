const { expect } = require('chai');
const config = require('../.config.json');
const { e18, ZERO_ADDRESS, SIX_HOURS, gwei } = require('../utils/web3-utils');
const Actions = {
  0: 'none',
  1: 'addLiquidityToJob',
  2: 'applyCreditToJob',
  3: 'removeLiquidityFromJob',
};
const escrowContracts = config.contracts.mainnet.escrow;

describe('Keep3rProxyJob', function () {
  let owner;
  let alice;
  let Keep3rProxyJob, keep3rProxyJob;
  before('Setup accounts and contracts', async () => {
    Keep3rProxyJob = await ethers.getContractFactory('Keep3rProxyJob');
    [owner, alice] = await ethers.getSigners();
  });

  it('full deployment and setup', async function () {
    // impersonate keep3rGovernance
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keep3rGovernance],
    });
    const keep3rGovernance = owner.provider.getUncheckedSigner(
      config.accounts.mainnet.keep3rGovernance
    );
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
    // impersonate lpWhale
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44'],
    });
    const lpWhale = owner.provider.getUncheckedSigner(
      '0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44'
    );
    // impersonate ethWhale
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
    });
    const ethWhale = owner.provider.getUncheckedSigner(
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    );

    const keep3r = await ethers.getContractAt(
      'IKeep3rV1',
      escrowContracts.keep3r,
      keep3rGovernance
    );
    const Keep3rEscrow = await ethers.getContractFactory(
      'contracts/keep3r/Keep3rEscrow.sol:Keep3rEscrow'
    );
    const Keep3rProxyJob = await ethers.getContractFactory('Keep3rProxyJob');
    const Keep3rEscrowJob = await ethers.getContractFactory('Keep3rEscrowJob');

    const keep3rEscrow1 = await ethers.getContractAt(
      'contracts/keep3r/Keep3rEscrow.sol:Keep3rEscrow',
      escrowContracts.escrow1,
      deployer
    );
    const keep3rEscrow2 = await ethers.getContractAt(
      'contracts/keep3r/Keep3rEscrow.sol:Keep3rEscrow',
      escrowContracts.escrow2,
      deployer
    );
    // Add LPs to escrows [not sure why it wont force eth...]
    // (await ethers.getContractFactory('ForceETH')).deploy(lpWhale._address, { value: e18 });
    console.log(1);
    await ethWhale.sendTransaction({
      to: escrowContracts.escrow1,
      value: e18.mul(100),
    });

    console.log(2);
    const lpContract = await ethers.getContractAt(
      'ERC20Mock',
      escrowContracts.lpToken,
      lpWhale
    );
    console.log(3);
    await lpContract
      .connect(lpWhale)
      .transfer(escrowContracts.escrow1, e18.mul(100));
    console.log(4);
    await lpContract
      .connect(lpWhale)
      .transfer(escrowContracts.escrow2, e18.mul(100));
    console.log(5);
    const oldKeep3rEscrowJob = await ethers.getContractAt(
      'Keep3rEscrowJob',
      '0x83A34a6469dbFd7654aE6D842d20977E89CcD73D',
      deployer
    );

    keep3rProxyJob = await Keep3rProxyJob.deploy(
      escrowContracts.keep3r,
      ZERO_ADDRESS, // // KP3R bond
      e18.mul(50), // 50 KP3Rs bond requirement
      0,
      0,
      true
    );
    escrowContracts.proxyJob = keep3rProxyJob.address;

    const MechanicsRegistry = await ethers.getContractFactory(
      'MechanicsRegistry'
    );
    const mechanicsRegistry = await MechanicsRegistry.deploy(owner.address);
    await mechanicsRegistry.addMechanic(deployer._address);

    const keep3rEscrowJob = await Keep3rEscrowJob.deploy(
      mechanicsRegistry.address,
      escrowContracts.keep3r,
      escrowContracts.proxyJob,
      escrowContracts.lpToken,
      escrowContracts.escrow1,
      escrowContracts.escrow2
    );

    // Setup keep3rEscrowJob as governor of escrows
    await keep3rEscrow1.setPendingGovernor(keep3rEscrowJob.address);
    await keep3rEscrow2.setPendingGovernor(keep3rEscrowJob.address);
    await keep3rEscrowJob.acceptGovernorOnEscrow(keep3rEscrow1.address);
    await keep3rEscrowJob.acceptGovernorOnEscrow(keep3rEscrow2.address);

    // Setup ProxyJob as a keep3r job
    await keep3r.addJob(keep3rProxyJob.address);
    await keep3r.addKPRCredit(keep3rProxyJob.address, e18.mul(100));

    await keep3rProxyJob.addValidJob(keep3rEscrowJob.address);

    // Deploy Vault Job
    const VaultKeep3rJob = await ethers.getContractFactory('VaultKeep3rJob');
    const vaultKeep3rJob = (
      await VaultKeep3rJob.deploy(
        mechanicsRegistry.address,
        escrowContracts.proxyJob,
        12 * 60 * 60, // 12 hours
        e18.mul(10), // 10 credits
        gwei.mul(250) // 150 max gwei
      )
    ).connect(keeper);
    await keep3rProxyJob.addValidJob(vaultKeep3rJob.address);
    const ycrvVaultAddress = '0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c';
    await vaultKeep3rJob
      .connect(owner)
      .addVault(ycrvVaultAddress, e18.mul(20000));

    const workable = await keep3rProxyJob.callStatic.workable(
      vaultKeep3rJob.address
    );
    const workData = await vaultKeep3rJob.callStatic.getWorkData();
    console.log({ workable, workData });
    await keep3rProxyJob.connect(keeper).work(vaultKeep3rJob.address, workData);

    console.log('--');

    const jobs = await keep3rProxyJob.jobs();
    for (const job of jobs) {
      const workable = await keep3rProxyJob.callStatic.workable(job);
      const jobContract = await ethers.getContractAt('IKeep3rJob', job);
      const workData = await jobContract.callStatic.getWorkData(); // TODO Change to just workData()
      console.log({ job, workable, workData });
      if (!workable) continue;
      await keep3rProxyJob.connect(keeper).work(job, workData);
    }
  });
  it.skip('Should deploy new Keep3rProxyJob with keep3r', async function () {
    keep3rProxyJob = await Keep3rProxyJob.deploy(
      escrowContracts.keep3r,
      ZERO_ADDRESS, // // KP3R bond
      e18.mul(50), // 50 KP3Rs bond requirement
      0,
      0,
      true
    );
    const isKeep3rProxyJob = await keep3rProxyJob.isKeep3rProxyJob();
    expect(isKeep3rProxyJob).to.be.true;
  });
});
