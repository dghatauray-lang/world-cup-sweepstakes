import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSync();

  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}
