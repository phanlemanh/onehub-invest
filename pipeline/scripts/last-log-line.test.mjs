// node --test scripts/last-log-line.test.mjs
// ON2 `lockdown-local-noi-that` AC-6: «Dòng log cuối» của job là dòng có nghĩa, không phải cảnh báo Node (OPS-19).
// Hai bản chép của cùng một luật — pipeline/lib/last-log-line.mjs (push-ops-facts.mjs) và app/src/lib/last-log-line.ts
// (collections-queries.ts) — đo trên CÙNG ma trận viết trước, mỗi ô một giá trị. Node 24 nạp thẳng tệp TS thuần.
// Không import push-ops-facts.mjs: tệp đó chạy main() (đẩy lên cloud) ngay khi nạp — chỉ đọc mã nguồn của nó.
// Tên ca mở đầu bằng mã AC để evals bám (LD-AC-n).
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, describe, test } from "node:test";

import * as pipe from "../lib/last-log-line.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const app = await import(pathToFileURL(path.join(REPO, "app/src/lib/last-log-line.ts")).href);

// Mẫu thật: đuôi pipeline/logs/cloud-sync.log 24/10 tại lúc push-ops-facts đọc (trước dòng «ops-facts pushed»).
const SYNC = "sync xong 2026-10-24T05:40:23.792Z (run 20261024053813-93ccda): 296463 dòng, 21 bảng; tổng 130.2s; leak gate";
const DEP =
  "(node:37275) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0.";
const USE = "(Use `node --trace-deprecation ...` to show where the warning was created)";
const PLAIN = "smoke ok — 12 listing, markup không đổi";
const DEP40 = "(node:5120) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.";

// Ma trận viết trước: 5 mẫu, giá trị mong đợi của từng mẫu (giống nhau cho hai bản — nhưng đo từng ô riêng).
const MATRIX = [
  { name: "mẫu cloud-sync thật 24/10", text: `  ref_calib_submarket_metrics: 28\n${SYNC}\n${DEP}\n${USE}\n`, want: SYNC },
  { name: "chỉ có cảnh báo", text: `${DEP}\n${USE}\n`, want: null },
  { name: "một dòng thường", text: `${PLAIN}\n`, want: PLAIN },
  { name: "dòng thường rồi cảnh báo [DEP0040]", text: `${PLAIN}\n${DEP40}\n\n`, want: PLAIN },
  { name: "tệp rỗng", text: "", want: null },
];
const IMPLS = [
  ["pipeline/lib/last-log-line.mjs", pipe.lastMeaningfulLine],
  ["app/src/lib/last-log-line.ts", app.lastMeaningfulLine],
];

const tmp = mkdtempSync(path.join(tmpdir(), "last-log-line-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

describe("LD-AC-6 dòng log cuối có nghĩa", () => {
  for (const [label, fn] of IMPLS)
    for (const m of MATRIX)
      test(`LD-AC-6 ${label} · ${m.name} → ${m.want === null ? "null" : JSON.stringify(m.want.slice(0, 24))}`, () => {
        assert.equal(fn(m.text), m.want);
      });

  test("LD-AC-6 tailLog đọc tệp mẫu cloud-sync → lastLine sync xong …", async () => {
    const f = path.join(tmp, "cloud-sync.log");
    writeFileSync(f, MATRIX[0].text);
    const r = await pipe.tailLog(f);
    assert.equal(r.lastLine, SYNC.slice(0, 140));
    assert.match(r.lastLogAt ?? "", /^\d{4}-\d{2}-\d{2}T/);
    assert.deepEqual(await pipe.tailLog(path.join(tmp, "vang.log")), { lastLogAt: null, lastLine: null });
  });

  test("LD-AC-6 push-ops-facts.mjs import tailLog từ lib và không còn hàm tailFile / lines.at(-1) riêng", () => {
    const src = readFileSync(path.join(REPO, "pipeline/push-ops-facts.mjs"), "utf8");
    assert.match(src, /import \{[^}]*\btailLog\b[^}]*\} from "\.\/lib\/last-log-line\.mjs"/);
    assert.doesNotMatch(src, /function tailFile\b/);
    assert.doesNotMatch(src, /lines\.at\(-1\)/);
    const jobs = src.slice(src.indexOf("async function scheduler()"), src.indexOf("// ---- 3."));
    assert.equal((jobs.match(/tailLog\(/g) ?? []).length, 5, "năm job đọc log trong scheduler() đều qua tailLog");
  });

  test("LD-AC-6 chiều đỏ: bản không lọc ra dòng (Use `node --trace-", () => {
    const unfiltered = (text) => text.split("\n").filter((l) => l.trim()).at(-1) ?? null;
    assert.equal(unfiltered(MATRIX[0].text), USE);
    assert.notEqual(unfiltered(MATRIX[0].text), pipe.lastMeaningfulLine(MATRIX[0].text));
  });
});
