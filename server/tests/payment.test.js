import test from "node:test";
import assert from "node:assert/strict";

// Provide deterministic test env defaults BEFORE importing config-dependent modules
process.env.NODE_ENV = "test";
process.env.GEMINI_ENCODER_KEY ||= "test-encoder-key";
process.env.SESSION_SECRET ||= "test-session-secret";
process.env.ACCESS_TOKEN_SECRET ||= "test-access-secret";
process.env.REFRESH_TOKEN_SECRET ||= "test-refresh-secret";
process.env.EMAIL_VERIFY_TOKEN_SECRET ||= "test-email-verify-secret";
process.env.PAYSTATION_BASE_URL = "https://sandbox.paystation.com.bd";
process.env.PAYSTATION_MERCHANT_ID = "TEST_MERCHANT_SECRET_ID";
process.env.PAYSTATION_PASSWORD = "TEST_MERCHANT_PASSWORD_999";
process.env.PAYSTATION_CALLBACK_URL =
  "http://localhost:5000/api/v1/payment/paystation-callback";
process.env.PAYSTATION_PAY_WITH_CHARGE = "0";

const {
  isGatewayApiSuccess,
  normalizeTransactionStatus,
  sanitizeBdPhone,
  roundBdtAmount,
  isValidPaystationUrl,
  sanitizePaystationError,
  initiatePayment,
  checkTransactionStatus,
  checkTransactionStatusByTrxId,
  verifyTransaction,
} = await import("../src/services/paystation/paystation.service.js");

const {
  calculateOrderPricing,
  validateAmountIntegrity,
  maskPhoneNumber,
  sanitizeTransactionForClient,
  createPaymentService,
} = await import("../src/services/payment/payment.service.js");

const { createPaystationPaymentSchema, paymentInvoiceParamSchema } =
  await import("../src/validations/index.js");

const { PAYMENT_STATUS } = await import("../src/constants/index.js");

test("calculateOrderPricing handles base, discountPrice, discountPercent, promo stacking, and 1 BDT floor", () => {
  const planPercent = {
    basePrice: 1000,
    discountPercent: 20,
    discountPrice: null,
  };
  const promo = { discountPercent: 15 };

  const res1 = calculateOrderPricing(planPercent, promo, 0);
  assert.equal(res1.basePrice, 1000);
  assert.equal(res1.priceAfterPlanDiscount, 800);
  assert.equal(res1.planDiscountAmount, 200);
  assert.equal(res1.promoDiscountAmount, 120);
  assert.equal(res1.expectedAmount, 680);
  assert.equal(res1.currency, "BDT");
  assert.equal(res1.payWithCharge, 0);

  // Explicit discountPrice overrides discountPercent
  const planFixed = {
    basePrice: 500,
    discountPrice: 350,
    discountPercent: 10,
  };
  const res2 = calculateOrderPricing(planFixed, { discountPercent: 50 }, 1);
  assert.equal(res2.priceAfterPlanDiscount, 350);
  assert.equal(res2.planDiscountAmount, 150);
  assert.equal(res2.promoDiscountAmount, 175);
  assert.equal(res2.expectedAmount, 175);
  assert.equal(res2.payWithCharge, 1);

  // Decimal rounding + 1 BDT floor for 100% promo
  const floorRes = calculateOrderPricing(
    { basePrice: 100, discountPercent: 0 },
    { discountPercent: 100 },
    0
  );
  assert.equal(floorRes.expectedAmount, 1);

  // Precision decimal rounding (99.99 * 0.85 = 84.9915 -> 84.99)
  const decimalRes = calculateOrderPricing(
    { basePrice: 99.99, discountPercent: 0 },
    { discountPercent: 15 },
    0
  );
  assert.equal(decimalRes.promoDiscountAmount, 15);
  assert.equal(decimalRes.expectedAmount, 84.99);
});

