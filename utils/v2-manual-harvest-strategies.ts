import { e18 } from './web3-utils';

export const manualHarvestStrategies = [
  {
    name: 'convex_hcrv',
    address: '0x7Ed0d52C5944C7BF92feDC87FEC49D474ee133ce',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(3),
  },
  {
    name: 'convex_ankr',
    address: '0xB194dCFF4E11d26919Ce3B3255F69aEca5951e88',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_link',
    address: '0xb7f013426d33fe27e4E8ABEE58500268554736bD',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(3000),
  },
  {
    name: 'convex_eurs',
    address: '0x4DC2CCC9E76bD30982243C1cB915003e17a88Eb9',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_usdp',
    address: '0xfb0702469A1a0440E87C06605461E8660FD0F43d',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_usdn',
    address: '0x8e87e65Cb28c069550012f92d5470dB6EB6897c0',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_comp',
    address: '0x2b0b941d98848d6c9C729d944E3B1BD9C00A5529',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_susd',
    address: '0xFA773b91b59B0895877c769000b9824b46b13a20',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_3pool',
    address: '0xeC088B98e71Ba5FFAf520c2f6A6F0153f1bf494B',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_gusd',
    address: '0x2D42CFdC6a1B03490892AdF7DC6c62AA7228E5D6',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_ust',
    address: '0x0921E388e86bbE0356e37413F946ccE47EDd294D',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_dusd',
    address: '0x33d7E0Fa2c7Db85Ef3AbC1C44e07E0b5cB2E4C14',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_musd',
    address: '0x75be6ABC02a010559Ed5c7b0Eab94abD2B783b65',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_lusd',
    address: '0x789685963DF287337759A9FaB65d8c645a3B4cba',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
  {
    name: 'convex_busd',
    address: '0xA44F947e51Ec6456A1d786F82ea5865F87Da9C30',
    maxReportDelay: 60 * 60 * 24 * 1, // 1 day
    amount: e18.mul(50000),
  },
];
