import { TokenBucket } from "./ratelimit.js";
import { Checkpoint } from "./checkpoint.js";
import { SnapshotWriter } from "./storage.js";
import type { CityRef, Collector } from "./types.js";

export type RunOptions = {
  city: CityRef;
  collector: Collector;
  snapshotRoot: string; // "snapshots/"
  stateDir: string; // "state/"
};

/**
 * Chạy một collector cho một city: checkpoint → collect (rate-limited) →
 * ghi raw snapshot + manifest → lưu checkpoint. Cron/launchd bên ngoài gọi CLI.
 */
export async function runCollector(opts: RunOptions): Promise<void> {
  const { city, collector, snapshotRoot, stateDir } = opts;
  const log = (...a: unknown[]) => console.log(`[${collector.id}/${city.id}]`, ...a);
  const checkpoint = await Checkpoint.load(`${stateDir}/${city.id}__${collector.id}.json`);
  const writer = new SnapshotWriter(snapshotRoot, city.id, collector.id);
  const rateLimit = new TokenBucket(collector.requestsPerSecond);

  log("start");
  try {
    const { items, coverage } = await collector.collect({
      city,
      checkpoint,
      rateLimit,
      log,
      paths: { snapshotRoot, stateDir },
    });
    await writer.write(items);
    const manifest = await writer.finalize(coverage);
    checkpoint.set("lastRunAt", manifest.finishedAt);
    checkpoint.set("lastSnapshotId", manifest.snapshotId);
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
