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
  {
    name: 'StrategystETHCurve',
    added: false,
    amount: 2_000_000,
    address: '0x979843B8eEa56E0bEA971445200e0eC3398cdB87',
  },
  {
    name: 'StrategyGenericLevCompFarm',
    added: false,
    amount: 2_000_000,
    address: '0x4D7d4485fD600c61d840ccbeC328BfD76A050F87',
  },
  {
    name: 'StrategyYearnVECRV',
    added: false,
    amount: 1_000_000,
    address: '0x2923a58c1831205C854DBEa001809B194FDb3Fa5',
  },
  {
    name: 'StrategyMakerETHDAIDelegate',
    added: true,
    amount: 2_000_000,
    address: '0x1A5890d45090701A35D995Be3b63948A67460341',
  },
  {
    name: 'StrategyLenderYieldOptimiser',
    added: true,
    amount: 2_000_000,
    address: '0x32b8C26d0439e1959CEa6262CBabC12320b384c4',
  },
  {
    name: 'StrategyeCurveWETHSingleSided',
    added: false,
    amount: 2_000_000,
    address: '0xda988eBb26F505246C59Ba26514340B634F9a7a2',
  },
  {
    name: 'StrategyIdleidleDAIYield',
    added: false,
    amount: 3_000_000,
    address: '0x9f51F4df0b275dfB1F74f6Db86219bAe622B36ca',
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
  {
    name: 'StrategysteCurveWETHSingleSided',
    added: false,
    amount: 1_000_000,
    address: '0x2886971eCAF2610236b4869f58cD42c115DFb47A',
  },
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
  // orb_unknown
  {
    name: 'orb_unknown_1',
    added: true,
    address: '0x04A508664B053E0A08d5386303E649925CBF763c',
    amount: 2_000_000,
  },
  {
    name: 'orb_unknown_2',
    added: true,
    address: '0x4730D10703155Ef4a448B17b0eaf3468fD4fb02d',
    amount: 2_000_000,
  },
  {
    name: 'orb_unknown_3',
    added: true,
    address: '0x9Ae0B9a67cF5D603847980D95Ad4D45b57Ff7783',
    amount: 2_000_000,
  },
];
