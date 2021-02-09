const { expect } = require('chai');
const config = require('../.config.json');
const { e18, ZERO_ADDRESS, SIX_HOURS } = require('../utils/web3-utils');
const Actions = { 0: 'none', 1: 'addLiquidityToJob', 2: 'applyCreditToJob', 3: 'removeLiquidityFromJob' }
const escrowContracts = config.contracts.mainnet.escrow;

describe('Keep3rSugarMommy', function() {
  let owner;
  let alice;
  let Keep3rSugarMommy, keep3rSugarMommy;
  before('Setup accounts and contracts', async () => {
    Keep3rSugarMommy = await ethers.getContractFactory('Keep3rSugarMommy');
    [owner, alice] = await ethers.getSigners();
  });

  it('full deployment and setup', async function() {
    // impersonate keep3rGovernance
    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.keep3rGovernance] });
    const keep3rGovernance = owner.provider.getUncheckedSigner(config.accounts.mainnet.keep3rGovernance);
    // Setup deployer
    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.deployer] });
    const deployer = owner.provider.getUncheckedSigner(config.accounts.mainnet.deployer);
    // impersonate keeper
    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.keeper] });
    const keeper = owner.provider.getUncheckedSigner(config.accounts.mainnet.keeper);
    
    const keep3r = await ethers.getContractAt('IKeep3rV1', escrowContracts.keep3r, keep3rGovernance);
    const Keep3rEscrow = await ethers.getContractFactory('Keep3rEscrow');
    const Keep3rSugarMommy = await ethers.getContractFactory('Keep3rSugarMommy');
    const Keep3rEscrowJob = await ethers.getContractFactory('Keep3rEscrowJob');

    const keep3rEscrow1 = await ethers.getContractAt('Keep3rEscrow', escrowContracts.escrow1, deployer);
    const keep3rEscrow2 = await ethers.getContractAt('Keep3rEscrow', escrowContracts.escrow2, deployer);
    
    keep3rSugarMommy = await Keep3rSugarMommy.deploy(
      escrowContracts.keep3r,
      ZERO_ADDRESS, // // KP3R bond
      e18.mul(50), // 50 KP3Rs bond requirement
      0,
      0,
      true
    );
    escrowContracts.sugarMommy = keep3rSugarMommy.address;

    
    const keep3rEscrowJob = (await Keep3rEscrowJob.deploy(
      escrowContracts.keep3r,
      escrowContracts.sugarMommy,
      escrowContracts.lpToken,
      escrowContracts.escrow1,
      escrowContracts.escrow2
    )).connect(keeper);
    
    // Setup keep3rEscrowJob as governor of escrows
    await keep3rEscrow1.setPendingGovernor(keep3rEscrowJob.address);
    await keep3rEscrow2.setPendingGovernor(keep3rEscrowJob.address);
    await keep3rEscrowJob.connect(owner).acceptGovernorOnEscrow(keep3rEscrow1.address);
    await keep3rEscrowJob.connect(owner).acceptGovernorOnEscrow(keep3rEscrow2.address);
    
    // Setup SugarMommy as a keep3r job
    await keep3r.addJob(keep3rSugarMommy.address);
    await keep3r.addKPRCredit(keep3rSugarMommy.address, e18.mul(100));
    
    await keep3rSugarMommy.addValidJob(keep3rEscrowJob.address);

    // DONE ^^

    console.log('workable:', await keep3rEscrowJob.workable())
    nextAction = await keep3rEscrowJob.getNextAction()
    console.log('nextAction:', Actions[nextAction._action], nextAction.Escrow)

    console.log('work')
    await keep3rEscrowJob.work();
    console.log('')


    // Deploy Vault Job
    const VaultKeep3rJob = await ethers.getContractFactory('VaultKeep3rJob');
    const vaultKeep3rJob = (await VaultKeep3rJob.deploy(
      escrowContracts.sugarMommy,
      12*60*60, // 12 hours
    )).connect(keeper);
    await keep3rSugarMommy.addValidJob(vaultKeep3rJob.address);
    const ycrvVaultAddress = '0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c';
    await vaultKeep3rJob.connect(owner).addVault(ycrvVaultAddress, e18.mul(20000));
    console.log('workable:', await vaultKeep3rJob.workable(ycrvVaultAddress))

    console.log('work')
    await vaultKeep3rJob.work(ycrvVaultAddress);
    console.log('')


  });
  it('Should deploy new Keep3rSugarMommy with keep3r', async function() {
    keep3rSugarMommy = await Keep3rSugarMommy.deploy(
      escrowContracts.keep3r,
      ZERO_ADDRESS, // // KP3R bond
      e18.mul(50), // 50 KP3Rs bond requirement
      0,
      0,
      true
    );
    const isKeep3rSugarMommy = await keep3rSugarMommy.isKeep3rSugarMommy();
    expect(isKeep3rSugarMommy).to.be.true;
  });

});
