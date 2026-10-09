import { getOrCreateSupportSettings } from "../../../lib/supportSettings";
import { getQrUrls } from "../../../lib/paymentQr";

// Public, read-only mirror of /api/admin/support-settings — lets the
// deposit/wallet UI know which method names the admin has advertised as
// available (see SupportSettings model). No auth: content/config only, same
// trust boundary as DepositAccount.
export async function GET() {
  const [settings, qr] = await Promise.all([getOrCreateSupportSettings(), getQrUrls()]);

  return Response.json({
    online: settings.online,
    whatsappNumber: settings.whatsappNumber,
    announcementEnabled: settings.announcementEnabled,
    announcementText: settings.announcementText,
    // qrUrl: admin-uploaded QR image (see lib/paymentQr) — hidden while the method is off.
    methods: settings.methods.map((m) => ({ key: m.key, label: m.label, enabled: m.enabled, qrUrl: m.enabled ? qr[m.key] || "" : "" })),
    withdrawMethods: settings.withdrawMethods.map((m) => ({ key: m.key, label: m.label, enabled: m.enabled })),
  });
}
