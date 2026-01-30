import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(habits)
    .where(eq(habits.active, true))
    .orderBy(asc(habits.sortOrder));

  return NextResponse.json({ ok: true, habits: rows });
}
