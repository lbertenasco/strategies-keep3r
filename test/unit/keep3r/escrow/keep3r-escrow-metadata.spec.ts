import { expect } from 'chai';
import { Contract, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';

describe('Keep3rEscrowMetadata', () => {
  let keep3rEscrowMetadataContract: ContractFactory;
  let keep3rEscrowMetadata: Contract;

  before('Setup accounts and contracts', async () => {
    keep3rEscrowMetadataContract = await ethers.getContractFactory(
      'contracts/mock/keep3r/escrow/Keep3rEscrowMetadata.sol:Keep3rEscrowMetadataMock'
    );
  });

  beforeEach('Deploy necessary contracts', async () => {
    keep3rEscrowMetadata = await keep3rEscrowMetadataContract.deploy();
  });

  describe('isKeep3rEscrow', () => {
    it('returns true', async () => {
      const isKeep3rEscrow = await keep3rEscrowMetadata.isKeep3rEscrow();
      expect(isKeep3rEscrow).to.be.true;
    });
  });
});
