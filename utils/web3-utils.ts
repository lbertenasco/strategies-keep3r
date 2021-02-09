import { BigNumber } from 'ethers';

const hre = require('hardhat');
const ethers = hre.ethers;

const gwei: BigNumber = ethers.BigNumber.from(10).pow(9);
const e18: BigNumber = ethers.BigNumber.from(10).pow(18);
const ZERO_ADDRESS: string = '0x0000000000000000000000000000000000000000';
const SIX_HOURS: number = 6 * 60 * 60;
const P: number = 100000;
const e18ToDecimal = (number: BigNumber): number =>
  number.mul(P).div(e18).toNumber() / P;

export { gwei, e18, ZERO_ADDRESS, SIX_HOURS, e18ToDecimal };
