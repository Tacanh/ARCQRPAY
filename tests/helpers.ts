/**
 * Shared test utilities and factory helpers.
 */
import { vi } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Request Factory ───────────────────────────────────────────────────────────

/**
 * Build a lightweight mock NextRequest for POST routes.
 * The real NextRequest extends the Web Fetch API Request object,
 * so we mock only the subset our route handlers use.
 */
export function mockPostRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

/**
 * Build a mock GET NextRequest (no body).
 */
export function mockGetRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

// ── Response Helpers ──────────────────────────────────────────────────────────

/**
 * Parse the JSON body from a NextResponse.
 */
export async function parseResponse<T = unknown>(
  response: Response
): Promise<{ status: number; body: T }> {
  const body = await response.json() as T;
  return { status: response.status, body };
}

// ── Prisma Mock Factory ───────────────────────────────────────────────────────

export function buildMerchant(overrides: Partial<{
  id: string;
  name: string;
  walletAddress: string;
  walletId: string;
  createdAt: Date;
}> = {}) {
  return {
    id: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789',
    name: 'Test Shop',
    walletAddress: '0xmerchant000address',
    walletId: 'f1e2d3c4-b5a6-4789-9012-c3d4e5f6a789',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function buildBill(overrides: Partial<{
  id: string;
  amount: number;
  merchantId: string;
  status: string;
  txHash: string | null;
  paidAt: Date | null;
  createdAt: Date;
  merchant: ReturnType<typeof buildMerchant>;
}> = {}) {
  return {
    id: 'b2c3d4e5-f6a7-4890-b123-c4d5e6f7a890',
    amount: 5.0,
    merchantId: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789',
    status: 'PENDING',
    txHash: null,
    paidAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    merchant: buildMerchant(),
    ...overrides,
  };
}

// ── Circle Webhook Payload Factory ─────────────────────────────────────────────

export function buildCircleWebhookPayload(overrides: {
  state?: string;
  amount?: string;
  destinationAddress?: string;
  txHash?: string;
  notificationType?: string;
} = {}) {
  return {
    clientId: 'test-client-id',
    notificationType: overrides.notificationType ?? 'transfers',
    version: 1,
    customAttributes: {},
    transfer: {
      id: 'transfer-uuid-1',
      state: overrides.state ?? 'COMPLETE',
      amounts: [{ amount: overrides.amount ?? '5.0', currency: 'USD' }],
      destinationAddress: overrides.destinationAddress ?? '0xmerchant000address',
      transactionHash: overrides.txHash ?? '0x' + 'a'.repeat(64),
      createDate: '2026-01-01T00:00:00Z',
      updateDate: '2026-01-01T00:01:00Z',
    },
  };
}
