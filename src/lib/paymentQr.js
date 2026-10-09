import "server-only";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Admin-uploaded scan-to-pay QR images for the manual deposit methods, kept
// as plain files on disk (not in Mongo) so the settings JSON stays small and
// browsers can cache the image itself — see api/payment-qr/[key].
export const QR_METHOD_KEYS = ["easypaisa", "jazzcash"];
export const MAX_QR_BYTES = 2 * 1024 * 1024; // 2MB

const QR_DIR = path.join(process.cwd(), "uploads", "payment-qr");
const EXT_TYPES = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

// Sniff the real image type from magic bytes instead of trusting the upload.
export function detectImageExt(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function findQrFile(key) {
  const files = await readdir(QR_DIR).catch(() => []);
  const name = files.find((f) => Object.keys(EXT_TYPES).some((ext) => f === `${key}.${ext}`));
  return name ? path.join(QR_DIR, name) : null;
}

// Versioned by mtime so the image URL can be cached forever and still change on re-upload.
export async function getQrUrl(key) {
  const file = await findQrFile(key);
  if (!file) return "";
  const { mtimeMs } = await stat(file);
  return `/api/payment-qr/${key}?v=${Math.floor(mtimeMs)}`;
}

export async function getQrUrls() {
  const entries = await Promise.all(QR_METHOD_KEYS.map(async (key) => [key, await getQrUrl(key)]));
  return Object.fromEntries(entries);
}

export async function readQr(key) {
  const file = await findQrFile(key);
  if (!file) return null;
  const ext = path.extname(file).slice(1);
  return { body: await readFile(file), contentType: EXT_TYPES[ext] };
}

export async function deleteQr(key) {
  const file = await findQrFile(key);
  if (file) await unlink(file).catch(() => {});
}

export async function saveQr(key, buf, ext) {
  await mkdir(QR_DIR, { recursive: true });
  await deleteQr(key); // drop an old upload that had a different extension
  await writeFile(path.join(QR_DIR, `${key}.${ext}`), buf);
}
