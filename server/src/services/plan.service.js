import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { AppUser } from "../models/appUser.model.js";
import { AppPricing } from "../models/appPricing.model.js";
import { Referral } from "../models/referral.model.js";
import { ReferralEarning } from "../models/referralEarning.model.js";
import { PromoCode } from "../models/promocode.model.js";
import { PromoCodeRedemption } from "../models/promoCodeRedemption.model.js";
import { generateAppUserKey } from "../utils/index.js";
import { PLAN_TYPES } from "../constants/index.js";

/**
 * Unified Plan & Subscription Service
 * Centralizes all subscription/credit logic and transactional state updates.
 */
class PlanService {
  /**
   * Update or assign a plan to a user's AppUser profile
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string|mongoose.Types.ObjectId} planId
   * @param {mongoose.ClientSession} [session] Optional session for transaction
   * @param {Object} [options={}] Optional flags { allowInactivePlan, planSnapshot }
   * @returns {Promise<boolean>}
   */
  async updateUserPlan(userId, planId, session = null, options = {}) {
    const { allowInactivePlan = false, planSnapshot = null } = options || {};
    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        console.error("[PlanService] User not found for plan update:", userId);
        return false;
      }

      let selectedPlan = await AppPricing.findById(planId).session(session);
      if (!selectedPlan && planSnapshot) {
        selectedPlan = {
          _id: planSnapshot.id || planId,
          name: planSnapshot.name,
          type: planSnapshot.type,
          planDuration: planSnapshot.planDuration ?? null,
          credit: planSnapshot.credit ?? null,
          isActive: true,
        };
      }

      if (!selectedPlan || (!selectedPlan.isActive && !allowInactivePlan)) {
        console.error("[PlanService] Selected plan not found or inactive:", planId);
        return false;
      }

      const planType = selectedPlan.type;
      const now = new Date();
      let expirationDate = null;

      if (selectedPlan.planDuration) {
        expirationDate = new Date(now);
        expirationDate.setDate(now.getDate() + selectedPlan.planDuration);
        expirationDate.setHours(23, 59, 59, 999);
      }

      let appUser = await AppUser.findOne({ userId }).session(session);

      if (!appUser) {
        // Create new AppUser
        const key = generateAppUserKey();
        const today = now.toISOString().split("T")[0];

        appUser = new AppUser({
          userId: user._id,
          username: (user.email || user.name).toLowerCase().trim(),
          key,
          plan: {
            type: planType,
            id: selectedPlan._id.toString(),
            name: selectedPlan.name,
          },
          expiresAt: expirationDate,
          credit:
            planType === PLAN_TYPES.CREDIT
              ? selectedPlan.credit || 0
              : planType === PLAN_TYPES.SUBSCRIPTION
                ? Infinity
                : 5,
          isActive: true,
          status: "active",
          lastCreditRefresh: today,
          monthlyProcess: new Map([[today.substring(0, 7), 0]]),
          dailyProcess: new Map([[today, 0]]),
        });

        await appUser.save({ session });
        console.log(`[PlanService] Created new AppUser with plan ${selectedPlan.name} for user ${user.email}`);
        return true;
      }

      // Update existing AppUser
      const previousPlanType = appUser.plan?.type || PLAN_TYPES.FREE;

      if (planType === PLAN_TYPES.SUBSCRIPTION) {
        if (previousPlanType === PLAN_TYPES.SUBSCRIPTION) {
          const isExpired = !appUser.expiresAt || now > appUser.expiresAt;
          if (isExpired) {
            appUser.expiresAt = expirationDate;
          } else if (appUser.expiresAt && selectedPlan.planDuration) {
            const newExpiresAt = new Date(appUser.expiresAt);
            newExpiresAt.setDate(newExpiresAt.getDate() + selectedPlan.planDuration);
            newExpiresAt.setHours(23, 59, 59, 999);
            appUser.expiresAt = newExpiresAt;
          }
        } else {
          appUser.expiresAt = expirationDate;
        }
        appUser.credit = Infinity;
      } else if (planType === PLAN_TYPES.CREDIT) {
        const additionalCredits = selectedPlan.credit || 0;

        if (previousPlanType === PLAN_TYPES.CREDIT) {
          const currentCredit = isFinite(appUser.credit) ? appUser.credit : 0;
          appUser.credit = currentCredit + additionalCredits;

          if (expirationDate) {
            const isExpired = !appUser.expiresAt || now > appUser.expiresAt;
            if (isExpired) {
              appUser.expiresAt = expirationDate;
            } else if (appUser.expiresAt && selectedPlan.planDuration) {
              const newExpiresAt = new Date(appUser.expiresAt);
              newExpiresAt.setDate(newExpiresAt.getDate() + selectedPlan.planDuration);
              newExpiresAt.setHours(23, 59, 59, 999);
              appUser.expiresAt = newExpiresAt;
            }
          }
        } else {
          // Free or Subscription -> Credit
          appUser.credit = additionalCredits;
          appUser.expiresAt = expirationDate;
        }
      }

