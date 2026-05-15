import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPostRequest, mockGetRequest, parseResponse, buildMerchant, buildBill } from '@/tests/helpers';

const { mockMerchantFindUnique, mockBillCreate, mockBillFindUnique } = vi.hoisted(() => ({
  mockMerchantFindUnique: vi.fn(),
  mockBillCreate: vi.fn(),
  mockBillFindUnique: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: mockMerchantFindUnique },
    bill: { create: mockBillCreate, findUnique: mockBillFindUnique },
  },
}));

import { POST as createBill } from '@/app/api/bill/create/route';
import { GET as getBill } from '@/app/api/bill/[id]/route';

const merchant = buildMerchant();
const bill = buildBill({ merchant });

// ── POST /api/bill/create ─────────────────────────────────────────────────────

describe('POST /api/bill/create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should create a bill and return 201', async () => {
    mockMerchantFindUnique.mockResolvedValue(merchant);
    mockBillCreate.mockResolvedValue(bill);

    const req = mockPostRequest({ merchantId: merchant.id, amount: 5.0 });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{
      id: string; status: string; amount: number; merchantAddress: string;
    }>(response);

    expect(status).toBe(201);
    expect(body).toMatchObject({ id: bill.id, status: 'PENDING', amount: 5.0, merchantAddress: merchant.walletAddress });
    expect(mockBillCreate).toHaveBeenCalledOnce();
  });

  it('should return 400 when merchantId is not a valid UUID', async () => {
    const req = mockPostRequest({ merchantId: 'not-a-uuid', amount: 5.0 });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when amount is zero', async () => {
    const req = mockPostRequest({ merchantId: merchant.id, amount: 0 });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when amount is negative', async () => {
    const req = mockPostRequest({ merchantId: merchant.id, amount: -1.5 });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 400 when amount is missing', async () => {
    const req = mockPostRequest({ merchantId: merchant.id });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(400);
    expect(body.error).toBe('INVALID_REQUEST');
  });

  it('should return 404 when merchant does not exist', async () => {
    mockMerchantFindUnique.mockResolvedValue(null);
    const req = mockPostRequest({ merchantId: 'c3d4e5f6-a7b8-4901-a234-d5e6f7a8b9c0', amount: 5.0 });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 500 on DB exception during bill creation', async () => {
    mockMerchantFindUnique.mockResolvedValue(merchant);
    mockBillCreate.mockRejectedValue(new Error('DB crashed'));
    const req = mockPostRequest({ merchantId: merchant.id, amount: 5.0 });
    const response = await createBill(req);
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ── GET /api/bill/[id] ────────────────────────────────────────────────────────

describe('GET /api/bill/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return bill details for a valid id', async () => {
    mockBillFindUnique.mockResolvedValue(bill);
    const req = mockGetRequest();
    const response = await getBill(req, { params: Promise.resolve({ id: bill.id }) });
    const { status, body } = await parseResponse<{ id: string; status: string; amount: number }>(response);
    expect(status).toBe(200);
    expect(body).toMatchObject({ id: bill.id, status: 'PENDING', amount: 5.0 });
  });

  it('should return 404 for a non-existent bill id', async () => {
    mockBillFindUnique.mockResolvedValue(null);
    const req = mockGetRequest();
    const response = await getBill(req, {
      params: Promise.resolve({ id: 'c3d4e5f6-a7b8-4901-a234-d5e6f7a8b9c0' }),
    });
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 500 on DB exception', async () => {
    mockBillFindUnique.mockRejectedValue(new Error('DB error'));
    const req = mockGetRequest();
    const response = await getBill(req, { params: Promise.resolve({ id: bill.id }) });
    const { status, body } = await parseResponse<{ error: string }>(response);
    expect(status).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});
