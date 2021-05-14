import { ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../utils/web3-utils';
import config from '../../.config.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Contract, ContractFactory, utils } from 'ethers';
import { expect } from 'chai';
import { JsonRpcSigner } from '@ethersproject/providers';
import { evm } from '../utils';

const escrowContracts = config.contracts.mainnet.escrow;
const mechanicsContracts = config.contracts.mainnet.mechanics;

describe('Keep3rProxyJobV2', () => {
  let owner: SignerWithAddress;
  let keep3r: Contract;
  let keep3rV1Helper: Contract;
  let keep3rGovernance: JsonRpcSigner;
  let keeper: JsonRpcSigner;
  let keep3rProxyJobV2Contract: ContractFactory;
  let keep3rProxyJobV2: Contract;
  let keep3rJob: Contract;
  let keep3rJobContract: ContractFactory;

  before('Setup accounts and contracts', async () => {
    [owner] = await ethers.getSigners();
    keep3rProxyJobV2Contract = await ethers.getContractFactory(
      'contracts/proxy-job/Keep3rProxyJobV2.sol:Keep3rProxyJobV2'
    );
    keep3rJobContract = await ethers.getContractFactory(
      'contracts/mock/jobs/Keep3rJob.sol:Keep3rJobMock'
    );
  });

  beforeEach(async () => {
    await evm.reset({
      jsonRpcUrl: process.env.MAINNET_HTTPS_URL,
      blockNumber: 12010939,
    });
    // impersonate keep3rGovernance
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keep3rGovernance],
    });
    keep3rGovernance = ethers.provider.getSigner(
      config.accounts.mainnet.keep3rGovernance
    );
    // impersonate keeper
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [config.accounts.mainnet.keeper],
    });
    keeper = ethers.provider.getSigner(config.accounts.mainnet.keeper);
    keep3r = await ethers.getContractAt(
      'IKeep3rV1',
      escrowContracts.keep3r,
      keep3rGovernance
    );
    keep3rV1Helper = await ethers.getContractAt(
      'IKeep3rV1Helper',
      escrowContracts.keep3rV1Helper,
      keep3rGovernance
    );
    keep3rProxyJobV2 = await keep3rProxyJobV2Contract.deploy(
      mechanicsContracts.registry,
      escrowContracts.keep3r,
      ZERO_ADDRESS, // // KP3R bond
      e18.mul('50'), // 50 KP3Rs bond requirement
      0,
      0,
      true
    );
    await keep3r.addJob(keep3rProxyJobV2.address);
    await keep3r.addKPRCredit(keep3rProxyJobV2.address, e18.mul(100));
    keep3rJob = await keep3rJobContract.deploy(
      keep3rProxyJobV2.address,
      utils.parseUnits('150', 'gwei')
    );
    await keep3rProxyJobV2.addValidJob(
      keep3rJob.address,
      e18.mul(10), // _maxCredits
      1_000 // _rewardMultiplier 1x
    );
  });

  describe('setKeep3r', () => {
    it('TODO');
  });

  describe('setKeep3rRequirements', () => {
    it('TODO');
  });

  describe('addValidJob', () => {
    it('TODO');
  });

  describe('removeValidJob', () => {
    it('TODO');
  });

  describe('setJobMaxCredits', () => {
    it('TODO');
  });

  describe('setJobRewardMultiplier', () => {
    it('TODO');
  });

  describe('jobs', () => {
    it('TODO');
  });

  describe('workable', () => {
    context('when is workable', () => {
      it('returns true', async () => {
        expect(await keep3rProxyJobV2.callStatic.workable(keep3rJob.address)).to
          .be.true;
      });
    });
    context('when is not workable', () => {
      beforeEach(async () => {
        await keep3rJob.setWorkableReturn(false);
      });
      it('returns false', async () => {
        expect(await keep3rProxyJobV2.callStatic.workable(keep3rJob.address)).to
          .be.false;
      });
    });
  });

  const shouldBehaveLikeWorkRevertsWhenNotFromWorker = async (
    workData: any
  ) => {
    await expect(
      keep3rProxyJobV2.workForBond(keep3rJob.address, workData)
    ).to.be.revertedWith('keep3r::isKeeper:keeper-not-min-requirements');
  };

  const shouldBehaveLikeWorkedForBonds = async (workData: any) => {
    const initialBonded = await keep3rV1Helper.callStatic.bonds(
      await keeper.getAddress()
    );
    await keep3rProxyJobV2
      .connect(keeper)
      .workForBond(keep3rJob.address, workData);
    expect(
      await keep3rV1Helper.callStatic.bonds(await keeper.getAddress())
    ).to.be.gt(initialBonded);
  };

  const shouldBehaveLikeWorkWorked = async (workData: any) => {
    const initialTimesWorked = await keep3rJob.timesWorked();
    await keep3rProxyJobV2
      .connect(keeper)
      .workForBond(keep3rJob.address, workData);
    expect(await keep3rJob.timesWorked()).to.equal(initialTimesWorked.add(1));
  };

  const shouldBehaveLikeWorkUpdatedCredits = async (workData: any) => {
    const initialUsedCredits = await keep3rProxyJobV2.usedCredits(
      keep3rJob.address
    );
    await keep3rProxyJobV2
      .connect(keeper)
      .workForTokens(keep3rJob.address, workData);
    expect(await keep3rProxyJobV2.usedCredits(keep3rJob.address)).to.be.gt(
      initialUsedCredits
    );
  };

  const shouldBehaveLikeWorkEmittedEvent = async (workData: any) => {
    await expect(
      keep3rProxyJobV2.connect(keeper).workForBond(keep3rJob.address, workData)
    ).to.emit(keep3rProxyJobV2, 'Worked');
  };

  const shouldBehaveLikeWorkHitMaxCredits = async () => {
    const newKeep3rJob = await keep3rJobContract.deploy(
      keep3rProxyJobV2.address,
      utils.parseUnits('150', 'gwei')
    );
    await keep3rProxyJobV2.addValidJob(
      newKeep3rJob.address,
      utils.parseUnits('0.2', 'ether'), // _maxCredits
      1_000 // _rewardMultiplier 1x
    );
    const workData = await newKeep3rJob.callStatic.getWorkData();
    let tested = false;
    while (!tested) {
      try {
        await keep3rProxyJobV2
          .connect(keeper)
          .workForBond(newKeep3rJob.address, workData);
      } catch (err) {
        expect(err.message).to.equal(
          'VM Exception while processing transaction: revert Keep3rProxyJob::update-credits:used-credits-exceed-max-credits'
        );
        tested = true;
      }
    }
  };

  const shouldBehaveLikeRewardMultiplierMatters = async (workData: any) => {
    const newKeep3rJob = await keep3rJobContract.deploy(
      keep3rProxyJobV2.address,
      utils.parseUnits('150', 'gwei')
    );
    await keep3rProxyJobV2.addValidJob(
      newKeep3rJob.address,
      utils.parseUnits('0.2', 'ether'), // _maxCredits
      0_005 // _rewardMultiplier 0.5x
    );
    const initial1XKeep3r = await keep3rProxyJobV2.usedCredits(
      keep3rJob.address
    );
    await keep3rProxyJobV2
      .connect(keeper)
      .workForBond(keep3rJob.address, workData);
    const consumedWith1X = (
      await keep3rProxyJobV2.usedCredits(keep3rJob.address)
    ).sub(initial1XKeep3r);

    const newWorkData = await newKeep3rJob.callStatic.getWorkData();
    const initial0500XKeep3r = await keep3rProxyJobV2.usedCredits(
      newKeep3rJob.address
    );
    await keep3rProxyJobV2
      .connect(keeper)
      .workForBond(newKeep3rJob.address, newWorkData);
    const consumedWith0500X = (
      await keep3rProxyJobV2.usedCredits(newKeep3rJob.address)
    ).sub(initial0500XKeep3r);
    expect(consumedWith1X).to.be.gt(consumedWith0500X.mul(2));
  };

  describe('work', () => {
    context('when not working from a keeper', () => {
      let workData: any;
      beforeEach(async () => {
        workData = await keep3rJob.callStatic.getWorkData();
      });
      it('reverts with message', async () => {
        await shouldBehaveLikeWorkRevertsWhenNotFromWorker(workData);
      });
    });
    context('when working from a keeper', () => {
      let workData: any;
      beforeEach(async () => {
        workData = await keep3rJob.callStatic.getWorkData();
      });
      it('works', async () => {
        await shouldBehaveLikeWorkWorked(workData);
      });
      it('defaults to work for bonded keep3rs', async () => {
        await shouldBehaveLikeWorkedForBonds(workData);
      });
      it('updates jobs used credits', async () => {
        await shouldBehaveLikeWorkUpdatedCredits(workData);
      });
      it('emits event', async () => {
        await shouldBehaveLikeWorkEmittedEvent(workData);
      });
      context('when working and hitting max credits', () => {
        it('reverts with message', async () => {
          await shouldBehaveLikeWorkHitMaxCredits();
        });
      });
      context('when working a job with reward multiplier', () => {
        it('applies reward multiplier correctly to reward', async () => {
          await shouldBehaveLikeRewardMultiplierMatters(workData);
        });
      });
    });
  });

  describe('workForBond', () => {
    context('when not working from a keeper', () => {
      let workData: any;
      beforeEach(async () => {
        workData = await keep3rJob.callStatic.getWorkData();
      });
      it('reverts with message', async () => {
        await shouldBehaveLikeWorkRevertsWhenNotFromWorker(workData);
      });
    });
    context('when working from a keeper', () => {
      let workData: any;
      beforeEach(async () => {
        workData = await keep3rJob.callStatic.getWorkData();
      });
      it('works', async () => {
        await shouldBehaveLikeWorkWorked(workData);
      });
      it('pays keeper with bonded keep3r', async () => {
        await shouldBehaveLikeWorkedForBonds(workData);
      });
      it('updates jobs used credits', async () => {
        await shouldBehaveLikeWorkUpdatedCredits(workData);
      });
      it('emits event', async () => {
        await shouldBehaveLikeWorkEmittedEvent(workData);
      });
      context('when working and hitting max credits', () => {
        it('reverts with message', async () => {
          await shouldBehaveLikeWorkHitMaxCredits();
        });
      });
      context('when working a job with reward multiplier', () => {
        it('applies reward multiplier correctly to reward', async () => {
          await shouldBehaveLikeRewardMultiplierMatters(workData);
        });
      });
    });
  });

  describe('workForTokens', () => {
    let workData: any;
    beforeEach(async () => {
      workData = await keep3rJob.callStatic.getWorkData();
    });
    context('when not working from a keeper', () => {
      let workData: any;
      beforeEach(async () => {
        workData = await keep3rJob.callStatic.getWorkData();
      });
      it('reverts with message', async () => {
        await shouldBehaveLikeWorkRevertsWhenNotFromWorker(workData);
      });
    });
    context('when working from a keeper', () => {
      it('works', async () => {
        await shouldBehaveLikeWorkWorked(workData);
      });
      it('pays keeper with keep3r tokens', async () => {
        const initialBonded = await keep3rV1Helper.callStatic.bonds(
          await keeper.getAddress()
        );
        const initialBalance = await keep3r.balanceOf(
          await keeper.getAddress()
        );
        await keep3rProxyJobV2
          .connect(keeper)
          .workForTokens(keep3rJob.address, workData);
        expect(await keep3r.balanceOf(await keeper.getAddress())).to.be.gt(
          initialBalance
        );
        expect(
          await keep3rV1Helper.callStatic.bonds(await keeper.getAddress())
        ).to.be.equal(initialBonded);
      });
      it('updates jobs used credits', async () => {
        await shouldBehaveLikeWorkUpdatedCredits(workData);
      });
      it('emits event', async () => {
        await shouldBehaveLikeWorkEmittedEvent(workData);
      });
      context('when working and hitting max credits', () => {
        it('reverts with message', async () => {
          await shouldBehaveLikeWorkHitMaxCredits();
        });
      });
      context('when working a job with reward multiplier', () => {
        it('applies reward multiplier correctly to reward', async () => {
          await shouldBehaveLikeRewardMultiplierMatters(workData);
        });
      });
    });
  });

  describe('isValidJob', () => {
    it('TODO');
  });
});