      // Update plan metadata
      appUser.plan = {
        type: planType,
        id: selectedPlan._id.toString(),
        name: selectedPlan.name,
      };
      appUser.isActive = true;
      appUser.status = "active";
      if (appUser.suspendedAt) appUser.suspendedAt = null;

      if (!appUser.planHistory) appUser.planHistory = [];
      appUser.planHistory.push({
        planType,
        changedAt: new Date(),
        reason: "upgrade_or_purchase",
      });

      await appUser.save({ session });
      console.log(`[PlanService] Updated AppUser for ${user.email} to plan ${selectedPlan.name}`);
      return true;
    } catch (error) {
      console.error("[PlanService] Plan update error:", error);
      return false;
    }
  }

  /**
   * Distribute referral commission if applicable
   * @param {string|mongoose.Types.ObjectId} payingUserId
   * @param {Object} [meta={}]
   * @param {mongoose.ClientSession} [session]
   */
  async processReferralReward(payingUserId, meta = {}, session = null) {
    try {
      const payingUser = await User.findById(payingUserId).session(session);
      if (!payingUser || !payingUser.referred) {
        return;
      }

      const referralDoc = await Referral.findById(payingUser.referred).session(session);
      if (!referralDoc) {
        return;
      }

      // Check if already rewarded using normalized ledger
      const existingEarning = await ReferralEarning.findOne({
        referralId: referralDoc._id,
        referredUserId: payingUser._id,
      }).session(session);

      if (existingEarning) {
        console.log(`[PlanService] Referral reward already granted for user ${payingUser._id}`);
        return;
      }

      const rewardAmount = 50; // standard commission

      // 1. Insert into normalized ledger FIRST so concurrent calls hit unique index (code 11000)
      try {
        await ReferralEarning.create(
          [
            {
              referralId: referralDoc._id,
              referrerId: referralDoc.referrer,
              referredUserId: payingUser._id,
              amount: rewardAmount,
              paymentId: meta.paymentId || null,
            },
          ],
          { session }
        );
      } catch (createErr) {
        if (createErr?.code === 11000) {
          console.log(`[PlanService] Referral reward already granted for user ${payingUser._id}`);
          return;
        }
        throw createErr;
      }

      // 2. Atomically credit Referral balance only after ledger insert succeeds
      await Referral.updateOne(
        { _id: referralDoc._id },
        {
          $inc: { availableBalance: rewardAmount },
          $push: {
            earnedHistory: {
              user: payingUser._id,
              amount: rewardAmount,
              createdAt: new Date(),
            },
          },
        },
        { session }
      );

      console.log(`[PlanService] Credited referral reward: 50 BDT to referrer ${referralDoc.referrer}`);
    } catch (error) {
      console.error("[PlanService] Failed to process referral reward:", error.message);
    }
  }

  /**
   * Record promo code usage
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string|mongoose.Types.ObjectId} promoCodeId
   * @param {Object} [meta={}]
   * @param {mongoose.ClientSession} [session]
   */
  async recordPromoCodeUsage(userId, promoCodeId, meta = {}, session = null) {
    if (!promoCodeId) return;
    try {
      const promo = await PromoCode.findById(promoCodeId).session(session);
      if (!promo) return;

      const userIdStr = userId.toString();

      // Update legacy array
      await PromoCode.findByIdAndUpdate(
        promoCodeId,
        { $addToSet: { usedCount: userIdStr } },
        { session }
      );

      // Upsert in normalized ledger
      await PromoCodeRedemption.updateOne(
        { promoCodeId: promo._id, userId },
        {
          $setOnInsert: {
            promoCodeId: promo._id,
            code: promo.code,
            userId,
            paymentId: meta.paymentId || null,
            discountPercent: promo.discountPercent,
            discountAmount: meta.discountAmount || 0,
            createdAt: new Date(),
          },
        },
        { upsert: true, session }
      );
    } catch (error) {
      console.error("[PlanService] Error recording promo code redemption:", error.message);
    }
  }
}

export const planService = new PlanService();
export default planService;
