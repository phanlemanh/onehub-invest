// judge-duong-s06.test.ts — s06-duong-du-an-len-tin (DS1) AC-6: bảy cặp đường dạng chữ của S06 qua soDuong của judge-entity và của
// thẻ duyệt (rút từ tệp thật); chỉ ca Lệch làm same_house = no. Chiều đỏ: bản sao judge-entity bỏ bước bỏ tiền tố trong khoaDuong.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import { TR, cap, type Tin } from "./judge-chung.js";
import * as that from "../src/agents/judge-entity.js";

type Mod = typeof that;
const X = "Nguyễn Xiển";
const MA_TRAN: [string, string | null, "khop" | "lech" | "thieu"][] = [
  [`Đường ${X}`, X, "khop"],
  [`Phố ${X}`, X, "khop"],
  [`Ngõ 5 ${X}`, X, "khop"],
  [`Đường ${X}, Phường Đại Kim, TP Hà Nội`, X, "khop"],
  [`Số 277 Đường ${X}`, `Đường ${X}`, "khop"],
  [`Đường ${X}`, "Đường Âu Cơ", "lech"],
  [`Đường ${X}`, null, "thieu"],
];

const TEP_APP = join(import.meta.dirname, "../../app/src/lib/ops/review-can-cu.ts");
function rutApp(ten: string): string {
  const m = readFileSync(TEP_APP, "utf8").match(new RegExp(`^(?:export )?function ${ten}\\([\\s\\S]*?\\n}`, "m"));
  assert.ok(m, `DS1-AC-6 không rút được ${ten} từ review-can-cu.ts`);
  return m[0].replace(/^export /, "");
}
const soDuongThe: (a: string | null, b: string | null) => string = new Function(
  `${stripTypeScriptTypes(["boDau", "khoaDuong", "soDuong"].map(rutApp).join("\n"))}\nreturn soDuong;`,
)();

const goc: Tin = { perm2: 100 * TR, area: 50, phuong: "Đại Kim", loai: "house" };
const voi = (street: string | null): Tin => ({ ...goc, perm2: 102 * TR, street });

function kiem(mod: Mod, soThe: typeof soDuongThe): number {
  let n = 0;
  for (const [a, b, mong] of MA_TRAN) {
    assert.equal(mod.soDuong(a, b), mong, `DS1-AC-6 judge-entity: ${a} × ${b}`);
    assert.equal(soThe(a, b), mong, `DS1-AC-6 thẻ duyệt: ${a} × ${b}`);
    const kq = mod.apNguong(cap(voi(a), voi(b)));
    assert.equal(kq.same_house === "no", mong === "lech", `DS1-AC-6 same_house: ${a} × ${b}`);
    n++;
  }
  return n;
}

test("DS1-AC-6 bảy cặp ở cả hai bản, chỉ Lệch làm same_house = no", () => {
  assert.equal(kiem(that, soDuongThe), 7);
});

const AGENTS = join(import.meta.dirname, "../src/agents");
const CHEP: string[] = [];
after(() => {
  for (const f of CHEP) rmSync(f, { force: true });
});
test("DS1-AC-6 đỏ: bản sao bỏ bước bỏ tiền tố thì ca đỏ gọi tên cặp «Đường X» × «X»", async () => {
  const cu = "if (coDau) return [boDau(coDau[1])];";
  const nguon = readFileSync(join(AGENTS, "judge-entity.ts"), "utf8");
  assert.ok(nguon.includes(cu), "đột biến không khớp mã nguồn");
  const f = join(AGENTS, `.ds1-${process.pid}.ts`);
  writeFileSync(f, nguon.replace(cu, "if (coDau) return [boDau(s)];"));
  CHEP.push(f);
  const mod = (await import(f)) as Mod;
  assert.throws(() => kiem(mod, soDuongThe), new RegExp(`DS1-AC-6 judge-entity: Đường ${X} × ${X}`));
});
