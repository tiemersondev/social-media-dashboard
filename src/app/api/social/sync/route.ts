import { NextResponse } from "next/server";
import { syncSocialProviders } from "@/lib/social/dashboard-service";
import { logSocialError } from "@/lib/social/errors";
import { isSocialProvider } from "@/lib/social/connection-service";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");

    if (provider && !isSocialProvider(provider)) {
      return NextResponse.json(
        { ok: false, error: "Provider invalido." },
        { status: 400 },
      );
    }

    const { results, summary } = await syncSocialProviders({
      provider: provider && isSocialProvider(provider) ? provider : undefined,
      force: true,
    });

    return NextResponse.json({
      ok: true,
      results: results.map((result) => ({
        provider: result.provider,
        status: result.status,
      })),
      summary,
    });
  } catch (error) {
    logSocialError("sync", error);
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel sincronizar agora." },
      { status: 500 },
    );
  }
}
