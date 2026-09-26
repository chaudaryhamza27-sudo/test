import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import Transaction from "../../../../lib/models/Transaction";
import User from "../../../../lib/models/User";
import { getCurrentUser } from "../../../../lib/auth";
import { reconcileKaropayPayment } from "../../../../lib/payments";

// Karopay's checkout redirects the browser back to returnUrl as soon as the
// user finishes on their hosted page — the wallet credit itself only happens
// once our notify webhook arrives (server-to-server, may lag a second or two
// behind the redirect). The frontend polls this endpoint after redirect to
// find out when that's landed.
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier");
  if (!identifier) return Response.json({ error: "identifier is required." }, { status: 400 });

  await dbConnect();

  const payment = await Payment.findOne({ provider: "karopay", providerOrderId: identifier });
  if (!payment) return Response.json({ error: "Payment not found." }, { status: 404 });
  if (String(payment.userId) !== String(user._id)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  // Webhook hasn't landed yet — ask Karopay directly so a successful payment
  // is credited even when the notify callback is delayed or never arrives.
  if (payment.status === "PENDING") {
    try {
      const reconciled = await reconcileKaropayPayment(payment);
      if (reconciled !== payment.status) payment.status = reconciled;
    } catch (err) {
      console.error("[karopay/status] Order inquiry failed", { identifier, message: err?.message });
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