test("validateAmountIntegrity enforces exact BDT matching and payWithCharge rules", () => {
  // Exact & floating tolerance
  assert.equal(
    validateAmountIntegrity({ expectedAmount: 500, paidAmount: 500, payWithCharge: 0 })
      .valid,
    true
  );
  assert.equal(
    validateAmountIntegrity({
      expectedAmount: 500,
      paidAmount: 500.005,
      payWithCharge: 0,
    }).valid,
    true
  );

  // Underpayment or overpayment rejected when merchant absorbs charge
  assert.equal(
    validateAmountIntegrity({ expectedAmount: 500, paidAmount: 499, payWithCharge: 0 })
      .valid,
    false
  );
  assert.equal(
    validateAmountIntegrity({ expectedAmount: 500, paidAmount: 510, payWithCharge: 0 })
      .valid,
    false
  );

  // Customer bears charge: paidAmount >= expectedAmount, requestAmount matches expectedAmount
  assert.equal(
    validateAmountIntegrity({
      expectedAmount: 500,
      paidAmount: 512.5,
      requestAmount: 500,
      payWithCharge: 1,
    }).valid,
    true
  );
  assert.equal(
    validateAmountIntegrity({
      expectedAmount: 500,
      paidAmount: 499,
      requestAmount: 500,
      payWithCharge: 1,
    }).valid,
    false
  );
  assert.equal(
    validateAmountIntegrity({
      expectedAmount: 500,
      paidAmount: 512.5,
      requestAmount: 450,
      payWithCharge: 1,
    }).valid,
    false
  );

  // Invalid values rejected
  assert.equal(
    validateAmountIntegrity({ expectedAmount: 500, paidAmount: NaN, payWithCharge: 0 })
      .valid,
    false
  );
  assert.equal(
    validateAmountIntegrity({ expectedAmount: 0, paidAmount: 500, payWithCharge: 0 })
      .valid,
    false
  );
});

test("PayStation helper functions normalize statuses, phones, URLs, and strip secrets", () => {
  assert.equal(isGatewayApiSuccess({ status_code: "200", status: "success" }), true);
  assert.equal(isGatewayApiSuccess({ status_code: 200, status: "Success" }), true);
  assert.equal(isGatewayApiSuccess({ status_code: "1008", status: "failed" }), false);

  assert.equal(normalizeTransactionStatus("Successful"), "success");
  assert.equal(normalizeTransactionStatus("COMPLETED"), "success");
  assert.equal(normalizeTransactionStatus("cancelled"), "canceled");
  assert.equal(normalizeTransactionStatus("Processing"), "pending");
  assert.equal(normalizeTransactionStatus("Refund"), "refunded");
  assert.equal(normalizeTransactionStatus("failed"), "failed");
  assert.equal(normalizeTransactionStatus(""), "unknown");

  assert.equal(sanitizeBdPhone("+8801712-345678"), "01712345678");
  assert.equal(sanitizeBdPhone("8801812345678"), "01812345678");
  assert.equal(sanitizeBdPhone("invalid", "01700000000"), "01700000000");

  assert.equal(roundBdtAmount(10.005), 10.01);

  assert.equal(
    isValidPaystationUrl("https://sandbox.paystation.com.bd/checkout/abc"),
    true
  );
  assert.equal(
    isValidPaystationUrl("https://api.paystation.com.bd/checkout/abc"),
    true
  );
  assert.equal(isValidPaystationUrl("https://evil.example.com/pay"), false);
  assert.equal(isValidPaystationUrl("javascript:alert(1)"), false);

  assert.equal(maskPhoneNumber("01712345678"), "017****5678");

  const leakedAxiosErr = {
    code: "ECONNABORTED",
    message: "timeout exceeded",
    config: {
      data: JSON.stringify({
        merchantId: "TEST_MERCHANT_SECRET_ID",
        password: "TEST_MERCHANT_PASSWORD_999",
      }),
    },
    response: {
      status: 503,
      data: { status_code: "503", message: "Service temporarily unavailable" },
    },
  };
  const safeErr = sanitizePaystationError(leakedAxiosErr);
  assert.equal(safeErr.isTransient, true);
  assert.equal(safeErr.statusCode, 503);
  assert.equal(JSON.stringify(safeErr).includes("TEST_MERCHANT_PASSWORD_999"), false);
  assert.equal(JSON.stringify(safeErr).includes("TEST_MERCHANT_SECRET_ID"), false);
});

