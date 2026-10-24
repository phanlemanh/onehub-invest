// dq-moi-nhat.test.tsx — hồ sơ dq-moi-nhat-moi-kiem (ON9): bảng «Kiểm chất lượng» của /ops/quality.
// Ca DB chạy ĐÚNG câu dqLatestSql()/loadDqChecks() trên fixture trong BEGIN…ROLLBACK (Postgres local :5433, khoá 33033)
// — bảng thật bị gạt trong giao dịch, không để lại dòng nào. Ca bảng vẽ DqChecksTable trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import pg from "pg";

import { dqLatestSql, dqResult, dqSection, loadDqChecks } from "../src/lib/dq-checks";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const CU = `SELECT check_name, entity, status, detail, checked_at::text FROM dq_check_results
     WHERE checked_at > now() - interval '7 days' ORDER BY checked_at DESC LIMIT 20`;

async function withTx<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query("DELETE FROM dq_check_results");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** [kiểm, đối tượng, trạng thái, số ngày trước] */
async function seed(c: pg.Client, rows: [string, string, string, number][]) {
  for (const [check, entity, status, days] of rows) {
    await c.query(
      `INSERT INTO dq_check_results (check_name, entity, status, detail, checked_at)
       VALUES ($1, $2, $3, 'thử', now() - make_interval(days => $4::int) - make_interval(secs => $5::int))`,
      [check, entity, status, Math.floor(days), Math.round((days % 1) * 86400)],
    );
  }
}

test("DQ-AC-1 mới nhất theo cặp", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c, [
      ["A", "x", "pass", 3],
      ["A", "x", "fail", 2],
      ["A", "x", "warn", 1],
      ["A", "y", "pass", 1],
      ["A", "z", "pass", 8],
    ]);
    const rows = (await c.query(dqLatestSql())).rows;
    assert.deepEqual(rows.map((r) => `${r.check_name}|${r.entity}|${r.status}`), ["A|x|warn", "A|y|pass"], "DQ-AC-1 cặp");
    // Chiều đỏ trên cùng fixture: câu cũ trả cả 4 dòng trong 7 ngày (x lặp).
    const cu = (await c.query(CU)).rows;
    assert.equal(cu.filter((r) => r.entity === "x").length, 3, "DQ-AC-1 đối chứng câu cũ không lặp");
  });
});

const DAY_DAC = (): [string, string, string, number][] => [
  ...Array.from({ length: 25 }, (_, i): [string, string, string, number] => ["D", `d${String(i).padStart(2, "0")}`, "pass", 0.1]),
  ["E", "e", "pass", 2],
];

test("DQ-AC-2 kiểm dày không đè kiểm thưa", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c, DAY_DAC());
    const rows = (await c.query(dqLatestSql())).rows;
    assert.equal(rows.filter((r) => r.check_name === "D").length, 25, "DQ-AC-2 thiếu dòng của D");
    assert.equal(rows.filter((r) => r.check_name === "E").length, 1, "DQ-AC-2 kiểm thưa E bị đẩy ra ngoài");
    assert.equal((await c.query(CU)).rows.some((r) => r.check_name === "E"), false, "DQ-AC-2 đối chứng: câu cũ vẫn có E");
  });
});

test("DQ-AC-3 trang lấy bảng và số qua loadDqChecks", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c, DAY_DAC());
    const { rows, stats } = await loadDqChecks(c);
    assert.ok(rows.some((r) => r.check_name === "E"), "DQ-AC-3 bảng thiếu kiểm E");
    assert.deepEqual({ checks: stats.checks, entities: stats.entities }, { checks: 2, entities: 26 });
    assert.deepEqual(stats.labels, ["2 kiểm", "26 đối tượng"], "DQ-AC-3 nhãn đầu trang");
    // Chiều đỏ: cùng hàm với câu cũ thì bảng thiếu E.
    const cu = await loadDqChecks({ query: (sql: string) => c.query(sql === dqLatestSql() ? CU : sql) });
    assert.equal(cu.rows.some((r) => r.check_name === "E"), false, "DQ-AC-3 đối chứng không phân biệt");
  });
  const page = readFileSync(new URL("../src/app/ops/quality/page.tsx", import.meta.url), "utf8");
  assert.equal(page.includes("dq_check_results"), false, "DQ-AC-3 page.tsx còn tự truy vấn dq_check_results");
  const code = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\/.*$/gm, "");
  assert.equal((code.match(/loadDqChecks\(/g) ?? []).length, 1, "DQ-AC-3 page.tsx gọi loadDqChecks không đúng một lần");
  assert.match(code, /const dq = dqSection\(dqRaw,/, "DQ-AC-3 page.tsx không dựng bảng + số qua dqSection");
  assert.match(code, /stats=\{\[\.\.\.dq\.stats\.labels/, "DQ-AC-3 PageHeader không nhận số từ dqSection");
  assert.match(code, /<DqChecksTable rows=\{dq\.rows\} \/>/, "DQ-AC-3 bảng không nhận dòng từ cùng dqSection");
});

test("DQ-AC-3 số đầu trang đếm trên chính dòng bảng", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c, DAY_DAC());
    const { rows } = await loadDqChecks(c);
    const dq = dqSection(rows, (d) => d.replaceAll("thử", "[che]"));
    assert.ok(dq.rows.every((r) => r.detail === "[che]"), "DQ-AC-3 bảng không qua bộ che chi tiết");
    assert.equal(dq.stats.entities, dq.rows.length, "DQ-AC-3 số đối tượng khác số dòng bảng");
    assert.equal(dq.stats.checks, new Set(dq.rows.map((r) => r.check_name)).size, "DQ-AC-3 số kiểm khác số loại kiểm của bảng");
    assert.deepEqual(dq.stats.labels, ["2 kiểm", "26 đối tượng"]);
  });
});

