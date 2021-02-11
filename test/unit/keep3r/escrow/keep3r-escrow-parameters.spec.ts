import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { Contract, ContractFactory } from 'ethers';
import { ethers, network } from 'hardhat';

describe('Keep3rEscrowParameters', () => {
  let owner: SignerWithAddress;
  let keep3rEscrowParametersContract: ContractFactory;
  let keep3rEscrowParameters: Contract;

  before('Setup accounts and contracts', async () => {
    [owner] = await ethers.getSigners();
    keep3rEscrowParametersContract = await ethers.getContractFactory(
      'contracts/mock/keep3r/escrow/Keep3rEscrowParameters.sol:Keep3rEscrowParametersMock'
    );
  });

  beforeEach('Deploy necessary contracts', async () => {
    keep3rEscrowParameters = await keep3rEscrowParametersContract.deploy(
      '0x0000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000001'
    );
  });

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
      it('reverts with message', async () => {});
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
