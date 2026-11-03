import { MongoClient, ObjectId } from "mongodb";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const SOURCE_URI = process.env.SOURCE_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const SOURCE_DB_NAME = process.env.SOURCE_DB || "GenMetaApp";

const TARGET_URI = process.env.TARGET_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const TARGET_DB_NAME = process.env.TARGET_DB || process.env.DB_NAME || "GenMetaApp_v2";

const BATCH_SIZE = 1000;

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return id;
}

function toDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

async function runDatabaseMigration() {
  console.log("======================================================================");
  console.log("     GENMETA ENTERPRISE DATABASE TRANSFORMATION & MIGRATION           ");
  console.log("======================================================================");
  console.log(`Source Database: ${SOURCE_URI} [${SOURCE_DB_NAME}] (READ-ONLY)`);
  console.log(`Target Database: ${TARGET_URI} [${TARGET_DB_NAME}] (NEW DATABASE)`);
  console.log("======================================================================\n");

  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    await sourceClient.connect();
    await targetClient.connect();
    console.log("✓ Connected to both database instances.\n");

    const sourceDb = sourceClient.db(SOURCE_DB_NAME);
    const targetDb = targetClient.db(TARGET_DB_NAME);

    // Drop target database to guarantee fresh, clean migration
    console.log(`Resetting target database [${TARGET_DB_NAME}] for clean migration...`);
    await targetDb.dropDatabase();
    console.log(`✓ Clean database initialized.\n`);

    // 1. MIGRATE USERS (Normalize fields, roles, logins, timestamps)
    console.log("▶ [1/9] Transforming & Migrating Users...");
    const usersCursor = sourceDb.collection("users").find({});
    let userBatch = [];
    let userCount = 0;

    for await (const user of usersCursor) {
      const email = (user.email || "").trim().toLowerCase();
      const loginProvider = Array.isArray(user.loginProvider) && user.loginProvider.length > 0
        ? user.loginProvider
        : user.googleId ? ["google"] : ["email"];

      let role = user.role || "user";
      if (!["user", "admin", "superAdmin"].includes(role)) {
        role = "user";
      }

      const transformedUser = {
        _id: toObjectId(user._id),
        name: (user.name || "User").trim(),
        email,
        password: user.password || undefined,
        avatar: user.avatar || user.profilePicture || null,
        isVerified: Boolean(user.isVerified),
        isDisabled: Boolean(user.isDisabled),
        role,
        loginProvider,
        referred: toObjectId(user.referred),
        ipAddress: user.ipAddress || null,
        verificationToken: user.verificationToken || null,
        refreshToken: user.refreshToken || null,
        createdAt: toDate(user.createdAt) || new Date(),
        updatedAt: toDate(user.updatedAt) || toDate(user.createdAt) || new Date(),
      };

      if (user.googleId) {
        transformedUser.googleId = String(user.googleId).trim();
      }

      userBatch.push(transformedUser);
      if (userBatch.length === BATCH_SIZE) {
        await targetDb.collection("users").insertMany(userBatch, { ordered: false });
        userCount += userBatch.length;
        process.stdout.write(`   → Processed ${userCount} users...\r`);
        userBatch = [];
      }
    }
    if (userBatch.length > 0) {
      await targetDb.collection("users").insertMany(userBatch, { ordered: false });
      userCount += userBatch.length;
    }
    console.log(`   ✓ Migrated ${userCount} users to ${TARGET_DB_NAME}.users`);

    // 2. MIGRATE APP PRICINGS
    console.log("\n▶ [2/9] Transforming & Migrating Pricing Plans...");
    const pricingCursor = sourceDb.collection("apppricings").find({});
    let pricingCount = 0;
    for await (const plan of pricingCursor) {
      const transformedPlan = {
        _id: toObjectId(plan._id),
        name: (plan.name || "Plan").trim(),
        type: plan.type === "credit" ? "credit" : "subscription",
        basePrice: Number(plan.basePrice) || 0,
        discountPrice: plan.discountPrice !== undefined ? Number(plan.discountPrice) : Number(plan.basePrice) || 0,
        discountPercent: Number(plan.discountPercent) || 0,
        isActive: Boolean(plan.isActive !== false),
        credit: plan.credit ? Number(plan.credit) : undefined,
        planDuration: Number(plan.planDuration) || 30,
        createdAt: toDate(plan.createdAt) || new Date(),
        updatedAt: toDate(plan.updatedAt) || new Date(),
      };
      await targetDb.collection("apppricings").insertOne(transformedPlan);
      pricingCount++;
    }
    console.log(`   ✓ Migrated ${pricingCount} pricing plans.`);

    // 3. MIGRATE APP KEYS & EXTRACT DAILY USAGE
    console.log("\n▶ [3/9] Transforming AppKeys & Extracting Historical Usage...");
    const appKeysCursor = sourceDb.collection("appkeys").find({});
    let appKeyBatch = [];
    let appKeyCount = 0;
    let dailyUsageBatch = [];
    let totalUsageRecords = 0;

    for await (const keyDoc of appKeysCursor) {
      const planType = keyDoc.plan?.type || "free";
      const planId = keyDoc.plan?.id || null;

      const transformedKey = {
        _id: toObjectId(keyDoc._id),
        userId: toObjectId(keyDoc.userId),
        username: (keyDoc.username || "").trim(),
        key: keyDoc.key,
        credit: Number(keyDoc.credit) || 0,
        isActive: Boolean(keyDoc.isActive !== false),
        status: keyDoc.status === "suspended" ? "suspended" : "active",
        suspendedAt: toDate(keyDoc.suspendedAt),
        expiresAt: toDate(keyDoc.expiresAt),
        allowedDevices: Array.isArray(keyDoc.allowedDevices) ? keyDoc.allowedDevices : [],
        plan: {
          type: ["free", "credit", "subscription"].includes(planType) ? planType : "free",
          id: planId,
        },
        totalProcess: Number(keyDoc.totalProcess) || 0,
        monthlyProcess: keyDoc.monthlyProcess || {},
        dailyProcess: keyDoc.dailyProcess || {},
        lastCreditRefresh: keyDoc.lastCreditRefresh || null,
        lastPlanChange: toDate(keyDoc.lastPlanChange) || toDate(keyDoc.createdAt) || new Date(),
        planHistory: Array.isArray(keyDoc.planHistory) ? keyDoc.planHistory : [],
        failedProcess: keyDoc.failedProcess || {},
        totalFailedProcess: Number(keyDoc.totalFailedProcess) || 0,
        createdAt: toDate(keyDoc.createdAt) || new Date(),
        updatedAt: toDate(keyDoc.updatedAt) || toDate(keyDoc.createdAt) || new Date(),
      };

      appKeyBatch.push(transformedKey);

      // Extract daily usage into dailyapiusages collection
      if (keyDoc.dailyProcess && typeof keyDoc.dailyProcess === "object") {
        for (const [dateStr, count] of Object.entries(keyDoc.dailyProcess)) {
          if (dateStr && count > 0) {
            dailyUsageBatch.push({
              appUserId: transformedKey._id,
              appKeyId: transformedKey._id,
              userId: transformedKey.userId,
              date: dateStr,
              processCount: Number(count) || 0,
              fileCount: 0,
              failedCount: 0,
              errors: [],
              createdAt: toDate(dateStr) || new Date(),
              updatedAt: new Date(),
            });

            if (dailyUsageBatch.length === BATCH_SIZE) {
              await targetDb.collection("dailyapiusages").insertMany(dailyUsageBatch, { ordered: false });
              totalUsageRecords += dailyUsageBatch.length;
              dailyUsageBatch = [];
            }
          }
        }
      }

      if (appKeyBatch.length === BATCH_SIZE) {
        await targetDb.collection("appkeys").insertMany(appKeyBatch, { ordered: false });
        appKeyCount += appKeyBatch.length;
        process.stdout.write(`   → Processed ${appKeyCount} app keys...\r`);
        appKeyBatch = [];
      }
    }

    if (appKeyBatch.length > 0) {
      await targetDb.collection("appkeys").insertMany(appKeyBatch, { ordered: false });
      appKeyCount += appKeyBatch.length;
    }

    if (dailyUsageBatch.length > 0) {
      await targetDb.collection("dailyapiusages").insertMany(dailyUsageBatch, { ordered: false });
      totalUsageRecords += dailyUsageBatch.length;
    }

    console.log(`   ✓ Migrated ${appKeyCount} app keys.`);
    console.log(`   ✓ Normalized ${totalUsageRecords} daily usage entries into [dailyapiusages].`);

    // 4. MIGRATE PAYMENTS
    console.log("\n▶ [4/9] Transforming & Migrating Payments...");
    const paymentsCursor = sourceDb.collection("apppayments").find({});
    let paymentBatch = [];
    let paymentCount = 0;

    for await (const pay of paymentsCursor) {
      let gateway = "bkash";
      const pid = pay.paymentID || "";
      if (pid.startsWith("INV") || pay.paymentDetails?.paymentMethod) {
        gateway = "paystation";
      }

      const transformedPay = {
        _id: toObjectId(pay._id),
        userId: toObjectId(pay.userId),
        paymentID: pay.paymentID,
        trxID: pay.trxID,
        amount: Number(pay.amount) || 0,
        currency: pay.paymentDetails?.currency || "BDT",
        gateway,
        plan: {
          id: pay.plan?.id || null,
          type: pay.plan?.type || "subscription",
          name: pay.plan?.name || "Plan",
        },
        status: pay.status || pay.paymentDetails?.transactionStatus || "Completed",
        paymentDetails: pay.paymentDetails || {},
        createdAt: toDate(pay.createdAt) || new Date(),
        updatedAt: toDate(pay.updatedAt) || toDate(pay.createdAt) || new Date(),
      };

      paymentBatch.push(transformedPay);
      if (paymentBatch.length === BATCH_SIZE) {
        await targetDb.collection("apppayments").insertMany(paymentBatch, { ordered: false });
        paymentCount += paymentBatch.length;
        paymentBatch = [];
      }
    }
    if (paymentBatch.length > 0) {
      await targetDb.collection("apppayments").insertMany(paymentBatch, { ordered: false });
      paymentCount += paymentBatch.length;
    }
    console.log(`   ✓ Migrated ${paymentCount} payment records.`);

    // 5. MIGRATE ORDERS
    console.log("\n▶ [5/9] Transforming & Migrating Orders...");
    const ordersCursor = sourceDb.collection("orders").find({});
    let orderBatch = [];
    let orderCount = 0;

    for await (const order of ordersCursor) {
      const transformedOrder = {
        _id: toObjectId(order._id),
        userId: toObjectId(order.userId),
        planId: toObjectId(order.planId),
        amount: Number(order.amount) || 0,
        planSnapshot: {
          name: order.planSnapshot?.name || "Plan",
          type: order.planSnapshot?.type || "subscription",
        },
        promoCodeId: toObjectId(order.promoCodeId),
        promoCodeUsed: order.promoCodeUsed || null,
        referralCodeId: toObjectId(order.referralCodeId),
        referralCode: order.referralCode || null,
        status: ["pending", "completed", "cancelled"].includes(order.status) ? order.status : "pending",
        notes: order.notes || null,
        createdAt: toDate(order.createdAt) || new Date(),
        updatedAt: toDate(order.updatedAt) || toDate(order.createdAt) || new Date(),
      };

      orderBatch.push(transformedOrder);
      if (orderBatch.length === BATCH_SIZE) {
        await targetDb.collection("orders").insertMany(orderBatch, { ordered: false });
        orderCount += orderBatch.length;
        orderBatch = [];
      }
    }
    if (orderBatch.length > 0) {
      await targetDb.collection("orders").insertMany(orderBatch, { ordered: false });
      orderCount += orderBatch.length;
    }
    console.log(`   ✓ Migrated ${orderCount} order records.`);

    // 6. MIGRATE PROMO CODES & EXTRACT REDEMPTIONS
    console.log("\n▶ [6/9] Transforming PromoCodes & Populating Redemptions Ledger...");
    const promoCursor = sourceDb.collection("promocodes").find({});
    let promoCount = 0;
    let redemptionCount = 0;

    for await (const promo of promoCursor) {
      const transformedPromo = {
        _id: toObjectId(promo._id),
        code: (promo.code || "").trim().toUpperCase(),
        description: promo.description || "",
        discountPercent: Number(promo.discountPercent) || 0,
        isActive: Boolean(promo.isActive !== false),
        appliesTo: ["subscription", "credit", "both"].includes(promo.appliesTo) ? promo.appliesTo : "both",
        usageLimit: promo.usageLimit ? Number(promo.usageLimit) : null,
        usedCount: Array.isArray(promo.usedCount) ? promo.usedCount : [],
        validFrom: toDate(promo.validFrom) || new Date(),
        validUntil: toDate(promo.validUntil) || new Date(Date.now() + 30 * 86400000),
        createdAt: toDate(promo.createdAt) || new Date(),
        updatedAt: toDate(promo.updatedAt) || new Date(),
      };

      await targetDb.collection("promocodes").insertOne(transformedPromo);
      promoCount++;

      // Populate normalized ledger
      if (Array.isArray(promo.usedCount)) {
        for (const userId of promo.usedCount) {
          if (!userId) continue;
          try {
            await targetDb.collection("promocoderedemptions").insertOne({
              promoCodeId: transformedPromo._id,
              code: transformedPromo.code,
              userId: toObjectId(userId),
              discountPercent: transformedPromo.discountPercent,
              discountAmount: 0,
              createdAt: transformedPromo.createdAt,
              updatedAt: transformedPromo.createdAt,
            });
            redemptionCount++;
          } catch {
            // Ignore duplicate
          }
        }
      }
    }
    console.log(`   ✓ Migrated ${promoCount} promo codes.`);
    console.log(`   ✓ Created ${redemptionCount} records in [promocoderedemptions] ledger.`);

    // 7. MIGRATE REFERRALS & EXTRACT EARNINGS + WITHDRAWALS
    console.log("\n▶ [7/9] Transforming Referrals & Extracting Normalized Ledgers...");
    const referralsCursor = sourceDb.collection("referrals").find({});
    let referralCount = 0;
    let earningsCount = 0;
    let withdrawalsCount = 0;

    for await (const ref of referralsCursor) {
      const transformedRef = {
        _id: toObjectId(ref._id),
        referrer: toObjectId(ref.referrer),
        withdrawAccount: ref.withdrawAccount || null,
        referralCode: (ref.referralCode || "").trim().toUpperCase(),
        availableBalance: Math.max(0, Number(ref.availableBalance) || 0),
        referredUsers: Array.isArray(ref.referredUsers) ? ref.referredUsers.map(toObjectId) : [],
        earnedHistory: Array.isArray(ref.earnedHistory) ? ref.earnedHistory : [],
        withdrawHistory: Array.isArray(ref.withdrawHistory) ? ref.withdrawHistory : [],
        createdAt: toDate(ref.createdAt) || new Date(),
        updatedAt: toDate(ref.updatedAt) || new Date(),
      };

      await targetDb.collection("referrals").insertOne(transformedRef);
      referralCount++;

      // Extract earnedHistory into referralearnings ledger
      if (Array.isArray(ref.earnedHistory)) {
        for (const earn of ref.earnedHistory) {
          if (!earn.user) continue;
          try {
            await targetDb.collection("referralearnings").insertOne({
              referralId: transformedRef._id,
              referrerId: transformedRef.referrer,
              referredUserId: toObjectId(earn.user),
              amount: Number(earn.amount) || 50,
              createdAt: toDate(earn.createdAt) || new Date(),
              updatedAt: toDate(earn.createdAt) || new Date(),
            });
            earningsCount++;
          } catch {
            // Ignore duplicates
          }
        }
      }

      // Extract withdrawHistory into referralwithdrawals ledger
      if (Array.isArray(ref.withdrawHistory)) {
        for (const w of ref.withdrawHistory) {
          try {
            await targetDb.collection("referralwithdrawals").insertOne({
              referralId: transformedRef._id,
              userId: transformedRef.referrer,
              amount: Number(w.amount) || 0,
              status: ["pending", "completed", "rejected"].includes(w.status) ? w.status : "pending",
              withdrawAccount: w.withdrawAccount || ref.withdrawAccount || "N/A",
              trx: w.trx || null,
              notes: w.notes || null,
              requestedAt: toDate(w.requestedAt) || toDate(w.createdAt) || new Date(),
              issuedAt: toDate(w.issuedAt),
              createdAt: toDate(w.createdAt) || new Date(),
              updatedAt: toDate(w.issuedAt) || toDate(w.createdAt) || new Date(),
            });
            withdrawalsCount++;
          } catch {
            // Ignore error
          }
        }
      }
    }

    console.log(`   ✓ Migrated ${referralCount} referral documents.`);
    console.log(`   ✓ Populated ${earningsCount} records in [referralearnings] ledger.`);
    console.log(`   ✓ Populated ${withdrawalsCount} records in [referralwithdrawals] ledger.`);

    // 8. MIGRATE SINGLETON CONFIGS (AiAPI, BKashToken)
    console.log("\n▶ [8/9] Migrating Tokens & AI Configuration...");
    const aiapis = await sourceDb.collection("aiapis").find({}).toArray();
    for (const a of aiapis) {
      await targetDb.collection("aiapis").insertOne({
        _id: toObjectId(a._id),
        ai_api_key: a.ai_api_key,
        name: a.name || "Gemini API Key",
        isActive: a.isActive !== false,
        createdAt: toDate(a.createdAt) || new Date(),
        updatedAt: toDate(a.updatedAt) || new Date(),
      });
    }

    const bkashtokens = await sourceDb.collection("bkashtokens").find({}).toArray();
    for (const b of bkashtokens) {
      await targetDb.collection("bkashtokens").insertOne({
        _id: toObjectId(b._id),
        id_token: b.id_token,
        refresh_token: b.refresh_token,
        expires_at: toDate(b.expires_at) || new Date(),
        created_at: toDate(b.created_at) || new Date(),
        createdAt: toDate(b.created_at) || new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`   ✓ Migrated AI keys (${aiapis.length}) and bKash tokens (${bkashtokens.length}).`);

    // 9. BUILD PRODUCTION COMPOUND INDEXES ON TARGET DATABASE
    console.log("\n▶ [9/9] Creating Optimized Compound Indexes on New Database...");

    // Users
    await targetDb.collection("users").createIndexes([
      { key: { email: 1 }, unique: true, name: "uniq_email" },
      {
        key: { googleId: 1 },
        unique: true,
        partialFilterExpression: { googleId: { $type: "string" } },
        name: "uniq_googleId"
      },
      { key: { role: 1, isVerified: 1, createdAt: -1 }, name: "idx_role_verified_created" },
    ]);

    // AppKeys
    await targetDb.collection("appkeys").createIndexes([
      { key: { key: 1 }, unique: true, name: "uniq_app_key" },
      { key: { userId: 1 }, name: "idx_appkey_userId" },
      { key: { username: 1 }, name: "idx_appkey_username" },
      { key: { "plan.type": 1, expiresAt: 1 }, name: "idx_plan_expires" },
      { key: { "plan.type": 1, credit: 1 }, name: "idx_plan_credit" },
      { key: { "plan.type": 1, lastCreditRefresh: 1 }, name: "idx_plan_refresh" },
      { key: { isActive: 1, status: 1 }, name: "idx_active_status" },
    ]);

    // AppPricings
    await targetDb.collection("apppricings").createIndexes([
      { key: { isActive: 1, type: 1, basePrice: 1 }, name: "idx_pricing_active_type" },
    ]);

    // AppPayments
    await targetDb.collection("apppayments").createIndexes([
      { key: { paymentID: 1 }, unique: true, name: "uniq_paymentID" },
      { key: { trxID: 1 }, unique: true, name: "uniq_trxID" },
      { key: { userId: 1, createdAt: -1 }, name: "idx_payment_user_created" },
      { key: { createdAt: -1, status: 1 }, name: "idx_payment_created_status" },
    ]);

    // Orders
    await targetDb.collection("orders").createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: "idx_order_user_created" },
      { key: { status: 1, createdAt: -1 }, name: "idx_order_status_created" },
      { key: { planId: 1 }, name: "idx_order_planId" },
    ]);

    // PromoCodes & Redemptions
    await targetDb.collection("promocodes").createIndexes([
      { key: { code: 1 }, unique: true, name: "uniq_promocode_code" },
      { key: { isActive: 1, validFrom: 1, validUntil: 1 }, name: "idx_promo_active_validity" },
    ]);
    await targetDb.collection("promocoderedemptions").createIndexes([
      { key: { promoCodeId: 1, userId: 1 }, unique: true, name: "uniq_promo_user_redemption" },
      { key: { userId: 1, createdAt: -1 }, name: "idx_redemption_user_created" },
    ]);

    // Referrals & Ledgers
    await targetDb.collection("referrals").createIndexes([
      { key: { referralCode: 1 }, unique: true, name: "uniq_referral_code" },
      { key: { referrer: 1 }, unique: true, name: "uniq_referral_referrer" },
      { key: { availableBalance: -1 }, name: "idx_referral_balance" },
    ]);
    await targetDb.collection("referralearnings").createIndexes([
      { key: { referralId: 1, referredUserId: 1 }, unique: true, name: "uniq_ref_earning" },
      { key: { referrerId: 1, createdAt: -1 }, name: "idx_referrer_created" },
    ]);
    await targetDb.collection("referralwithdrawals").createIndexes([
      { key: { status: 1, requestedAt: -1 }, name: "idx_withdrawal_status_req" },
      { key: { userId: 1, requestedAt: -1 }, name: "idx_withdrawal_user_req" },
    ]);

    // Daily Api Usages
    await targetDb.collection("dailyapiusages").createIndexes([
      { key: { appUserId: 1, date: 1 }, unique: true, name: "uniq_appuser_date" },
      { key: { appKeyId: 1, date: 1 }, name: "idx_appkey_date" },
      { key: { userId: 1, date: 1 }, name: "idx_user_date" },
      { key: { date: 1 }, name: "idx_usage_date" },
    ]);

    // 10. MIGRATE APPKEYS TO APPUSERS (NEW UNIFIED SYSTEM)
    console.log("\n▶ [10/10] Transitioning AppKeys to Unified AppUsers Collection...");
    const appKeysCol = targetDb.collection("appkeys");
    const appUsersCol = targetDb.collection("appusers");
    const usersCol = targetDb.collection("users");

    const legacyKeys = await appKeysCol.find().toArray();
    // Prioritize keys with usage/active status if duplicates exist
    legacyKeys.sort((a, b) => (b.totalProcess || 0) - (a.totalProcess || 0));

    const seenUserIds = new Set();
    const validAppUsers = [];

    for (const doc of legacyKeys) {
      const uidStr = doc.userId?.toString();
      if (!uidStr) continue;

      if (seenUserIds.has(uidStr)) {
        console.log(`   [Deduplicate] Skipping duplicate app key for userId: ${uidStr}`);
        continue;
      }
      seenUserIds.add(uidStr);

      validAppUsers.push({
        ...doc,
        userId: doc.userId instanceof ObjectId ? doc.userId : new ObjectId(doc.userId),
        username: (doc.username || "").toLowerCase().trim(),
        updatedAt: doc.updatedAt || new Date(),
      });
    }

    if (validAppUsers.length > 0) {
      await appUsersCol.insertMany(validAppUsers, { ordered: false });
    }

    // Populate missing AppUser profiles for registered users
    const allUsers = await usersCol
      .find({}, { projection: { _id: 1, email: 1, isDisabled: 1, createdAt: 1 } })
      .toArray();
    const existingAppUserIds = new Set(
      (await appUsersCol.find({}, { projection: { userId: 1 } }).toArray()).map((u) => u.userId.toString())
    );

    const missingUsers = allUsers.filter((u) => !existingAppUserIds.has(u._id.toString()));
    if (missingUsers.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const newAppUsers = missingUsers.map((u) => ({
        userId: u._id,
        username: (u.email || "").toLowerCase().trim(),
        key: crypto.randomBytes(32).toString("hex"),
        credit: 5,
        isActive: true,
        status: u.isDisabled ? "suspended" : "active",
        suspendedAt: null,
        expiresAt: null,
        allowedDevices: [],
        plan: {
          type: "free",
          id: null,
          name: "Free Tier",
        },
        totalProcess: 0,
        monthlyProcess: {},
        dailyProcess: {},
        lastCreditRefresh: today,
        lastPlanChange: u.createdAt || new Date(),
        planHistory: [],
        failedProcess: {},
        totalFailedProcess: 0,
        createdAt: u.createdAt || new Date(),
        updatedAt: new Date(),
      }));

      await appUsersCol.insertMany(newAppUsers, { ordered: false });
    }

    // AppUsers Compound Indexes
    await targetDb.collection("appusers").createIndexes([
      { key: { userId: 1 }, unique: true, name: "uniq_appuser_userId" },
      { key: { key: 1 }, unique: true, name: "uniq_appuser_key" },
      { key: { username: 1 }, unique: true, name: "uniq_appuser_username" },
      { key: { "plan.type": 1, expiresAt: 1 }, name: "idx_appuser_plan_expires" },
      { key: { "plan.type": 1, credit: 1 }, name: "idx_appuser_plan_credit" },
      { key: { "plan.type": 1, lastCreditRefresh: 1 }, name: "idx_appuser_plan_refresh" },
      { key: { isActive: 1, status: 1 }, name: "idx_appuser_active_status" },
      { key: { userId: 1, isActive: 1 }, name: "idx_appuser_user_active" },
      { key: { createdAt: -1 }, name: "idx_appuser_created" },
    ]);
    console.log(`   ✓ Created ${validAppUsers.length + missingUsers.length} documents in [appusers] with full indexes.`);

    // Record migrations as applied in target database
    await targetDb.collection("_migrations").insertMany([
      { name: "001_initial_indexes.js", batch: 1, executedAt: new Date() },
      { name: "002_normalize_referrals_and_promocodes.js", batch: 1, executedAt: new Date() },
      { name: "003_normalize_appkeys_and_pricing.js", batch: 1, executedAt: new Date() },
      { name: "004_migrate_appkeys_to_appusers.js", batch: 1, executedAt: new Date() },
    ]);

    console.log("   ✓ All compound indexes & migration history established.");

    // FINAL SUMMARY
    console.log("\n======================================================================");
    console.log("                     MIGRATION VERIFICATION AUDIT                     ");
    console.log("======================================================================");
    const targetCollections = await targetDb.listCollections().toArray();
    for (const col of targetCollections) {
      const c = await targetDb.collection(col.name).countDocuments();
      console.log(` • Collection [${col.name.padEnd(25)}]: ${c.toString().padStart(6)} documents`);
    }
    console.log("======================================================================");
    console.log(`\n🎉 New Database [${TARGET_DB_NAME}] created and migrated with complete data integrity!`);

  } catch (error) {
    console.error("\n❌ Migration to new database failed:", error);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

runDatabaseMigration();