test("DQ-AC-4 nhãn kết quả", () => {
  const MATRIX: [string, string, string, string][] = [
    ["truthful-coverage", "pass", "Có số tham chiếu", "info-light"],
    ["truthful-coverage", "fail", "Thiếu số tham chiếu", "warning-light"],
    ["truthful-coverage", "warn", "Cảnh báo", "warning-light"],
    ["truthful-coverage", "skip", "Bỏ qua", "outline"],
    ["truthful-coverage", "xyz", "xyz", "destructive-light"],
    ["freshness", "pass", "Đạt", "success-light"],
    ["freshness", "warn", "Cảnh báo", "warning-light"],
    ["freshness", "fail", "Không đạt", "destructive-light"],
    ["freshness", "skip", "Bỏ qua", "outline"],
    ["freshness", "xyz", "xyz", "destructive-light"],
  ];
  for (const [check, status, label, variant] of MATRIX) {
    assert.deepEqual(dqResult(check, status), { label, variant }, `DQ-AC-4 ${check}/${status}`);
  }
  for (const s of ["pass", "fail", "warn", "skip", "xyz"]) {
    const r = dqResult("truthful-coverage", s);
    assert.notEqual(r.label, "Đạt", `DQ-AC-4 kiểm số tham chiếu ${s} ra «Đạt»`);
    assert.notEqual(r.variant, "success-light", `DQ-AC-4 kiểm số tham chiếu ${s} ra xanh lá`);
  }
});

// ---- Bảng vẽ (jsdom) ----
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/quality" });
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window), // bảng (data-grid) đọc kích thước cột
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
// jsdom không có Web Animations — thanh cuộn của bảng gọi getAnimations().
Object.assign(dom.window.Element.prototype, { getAnimations: () => [] });
for (const k of ["ResizeObserver", "matchMedia"] as const) {
  if (!(k in globalThis)) {
    Object.assign(globalThis, {
      [k]:
        k === "matchMedia"
          ? () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
          : class { observe() {} unobserve() {} disconnect() {} },
    });
    Object.assign(dom.window, { [k]: (globalThis as Record<string, unknown>)[k] });
  }
}

test("DQ-AC-4 bảng vẽ", async () => {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { DqChecksTable } = await import("../src/components/ops/quality/dq-checks-table");
  const { Badge } = await import("../src/components/reui/badge");
  document.body.innerHTML = "<div id=root></div><div id=ref></div>";
  const root = createRoot(document.getElementById("root")!);
  const ref = createRoot(document.getElementById("ref")!);
  await React.act(async () => {
    root.render(
      <DqChecksTable
        rows={[
          { check_name: "truthful-coverage", entity: "vn-hanoi", status: "pass", detail: "coverage=0.00%", checked_at: "2026-10-24T08:00:00Z" },
          { check_name: "freshness", entity: "S01/hanoi", status: "pass", detail: "ok", checked_at: "2026-10-24T07:00:00Z" },
        ]}
      />,
    );
    ref.render(<Badge variant="success-light">mốc</Badge>);
  });
  const green = document.querySelector("#ref > *")!.className;
  const badgeIn = (needle: string) => {
    const row = [...document.querySelectorAll("#root tr")].find((tr) => tr.textContent?.includes(needle));
    assert.ok(row, `DQ-AC-4 không thấy hàng ${needle}`);
    const cell = [...row.querySelectorAll("span, div")].find((el) => /Đạt|tham chiếu/.test(el.textContent ?? "") && el.children.length <= 1);
    return { row: row.textContent ?? "", cls: (cell as HTMLElement | undefined)?.className ?? "" };
  };
  const ref1 = badgeIn("truthful-coverage");
  assert.match(ref1.row, /Có số tham chiếu/, "DQ-AC-4 hàng số tham chiếu thiếu nhãn");
  assert.doesNotMatch(ref1.row, /Đạt/, "DQ-AC-4 hàng số tham chiếu mang «Đạt»");
  assert.notEqual(ref1.cls, green, "DQ-AC-4 hàng số tham chiếu mang màu xanh lá");
  const fr = badgeIn("freshness");
  assert.match(fr.row, /Đạt/, "DQ-AC-4 hàng freshness thiếu «Đạt»");
  assert.equal(fr.cls, green, "DQ-AC-4 đối chứng: hàng freshness không mang màu xanh lá");
  await React.act(async () => {
    root.unmount();
    ref.unmount();
  });
});
