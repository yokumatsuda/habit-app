import { db } from "./index";
import { habits, users } from "./schema";

type HabitInsert = typeof habits.$inferInsert;
type HabitSeedItem = Pick<
  HabitInsert,
  "habitKey" | "label" | "frequency" | "sortOrder"
>;

async function main() {
  // 個人用：ユーザーは1人だけ作る（将来拡張しやすい）
  const email = "me@local";
  await db.insert(users).values({ email }).onConflictDoNothing();

  const habitSeed = [
    // daily
    {
      habitKey: "wake_fixed",
      label: "起床時刻固定（±30分）",
      frequency: "daily",
      sortOrder: 10,
    },
    {
      habitKey: "sleep_7_9",
      label: "睡眠7〜9h（または就寝時刻厳守）",
      frequency: "daily",
      sortOrder: 20,
    },
    {
      habitKey: "aerobic_20",
      label: "有酸素20分（合計）",
      frequency: "daily",
      sortOrder: 30,
    },
    {
      habitKey: "break_sit",
      label: "座りっぱなし分断（1時間に1回立つ）",
      frequency: "daily",
      sortOrder: 40,
    },
    {
      habitKey: "veg_protein",
      label: "野菜＋たんぱく質（2食以上）",
      frequency: "daily",
      sortOrder: 50,
    },
    {
      habitKey: "recall_10",
      label: "学習：思い出す練習10分",
      frequency: "daily",
      sortOrder: 60,
    },
    {
      habitKey: "social_5",
      label: "人と話す/外に出る（5分でも）",
      frequency: "daily",
      sortOrder: 70,
    },

    // weekly
    {
      habitKey: "strength_2",
      label: "筋トレ（週2回）",
      frequency: "weekly",
      sortOrder: 110,
    },
    {
      habitKey: "fish_2",
      label: "魚（週2回）",
      frequency: "weekly",
      sortOrder: 120,
    },
    {
      habitKey: "alcohol_control",
      label: "休肝日2日以上（または量を半分）",
      frequency: "weekly",
      sortOrder: 130,
    },
    {
      habitKey: "measure_bp",
      label: "計測（血圧週3/体重週3 など）",
      frequency: "weekly",
      sortOrder: 140,
    },
  ] satisfies HabitSeedItem[];

  for (const h of habitSeed) {
    await db.insert(habits).values(h).onConflictDoNothing();
  }

  console.log("seed done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
