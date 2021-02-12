import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { Contract, ContractFactory, utils } from 'ethers';
import { ethers, network } from 'hardhat';
import { ZERO_ADDRESS } from '../../../../utils/web3-utils';
import { behaviours, constants, erc20 } from '../../../utils';

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
      '0x0000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000002'
    );
  });

  describe('constructor', () => {
    context('when governance address is zero', () => {
      it('reverts with message', async () => {
        await behaviours.deployShouldRevertWithZeroAddress({
          contract: keep3rEscrowParametersContract,
          args: [
            constants.ZERO_ADDRESS,
            constants.NOT_ZERO_ADDRESS,
            constants.NOT_ZERO_ADDRESS,
          ],
        });
      });
    });
    context('when keep3r address is zero', () => {
      it('reverts with message', async () => {
        await behaviours.deployShouldRevertWithZeroAddress({
          contract: keep3rEscrowParametersContract,
          args: [
            constants.NOT_ZERO_ADDRESS,
            constants.ZERO_ADDRESS,
            constants.NOT_ZERO_ADDRESS,
          ],
        });
      });
    });
    context('when lpToken address is zero', () => {
      it('reverts with message', async () => {
        await behaviours.deployShouldRevertWithZeroAddress({
          contract: keep3rEscrowParametersContract,
          args: [
            constants.NOT_ZERO_ADDRESS,
            constants.NOT_ZERO_ADDRESS,
            constants.ZERO_ADDRESS,
          ],
        });
      });
    });
    context('when no address is zero', () => {
      it('deploys, sets data correctly and emits events', async () => {
        await behaviours.deployShouldSetVariablesAndEmitEvents({
          contract: keep3rEscrowParametersContract,
          args: [
            constants.NOT_ZERO_ADDRESS,
            constants.NOT_ZERO_ADDRESS,
            constants.NOT_ZERO_ADDRESS,
          ],
          settersGettersVariablesAndEvents: [
            {
              getterFunc: 'governance',
              variable: constants.NOT_ZERO_ADDRESS,
              eventEmitted: 'GovernanceSet',
            },
          ],
        });
      });
    });
  });

  describe('setGovernance', () => {
    context('when governance address is zero', () => {
      it('reverts with message', async () => {
        await behaviours.txShouldRevertWithZeroAddress({
          contract: keep3rEscrowParameters,
          func: 'setGovernance',
          args: [constants.ZERO_ADDRESS],
        });
      });
    });
    context('when governance address is not zero', () => {
      it('sets governance and emits event', async () => {
        await behaviours.txShouldSetVariableAndEmitEvent({
          contract: keep3rEscrowParameters,
          getterFunc: 'governance',
          setterFunc: 'setGovernance',
          variable: constants.NOT_ZERO_ADDRESS,
          eventEmitted: 'GovernanceSet',
        });
      });
    });
  });

  describe('setKeep3rV1', () => {
    context('when keep3rV1 address is zero', () => {
      it('reverts with message', async () => {
        await behaviours.txShouldRevertWithZeroAddress({
          contract: keep3rEscrowParameters,
          func: 'setKeep3rV1',
          args: [constants.ZERO_ADDRESS],
        });
      });
    });
    context('when keep3rV1 address is not zero', () => {
      it('sets keep3rV1 and emits event', async () => {
        await behaviours.txShouldSetVariableAndEmitEvent({
          contract: keep3rEscrowParameters,
          getterFunc: 'keep3rV1',
          setterFunc: 'setKeep3rV1',
          variable: constants.NOT_ZERO_ADDRESS,
          eventEmitted: 'Keep3rV1Set',
        });
      });
    });
  });

  describe('setLPToken', () => {
    context('when lpToken address is zero', () => {
      it('reverts with message', async () => {
        await behaviours.txShouldRevertWithZeroAddress({
          contract: keep3rEscrowParameters,
          func: 'setLPToken',
          args: [constants.ZERO_ADDRESS],
        });
      });
    });
    context('when lpToken address is not zero', () => {
      it('sets lpToken and emits event', async () => {
        await behaviours.txShouldSetVariableAndEmitEvent({
          contract: keep3rEscrowParameters,
          getterFunc: 'lpToken',
          setterFunc: 'setLPToken',
          variable: constants.NOT_ZERO_ADDRESS,
          eventEmitted: 'LPTokenSet',
        });
      });
    });
  });

  describe('returnLPsToGovernance', () => {
    let erc20Token: Contract;
    const lpsInKeep3rEscrow = utils.parseEther('10');
    beforeEach(async () => {
      erc20Token = await erc20.deploy({
        name: 'erc20 test',
        symbol: 'ERCT',
        initialAccount: owner.address,
        initialAmount: lpsInKeep3rEscrow,
      });
      await keep3rEscrowParameters.setLPToken(erc20Token.address);
    });
    context('when token balance = 0', () => {
      it('revets with message', async () => {
        expect(
          keep3rEscrowParameters.returnLPsToGovernance()
        ).to.be.revertedWith(
          'Keep3rEscrowParameters::_returnLPsToGovernance::no-lp-tokens'
        );
      });
    });
    context('when token balanace > 0', () => {
      beforeEach(async () => {
        await erc20Token.transfer(
          keep3rEscrowParameters.address,
          lpsInKeep3rEscrow
        );
      });
      it('returns lp token balance to governor and emits event', async () => {
        const governance = await keep3rEscrowParameters.governance();
        expect(await erc20Token.balanceOf(governance)).to.equal(0);
        await expect(keep3rEscrowParameters.returnLPsToGovernance())
          .to.emit(keep3rEscrowParameters, 'LPsReturnedToGovernance')
          .withArgs(governance, lpsInKeep3rEscrow);
        expect(await erc20Token.balanceOf(governance)).to.equal(
          lpsInKeep3rEscrow
        );
      });
    });
  });
});
