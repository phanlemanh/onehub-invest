// node --test pipeline/scripts/ops-nhan-ma-nguon.test.mjs (cd pipeline && npm test)
// ON7 `ops-nhan-ma-nguon`: AC-7 bộ che tên nguồn thật (bản pipeline + bản app trên cùng bảng ca) và AC-4 payload facts
// do push-ops-facts thật đẩy. Tên thật lấy lúc chạy từ db/migrations — tệp này không chứa tên. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import * as pipe from "../lib/mask-source-names.mjs";
import * as app from "../../app/src/lib/mask-source-names.ts";
import { sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEEDS = sourceRegistrySeeds();
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }));
const name = (code) => SEEDS.find((s) => s.code === code).realName;
const FORMS = {
  full: (n) => n,
  upper: (n) => n.toUpperCase(),
  fold: (n) => pipe.fold(n),
  joined: (n) => pipe.fold(n).replace(/[\s.\-_/]+/g, ""),
  suffix: (n) => pipe.fold(n).replace(/[\s.\-_/]+/g, "") + "user",
  first: (n) => n.split(/\s+/)[0],
};
const expand = (s) => s?.replace(/\{(S0\d):(\w+)\}/g, (_, code, form) => FORMS[form](name(code)));

describe("ON7-AC-7 bộ che", () => {
  const { cases } = JSON.parse(readFileSync(path.join(HERE, "mask-source-names.cases.json"), "utf8"));
  test("ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau", () => {
    assert.ok(cases.length >= 10, "bảng ca phải đủ 10 ca viết trước");
    for (const c of cases) {
      const input = expand(c.in);
      const want = c.out === null ? null : expand(c.out);
      const names = c.names ?? ENTRIES;
      assert.equal(pipe.maskSourceNames(input, names), want, `bản pipeline sai ở ca «${c.ten}»`);
      assert.equal(app.maskSourceNames(input, names), want, `bản app sai ở ca «${c.ten}»`);
    }
  });
  test("ON7-AC-7 tên ba ký tự giữa một từ khác không bị thay", () => {
    const short = SEEDS.find((s) => pipe.nameVariants(s.realName).some((v) => v.length < 4));
    assert.ok(short, "migration phải có ít nhất một tên ba ký tự để ca này có nghĩa");
    const inWord = `x${pipe.fold(short.realName)}y`;
    for (const m of [pipe, app]) assert.equal(m.maskSourceNames(inWord, ENTRIES), inWord, "tên ngắn giữa từ bị thay nhầm");
  });
  test("ON7-AC-7 danh sách tên rỗng → cả hai bản trả null", () => {
    for (const m of [pipe, app]) {
      assert.equal(m.maskSourceNames(`lỗi ${name("S02")}`, []), null, "đóng chặt: không được trả chuỗi gốc");
      assert.equal(m.maskSourceNames(`lỗi ${name("S02")}`, null), null);
    }
  });
});
