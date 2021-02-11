import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';

describe('Keep3rEscrowParameters', () => {
  let owner: SignerWithAddress;

  before('Setup accounts and contracts', async () => {
    [owner] = await ethers.getSigners();
  });

  beforeEach('Deploy necessary contracts', async () => {});

  describe('constructor', () => {
    context('when governance address is zero', () => {
      it('reverts with message');
    });
    context('when keep3r address is zero', () => {
      it('reverts with message');
    });
    context('when lpToken address is zero', () => {
      it('reverts with message');
    });
    context('when no address is zero', () => {
      it('deploys, sets data correctly and emits events');
    });
  });

  describe('setGovernance', () => {
    context('when governance address is zero', () => {
      it('reverts with message');
    });
    context('when governance address is not zero', () => {
      it('sets governance and emits event');
    });
  });

  describe('setKeep3rV1', () => {
    context('when keep3rV1 address is zero', () => {
      it('reverts with message');
    });
    context('when keep3rV1 address is not zero', () => {
      it('sets keep3rV1 and emits event');
    });
  });

  describe('setLPToken', () => {
    context('when lpToken address is zero', () => {
      it('reverts with message');
    });
    context('when lpToken address is not zero', () => {
      it('sets lpToken and emits event');
    });
  });

  describe('returnLPsToGovernance', () => {
    context('when token balance = 0', () => {
      it('revets with message');
    });
    context('when token balanace > 0', () => {
      it('returns lp token balance to governor and emits event');
    });
  });
});
