export const handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "METHOD_NOT_ALLOWED" })
      };
    }

    const secret = process.env.PAYEVO_SECRET_KEY;
    if (!secret) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "MISSING_PAYEVO_SECRET_KEY" })
      };
    }

    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "MISSING_ID" })
      };
    }

    const token = Buffer.from(`${secret}:x`).toString("base64");

    // Endpoint mais comum: GET /transactions/:id
    const r = await fetch(`https://apiv2.payevo.com.br/functions/v1/transactions/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Basic ${token}`
      }
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "PAYEVO_STATUS_FAILED", details: data })
      };
    }

    const status = data?.data?.status ?? data?.status ?? "waiting_payment";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "INTERNAL_ERROR", message: String(e?.message || e) })
    };
  }
};
