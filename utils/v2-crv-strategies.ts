import { e18 } from './web3-utils';

export const defaultRequiredHarvestAmount = e18.mul(10_000);

export const v2CrvStrategies = [
  // TODO update all and add strategy.profitFactor
  {
    name: 'LUSD',
    added: true,
    address: '0x21e5a745d77430568C074569C06e6c765922626a',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'yUSD',
    added: true,
    address: '0x6d45c5a8C1cF1f77Ab89cAF8D44917730298bab7',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'y3CRV',
    added: true,
    address: '0x9d7c11D1268C8FD831f1b92A304aCcb2aBEbfDe1',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'GUSD',
    added: true,
    address: '0x9C1117cf2ED3A0F4A9F069001F517c1D511c8B53',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'FRAX',
    added: true,
    address: '0xb622F17e1ba8C51b9BD760Fb37994a55b1e5CD85',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'Compound',
    added: true,
    address: '0xdDAAc8B5Dd65d079b6572e43890BDD8d95bD5cc3',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'yBUSD',
    added: true,
    address: '0xB3E1a513a2fE74EcF397dF9C0E6BCe5B57A961C8',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'sAave',
    added: true,
    address: '0xE73817de3418bB44A4FeCeBa53Aa835333C550e7',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'TUSD',
    added: true,
    address: '0xE7C32D413341bfc84BB58492BEA8a69e8D06E0b4',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'BUSDv2',
    added: true,
    address: '0x687C424F6CB4Be24587af6c7E85CA33d5015938d',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },
  {
    name: 'DUSD',
    added: true,
    address: '0x4C547b6202247E7B7c45A95d7747A85704530ab3',
    requiredHarvestAmount: defaultRequiredHarvestAmount,
    requiredEarn: { amount: 100, decimals: 18 },
  },  
  {
    name: 'hbtc',
    added: false,
    address: '0xEeabc022EA72AFC585809214a43e1dDF3b34FBB6',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
  {
    name: 'sbtc',
    added: false,
    address: '0x24345144c80BC994C12d85fb276bB4c5520579Ea',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
  {
    name: 'obtc',
    added: false,
    address: '0x126e4fDfa9DCEA94F8f4157EF8ad533140C60fC7',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
  {
    name: 'pbtc',
    added: false,
    address: '0xf726472B7BE7461001df396C55CAdB1870c78dAE',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
  {
    name: 'rbtc',
    added: false,
    address: '0x9eCC1abbA680C5cAACA37AD56E446ED741d86731',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
  {
    name: 'bbtc',
    added: false,
    address: '0xe9Fd1BEfdd412C8966689A64dE74a783AfA6AD57',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
  {
    name: 'tbtc',
    added: false,
    address: '0x060E04305C07DdE40A9f57bB4fFAcd662D51Ab96',
    requiredHarvestAmount: e18.mul(5000),
    requiredEarn: { amount: 3, decimals: 18 },
  },
    
];
