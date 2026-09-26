import os from "os";
import { requireAdmin } from "../../../../../lib/auth";
import { queryMerchantBalance, KaropayError } from "../../../../../lib/karopay";
import { BANK_PROVIDERS, WALLET_PROVIDERS, resolvePayoutNotifyUrl } from "../../../../../lib/payoutRules";

const IP_LOOKUP_TIMEOUT_MS = 4000;

async function lookupPublicIp(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IP_LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const data = await res.json();
    return typeof data?.ip === "string" ? data.ip : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function internalIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const addr of list || []) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return null;
}

// Cash Out header data: Karopay merchant balance (Merchant Balance Inquiry),
// this server's IPs (what Karopay's IP whitelist must contain) and the
// payout config the form needs.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden." }, { status: 403 });

  const [balanceResult, ipv4, ipv6] = await Promise.all([
    queryMerchantBalance().then(
      (b) => ({ ok: true, ...b }),
      (err) => ({ ok: false, error: err instanceof KaropayError ? err.message : "Balance inquiry failed." })
    ),
    lookupPublicIp("https://api.ipify.org?format=json"),
    lookupPublicIp("https://api6.ipify.org?format=json"),
  ]);

  return Response.json({
    balance: balanceResult.ok
      ? { available: balanceResult.balanceCents / 100, frozen: balanceResult.freezeBalanceCents / 100, queryTime: balanceResult.queryTime }
      : null,
    balanceError: balanceResult.ok ? null : balanceResult.error,
    server: { internalIp: internalIp(), publicIpv4: ipv4, publicIpv6: ipv6 },
    notifyUrl: resolvePayoutNotifyUrl(process.env.KAROPAY_PAYOUT_NOTIFY_BASE_URL || "https://lucky73.online"),
    providers: { WALLET: WALLET_PROVIDERS, BANK: BANK_PROVIDERS },
  });
}
