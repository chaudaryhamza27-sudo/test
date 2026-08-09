import dbConnect from "../../../../lib/mongodb";
import Payment from "../../../../lib/models/Payment";
import Transaction from "../../../../lib/models/Transaction";
import User from "../../../../lib/models/User";
import { getCurrentUser } from "../../../../lib/auth";

// Paybost's checkout redirects the browser back to success_url as soon as the user
// finishes on their hosted page — the wallet credit itself only happens once our IPN
// webhook arrives (server-to-server, may lag a second or two behind the redirect).
// The frontend polls this endpoint after redirect to find out when that's landed.
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier");
  if (!identifier) return Response.json({ error: "identifier is required." }, { status: 400 });

  await dbConnect();

  const payment = await Payment.findOne({ provider: "paybost", providerOrderId: identifier });
  if (!payment) return Response.json({ error: "Payment not found." }, { status: 404 });
  if (String(payment.userId) !== String(user._id)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
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
