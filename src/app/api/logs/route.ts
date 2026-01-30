import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { and, between, eq } from "drizzle-orm";

// 個人用：ユーザー固定（seedで作ったusers.id=1を使う想定）
const USER_ID = 1;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const statusSchema = z.union([
  z.literal("ok"),
  z.literal("partial"),
  z.literal("no"),
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const parsed = z
    .object({ start: dateSchema, end: dateSchema })
    .safeParse({ start, end });
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: "invalid start/end" },
      { status: 400 },
    );

  const rows = await db
    .select({
      habitId: habitLogs.habitId,
      logDate: habitLogs.logDate,
      status: habitLogs.status,
    })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.userId, USER_ID),
        between(habitLogs.logDate, start, end),
      ),
    );

  return NextResponse.json({ ok: true, logs: rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const schema = z.object({
    habitId: z.number().int().positive(),
    date: dateSchema,
    status: z.string().optional(), // 空なら削除
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: "invalid body" },
      { status: 400 },
    );

  const { habitId, date, status } = parsed.data;

  // habit存在チェック（変なID防止）
  const h = await db
    .select({ id: habits.id })
    .from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);
  if (h.length === 0)
    return NextResponse.json(
      { ok: false, error: "habit not found" },
      { status: 404 },
    );

  // statusが空 = 未入力に戻す（削除）
  if (!status) {
    await db
      .delete(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, USER_ID),
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.logDate, date),
        ),
      );
    return NextResponse.json({ ok: true });
  }

  const st = statusSchema.safeParse(status);
  if (!st.success)
    return NextResponse.json(
      { ok: false, error: "invalid status" },
      { status: 400 },
    );

  // upsert（ユニークキーで衝突したら更新）
  await db
    .insert(habitLogs)
    .values({ userId: USER_ID, habitId, logDate: date, status: st.data })
    .onConflictDoUpdate({
      target: [habitLogs.userId, habitLogs.habitId, habitLogs.logDate],
      set: { status: st.data, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
