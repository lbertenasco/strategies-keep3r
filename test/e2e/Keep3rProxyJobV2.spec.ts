import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { e18, ZERO_ADDRESS } from '../../utils/web3-utils';
import config from '../../.config.json';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Contract, ContractFactory } from 'ethers';

describe('Keep3rProxyJobV2', () => {
  let owner: SignerWithAddress;

  before('Setup accounts and contracts', async () => {
    [owner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.MAINNET_HTTPS_URL,
            blockNumber: 12010939,
          },
        },
      ],
    });
  });

  describe('setKeep3r', () => {
    it('passess');
  });

  describe('setKeep3rRequirements', () => {
    it('passess');
  });

  describe('addValidJob', () => {
    it('passess');
  });

  describe('removeValidJob', () => {
    it('passess');
  });

  describe('setJobMaxCredits', () => {
    it('passess');
  });

  describe('setJobRewardMultiplier', () => {
    it('passess');
  });

  describe('jobs', () => {
    it('passess');
  });

  describe('workable', () => {
    it('passess');
  });

  describe('work', () => {
    it('passess');
  });

  describe('workForBond', () => {
    it('passess');
  });

  describe('workForTokens', () => {
    it('passess');
  });

  describe('isValidJob', () => {
    it('passess');
  });
});
