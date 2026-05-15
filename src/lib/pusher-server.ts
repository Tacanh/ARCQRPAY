import Pusher from 'pusher';

/**
 * Server-side Pusher instance for triggering events from API Routes.
 * Lazily-initialized singleton.
 */
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;

    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
      throw new Error('Missing Pusher server credentials in environment variables.');
    }

    pusherServer = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

/**
 * Build a unique Pusher channel name per merchant.
 * Convention: `merchant-{merchantId}`
 */
export function merchantChannel(merchantId: string): string {
  return `merchant-${merchantId}`;
}

/** Event names (single source of truth for both server and client). */
export const PUSHER_EVENTS = {
  BILL_PAID: 'bill-paid',
  BILL_FAILED: 'bill-failed',
} as const;
