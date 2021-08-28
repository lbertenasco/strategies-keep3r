import { e18 } from './web3-utils';

export const manualHarvestStrategies = [
  // { // deprecated due to illiquid swap
  //   name: 'idle_rai_yield',
  //   address: '0x5D411D2cde10e138d68517c42bE2808C90c22026',
  //   amount: e18.mul(1000000),
  // },
  // sam unknown
  {
    name: 'sam_unknown_1',
    address: '0x4d069f267DaAb537c4ff135556F711c0A6538496',
    maxReportDelay: 60 * 60 * 8, // 8 hours
  },
  {
    name: 'sam_unknown_2',
    address: '0xE6c78b85f93c25B8EE7d963fD15d1d53a00F5908',
    maxReportDelay: 60 * 60 * 8, // 8 hours
  },
  {
    name: 'sam_unknown_3',
    address: '0x6341c289b2E0795A04223DF04B53A77970958723',
    maxReportDelay: 60 * 60 * 8, // 8 hours
  },
  {
    name: 'Lev Comp WETH',
    address: '0x83B6211379c26E0bA8d01b9EcD4eE1aE915630aa',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
  },
  {
    name: 'sam_unknown_5',
    address: '0xDD387F2fe0D9B1E5768fc941e7E48AA8BfAf5e41',
    maxReportDelay: 60 * 60 * 80, // 80 hours
  },
  {
    name: 'comp_wbtc',
    address: '0x4F3c19878da5366fd85648Ef8692D96067dEE16D',
    maxReportDelay: 60 * 60 * 24, // 24 hours
  },
  // poolpi's strats
  {
    name: 'Router_yvDAI_030_to_yvDAI_043',
    address: '0x3D6532c589A11117a4494d9725bb8518C731f1Be',
    maxReportDelay: 60 * 60 * 24 * 2, // 2 days
    // amount: e18.mul(2500000),
  },
];
