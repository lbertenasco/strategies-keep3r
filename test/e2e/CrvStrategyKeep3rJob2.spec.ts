import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../utils/web3-utils';
import config from '../../.config.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Contract, ContractFactory } from 'ethers';

const mainnetContracts = config.contracts.mainnet;
const mechanicsContracts = config.contracts.mainnet.mechanics;
const genericV2Keep3rJobContracts = config.contracts.mainnet.genericV2Keep3rJob;

const lowerCaseArray = (array: string[]) =>
  array.map((address: string) => address.toLowerCase());

describe('CrvStrategyKeep3rJob2', () => {
  let owner: SignerWithAddress;

  before('Setup accounts and contracts', async () => {
    [owner] = await ethers.getSigners();
  });

  it('Should deploy on mainnet fork', async function () {
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.publicKey],
    });
    const multisig = ethers.provider.getUncheckedSigner(
      config.accounts.mainnet.publicKey
    );

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.deployer],
    });
    const deployer = ethers.provider.getUncheckedSigner(
      config.accounts.mainnet.deployer
    );
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keeper],
    });
    const keeper = ethers.provider.getUncheckedSigner(
      config.accounts.mainnet.keeper
    );
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keep3rGovernance],
    });
    const keep3rGovernance = ethers.provider.getUncheckedSigner(
      config.accounts.mainnet.keep3rGovernance
    );
    // impersonate whale
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.whale],
    });
    const whale = ethers.provider.getUncheckedSigner(
      config.accounts.mainnet.whale
    );
    (await ethers.getContractFactory('ForceETH')).deploy(
      keep3rGovernance._address,
      {
        value: e18.mul(100),
      }
    );
    (await ethers.getContractFactory('ForceETH')).deploy(keeper._address, {
      value: e18.mul(100),
    });

    const v2Keeper = await ethers.getContractAt(
      'V2Keeper',
      config.contracts.mainnet.proxyJobs.v2Keeper,
      deployer
    );

    const CrvStrategyKeep3rJob2 = await ethers.getContractFactory(
      'CrvStrategyKeep3rJob2'
    );

    const crvStrategyKeep3rJob2 = (
      await CrvStrategyKeep3rJob2.deploy(
        mechanicsContracts.registry, // address _mechanicsRegistry,
        config.contracts.mainnet.keep3r.address, // address _keep3r,
        ZERO_ADDRESS, // address _bond,
        e18.mul(50), // 50 KP3R required // uint256 _minBond,
        0, // uint256 _earned,
        0, // uint256 _age,
        true, // bool _onlyEOA,
        24 * 60 * 60, // 1 day maxHarvestPeriod, // uint256 _maxHarvestPeriod,
        30 * 60, // 30 minutes harvestCooldown // uint256 _harvestCooldown,
        v2Keeper.address // address _v2Keeper
      )
    ).connect(owner);

    // Add as valid job
    await v2Keeper.addJob(crvStrategyKeep3rJob2.address);

    // Add to keep3r
    const keep3r = await ethers.getContractAt(
      'IKeep3rV1',
      config.contracts.mainnet.keep3r.address,
      keep3rGovernance
    );
    await keep3r.addJob(crvStrategyKeep3rJob2.address);
    await keep3r.addKPRCredit(crvStrategyKeep3rJob2.address, e18.mul(100));

    // Add strategies to job
    const strategies = [
      {
        name: 'StrategyCurveUSDNVoterProxy',
        address: '0x406813fF2143d178d1Ebccd2357C20A424208912',
        requiredAmount: 10_000,
        requiredEarn: 100_000,
      },
      {
        name: 'StrategyCurveBTCVoterProxy',
        address: '0x6D6c1AD13A5000148Aa087E7CbFb53D402c81341',
        requiredAmount: 10_000,
        requiredEarn: 3,
      },
      {
        name: 'StrategystETHCurve',
        address: '0x979843B8eEa56E0bEA971445200e0eC3398cdB87',
        requiredAmount: 10_000,
        requiredEarn: 0, // v2
      },
    ];

    // set V1 strategist role to new job
    for (const strategy of strategies) {
      const strategyContract = await ethers.getContractAt(
        'StrategyCurveYVoterProxy',
        strategy.address,
        multisig
      );
      try {
        if (await strategyContract.controller())
          await strategyContract.setStrategist(crvStrategyKeep3rJob2.address);
      } catch (error) {}
    }

    // set reward multiplier
    await crvStrategyKeep3rJob2.setRewardMultiplier(800);

    for (const strategy of strategies) {
      await crvStrategyKeep3rJob2.addStrategy(
        strategy.address,
        e18.mul(strategy.requiredAmount),
        e18.mul(strategy.requiredEarn)
      );
    }

    await expect(
      crvStrategyKeep3rJob2.addStrategy(
        '0x2A94A56fBEE72ACEC39ea0269c1356a8DFbC4765',
        2000000,
        1
      )
    ).to.be.revertedWith(
      'CrvStrategyKeep3rJob::set-required-earn:should-be-zero-for-v2'
    );

    const jobStrategies = await crvStrategyKeep3rJob2.strategies();
    expect(lowerCaseArray(jobStrategies)).to.be.deep.eq(
      lowerCaseArray(strategies.map((s) => s.address))
    );

    let workable = await crvStrategyKeep3rJob2.callStatic.workable(
      strategies[0].address
    );
    console.log({ workable });

    let workTx = await crvStrategyKeep3rJob2
      .connect(keeper)
      .work(strategies[0].address);
    let workTxData = await workTx.wait();
    console.log('gasUsed:', workTxData.cumulativeGasUsed.toNumber());

    expect(
      await crvStrategyKeep3rJob2.callStatic.workable(strategies[0].address)
    ).to.be.false;
  });
});
