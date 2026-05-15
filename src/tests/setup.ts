/**
 * Global test setup — runs before every test file.
 *
 * We set required environment variables here so the production code
 * can access them without throwing on startup.
 */

// ── Database ──────────────────────────────────────────────────────────────────
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/arcqrpay_test';

// ── Circle ────────────────────────────────────────────────────────────────────
process.env.CIRCLE_API_KEY = 'test-circle-api-key';
process.env.CIRCLE_ENTITY_SECRET = 'a'.repeat(64); // 32-byte hex placeholder
process.env.CIRCLE_WALLET_SET_ID = 'test-wallet-set-id';
process.env.CIRCLE_WEBHOOK_PUBLIC_KEY = 'test-public-key';
process.env.CIRCLE_SKIP_WEBHOOK_VERIFY = 'true'; // bypass SNS in unit tests

// ── Pusher ────────────────────────────────────────────────────────────────────
process.env.PUSHER_APP_ID = 'test-app-id';
process.env.PUSHER_KEY = 'test-key';
process.env.PUSHER_SECRET = 'test-secret';
process.env.PUSHER_CLUSTER = 'ap1';
process.env.NEXT_PUBLIC_PUSHER_KEY = 'test-key';
process.env.NEXT_PUBLIC_PUSHER_CLUSTER = 'ap1';
