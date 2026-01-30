import HabitGrid from "./components/HabitGrid";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Habit App</h1>
        <p className="mt-2 text-slate-300">
          4週間・習慣化チェック（クリックで切替）
        </p>
        <div className="mt-6">
          <HabitGrid />
        </div>
      </div>
    </main>
  );
}
