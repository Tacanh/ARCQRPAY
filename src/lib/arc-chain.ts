import { defineChain, createPublicClient, http } from 'viem';

// Arc Testnet chain definition for viem
// Source: https://docs.arc.network/integrate/connect-to-arc
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network']
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

// Arc Testnet public client
export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
  pollingInterval: 1000,
});

// USDC ERC-20 contract on Arc Testnet
// Source: https://docs.arc.network/arc/references/contract-addresses
// NOTE: ERC-20 interface uses 6 decimals (not 18 like native gas token)
export const USDC_CONTRACT_ADDRESS =
  '0x3600000000000000000000000000000000000000' as const;

export const USDC_DECIMALS = 6;

// Minimal ERC-20 ABI — only the functions we need
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;
