import Ably from "ably";
import { NextResponse } from "next/server";

// Server-side token endpoint: hands out short-lived Ably token requests so the
// ABLY_API_KEY never reaches the browser. Clients point Ably's authUrl here.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Ably no configurado" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || `mus-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const client = new Ably.Rest(apiKey);
    const tokenRequest = await client.auth.createTokenRequest({ clientId });
    return NextResponse.json(tokenRequest);
  } catch {
    return NextResponse.json({ error: "No se pudo crear el token" }, { status: 500 });
  }
}
