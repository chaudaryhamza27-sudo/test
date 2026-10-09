import { QR_METHOD_KEYS, readQr } from "../../../../lib/paymentQr";

// Public image endpoint for the admin-uploaded deposit QR. Callers always use
// the ?v=<mtime> URL from getQrUrl, so it is safe to cache for a year — a
// re-upload changes the URL, and no DB hit happens here.
export async function GET(request, ctx) {
  const { key } = await ctx.params;
  if (!QR_METHOD_KEYS.includes(key)) return new Response("Not found", { status: 404 });

  const qr = await readQr(key);
  if (!qr) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(qr.body, {
    headers: {
      "Content-Type": qr.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
