import PusherJs from 'pusher-js';

let pusherClient: PusherJs | null = null;

/**
 * Browser-side Pusher client — safe to call from React components.
 * Uses NEXT_PUBLIC_ env vars (exposed to browser).
 */
export function getPusherClient(): PusherJs {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      throw new Error('Missing Pusher public client env vars (NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER).');
    }

    pusherClient = new PusherJs(key, {
      cluster,
    });
  }

  return pusherClient;
}
