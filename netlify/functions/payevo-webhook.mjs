export const handler = async (event) => {
  // Recebe postbacks da Payevo (status de transação).
  // Mantemos simples: responder rápido (200).
  try {
    const bodyText = event.body || "";
    // Se quiser, você pode registrar em logs:
    // console.log("PAYEVO_WEBHOOK", bodyText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true })
    };
  }
};
