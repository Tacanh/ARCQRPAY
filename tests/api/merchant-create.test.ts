import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPostRequest, parseResponse, buildMerchant } from '@/tests/helpers';

// ── Hoisted mock factories ─────────────────────────────────────────────────────
// vi.mock() is hoisted to top of file — mocked fns must be defined with vi.hoisted()

const { mockCreateWallets, mockMerchantCreate } = vi.hoisted(() => ({
  mockCreateWallets: vi.fn(),
  mockMerchantCreate: vi.fn(),
}));

vi.mock('@/lib/circle', () => ({
  getCircleClient: vi.fn(() => ({ createWallets: mockCreateWallets })),
  CIRCLE_WALLET_SET_ID: 'test-wallet-set-id',
  ARC_BLOCKCHAIN_ID: 'ARC-TESTNET',
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { merchant: { create: mockMerchantCreate } },
}));

// Route import AFTER mock declarations
import { POST } from '@/app/api/merchant/create/route';

const merchant = buildMerchant();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/merchant/create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should create a merchant and return 201 on success', async () => {
    mockCreateWallets.mockResolvedValue({
      data: { wallets: [{ id: merchant.walletId, address: merchant.walletAddress }] },
    });
    mockMerchantCreate.mockResolvedValue(merchant);

    const req = mockPostRequest({ name: 'Test Shop' });
    const response = await POST(req);
    const { status, body } = await parseResponse<typeof merchant>(response);

    expect(status).toBe(201);
    expect(body).toMatchObject({
      id: merchant.id,
      name: merchant.name,
      walletAddress: merchant.walletAddress,
      walletId: merchant.walletId,
    });
    expect(mockMerchantCreate).toHaveBeenCalledOnce();
    expect(mockMerchantCreate).toHaveBeenCalledWith({
      data: { name: 'Test Shop', walletAddress: merchant.walletAddress, walletId: merchant.walletId },
    });
  });

  it('should return 400 when name is empty', async () => {
    const req = mockPostRequest({ name: '' });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when name is missing', async () => {
    const req = mockPostRequest({});
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 500 CIRCLE_ERROR when Circle returns empty wallets', async () => {
    mockCreateWallets.mockResolvedValue({ data: { wallets: [] } });
    const req = mockPostRequest({ name: 'Test Shop' });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(500);
    expect(body.error).toBe('CIRCLE_ERROR');
  });

  it('should return 500 INTERNAL_ERROR when Circle throws', async () => {
    mockCreateWallets.mockRejectedValue(new Error('Network error'));
    const req = mockPostRequest({ name: 'Test Shop' });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});
