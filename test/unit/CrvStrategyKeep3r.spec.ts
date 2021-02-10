import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

// Example file for Yearn Test

describe.only('CrvStrategyKeep3r', function () {
  let crvStrategyKeep3rContract: ContractFactory;
  // let crvStrategyKeep3r: Contract;

  before('Setup accounts and contracts', async () => {
    crvStrategyKeep3rContract = await ethers.getContractFactory(
      'CrvStrategyKeep3r'
    );
  });

  beforeEach(async () => {
    // crvStrategyKeep3r = await crvStrategyKeep3rContract.deploy(
    //   config.contracts.mainnet.keep3r.address,
    //   ZERO_ADDRESS,
    //   0,
    //   0,
    //   0,
    //   true
    // );
  });

  describe('isCrvStrategyKeep3r', () => {
    it('returns true', async () => {
      expect(true).to.be.true;
    });
  });

  describe('addStrategy', () => {
    context('when strategy is already added', () => {
      it('reverts with message');
    });
    context('when strategy was not added', () => {
      it('adds strategy and emits event');
    });
  });
});