test("PayStation REST client handles initiatePayment, duplicate 1008, invalid redirect URL, and read retries", async () => {
  // 1. Successful initiatePayment
  const mockSuccessClient = {
    post: async (url, body) => {
      assert.equal(url, "/initiate-payment");
      assert.equal(body.merchantId, "TEST_MERCHANT_SECRET_ID");
      assert.equal(body.password, "TEST_MERCHANT_PASSWORD_999");
      assert.equal(body.currency, "BDT");
      return {
        data: {
          status_code: "200",
          status: "success",
          message: "Payment Link Created Successfully.",
          payment_amount: "500",
          invoice_number: body.invoice_number,
          payment_url: "https://sandbox.paystation.com.bd/checkout/token123",
        },
      };
    },
  };

  const initRes = await initiatePayment(
    {
      invoiceNumber: "INV-12345",
      amount: 500,
      customerName: "Test User",
      customerPhone: "+8801712345678",
      customerEmail: "user@example.com",
    },
    { httpClient: mockSuccessClient }
  );
  assert.equal(initRes.paymentUrl, "https://sandbox.paystation.com.bd/checkout/token123");

  // 2. Duplicate invoice 1008 -> 409
  const mockDupClient = {
    post: async () => ({
      data: {
        status_code: "1008",
        status: "failed",
        message: "Duplicate invoice number.",
      },
    }),
  };
  await assert.rejects(
    () =>
      initiatePayment(
        {
          invoiceNumber: "INV-DUP",
          amount: 100,
          customerName: "Test User",
          customerPhone: "01712345678",
          customerEmail: "user@example.com",
        },
        { httpClient: mockDupClient }
      ),
    (err) => err.statusCode === 409 && err.code === "PAYSTATION_DUPLICATE_INVOICE"
  );

  // 3. Untrusted payment_url rejected
  const mockEvilUrlClient = {
    post: async () => ({
      data: {
        status_code: "200",
        status: "success",
        payment_url: "https://phishing.attacker.tld/pay",
      },
    }),
  };
  await assert.rejects(
    () =>
      initiatePayment(
        {
          invoiceNumber: "INV-EVIL",
          amount: 100,
          customerName: "Test User",
          customerPhone: "01712345678",
          customerEmail: "user@example.com",
        },
        { httpClient: mockEvilUrlClient }
      ),
    (err) => err.statusCode === 502 && err.code === "INVALID_GATEWAY_URL"
  );

  // 4. checkTransactionStatus 1006 -> { found: false }
  const mockNotFoundClient = {
    post: async (url, _body, opts) => {
      assert.equal(url, "/transaction-status");
      assert.equal(opts.headers.merchantId, "TEST_MERCHANT_SECRET_ID");
      return {
        data: {
          status_code: "1006",
          status: "failed",
          message: "Transaction not found",
        },
      };
    },
  };
  const notFoundRes = await checkTransactionStatus("INV-404", {
    httpClient: mockNotFoundClient,
  });
  assert.equal(notFoundRes.found, false);
  assert.equal(notFoundRes.gatewayCode, "1006");

  // 5. Read retry on transient 503 then success
  let attempts = 0;
  const mockRetryClient = {
    post: async () => {
      attempts += 1;
      if (attempts === 1) {
        const err = new Error("Service Unavailable");
        err.response = { status: 503, data: { message: "Temporary outage" } };
        throw err;
      }
      return {
        data: {
          status_code: "200",
          status: "success",
          data: {
            invoice_number: "INV-RETRY",
            trx_status: "Success",
            trx_id: "TRX999",
            payment_amount: 500,
            payment_method: "bKash",
          },
        },
      };
    },
  };
  const retryRes = await checkTransactionStatus("INV-RETRY", {
    httpClient: mockRetryClient,
    retryOptions: { maxRetries: 2, baseDelayMs: 5 },
  });
  assert.equal(attempts, 2);
  assert.equal(retryRes.found, true);
  assert.equal(retryRes.data.trxId, "TRX999");

  // 6. verifyTransaction falls back from v1 (1006) to v2 (trxId)
  const mockFallbackClient = {
    post: async (url) => {
      if (url === "/transaction-status") {
        return {
          data: { status_code: "1006", status: "failed", message: "Not found" },
        };
      }
      if (url === "/v2/transaction-status") {
        return {
          data: {
            status_code: "200",
            status: "success",
            data: {
              invoice_number: "INV-V2",
              trx_status: "Success",
              trx_id: "TRX-V2",
              trx_amount: 750,
              request_amount: 750,
              payment_method: "Nagad",
            },
          },
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    },
  };
  const fallbackRes = await verifyTransaction(
    { invoiceNumber: "INV-V2", trxId: "TRX-V2" },
    { httpClient: mockFallbackClient }
  );
  assert.equal(fallbackRes.found, true);
  assert.equal(fallbackRes.apiVersion, "v2");
  assert.equal(fallbackRes.data.paymentAmount, 750);

  // Direct v2 lookup smoke test
  const v2Direct = await checkTransactionStatusByTrxId("TRX-V2", {
    httpClient: mockFallbackClient,
  });
  assert.equal(v2Direct.found, true);
  assert.equal(v2Direct.data.paymentMethod, "Nagad");
});

test("Zod schemas validate checkout payloads and invoice params", () => {
  const validBody = createPaystationPaymentSchema.safeParse({
    planId: "507f1f77bcf86cd799439011",
    promoCode: "SAVE20",
    customerPhone: "+880 1712-345678",
    idempotencyKey: "req-123",
  });
  assert.equal(validBody.success, true);

  const badPlanId = createPaystationPaymentSchema.safeParse({
    planId: "not-an-object-id",
  });
  assert.equal(badPlanId.success, false);

  const badPhone = createPaystationPaymentSchema.safeParse({
    planId: "507f1f77bcf86cd799439011",
    customerPhone: "12345",
  });
  assert.equal(badPhone.success, false);

  const validParam = paymentInvoiceParamSchema.safeParse({
    invoiceNumber: "INV-1700000000-ABCD1234",
  });
  assert.equal(validParam.success, true);

  const badParam = paymentInvoiceParamSchema.safeParse({
    invoiceNumber: "bad/../../invoice",
  });
  assert.equal(badParam.success, false);
});

test("verifyAndFulfillTransaction enforces idempotency, lock safety, amount integrity, and replay protection", async () => {
  function makeInMemoryMocks(initialTx) {
    const txStore = new Map([[initialTx.invoiceNumber, structuredClone(initialTx)]]);
    const appPayments = new Map();
    const counters = { planUpdates: 0, referrals: 0, promos: 0, emails: 0 };

    const PaymentTransactionModel = {
      async findOne(query) {
        if (query.invoiceNumber) {
          return txStore.get(query.invoiceNumber) || null;
        }
        return null;
      },
      async findById(id) {
        for (const doc of txStore.values()) {
          if (doc._id === id) return doc;
        }
        return null;
      },
      async updateOne(filter, update) {
        for (const doc of txStore.values()) {
          if (
            (filter._id && doc._id === filter._id) ||
            (filter.invoiceNumber && doc.invoiceNumber === filter.invoiceNumber)
          ) {
            if (filter.callbackReceivedAt === null && doc.callbackReceivedAt !== null) {
              return { modifiedCount: 0 };
            }
            if (filter.ipnReceivedAt === null && doc.ipnReceivedAt !== null) {
              return { modifiedCount: 0 };
            }
            applyMongoUpdate(doc, update);
            return { modifiedCount: 1 };
          }
        }
        return { modifiedCount: 0 };
      },
      async findOneAndUpdate(filter, update) {
        let doc = null;
        if (filter.invoiceNumber) {
          doc = txStore.get(filter.invoiceNumber) || null;
        } else if (filter._id) {
          for (const candidate of txStore.values()) {
            if (candidate._id === filter._id) {
              doc = candidate;
              break;
            }
          }
        }
        if (!doc) return null;
        if (filter.fulfilledAt === null && doc.fulfilledAt !== null) return null;
        if (filter.status?.$in && !filter.status.$in.includes(doc.status)) return null;
        if (filter.$or) {
          const matchesOr = filter.$or.some((branch) => {
            if (branch.status?.$in) return branch.status.$in.includes(doc.status);
            if (branch.status === doc.status && branch.processingStartedAt?.$lte) {
              return (
                doc.processingStartedAt &&
                new Date(doc.processingStartedAt) <= branch.processingStartedAt.$lte
              );
            }
            return false;
          });
          if (!matchesOr) return null;
        }
        applyMongoUpdate(doc, update);
        return structuredClone(doc);
      },
    };

    function applyMongoUpdate(doc, update) {
      if (update.$set) {
        for (const [key, val] of Object.entries(update.$set)) {
          const parts = key.split(".");
          let cur = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            cur[parts[i]] ??= {};
            cur = cur[parts[i]];
          }
          cur[parts[parts.length - 1]] = val;
        }
      }
      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          delete doc[key];
        }
      }
      if (update.$push?.events?.$each) {
        doc.events = [...(doc.events || []), ...update.$push.events.$each].slice(-25);
      }
    }

    const AppPaymentModel = {
      async findOne(query) {
        for (const p of appPayments.values()) {
          if (query.trxID && p.trxID === query.trxID) return p;
          if (query.paymentID && p.paymentID === query.paymentID) return p;
        }
        return null;
      },
      async create(payload) {
        const record = { _id: `pay_${appPayments.size + 1}`, ...payload };
        appPayments.set(record.paymentID, record);
        return record;
      },
    };

    return { txStore, appPayments, counters, PaymentTransactionModel, AppPaymentModel };
  }

  const baseTx = {
    _id: "tx_1",
    invoiceNumber: "INV-HAPPY-1",
    userId: "user_1",
    gateway: "paystation",
    status: PAYMENT_STATUS.PENDING,
    activeIdempotencyKey: "idem-1",
    plan: {
      id: "plan_1",
      name: "Pro Monthly",
      type: "subscription",
      planDuration: 30,
      credit: null,
    },
    promoCode: { id: "promo_1", code: "PROMO10", discountPercent: 10 },
    pricing: {
      basePrice: 500,
      priceAfterPlanDiscount: 500,
      planDiscountAmount: 0,
      promoDiscountAmount: 50,
      expectedAmount: 450,
      paidAmount: null,
      currency: "BDT",
      payWithCharge: 0,
    },
    customer: { name: "Test User", email: "user@example.com", phone: "01712345678" },
    fulfillmentSteps: {
      paymentRecorded: false,
      planUpdated: false,
      referralProcessed: false,
      promoRecorded: false,
      emailSent: false,
    },
    callbackReceivedAt: null,
    ipnReceivedAt: null,
    fulfilledAt: null,
    processingStartedAt: null,
    expiresAt: new Date(Date.now() + 1800_000),
    events: [],
  };

  // Scenario A: Happy path + duplicate callback idempotency
  const mocksA = makeInMemoryMocks(baseTx);
  const serviceA = createPaymentService({
    PaymentTransactionModel: mocksA.PaymentTransactionModel,
    AppPaymentModel: mocksA.AppPaymentModel,
    paystation: {
      ...{ normalizeTransactionStatus, sanitizeBdPhone, roundBdtAmount },
      isPaystationConfigured: () => true,
      assertPaystationConfigured: () => {},
      verifyTransaction: async () => ({
        found: true,
        apiVersion: "v1",
        data: {
          invoiceNumber: "INV-HAPPY-1",
          trxStatus: "Success",
          normalizedStatus: "success",
          trxId: "PS-TRX-100",
          paymentAmount: 450,
          paymentMethod: "bKash",
          payerMobileNo: "01712345678",
          raw: { trx_id: "PS-TRX-100" },
        },
      }),
    },
    planService: {
      updateUserPlan: async () => {
        mocksA.counters.planUpdates += 1;
        return true;
      },
      processReferralReward: async () => {
        mocksA.counters.referrals += 1;
      },
      recordPromoCodeUsage: async () => {
        mocksA.counters.promos += 1;
      },
    },
    sendPaymentEmail: async () => {
      mocksA.counters.emails += 1;
    },
  });

  const first = await serviceA.verifyAndFulfillTransaction("INV-HAPPY-1", {
    source: "callback",
  });
  const second = await serviceA.verifyAndFulfillTransaction("INV-HAPPY-1", {
    source: "ipn",
  });

  assert.equal(first.outcome, "completed");
  assert.equal(first.alreadyProcessed, false);
  assert.equal(second.outcome, "completed");
  assert.equal(second.alreadyProcessed, true);
  assert.equal(mocksA.counters.planUpdates, 1);
  assert.equal(mocksA.counters.referrals, 1);
  assert.equal(mocksA.counters.promos, 1);
  assert.equal(mocksA.appPayments.size, 1);
  const storedA = mocksA.txStore.get("INV-HAPPY-1");
  assert.equal(storedA.status, PAYMENT_STATUS.COMPLETED);
  assert.equal(storedA.activeIdempotencyKey, undefined);

  // Sanitization hides raw gateway response for non-admins and masks phone
  const clientView = sanitizeTransactionForClient(storedA, { isAdmin: false });
  assert.equal(clientView.payerMobileNo, "017****5678");
  assert.equal(clientView.gatewayResponse, undefined);

  // Scenario B: Amount mismatch blocks plan activation
  const mocksB = makeInMemoryMocks({
    ...baseTx,
    invoiceNumber: "INV-MISMATCH",
    pricing: { ...baseTx.pricing, expectedAmount: 450 },
  });
  const serviceB = createPaymentService({
    PaymentTransactionModel: mocksB.PaymentTransactionModel,
    AppPaymentModel: mocksB.AppPaymentModel,
    paystation: {
      isPaystationConfigured: () => true,
      assertPaystationConfigured: () => {},
      verifyTransaction: async () => ({
        found: true,
        apiVersion: "v1",
        data: {
          invoiceNumber: "INV-MISMATCH",
          trxStatus: "Success",
          normalizedStatus: "success",
          trxId: "PS-TRX-FRAUD",
          paymentAmount: 10, // Tampered underpayment
          paymentMethod: "bKash",
        },
      }),
    },
    planService: {
      updateUserPlan: async () => {
        mocksB.counters.planUpdates += 1;
        return true;
      },
      processReferralReward: async () => {},
      recordPromoCodeUsage: async () => {},
    },
    sendPaymentEmail: async () => {},
  });

  const mismatchRes = await serviceB.verifyAndFulfillTransaction("INV-MISMATCH", {
    source: "callback",
  });
  assert.equal(mismatchRes.outcome, "amount_mismatch");
  assert.equal(mocksB.counters.planUpdates, 0);
  assert.equal(mocksB.appPayments.size, 0);

  // Scenario C: Gateway trxId replay across different invoice is blocked
  const mocksC = makeInMemoryMocks({
    ...baseTx,
    invoiceNumber: "INV-REPLAY-2",
  });
  await mocksC.AppPaymentModel.create({
    paymentID: "INV-OLDER-1",
    trxID: "PS-TRX-SHARED",
    amount: 450,
  });
  const serviceC = createPaymentService({
    PaymentTransactionModel: mocksC.PaymentTransactionModel,
    AppPaymentModel: mocksC.AppPaymentModel,
    paystation: {
      isPaystationConfigured: () => true,
      assertPaystationConfigured: () => {},
      verifyTransaction: async () => ({
        found: true,
        apiVersion: "v1",
        data: {
          invoiceNumber: "INV-REPLAY-2",
          trxStatus: "Success",
          normalizedStatus: "success",
          trxId: "PS-TRX-SHARED",
          paymentAmount: 450,
        },
      }),
    },
    planService: {
      updateUserPlan: async () => {
        mocksC.counters.planUpdates += 1;
        return true;
      },
      processReferralReward: async () => {},
      recordPromoCodeUsage: async () => {},
    },
    sendPaymentEmail: async () => {},
  });

  const replayRes = await serviceC.verifyAndFulfillTransaction("INV-REPLAY-2", {
    source: "ipn",
  });
  assert.equal(replayRes.outcome, "failed");
  assert.equal(mocksC.counters.planUpdates, 0);

  // Scenario D: Concurrent callback + IPN contention processes fulfillment exactly once
  const mocksD = makeInMemoryMocks({
    ...baseTx,
    invoiceNumber: "INV-CONCURRENT",
  });
  const serviceD = createPaymentService({
    PaymentTransactionModel: mocksD.PaymentTransactionModel,
    AppPaymentModel: mocksD.AppPaymentModel,
    paystation: {
      isPaystationConfigured: () => true,
      assertPaystationConfigured: () => {},
      verifyTransaction: async () => ({
        found: true,
        apiVersion: "v1",
        data: {
          invoiceNumber: "INV-CONCURRENT",
          trxStatus: "Success",
          normalizedStatus: "success",
          trxId: "PS-TRX-RACE",
          paymentAmount: 450,
          paymentMethod: "Nagad",
        },
      }),
    },
    planService: {
      updateUserPlan: async () => {
        await new Promise((r) => setTimeout(r, 80));
        mocksD.counters.planUpdates += 1;
        return true;
      },
      processReferralReward: async () => {
        mocksD.counters.referrals += 1;
      },
      recordPromoCodeUsage: async () => {
        mocksD.counters.promos += 1;
      },
    },
    sendPaymentEmail: async () => {
      mocksD.counters.emails += 1;
    },
  });

  const [race1, race2] = await Promise.all([
    serviceD.verifyAndFulfillTransaction("INV-CONCURRENT", { source: "callback" }),
    serviceD.verifyAndFulfillTransaction("INV-CONCURRENT", { source: "ipn" }),
  ]);

  assert.equal(race1.outcome, "completed");
  assert.equal(race2.outcome, "completed");
  assert.equal(
    Number(race1.alreadyProcessed) + Number(race2.alreadyProcessed),
    1
  );
  assert.equal(mocksD.counters.planUpdates, 1);
  assert.equal(mocksD.counters.referrals, 1);
  assert.equal(mocksD.counters.promos, 1);
  assert.equal(mocksD.appPayments.size, 1);
});
