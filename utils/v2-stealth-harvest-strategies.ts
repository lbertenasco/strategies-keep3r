import { BigNumberish } from 'ethers';
import { e18, ZERO_ADDRESS } from './web3-utils';

export interface v2HarvestStealthStrategy {
  name: string;
  added: boolean;
  amount: BigNumberish;
  address: string;
  costToken?: string;
  costPair?: string;
}

export const v2StealthStrategies: v2HarvestStealthStrategy[] = [
  // { // deprecated
  //   name: 'StrategystETHCurve',
  //   added: false,
  //   amount: 2_000_000,
  //   address: '0x979843B8eEa56E0bEA971445200e0eC3398cdB87',
  // },
  // { // deprecated
  //   name: 'StrategyGenericLevCompFarm',
  //   added: false,
  //   amount: 2_000_000,
  //   address: '0x4D7d4485fD600c61d840ccbeC328BfD76A050F87',
  // },
  {
    name: 'StrategyYearnVECRV',
    added: false,
    amount: 1_000_000,
    address: '0x2923a58c1831205C854DBEa001809B194FDb3Fa5',
  },
  // { // deprecated
  //   name: 'StrategyMakerETHDAIDelegate',
  //   added: false,
  //   amount: 1_000_000,
  //   address: '0x1A5890d45090701A35D995Be3b63948A67460341',
  // },
  {
    name: 'StrategyLenderYieldOptimiser',
    added: true,
    amount: 2_000_000,
    address: '0x32b8C26d0439e1959CEa6262CBabC12320b384c4',
  },
  {
    name: 'StrategyIdleidleUSDCYield',
    added: false,
    amount: 2_800_000,
    address: '0x2E1ad896D3082C52A5AE7Af307131DE7a37a46a0',
  },
  {
    name: 'StrategyIdleidleUSDTYield',
    added: false,
    amount: 2_800_000,
    address: '0x01b54c320d6B3057377cbc71d953d1BBa84df44e',
  },
  // {
  //   name: 'StrategysteCurveWETHSingleSided',
  //   added: false,
  //   amount: 1_000_000,
  //   address: '0x2886971eCAF2610236b4869f58cD42c115DFb47A',
  // },
  /* ETH */
  {
    name: 'convex_ankr',
    added: true,
    address: '0xB194dCFF4E11d26919Ce3B3255F69aEca5951e88',
    amount: 2_000_000,
  },
  {
    name: 'convex_reth',
    added: true,
    address: '0x8E4AA2E00694Adaf37f0311651262671f4d7Ac16',
    amount: 2_000_000,
  },
  /* MISC */
  {
    name: 'convex_link',
    added: true,
    address: '0xb7f013426d33fe27e4E8ABEE58500268554736bD',
    amount: 2_000_000,
  },
  {
    name: 'convex_eurs',
    added: true,
    address: '0xC45b3312c0DE684301a58A1eee558151BBE8f45c',
    amount: 2_000_000,
  },
  {
    name: 'convex_tricrypto',
    added: true,
    address: '0xCc39eC658Eedb7e44f5aeD9B5192219982D2c9e5',
    amount: 2_000_000,
  },
  {
    name: 'StrategyKashiMultiPairLender',
    added: false,
    address: '0xC8f17f8E15900b6D6079680b15Da3cE5263f62AA',
    amount: 2_000_000,
  },
];
