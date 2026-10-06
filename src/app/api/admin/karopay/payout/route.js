import mongoose from "mongoose";
import dbConnect from "../../../../../lib/mongodb";
import Payout from "../../../../../lib/models/Payout";
import User from "../../../../../lib/models/User";
import Transaction from "../../../../../lib/models/Transaction";
import { requireSuperAdmin } from "../../../../../lib/auth";
import { createPayoutOrder, makeSyntheticCert, KaropayError } from "../../../../../lib/karopay";
import { checkRateLimit, getClientIp } from "../../../../../lib/rateLimit";
import { logActivity } from "../../../../../lib/activity";
import { claimWithdrawalForPayout, releaseWithdrawalClaim, serializePayout } from "../../../../../lib/payouts";
import {
  validatePayoutInput,
  buildPayoutRequestBody,
  makePayoutOrderId,
  maskTail,
  resolvePayoutNotifyUrl,
} from "../../../../../lib/payoutRules";

const PAGE_SIZE = 50;
const DEFAULT_NOTIFY_BASE = "https://lucky73.online";

// "03001234567" / "+923001234567" → "3001234567".
function toTenDigit(num) {
  const digits = String(num || "").replace(/\D/g, "");
  if (/^923\d{9}$/.test(digits)) return digits.slice(2);
  if (/^03\d{9}$/.test(digits)) return digits.slice(1);
  return digits;
}

// Same approach as the deposit flow (api/karopay/create-order): name from the
// profile, a deterministic synthetic 13-digit cert, and a synthetic email
// when the profile has none. Phone: profile phone, else the wallet number.
function withCustomerDefaults(body, user, { merchantUserId }) {
  const phone = toTenDigit(user?.phone);
  const account = toTenDigit(body.accountNum);
  const walletPhone = String(body.accountType).toUpperCase() === "WALLET" && /^3\d{9}$/.test(account) ? account : "";
  return {
    ...body,
    merchantUserId,
    accountNum: String(body.accountType).toUpperCase() === "WALLET" ? account : body.accountNum,
    customerName: body.customerName || user?.name || user?.uid || "Customer",
    customerCert: body.customerCert || makeSyntheticCert(user?._id || merchantUserId),
    customerEmail: body.customerEmail || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user?.email || "") ? user.email : `${user?.uid || "user"}@example.com`),
    customerPhone: body.customerPhone || (/^3\d{9}$/.test(phone) ? phone : walletPhone),
  };
}

function withoutSign(data) {
  const { sign: _sign, ...rest } = data || {};
  return rest;
}

export async function GET(request) {
  const admin = await requireSuperAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const filter = ["PENDING", "COMPLETED", "FAILED"].includes(status) ? { status } : {};

  await dbConnect();
  void User; // registers the User schema with mongoose before populate()
  const payouts = await Payout.find(filter).populate("user", "uid name email").sort({ createdAt: -1 }).limit(PAGE_SIZE);
  return Response.json({ payouts: payouts.map(serializePayout) });
}

