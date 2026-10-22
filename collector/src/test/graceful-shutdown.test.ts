import { strict as assert } from "node:assert";
import { test } from "node:test";

import { installGracefulShutdown } from "../api/graceful.js";

/**
 * Collector API chạy dưới launchd: SIGTERM (bootout/restart) phải flush buffer
 * thành snapshot TRƯỚC khi thoát — không thì tin đã ack 202 mà chưa flush
 * mất âm thầm. Test qua deps giả — không đụng process thật.
 */

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

type Harness = {
  order: string[];
  fire: (sig: "SIGTERM" | "SIGINT") => void;
  uninstall: () => void;
  exitCodes: number[];
};

function harness(opts: {
  flush: () => Promise<unknown>;
  deadlineMs?: number;
}): Harness {
  const order: string[] = [];
  const exitCodes: number[] = [];
  const handlers = new Map<string, () => void>();
  const g = installGracefulShutdown(
    {
      on: (sig, fn) => handlers.set(sig, fn),
      off: (sig) => handlers.delete(sig),
      exit: (code) => {
        order.push("exit");
        exitCodes.push(code);
      },
      log: () => {}, // không bẩn mảng order — test chỉ quan tâm thứ tự flush/exit
    },
    { flush: opts.flush, deadlineMs: opts.deadlineMs },
  );
  return {
    order,
    exitCodes,
    uninstall: g.uninstall,
    fire: (sig) => handlers.get(sig)?.(),
  };
}

test("SIGTERM: flush xong RỒI mới exit(0) — đúng thứ tự", async () => {
  const h = harness({
    flush: async () => {
      h.order.push("flush-start");
      await sleep(10);
      h.order.push("flush-done");
    },
  });
  h.fire("SIGTERM");
  await sleep(40);
  assert.deepEqual(h.order, ["flush-start", "flush-done", "exit"]);
  assert.deepEqual(h.exitCodes, [0]);
});

test("SIGINT cũng được bắt, không chỉ SIGTERM", async () => {
  const h = harness({ flush: async () => h.order.push("flush") });
  h.fire("SIGINT");
  await sleep(10);
  assert.deepEqual(h.order, ["flush", "exit"]);
});

test("signal lần 2 khi đang chờ flush → exit ngay, flush chỉ 1 lần", async () => {
  const h = harness({
    flush: () => new Promise(() => h.order.push("flush-start")), // treo mãi
  });
  h.fire("SIGTERM");
  await sleep(5);
  assert.equal(h.order.includes("exit"), false, "chưa có signal 2 — chưa thoát");
  h.fire("SIGTERM");
  await sleep(5);
  assert.equal(h.exitCodes.length, 1, "signal 2 thoát ngay");
  assert.equal(h.order.filter((x) => x === "flush-start").length, 1, "flush không gọi lại");
});

test("flush ném lỗi → vẫn exit(0), không treo tiến trình", async () => {
  const h = harness({
    flush: async () => {
      throw new Error("đĩa đầy");
    },
  });
  h.fire("SIGTERM");
  await sleep(10);
  assert.deepEqual(h.exitCodes, [0]);
});

test("flush treo quá deadline → exit vẫn diễn ra (không đợi launchd SIGKILL)", async () => {
  const h = harness({
    flush: () => new Promise(() => {}), // treo mãi
    deadlineMs: 25,
  });
  h.fire("SIGTERM");
  await sleep(5);
  assert.equal(h.exitCodes.length, 0, "còn trong deadline — chưa thoát");
  await sleep(40);
  assert.deepEqual(h.exitCodes, [0], "quá deadline phải thoát");
});

test("uninstall gỡ cả hai signal", () => {
  const removed: string[] = [];
  const handlers = new Map<string, () => void>();
  const g = installGracefulShutdown(
    {
      on: (sig, fn) => handlers.set(sig, fn),
      off: (sig) => {
        removed.push(sig);
        handlers.delete(sig);
      },
      exit: () => {},
      log: () => {},
    },
    { flush: async () => {} },
  );
  g.uninstall();
  assert.deepEqual(removed.sort(), ["SIGINT", "SIGTERM"]);
  assert.equal(handlers.size, 0, "handler không giữ lại");
});
