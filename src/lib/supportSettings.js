import dbConnect from "./mongodb";
import SupportSettings from "./models/SupportSettings";

// Method keys that must always exist on the singleton doc. New keys added
// here (e.g. when gating a new provider) get merged into any settings doc
// that was created before the key existed, so older docs self-heal instead
// of silently missing a toggle.
const REQUIRED_METHODS = [
  { key: "easypaisa", label: "EasyPaisa" },
  { key: "jazzcash", label: "JazzCash" },
  { key: "sadapay", label: "SadaPay" },
  { key: "trc20", label: "TRC20 (USDT)" },
  { key: "paybost", label: "Paybost" },
];

export async function getOrCreateSupportSettings() {
  await dbConnect();
  let settings = await SupportSettings.findOne();
  if (!settings) settings = await SupportSettings.create({});

  let changed = false;
  for (const required of REQUIRED_METHODS) {
    if (!settings.methods.some((m) => m.key === required.key)) {
      settings.methods.push({ key: required.key, label: required.label, enabled: false });
      changed = true;
    }
  }
  if (changed) await settings.save();

  return settings;
}

// Whether an admin-gated method (e.g. "paybost") is currently switched on.
// Defaults to false for unknown keys — off unless explicitly enabled.
export async function isMethodEnabled(key) {
  const settings = await getOrCreateSupportSettings();
  return Boolean(settings.methods.find((m) => m.key === key)?.enabled);
}
