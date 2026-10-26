import { TokenBucket } from "./ratelimit.js";
import { Checkpoint } from "./checkpoint.js";
import { SnapshotWriter } from "./storage.js";
import { dailyBudget, inActivityWindow, jitterMs } from "./conduct.js";
import type { CityRef, Collector, RateLimitLike } from "./types.js";

export type RunOptions = {
  city: CityRef;
  collector: Collector;
  snapshotRoot: string; // "snapshots/"
  stateDir: string; // "state/"
};

/** Env CCP (ADR-0007) — override được cho chạy tay / smoke test. */
const JITTER = process.env.CONDUCT_JITTER !== "0";
const WINDOW = process.env.CONDUCT_WINDOW ?? "19-23";
const DAILY_MAX = Number(process.env.CONDUCT_DAILY_MAX ?? 600);

/** Bọc rateLimit: sau mỗi take ngủ jitter 2–15s — tránh nhịp metronome. */
function withJitter(inner: RateLimitLike): RateLimitLike {
  return {
    async take(n?: number) {
      await inner.take(n);
      await new Promise((r) => setTimeout(r, jitterMs()));
    },
  };
}

/**
 * Chạy một collector cho một city: checkpoint → collect (rate-limited) →
 * ghi raw snapshot + manifest → lưu checkpoint. Cron/launchd bên ngoài gọi CLI.
 * Conduct CCP: cửa sổ giờ hoạt động + cap items/ngày + jitter sau mỗi request.
 */
export async function runCollector(opts: RunOptions): Promise<void> {
  const { city, collector, snapshotRoot, stateDir } = opts;
  const log = (...a: unknown[]) => console.log(`[${collector.id}/${city.id}]`, ...a);
  const checkpoint = await Checkpoint.load(`${stateDir}/${city.id}__${collector.id}.json`);
  const rateLimit = new TokenBucket(collector.requestsPerSecond);

  if (!inActivityWindow(new Date(), WINDOW)) {
    log(`skip: ngoài cửa sổ giờ hoạt động ${WINDOW} (CONDUCT_WINDOW=off để chạy tay)`);
    return;
  }
  const budgetKey = `conduct:${dailyBudget(undefined).date}`;
  const budget = dailyBudget(checkpoint.get<{ date: string; used: number }>(budgetKey));
  if (budget.used >= DAILY_MAX) {
    log(`skip: vượt cap ngày ${DAILY_MAX} items (CONDUCT_DAILY_MAX) — đã dùng ${budget.used}`);
    return;
  }

  // 2510-32: writer chiếm '.<id>.partial' ngay trong constructor (2510-8 v3)
  // nên phải tạo SAU hai chỗ dừng sớm — không thì mỗi lượt skip để lại một
  // thư mục '.partial' rỗng vĩnh viễn.
  const writer = new SnapshotWriter(snapshotRoot, city.id, collector.id);
  log("start");
  try {
    const { items, coverage } = await collector.collect({
      city,
      checkpoint,
      rateLimit: JITTER ? withJitter(rateLimit) : rateLimit,
      log,
      paths: { snapshotRoot, stateDir },
    });
    await writer.write(items);
    const manifest = await writer.finalize(coverage);
    checkpoint.set("lastRunAt", manifest.finishedAt);
    checkpoint.set("lastSnapshotId", manifest.snapshotId);
    checkpoint.set(budgetKey, { date: budget.date, used: budget.used + coverage.captured });
    await checkpoint.save();
    log(
      `done: ${manifest.counts.items} items, ${manifest.files.length} file(s) → ${manifest.snapshotId}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await writer.finalize(
      { discovered: 0, captured: 0, failed: 0, methods: {}, notes: ["run failed"] },
      message,
    );
    await checkpoint.save();
    log("FAILED:", message);
    throw err;
  }
}
