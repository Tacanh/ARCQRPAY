import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockPostRequest, parseResponse, buildMerchant, buildBill, buildCircleWebhookPayload } from '@/tests/helpers';

const { mockMerchantFindFirst, mockBillFindFirst, mockBillUpdate, mockTrigger } = vi.hoisted(() => ({
  mockMerchantFindFirst: vi.fn(),
  mockBillFindFirst: vi.fn(),
  mockBillUpdate: vi.fn(),
  mockTrigger: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findFirst: mockMerchantFindFirst },
    bill: { findFirst: mockBillFindFirst, update: mockBillUpdate },
  },
}));

vi.mock('@/lib/pusher-server', () => ({
  getPusherServer: vi.fn(() => ({ trigger: mockTrigger })),
  merchantChannel: vi.fn((id: string) => `merchant-${id}`),
  PUSHER_EVENTS: { BILL_PAID: 'bill-paid', BILL_FAILED: 'bill-failed' },
}));

import { POST } from '@/app/api/webhooks/circle/route';

const merchant = buildMerchant();
const pendingBill = buildBill({ status: 'PENDING', txHash: null });
const TX_HASH = '0x' + 'b'.repeat(64);

describe('POST /api/webhooks/circle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should mark bill PAID and trigger Pusher on a COMPLETE transfer', async () => {
    mockMerchantFindFirst.mockResolvedValue(merchant);
    mockBillFindFirst.mockResolvedValue(pendingBill);
    mockBillUpdate.mockResolvedValue({ ...pendingBill, status: 'PAID', txHash: TX_HASH });

    const payload = buildCircleWebhookPayload({
      state: 'COMPLETE', amount: '5.0',
      destinationAddress: merchant.walletAddress, txHash: TX_HASH,
    });

    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ success: boolean; billId: string }>(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.billId).toBe(pendingBill.id);
    expect(mockBillUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: pendingBill.id },
        data: expect.objectContaining({ status: 'PAID', txHash: TX_HASH }),
      })
    );
    expect(mockTrigger).toHaveBeenCalledOnce();
    expect(mockTrigger).toHaveBeenCalledWith(
      `merchant-${merchant.id}`, 'bill-paid',
      expect.objectContaining({ billId: pendingBill.id, txHash: TX_HASH })
    );
  });

  it('should NOT double-update a bill already PAID with same txHash (idempotency)', async () => {
    const paidBill = buildBill({ status: 'PAID', txHash: TX_HASH });
    mockMerchantFindFirst.mockResolvedValue(merchant);
    mockBillFindFirst.mockResolvedValue(paidBill);

    const payload = buildCircleWebhookPayload({ txHash: TX_HASH });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ success: boolean; note: string }>(response);

    expect(status).toBe(200);
    expect(body.note).toBe('Already processed');
    expect(mockBillUpdate).not.toHaveBeenCalled();
  });

  it('should ignore non-transfer notification types', async () => {
    const payload = buildCircleWebhookPayload();
    const req = mockPostRequest({ ...payload, notificationType: 'wallets' });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ ignored: boolean }>(response);
    expect(status).toBe(200);
    expect(body.ignored).toBe(true);
    expect(mockMerchantFindFirst).not.toHaveBeenCalled();
  });

  it('should ignore transfers not in COMPLETE state', async () => {
    const payload = buildCircleWebhookPayload({ state: 'PENDING' });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ ignored: boolean }>(response);
    expect(status).toBe(200);
    expect(body.ignored).toBe(true);
    expect(mockMerchantFindFirst).not.toHaveBeenCalled();
  });

  it('should return 200+ignored when no merchant matches destination address', async () => {
    mockMerchantFindFirst.mockResolvedValue(null);
    const payload = buildCircleWebhookPayload({ destinationAddress: '0xunknown' });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ ignored: boolean }>(response);
    expect(status).toBe(200);
    expect(body.ignored).toBe(true);
    expect(mockBillFindFirst).not.toHaveBeenCalled();
  });

  it('should return 200+ignored when no PENDING bill matches the amount', async () => {
    mockMerchantFindFirst.mockResolvedValue(merchant);
    mockBillFindFirst.mockResolvedValue(null);
    const payload = buildCircleWebhookPayload({ amount: '999.0' });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ ignored: boolean }>(response);
    expect(status).toBe(200);
    expect(body.ignored).toBe(true);
    expect(mockBillUpdate).not.toHaveBeenCalled();
  });

  it('should still mark PAID even if Pusher trigger fails (non-fatal)', async () => {
    mockMerchantFindFirst.mockResolvedValue(merchant);
    mockBillFindFirst.mockResolvedValue(pendingBill);
    mockBillUpdate.mockResolvedValue({ ...pendingBill, status: 'PAID', txHash: TX_HASH });
    mockTrigger.mockRejectedValueOnce(new Error('Pusher timeout'));

    const payload = buildCircleWebhookPayload({ txHash: TX_HASH });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ success: boolean }>(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockBillUpdate).toHaveBeenCalledOnce();
  });

  it('should return 400 when JSON body is malformed', async () => {
    const req = {
      text: vi.fn().mockResolvedValue('{ invalid json }'),
      headers: { get: () => null },
    } as never;

    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when req.text() throws', async () => {
    const req = {
      text: vi.fn().mockRejectedValue(new Error('Network drop')),
      headers: { get: () => null },
    } as never;

    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when transfer is missing destinationAddress', async () => {
    const payload = buildCircleWebhookPayload({ destinationAddress: '' });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when transfer is missing txHash', async () => {
    const payload = buildCircleWebhookPayload({ txHash: '' });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when transfer amount is zero', async () => {
    const payload = buildCircleWebhookPayload({ amount: '0' });
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when transfer amounts array is empty', async () => {
    const payload = buildCircleWebhookPayload();
    payload.transfer.amounts = []; // Override to empty array
    const req = mockPostRequest(payload);
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  describe('Signature Verification', () => {
    const originalVerifyBypass = process.env.CIRCLE_SKIP_WEBHOOK_VERIFY;
    const originalPublicKey = process.env.CIRCLE_WEBHOOK_PUBLIC_KEY;

    beforeEach(() => {
      // Disable bypass to test actual signature verification logic
      process.env.CIRCLE_SKIP_WEBHOOK_VERIFY = 'false';
    });

    afterEach(() => {
      process.env.CIRCLE_SKIP_WEBHOOK_VERIFY = originalVerifyBypass;
      process.env.CIRCLE_WEBHOOK_PUBLIC_KEY = originalPublicKey;
    });

    it('should return 401 when public key is not configured', async () => {
      process.env.CIRCLE_WEBHOOK_PUBLIC_KEY = '';
      const payload = buildCircleWebhookPayload();
      const req = mockPostRequest(payload);
      
      const response = await POST(req);
      const { status, body } = await parseResponse<{ error: string }>(response);
      expect(status).toBe(401);
      expect(body.error).toBe('WEBHOOK_INVALID');
    });

    it('should return 401 when x-circle-signature header is missing', async () => {
      const payload = buildCircleWebhookPayload();
      // No headers provided
      const req = mockPostRequest(payload);
      
      const response = await POST(req);
      const { status, body } = await parseResponse<{ error: string }>(response);
      expect(status).toBe(401);
      expect(body.error).toBe('WEBHOOK_INVALID');
    });

    it('should return 401 when crypto.verify throws or returns false (invalid signature)', async () => {
      const payload = buildCircleWebhookPayload();
      const req = mockPostRequest(payload, { 'x-circle-signature': 'invalid-signature' });
      
      // Node's crypto.createVerify will throw if the public key is not a valid PEM,
      // which our test key 'test-public-key' is not. This tests the catch block.
      const response = await POST(req);
      const { status, body } = await parseResponse<{ error: string }>(response);
      expect(status).toBe(401);
      expect(body.error).toBe('WEBHOOK_INVALID');
    });
  });
});
