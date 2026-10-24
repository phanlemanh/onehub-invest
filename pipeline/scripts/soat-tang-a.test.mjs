// node --test pipeline/scripts/soat-tang-a.test.mjs (cd pipeline && npm test)
// NT2 `soat-tang-a-moi-duong-len-cloud`: MỘT bộ soát tầng A (pipeline/lib/tier-a-guard.mjs) cho sync-cloud và push-ops-facts.
// Tên thật lấy lúc chạy từ db/migrations — tệp này không chứa tên. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { fold } from "../lib/mask-source-names.mjs";
import { guardValues } from "../lib/tier-a-guard.mjs";
import { scanSourceNames } from "../sync-cloud.mjs";
import { sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEEDS = sourceRegistrySeeds();
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }));
const name = (code) => SEEDS.find((s) => s.code === code).realName;
const FORMS = {
  full: (n) => n, upper: (n) => n.toUpperCase(), fold: (n) => fold(n),
  joined: (n) => fold(n).replace(/[\s.\-_/]+/g, ""), suffix: (n) => fold(n).replace(/[\s.\-_/]+/g, "") + "user",
  first: (n) => n.split(/\s+/)[0],
};
const expand = (s) => s.replace(/\{(S0\d):(\w+)\}/g, (_, code, form) => FORMS[form](name(code)));

describe("NT2-AC-6 một bộ soát", () => {
  test("NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca", () => {
    const { cases } = JSON.parse(readFileSync(path.join(HERE, "mask-source-names.cases.json"), "utf8"));
    const withNames = cases.filter((c) => !c.names);
    assert.ok(withNames.length >= 9, "bảng ca phải có đủ ca viết trước");
    const tokens = SEEDS.map((s) => s.realName);
    let hits = 0;
    for (const c of withNames) {
      const text = expand(c.in);
      const viaSync = scanSourceNames(text, tokens) !== null;
      const viaGuard = guardValues(text, ENTRIES).length > 0;
      assert.equal(viaSync, viaGuard, `hai đường lệch ở ca «${c.ten}»`);
      if (viaGuard) hits++;
    }
    assert.ok(hits >= 6 && hits < withNames.length, `bảng ca phải có cả ca trúng lẫn ca không trúng (trúng ${hits}/${withNames.length})`);
  });
});
