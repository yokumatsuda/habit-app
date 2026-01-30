import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  date,
  pgEnum,
  uniqueIndex,
  boolean,
  text,
} from "drizzle-orm/pg-core";

export const habitFrequency = pgEnum("habit_frequency", ["daily", "weekly"]);
export const habitStatus = pgEnum("habit_status", ["ok", "partial", "no"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  habitKey: varchar("habit_key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  frequency: habitFrequency("frequency").notNull().default("daily"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(), // YYYY-MM-DD
    status: habitStatus("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("uniq_user_habit_date").on(
      t.userId,
      t.habitId,
      t.logDate,
    ),
  }),
);
