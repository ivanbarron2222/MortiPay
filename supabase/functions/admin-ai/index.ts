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

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type BorrowerContext = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  motorcycle?: string;
  overdueInstallmentCount?: number;
  overdueBalance?: number;
  outstandingBalance?: number;
  nextDueDate?: string | null;
};

type AdminAiRequest = {
  prompt: string;
  mode?: "chat" | "email_draft";
  tenant: {
    name: string;
    plan: string;
  };
  analytics: Record<string, unknown>;
  borrowers: BorrowerContext[];
  messages?: ChatMessage[];
};

function extractJsonObject(content: string) {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("The AI model returned an email draft in an invalid format.");
  }
}

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    const model = Deno.env.get("OPENROUTER_MODEL") ?? "google/gemma-3-27b-it:free";
    const payload = (await request.json()) as AdminAiRequest;
    const mode = payload.mode ?? "chat";

    const systemPrompt =
      mode === "email_draft"
        ? [
            "You are Morti Pay's premium admin AI assistant.",
            "Create borrower payment emails for motorcycle financing admins.",
            "Return only valid JSON with this exact shape:",
            '{"reply":"short explanation for the admin","draft":{"to":"borrower email","subject":"email subject","body":"email body"}}',
            "Use a professional, respectful, concise tone. Do not threaten the borrower.",
            "Use the selected/highest-priority borrower from the provided borrower context.",
          ].join(" ")
        : [
            "You are Morti Pay's premium admin AI assistant.",
            "Help tenant admins understand motorcycle financing collections, overdue borrowers, risk, reminders, and dashboard analytics.",
            "Answer with concise, actionable guidance. Use only the tenant data provided.",
            "Do not invent borrowers, balances, or payment facts.",
          ].join(" ");

    const context = {
      tenant: payload.tenant,
      analytics: payload.analytics,
      borrowers: payload.borrowers.slice(0, 8),
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("APP_ORIGIN") ?? "https://morti-pay.vercel.app",
        "X-Title": "Morti Pay",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              `Instructions:\n${systemPrompt}`,
              `Tenant data:\n${JSON.stringify(context, null, 2)}`,
            ].join("\n\n"),
          },
          ...(payload.messages ?? []).slice(-8),
          { role: "user", content: payload.prompt },
        ],
        temperature: mode === "email_draft" ? 0.4 : 0.2,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenRouter request failed: ${detail}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("OpenRouter returned an empty response.");
    }

    if (mode === "email_draft") {
      const parsed = extractJsonObject(content);
      return Response.json(parsed, { headers: corsHeaders });
    }

    return Response.json({ reply: content.trim() }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate AI response.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
