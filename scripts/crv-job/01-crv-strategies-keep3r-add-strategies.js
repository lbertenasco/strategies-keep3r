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
    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.deployer] });
    const deployer = owner.provider.getUncheckedSigner(config.accounts.mainnet.deployer);
    // impersonate keeper
    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.keeper] });
    const keeper = owner.provider.getUncheckedSigner(config.accounts.mainnet.keeper);
    (await ethers.getContractFactory('ForceETH')).deploy(keeper._address, { value: e18 });
    // impersonate keep3rGovernance
    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [config.accounts.mainnet.keep3rGovernance] });
    const keep3rGovernance = owner.provider.getUncheckedSigner(config.accounts.mainnet.keep3rGovernance);
    
    
    const Keep3rSugarMommy = await ethers.getContractFactory('Keep3rSugarMommy');
    const crvStrategyKeep3rJob = await ethers.getContractAt('CrvStrategyKeep3rJob', escrowContracts.jobs.crvStrategyKeep3rJob, deployer);


    // Setup crv strategies
    const requiredHarvestAmount = e18.mul(10000);
    const crvStrategies = [
      { name: 'StrategyCurve3CrvVoterProxy',address: '0xC59601F0CC49baa266891b7fc63d2D5FE097A79D', requiredHarvestAmount },
      { name: 'StrategyCurveBBTCVoterProxy',address: '0x551F41aD4ebeCa4F5d025D2B3082b7AB2383B768', requiredHarvestAmount },
      { name: 'StrategyCurveBUSDVoterProxy',address: '0x112570655b32A8c747845E0215ad139661e66E7F', requiredHarvestAmount },
      { name: 'StrategyCurveCompoundVoterProxy',address: '0x530da5aeF3c8f9CCbc75C97C182D6ee2284B643F', requiredHarvestAmount },
      { name: 'StrategyCurveDUSDVoterProxy',address: '0x33F3f002b8f812f3E087E9245921C8355E777231', requiredHarvestAmount },
      { name: 'StrategyCurveEURVoterProxy',address: '0x22422825e2dFf23f645b04A3f89190B69f174659', requiredHarvestAmount },
      { name: 'StrategyCurveGUSDVoterProxy',address: '0xD42eC70A590C6bc11e9995314fdbA45B4f74FABb', requiredHarvestAmount },
      { name: 'StrategyCurveHBTCVoterProxy',address: '0xE02363cB1e4E1B77a74fAf38F3Dbb7d0B70F26D7', requiredHarvestAmount },
      { name: 'StrategyCurveHUSDVoterProxy',address: '0xb21C4d2f7b2F29109FF6243309647A01bEB9950a', requiredHarvestAmount },
      { name: 'StrategyCurvemUSDVoterProxy',address: '0xBA0c07BBE9C22a1ee33FE988Ea3763f21D0909a0', requiredHarvestAmount },
      { name: 'StrategyCurveOBTCVoterProxy',address: '0x15CfA851403aBFbbD6fDB1f6fe0d32F22ddc846a', requiredHarvestAmount },
      { name: 'StrategyCurvePBTCVoterProxy',address: '0xD96041c5EC05735D965966bF51faEC40F3888f6e', requiredHarvestAmount },
      { name: 'StrategyCurveRENVoterProxy',address: '0x76B29E824C183dBbE4b27fe5D8EdF0f926340750', requiredHarvestAmount },
      { name: 'StrategyCurveBTCVoterProxy',address: '0x6D6c1AD13A5000148Aa087E7CbFb53D402c81341', requiredHarvestAmount },
      { name: 'StrategyCurvesUSDVoterProxy',address: '0xd7F641697ca4e0e19F6C9cF84989ABc293D24f84', requiredHarvestAmount },
      { name: 'StrategyCurveTBTCVoterProxy',address: '0x61A01a704665b3C0E6898C1B4dA54447f561889d', requiredHarvestAmount },
      { name: 'StrategyCurveUSDNVoterProxy',address: '0x406813fF2143d178d1Ebccd2357C20A424208912', requiredHarvestAmount },
      { name: 'StrategyCurveUSTVoterProxy',address: '0x3be2717DA725f43b7d6C598D8f76AeC43e231B99', requiredHarvestAmount },
      { name: 'StrategyCurveYVoterProxy',address: '0x07DB4B9b3951094B9E278D336aDf46a036295DE7', requiredHarvestAmount },
    ];

    // for (const strategy of crvStrategies) {
    //   console.log(await(await ethers.getContractAt('StrategyCurveYVoterProxy', strategy.address, owner)).getName());
    // }

    // Add crv strategies to crv keep3r
    console.time('addStrategies')
    await crvStrategyKeep3rJob.addStrategies(
      crvStrategies.map(strategy => strategy.address),
      crvStrategies.map(strategy => strategy.requiredHarvestAmount),
    );
    console.timeEnd('addStrategies')

    resolve();
  });
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
