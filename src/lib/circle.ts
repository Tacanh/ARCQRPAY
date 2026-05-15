import {
  initiateDeveloperControlledWalletsClient,
} from '@circle-fin/developer-controlled-wallets';

/**
 * Lazily-initialized Circle SDK client.
 * Uses server-side env vars only — never call this from client components.
 */
let circleClient: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;

export function getCircleClient() {
  if (!circleClient) {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      throw new Error(
        'Missing Circle credentials. Set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET in .env'
      );
    }

    circleClient = initiateDeveloperControlledWalletsClient({
      apiKey,
      entitySecret,
    });
  }

  return circleClient;
}

/** The WalletSet ID shared across all merchant wallets (created once in Circle Console). */
export const CIRCLE_WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID!;

/** Blockchain identifier for Arc Testnet as understood by Circle. */
export const ARC_BLOCKCHAIN_ID = 'ARC-TESTNET' as const;
