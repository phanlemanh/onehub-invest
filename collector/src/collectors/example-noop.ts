import type { Collector, RawItem } from "../core/types.js";

/** Collector mẫu chứng minh toàn bộ luồng plumbing (không thu thập thật). */
export const exampleCollector: Collector = {
  id: "example",
  description: "No-op collector sinh 3 items syntetic để smoke-test pipeline",
  requestsPerSecond: 2,
  async collect(ctx) {
    ctx.log("collecting synthetic items…");
    const items: RawItem[] = [];
    for (let i = 1; i <= 3; i++) {
      await ctx.rateLimit.take(); // demo rate discipline
      items.push({
        source: "example",
        sourceId: `demo-${i}`,
        kind: "listing",
        fetchedAt: new Date().toISOString(),
        payload: { demo: true, seq: i, city: ctx.city.id },
        meta: { method: "synthetic" },
      });
    }
    ctx.checkpoint.set("lastSeq", 3);
    return {
      items,
      coverage: { discovered: 3, captured: 3, failed: 0, methods: { synthetic: 3 } },
    };
  },
};
