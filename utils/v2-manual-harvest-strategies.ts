import { e18 } from './web3-utils';

export const manualHarvestStrategies = [
  /* BTC */
  {
    name: 'convex_hcrv',
    address: '0x7Ed0d52C5944C7BF92feDC87FEC49D474ee133ce',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
    amount: e18.mul(5),
  },
  {
    name: 'convex_bbtc',
    address: '0xE9ac8D34C546CBfdAD98F9a4546Db5fE08D01bF2',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(5),
  },
  {
    name: 'convex_obtc',
    address: '0xDb2D3F149270630382D4E6B4dbCd47e665D78D76',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(5),
  },
  {
    name: 'convex_pbtc',
    address: '0x7b5cb4694b0A299ED2F65db7d87B286461549e84',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(5),
  },
  {
    name: 'convex_sbtc',
    address: '0x7aB4DB515bf258A88Bb14f3685769a0f70B8778f',
    maxReportDelay: 60 * 60 * 24 * 6.73, // 6.73 days
    amount: e18.mul(5),
  },
  {
    name: 'convex_tbtc',
    address: '0x07fb6A53185E2F095253099A47F34CD410eB2A89',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
    amount: e18.mul(5),
  },
  {
    name: 'convex_renbtc',
    address: '0x7799F476522Ebe259fc525C1A21E84f7Dd551955',
    maxReportDelay: 60 * 60 * 24 * 6.93, // 6.93 days
    amount: e18.mul(5),
  },
  // /* ETH */ Moved to job
  // {
  //   name: 'convex_ankr',
  //   address: '0xB194dCFF4E11d26919Ce3B3255F69aEca5951e88',
  //   maxReportDelay: 60 * 60 * 24 * 6.84, // 6.84 days
  //   amount: e18.mul(125),
  // },
  // {
  //   name: 'convex_reth',
  //   address: '0x8E4AA2E00694Adaf37f0311651262671f4d7Ac16',
  //   maxReportDelay: 60 * 60 * 24 * 6.45, // 6.45 days
  //   amount: e18.mul(125),
  // },
  // /* MISC */ Moved to job
  // {
  //   name: 'convex_link',
  //   address: '0xb7f013426d33fe27e4E8ABEE58500268554736bD',
  //   maxReportDelay: 60 * 60 * 24 * 6.84, // 6.84 days
  //   amount: e18.mul(12500),
  // },
  // {
  //   name: 'convex_eurs',
  //   address: '0xC45b3312c0DE684301a58A1eee558151BBE8f45c',
  //   maxReportDelay: 60 * 60 * 24 * 4.1, // 4.1 days
  //   amount: e18.mul(250000),
  // },
  // {
  //   name: 'convex_tricrypto',
  //   address: '0xCc39eC658Eedb7e44f5aeD9B5192219982D2c9e5',
  //   maxReportDelay: 60 * 60 * 24 * 4.3, // 4.3 days
  //   amount: e18.mul(250),
  // },
  /* STABLECOINS */
  {
    name: 'convex_usdp',
    address: '0xfb0702469A1a0440E87C06605461E8660FD0F43d',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_usdn',
    address: '0x8e87e65Cb28c069550012f92d5470dB6EB6897c0',
    maxReportDelay: 60 * 60 * 20, // 20 hours
    amount: e18.mul(150000),
  },
  {
    name: 'convex_comp',
    address: '0x2b0b941d98848d6c9C729d944E3B1BD9C00A5529',
    maxReportDelay: 60 * 60 * 24 * 5, // 5 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_ybusd',
    address: '0x3cA0B4d7eedE71061B0bAdb4F0E86E99b0FEa613',
    maxReportDelay: 60 * 60 * 24 * 5, // 5 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_susd',
    address: '0xFA773b91b59B0895877c769000b9824b46b13a20',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_3pool',
    address: '0xeC088B98e71Ba5FFAf520c2f6A6F0153f1bf494B',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_yusd',
    address: '0xA5189cb0149761A8346D64E384924b2394dFa595',
    maxReportDelay: 60 * 60 * 24 * 6, // 6 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_gusd',
    address: '0x2D42CFdC6a1B03490892AdF7DC6c62AA7228E5D6',
    maxReportDelay: 60 * 60 * 24 * 6, // 6 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_ust',
    address: '0x0921E388e86bbE0356e37413F946ccE47EDd294D',
    maxReportDelay: 60 * 60 * 24 * 6, // 6 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_husd',
    address: '0xdC929e76081a78e5c32552C2e79D29ECab3F6755',
    maxReportDelay: 60 * 60 * 24 * 7, // 7 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_dusd',
    address: '0x33d7E0Fa2c7Db85Ef3AbC1C44e07E0b5cB2E4C14',
    maxReportDelay: 60 * 60 * 24 * 5, // 5 days
    amount: e18.mul(100000),
  },
  // { // deprecated
  //   name: 'convex_musd',
  //   address: '0x75be6ABC02a010559Ed5c7b0Eab94abD2B783b65',
  //   maxReportDelay: 60 * 60 * 24 * 6.75, // 6.75 days
  //   amount: e18.mul(100000),
  // },
  {
    name: 'convex_aave',
    address: '0xAC4AE0B06C913dF4608dB60E2571a8e91b74C619',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_saave',
    address: '0xF5636591256195414f25d19034B70A4742Fc2A2e',
    maxReportDelay: 60 * 60 * 24 * 4, // 4 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_lusd',
    address: '0x789685963DF287337759A9FaB65d8c645a3B4cba',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_frax',
    address: '0x8c312B63Bc4000f61E1C4df4868A3A1f09b31A73',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(100000),
  },
  // { // deprecated
  //   name: 'convex_busd',
  //   address: '0xA44F947e51Ec6456A1d786F82ea5865F87Da9C30',
  //   maxReportDelay: 60 * 60 * 24 * 6.94, // 6.94 days
  //   amount: e18.mul(100000),
  // },
  {
    name: 'convex_tusd',
    address: '0x270101459e9A38Db38Ba4Cb8718FfA31953A9Af3',
    maxReportDelay: 60 * 60 * 24 * 7, // 7 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_alusd',
    address: '0xf8Fb278DeeaF30Ff3F6326d928A61eA8b9397d16',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
    amount: e18.mul(100000),
  },
  {
    name: 'convex_ironbank',
    address: '0xf0aAba6bb8E6bAE83Ea984BC4b7dcf0fF54a8FEF',
    maxReportDelay: 60 * 60 * 22, // 22 hours
    amount: e18.mul(2500000),
  },
  {
    name: 'convex_seth',
    address: '0x22D07F42Cf4D077E765560ff6A741eF8E851091c',
    maxReportDelay: 60 * 60 * 90, // 90 hours
    amount: e18.mul(200),
  },
  {
    name: 'convex_steth',
    address: '0x6C0496fC55Eb4089f1Cf91A4344a2D56fAcE51e3',
    maxReportDelay: 60 * 60 * 45, // 45 hours
    amount: e18.mul(300),
  },
  {
    name: 'convex_3crypto',
    address: '0x2055CFD5CDbc90c60A202A1AC3DDfB71AeC1cE98',
    maxReportDelay: 60 * 60 * 24, // 24 hours
    amount: e18.mul(500),
  },
  {
    name: 'idle_rai_yield',
    address: '0x5d411d2cde10e138d68517c42be2808c90c22026',
    amount: e18.mul(1000000),
  },
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
    name: 'sam_unknown_4',
    address: '0x83B6211379c26E0bA8d01b9EcD4eE1aE915630aa',
    maxReportDelay: 60 * 60 * 24, // 24 hours
  },
  {
    name: 'sam_unknown_5',
    address: '0xDD387F2fe0D9B1E5768fc941e7E48AA8BfAf5e41',
    maxReportDelay: 60 * 60 * 80, // 80 hours
  },
  {
    name: 'ssc_steth',
    address: '0x8c44Cc5c0f5CD2f7f17B9Aca85d456df25a61Ae8',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
  },
  {
    name: 'ssc_seth',
    address: '0xCdC3d3A18c9d83Ee6E10E91B48b1fcb5268C97B5',
    maxReportDelay: 60 * 60 * 24 * 3, // 3 days
  },
  // poolpi's strats
  {
    name: 'Router_yvDAI_030_to_yvDAI_043',
    address: '0x3D6532c589A11117a4494d9725bb8518C731f1Be',
    maxReportDelay: 60 * 60 * 24 * 2, // 2 days
    // amount: e18.mul(2500000),
  },
];
