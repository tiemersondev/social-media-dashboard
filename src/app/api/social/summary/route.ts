import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/social/dashboard-service";
import { logSocialError } from "@/lib/social/errors";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    logSocialError("summary", error);
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel carregar o resumo social." },
      { status: 500 },
    );
  }
}
