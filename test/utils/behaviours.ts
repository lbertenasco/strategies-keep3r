import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import { Contract } from 'ethers';

chai.use(chaiAsPromised);

const shouldRevertWithZeroAddress = async ({
  contract,
  func,
  args,
}: {
  contract: Contract;
  func: string;
  args: any[];
}) => {
  const tx = contract[func].apply(this, args);
  await expect(tx).to.be.reverted;
  await expect(tx)
    .eventually.rejected.have.property('message')
    .match(/zero-address/);
};

const shouldSetVariableAndEmitEvent = async ({
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
  shouldRevertWithZeroAddress,
  shouldSetVariableAndEmitEvent,
};
