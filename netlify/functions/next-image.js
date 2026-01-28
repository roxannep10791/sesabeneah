/**
 * Minimal replacement for Next.js /_next/image in a static export.
 * It simply proxies the original image URL (remote or local) without resizing.
 *
 * Usage: /_next/image?url=<encoded>&w=<num>&q=<num>
 */
const { URL } = require("url");

exports.handler = async (event) => {
  try {
    const requestUrl = new URL(event.rawUrl);
    const target = requestUrl.searchParams.get("url");

    if (!target) {
      return { statusCode: 400, body: "Missing url param" };
    }

    // Decode the `url` param as Next does.
    const decoded = decodeURIComponent(target);

    let fetchUrl = decoded;

    // If it is a site-relative path (starts with /), resolve against this site origin.
    if (decoded.startsWith("/")) {
      const proto = (event.headers["x-forwarded-proto"] || "https");
      const host = event.headers.host;
      fetchUrl = `${proto}://${host}${decoded}`;
    }

    // Basic allowlist: only http/https or site-relative.
    if (!/^https?:\/\//i.test(fetchUrl)) {
      return { statusCode: 400, body: "Invalid url" };
    }

    const resp = await fetch(fetchUrl, {
      // pass through some caching; remote servers may require UA
      headers: { "User-Agent": "netlify-next-image-proxy" },
      redirect: "follow",
    });

    if (!resp.ok) {
      return { statusCode: resp.status, body: `Upstream error: ${resp.status}` };
    }

    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Content-Type
    const contentType = resp.headers.get("content-type") || "application/octet-stream";

    // Cache: keep decent caching (you can tune)
    const cacheControl = resp.headers.get("cache-control") || "public, max-age=86400";

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        "Access-Control-Allow-Origin": "*",
      },
      body: buffer.toString("base64"),
    };
  } catch (e) {
    return { statusCode: 500, body: `Internal error: ${e?.message || e}` };
  }
};
