function getCorsHeaders(request: Request) {
  const requestOrigin = request.headers.get("origin") ?? "";
  const configuredOrigin = (Deno.env.get("APP_ORIGIN") ?? "https://morti-pay.vercel.app")
    .replace(/\/+$/, "");
  const allowedOrigins = new Set([
    configuredOrigin,
    "https://morti-pay.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  const allowOrigin = allowedOrigins.has(requestOrigin) ? requestOrigin : configuredOrigin;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

type SendEmailRequest = {
  to: string;
  subject: string;
  body: string;
};

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") ?? "Morti Pay";

    if (!apiKey || !senderEmail) {
      throw new Error("Brevo sender secrets are not configured.");
    }

    const payload = (await request.json()) as SendEmailRequest;
    const to = payload.to?.trim().toLowerCase();
    const subject = payload.subject?.trim();
    const body = payload.body?.trim();

    if (!to || !subject || !body) {
      throw new Error("Recipient, subject, and body are required.");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: senderName,
        },
        to: [{ email: to }],
        subject,
        textContent: body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Brevo send failed: ${detail}`);
    }

    const data = await response.json();
    return Response.json({ ok: true, messageId: data?.messageId ?? null }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
