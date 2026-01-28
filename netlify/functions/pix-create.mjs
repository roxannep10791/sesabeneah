export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
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

    const payloadIn = event.body ? JSON.parse(event.body) : {};

    // Itens "neutros" (sem expor detalhes do produto/serviço)
    const safeItems = Array.isArray(payloadIn.items) && payloadIn.items.length
      ? payloadIn.items.map((it, idx) => ({
          title: "Serviço de entretenimento",
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          externalRef: it.externalRef ?? payloadIn.orderId ?? `item-${idx + 1}`
        }))
      : [{
          title: "Serviço de entretenimento",
          unitPrice: payloadIn.amount,
          quantity: 1,
          externalRef: payloadIn.orderId ?? "pedido"
        }];

    const safeDescription =
      payloadIn.orderId ? `Pedido ${payloadIn.orderId}` :
      payloadIn.description ? String(payloadIn.description) :
      "Pedido online";

    const token = Buffer.from(`${secret}:x`).toString("base64");

    const payevoPayload = {
      paymentMethod: "PIX",
      amount: payloadIn.amount,
      description: safeDescription,
      customer: payloadIn.customer,
      shipping: payloadIn.shipping,
      items: safeItems,
      postbackUrl: process.env.PAYEVO_POSTBACK_URL ?? null,
      metadata: payloadIn.metadata ? JSON.stringify(payloadIn.metadata) : "{}",
      ip: payloadIn.ip ?? event.headers?.["x-forwarded-for"] ?? null
    };

    const r = await fetch("https://apiv2.payevo.com.br/functions/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${token}`
      },
      body: JSON.stringify(payevoPayload)
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "PAYEVO_CREATE_FAILED", details: data })
      };
    }

    const out = {
      id: data?.data?.id ?? data?.id ?? null,
      status: data?.data?.status ?? data?.status ?? "waiting_payment",
      pix: {
        qrcode: data?.data?.pix?.qrcode ?? data?.pix?.qrcode ?? null,
        expirationDate: data?.data?.pix?.expirationDate ?? data?.pix?.expirationDate ?? null
      }
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(out)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "INTERNAL_ERROR", message: String(e?.message || e) })
    };
  }
};
