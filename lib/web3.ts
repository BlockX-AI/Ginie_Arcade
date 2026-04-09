import { http, createConfig } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';

export const config = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});

// Export chain for easy access
export { avalancheFuji };