export async function POST(request) {
  const admin = await requireSuperAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const limit = checkRateLimit(`admin-payout:${admin._id}`, { max: 6, windowMs: 60_000 });
  if (!limit.allowed) {
    return Response.json({ error: "Too many cash out requests — wait a minute and try again." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));

  await dbConnect();

  // The Cash Out form only asks for the account + amount; the customer fields
  // Karopay requires are derived from the paid user's profile (the linked
  // withdrawal's user, else the typed user id/uid, else the admin).
  let pending = null;
  let subject = null;
  if (body.withdrawalId) {
    if (!mongoose.isValidObjectId(body.withdrawalId)) return Response.json({ error: "Invalid withdrawal id." }, { status: 400 });
    pending = await Transaction.findOne({ _id: body.withdrawalId, type: "withdraw" }).lean();
    if (!pending) return Response.json({ error: "Withdrawal not found." }, { status: 404 });
    subject = await User.findById(pending.user).lean();
  } else if (String(body.merchantUserId || "").trim()) {
    const typed = String(body.merchantUserId).trim();
    subject =
      (mongoose.isValidObjectId(typed) ? await User.findById(typed).lean() : null) ||
      (await User.findOne({ uid: typed }).lean());
  }
  const input = withCustomerDefaults(body, subject || admin.toObject(), {
    merchantUserId: pending ? String(pending.user) : String(body.merchantUserId || "").trim() || String(admin._id),
  });

  const { value, errors } = validatePayoutInput(input);
  if (errors) {
    const hidden = ["customerName", "customerCert", "customerEmail", "customerPhone"].filter((k) => errors[k]);
    const msg = hidden.length
      ? `Could not derive ${hidden.join(", ")} from the user's profile.`
      : "Please fix the highlighted fields.";
    return Response.json({ error: msg, fields: errors }, { status: 400 });
  }

  const notifyUrl = resolvePayoutNotifyUrl(process.env.KAROPAY_PAYOUT_NOTIFY_BASE_URL || DEFAULT_NOTIFY_BASE);
  if (!notifyUrl) {
    console.error("[admin/karopay/payout] KAROPAY_PAYOUT_NOTIFY_BASE_URL is not a public https URL.");
    return Response.json({ error: "Payout notify URL is not configured to a public https address." }, { status: 503 });
  }

  // Client-generated id so the confirm modal can show the exact order id that
  // will be sent; the server still enforces the shape and uniqueness.
  const requestedId = typeof body.merchantOrderId === "string" ? body.merchantOrderId.trim() : "";
  const merchantOrderId = /^cashout_\d{13}_[a-f0-9]{12}$/.test(requestedId) ? requestedId : makePayoutOrderId();

  if (await Payout.exists({ merchantOrderId })) {
    return Response.json({ error: "This cash out was already submitted (duplicate order id)." }, { status: 409 });
  }

  let userId = null;
  let withdrawalId = null;
  if (pending) {
    if (Math.round(Number(pending.amount) * 100) !== value.amountCents) {
      return Response.json(
        { error: `Amount must match the withdrawal request (Rs${Number(pending.amount).toLocaleString()}).`, fields: { amount: "Must match the withdrawal amount." } },
        { status: 400 }
      );
    }
    const claim = await claimWithdrawalForPayout(body.withdrawalId, admin, merchantOrderId);
    if (claim.error) return Response.json({ error: claim.error }, { status: claim.status });
    userId = claim.tx.user;
    withdrawalId = claim.tx._id;
    value.merchantUserId = String(claim.tx.user);
  } else {
    userId = subject?._id || null;
  }

  const clientIp = getClientIp(request);
  const merchantUserIp = String(body.merchantUserIp || "").trim() || (clientIp !== "unknown" ? clientIp : "");
  const requestBody = buildPayoutRequestBody(value, { merchantOrderId, notifyUrl, merchantUserIp });

  // Persist before calling Karopay so a crash/timeout mid-request still
  // leaves a record the admin can reconcile with "Check status".
  const payout = await Payout.create({
    merchantOrderId,
    merchantUserId: value.merchantUserId,
    user: userId,
    withdrawal: withdrawalId,
    accountType: value.accountType,
    accountProvider: value.accountProvider,
    accountNumMasked: maskTail(value.accountNum),
    amount: value.amountCents,
    customerName: value.customerName,
    customerCertMasked: maskTail(value.customerCert),
    customerEmail: value.customerEmail,
    customerPhone: value.customerPhone,
    customerIBANMasked: value.customerIBAN ? maskTail(value.customerIBAN) : "",
    merchantUserIp,
    notifyUrl,
    status: "PENDING",
    createdBy: admin._id,
  });

  try {
    const data = await createPayoutOrder(requestBody);
    // Accepted by Karopay — NOT completed. Status stays PENDING until the
    // notify callback (or an order inquiry) reports 01/02.
    payout.providerOrderId = data.orderId != null ? String(data.orderId) : null;
    payout.providerStatus = data.status != null ? String(data.status) : null;
    payout.providerCode = Number(data.code);
    payout.providerMsg = String(data.msg || "").slice(0, 300);
    payout.fee = data.fee != null && data.fee !== "" ? Number(data.fee) : null;
    payout.transferReceipt = data.transferReceipt || "";
    payout.traceId = data.traceId || "";
    payout.rawResponse = withoutSign(data);
    await payout.save();

    await logActivity({
      user: admin._id,
      actorRole: "admin",
      action: "karopay_payout_requested",
      targetUser: userId,
      message: `Sent Karopay cash out ${merchantOrderId} of Rs${(value.amountCents / 100).toLocaleString()} to ${value.accountProvider} ${maskTail(value.accountNum)}.`,
      meta: { payoutId: payout._id, merchantOrderId, withdrawalId, traceId: payout.traceId },
    });

    return Response.json({ payout: serializePayout(payout) });
  } catch (err) {
    if (!(err instanceof KaropayError)) {
      console.error("[admin/karopay/payout] Unexpected error", { merchantOrderId, message: err?.message });
      return Response.json(
        { error: "Unexpected error — the payout is saved as PENDING. Use Check status before retrying.", payout: serializePayout(payout) },
        { status: 500 }
      );
    }

    const detail = err.detail && !(err.detail instanceof Error) ? err.detail : null;
    console.error("[admin/karopay/payout] Karopay payout failed", {
      merchantOrderId,
      httpStatus: detail?.httpStatus ?? null,
      code: detail?.code ?? null,
      msg: detail?.msg ?? null,
      traceId: detail?.traceId ?? null,
      message: err.message,
    });

    // Timeout / network error: Karopay may or may not have created the
    // order. Leave it PENDING (and the withdrawal claimed) so it's never
    // re-sent blindly — the admin reconciles with "Check status".
    if (!detail) {
      payout.providerMsg = err.message;
      await payout.save();
      return Response.json(
        { error: `${err.message} The payout is saved as PENDING — use Check status before retrying.`, payout: serializePayout(payout) },
        { status: err.status || 502 }
      );
    }

    // Karopay answered with an error: the payout was not created.
    payout.status = "FAILED";
    payout.failedAt = new Date();
    payout.providerCode = detail.code != null ? Number(detail.code) : null;
    payout.providerMsg = String(detail.msg || err.message).slice(0, 300);
    payout.traceId = detail.traceId || "";
    payout.rawResponse = detail.body && typeof detail.body === "object" ? withoutSign(detail.body) : { httpStatus: detail.httpStatus };
    await payout.save();
    if (withdrawalId) await releaseWithdrawalClaim(withdrawalId, merchantOrderId);

    return Response.json(
      {
        error: `Karopay rejected the cash out: ${err.message}`,
        karopay: { httpStatus: detail.httpStatus ?? null, code: detail.code ?? null, msg: detail.msg ?? null, traceId: detail.traceId ?? null },
        payout: serializePayout(payout),
      },
      { status: 502 }
    );
  }
}
