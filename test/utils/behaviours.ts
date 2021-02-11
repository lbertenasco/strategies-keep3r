import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import { Contract, ContractFactory } from 'ethers';
import { TransactionRequest } from '@ethersproject/abstract-provider';

chai.use(chaiAsPromised);

const checkTxRevertedWithMessage = async ({
  tx,
  message,
}: {
  tx: Promise<TransactionRequest>;
  message: RegExp;
}): Promise<void> => {
  await expect(tx).to.be.reverted;
  await expect(tx).eventually.rejected.have.property('message').match(message);
};

const checkTxRevertedWithZeroAddress = async (
  tx: Promise<TransactionRequest>
): Promise<void> => {
  await checkTxRevertedWithMessage({
    tx,
    message: /zero-address/,
  });
};

const txShouldRevertWithZeroAddress = async ({
  contract,
  func,
  args,
}: {
  contract: Contract;
  func: string;
  args: any[];
  tx?: Promise<TransactionRequest>;
}) => {
  const tx = contract[func].apply(this, args);
  await checkTxRevertedWithZeroAddress(tx);
};

const deployShouldRevertWithZeroAddress = async ({
  contract,
  args,
}: {
  contract: ContractFactory;
  args: any[];
}) => {
  const deployContractTx = await contract.getDeployTransaction(...args);
  const tx = contract.signer.sendTransaction(deployContractTx);
  await checkTxRevertedWithZeroAddress(tx);
};

const txShouldSetVariableAndEmitEvent = async ({
  contract,
  setterFunc,
  getterFunc,
  variable,
  eventEmitted,
}: {
  contract: Contract;
  setterFunc: string;
  getterFunc: string;
  variable: any;
  eventEmitted: string;
}) => {
  expect(await contract[getterFunc].apply(this)).to.not.eq(variable);
  await expect(contract[setterFunc].apply(this, [variable]))
    .to.emit(contract, eventEmitted)
    .withArgs(variable);
  expect(await contract[getterFunc].apply(this)).to.eq(variable);
};

export default {
  txShouldRevertWithZeroAddress,
  deployShouldRevertWithZeroAddress,
  txShouldSetVariableAndEmitEvent,
};
