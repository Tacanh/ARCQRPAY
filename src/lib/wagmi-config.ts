import { http, createConfig } from 'wagmi'
import { sepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains'
import { arcTestnet } from './arc-chain'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})
