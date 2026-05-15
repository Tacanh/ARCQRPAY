import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPostRequest, parseResponse, buildMerchant, buildBill } from '@/tests/helpers';

const { mockBillFindUnique, mockBillUpdate, mockTrigger } = vi.hoisted(() => ({
  mockBillFindUnique: vi.fn(),
  mockBillUpdate: vi.fn(),
  mockTrigger: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bill: { findUnique: mockBillFindUnique, update: mockBillUpdate },
  },
}));

vi.mock('@/lib/pusher-server', () => ({
  getPusherServer: vi.fn(() => ({ trigger: mockTrigger })),
  merchantChannel: vi.fn((id: string) => `merchant-${id}`),
  PUSHER_EVENTS: { BILL_PAID: 'bill-paid', BILL_FAILED: 'bill-failed' },
}));

import { POST } from '@/app/api/bill/sync/route';

const merchant = buildMerchant();
const pendingBill = buildBill({ status: 'PENDING', merchant });
const TX_HASH = '0x' + 'c'.repeat(64);

describe('POST /api/bill/sync', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should mark bill PAID and notify Pusher on valid sync', async () => {
    mockBillFindUnique.mockResolvedValue(pendingBill);
    mockBillUpdate.mockResolvedValue({ ...pendingBill, status: 'PAID', txHash: TX_HASH });

    const req = mockPostRequest({ billId: pendingBill.id, txHash: TX_HASH });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ success: boolean; billId: string; status: string }>(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('PAID');
    expect(mockBillUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: pendingBill.id },
        data: expect.objectContaining({ status: 'PAID', txHash: TX_HASH }),
      })
    );
    expect(mockTrigger).toHaveBeenCalledOnce();
  });

  it('should return success and re-trigger Pusher if bill already PAID (idempotency)', async () => {
    const paidBill = buildBill({ status: 'PAID', txHash: TX_HASH, merchant });
    mockBillFindUnique.mockResolvedValue(paidBill);

    const req = mockPostRequest({ billId: paidBill.id, txHash: TX_HASH });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ success: boolean; status: string }>(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.status).toBe('PAID');
    expect(mockBillUpdate).not.toHaveBeenCalled();
    expect(mockTrigger).toHaveBeenCalledOnce();
  });

  it('should return 400 when bill is in FAILED state', async () => {
    mockBillFindUnique.mockResolvedValue(buildBill({ status: 'FAILED', merchant }));
    const req = mockPostRequest({ billId: pendingBill.id, txHash: TX_HASH });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when billId is not a UUID', async () => {
    const req = mockPostRequest({ billId: 'not-a-uuid', txHash: TX_HASH });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when txHash is too short', async () => {
    const req = mockPostRequest({ billId: pendingBill.id, txHash: '0xshort' });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 404 when bill does not exist', async () => {
    mockBillFindUnique.mockResolvedValue(null);
    const req = mockPostRequest({ billId: 'c3d4e5f6-a7b8-4901-a234-d5e6f7a8b9c0', txHash: TX_HASH });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 500 on unexpected DB exception', async () => {
    mockBillFindUnique.mockRejectedValue(new Error('DB crashed'));
    const req = mockPostRequest({ billId: pendingBill.id, txHash: TX_HASH });
    const response = await POST(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});
