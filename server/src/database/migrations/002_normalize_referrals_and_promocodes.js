/**
 * Migration: 002_normalize_referrals_and_promocodes
 * Description: Migrates legacy embedded referral histories and promocode usage into normalized ledger collections
 */
export async function up(connection) {
  const db = connection.db;

  console.log("  → Ensuring ledger collections and indexes exist...");
  const earningsCol = db.collection("referralearnings");
  const withdrawalsCol = db.collection("referralwithdrawals");
  const redemptionsCol = db.collection("promocoderedemptions");

  await earningsCol.createIndexes([
    { key: { referralId: 1, referredUserId: 1 }, unique: true, name: "uniq_ref_earning" },
    { key: { referrerId: 1, createdAt: -1 }, name: "idx_referrer_created" },
  ]);

  await withdrawalsCol.createIndexes([
    { key: { status: 1, requestedAt: -1 }, name: "idx_withdrawal_status_req" },
    { key: { userId: 1, requestedAt: -1 }, name: "idx_withdrawal_user_req" },
  ]);

  await redemptionsCol.createIndexes([
    { key: { promoCodeId: 1, userId: 1 }, unique: true, name: "uniq_promo_user_redemption" },
    { key: { userId: 1, createdAt: -1 }, name: "idx_redemption_user_created" },
  ]);

  // 1. Migrate Referral Earnings
  const referralsCol = db.collection("referrals");
  const referralsCursor = referralsCol.find();

  let earningsCount = 0;
  let withdrawalsCount = 0;

  while (await referralsCursor.hasNext()) {
    const referral = await referralsCursor.next();
    if (!referral) continue;

    // Migrate earnedHistory
    if (Array.isArray(referral.earnedHistory) && referral.earnedHistory.length > 0) {
      for (const item of referral.earnedHistory) {
        if (!item.user) continue;
        try {
          await earningsCol.updateOne(
            { referralId: referral._id, referredUserId: item.user },
            {
              $setOnInsert: {
                referralId: referral._id,
                referrerId: referral.referrer,
                referredUserId: item.user,
                amount: item.amount || 50,
                createdAt: item.createdAt || new Date(),
                updatedAt: item.createdAt || new Date(),
              },
            },
            { upsert: true }
          );
          earningsCount++;
        } catch {
          // ignore duplicate in migration
        }
      }
    }

    // Migrate withdrawHistory
    if (Array.isArray(referral.withdrawHistory) && referral.withdrawHistory.length > 0) {
      for (const item of referral.withdrawHistory) {
        try {
          await withdrawalsCol.insertOne({
            referralId: referral._id,
            userId: referral.referrer,
            amount: item.amount || 0,
            status: item.status || "pending",
            withdrawAccount: item.withdrawAccount || referral.withdrawAccount || "N/A",
            trx: item.trx || null,
            notes: item.notes || null,
            requestedAt: item.requestedAt || item.createdAt || new Date(),
            issuedAt: item.issuedAt || null,
            createdAt: item.createdAt || new Date(),
            updatedAt: item.issuedAt || item.createdAt || new Date(),
          });
          withdrawalsCount++;
        } catch {
          // ignore error
        }
      }
    }
  }

  console.log(`  ✓ Migrated ${earningsCount} referral earning records.`);
  console.log(`  ✓ Migrated ${withdrawalsCount} referral withdrawal records.`);

  // 2. Migrate PromoCode Usage
  const promocodesCol = db.collection("promocodes");
  const promoCursor = promocodesCol.find();
  let promoUsageCount = 0;

  while (await promoCursor.hasNext()) {
    const promo = await promoCursor.next();
    if (!promo || !Array.isArray(promo.usedCount)) continue;

    for (const userId of promo.usedCount) {
      if (!userId) continue;
      try {
        await redemptionsCol.updateOne(
          { promoCodeId: promo._id, userId: typeof userId === "string" ? userId : String(userId) },
          {
            $setOnInsert: {
              promoCodeId: promo._id,
              code: promo.code,
              userId: typeof userId === "string" ? userId : String(userId),
              discountPercent: promo.discountPercent,
              discountAmount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
        promoUsageCount++;
      } catch {
        // ignore duplicate
      }
    }
  }

  console.log(`  ✓ Migrated ${promoUsageCount} promo code redemption records.`);
}

export async function down(connection) {
  const db = connection.db;
  console.log("  → Rolling back ledger migration (collections remain intact)...");
  // Down migration intentionally keeps data safe
}
