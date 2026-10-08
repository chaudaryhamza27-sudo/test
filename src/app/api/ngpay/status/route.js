import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import Transaction from "../../../../lib/models/Transaction";
import User from "../../../../lib/models/User";
import { getCurrentUser } from "../../../../lib/auth";
import { reconcileNgPayPayment } from "../../../../lib/payments";

// Polled by the deposit page after NG Pay's checkout sends the browser back.
// The credit itself comes from the notify webhook; while that hasn't landed,
// ask NG Pay's query endpoint directly so a delayed callback can't strand it.
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier");
  if (!identifier) return Response.json({ error: "identifier is required." }, { status: 400 });

  await dbConnect();

  const payment = await Payment.findOne({ provider: "ngpay", providerOrderId: identifier });
  if (!payment) return Response.json({ error: "Payment not found." }, { status: 404 });
  if (String(payment.userId) !== String(user._id)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  if (payment.status === "PENDING") {
    try {
      const reconciled = await reconcileNgPayPayment(payment);
      if (reconciled !== payment.status) payment.status = reconciled;
    } catch (err) {
      console.error("[ngpay/status] Order query failed", { identifier, message: err?.message });
    }
  }

  if (payment.status === "COMPLETED") {
    const [transaction, freshUser] = await Promise.all([
      Transaction.findOne({ "meta.paymentId": payment._id }),
      User.findById(user._id, "balance"),
    ]);
    return Response.json({ status: payment.status, balance: freshUser?.balance ?? null, transaction });
  }

  return Response.json({ status: payment.status, balance: null, transaction: null });
}
