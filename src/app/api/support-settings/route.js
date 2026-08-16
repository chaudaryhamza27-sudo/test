import { getOrCreateSupportSettings } from "../../../lib/supportSettings";

// Public, read-only mirror of /api/admin/support-settings — lets the
// deposit/wallet UI know which method names the admin has advertised as
// available (see SupportSettings model). No auth: content/config only, same
// trust boundary as DepositAccount.
export async function GET() {
  const settings = await getOrCreateSupportSettings();

  return Response.json({
    online: settings.online,
    whatsappNumber: settings.whatsappNumber,
    methods: settings.methods.map((m) => ({ key: m.key, label: m.label, enabled: m.enabled })),
  });
}
