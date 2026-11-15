// chung.ts — tiện ích dùng chung cho các probe dữ liệu thật ngoài suite chung (hồ sơ l2-bao-thu-doi-probe-that).
// - dotBienLuoi: bản đột biến của một tệp src/agents chép tạm CẠNH tệp thật, tạo khi cần lần đầu, xoá cuối lượt.
// - trongScript: lượt do scripts/probe-du-lieu-that.sh hay o-duong-that.sh gọi — chỉ đo dữ liệu, không tạo tệp đột biến.
// - giaDo: PROBE_GIA_DO=<tên tệp probe> làm đúng tệp ấy ném lỗi ghim — để kiểm nhánh ❌ của script mà không sửa mã nguồn.
import { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AGENTS = join(import.meta.dirname, "../src/agents");
const CHEP: string[] = [];
after(() => {
  for (const f of CHEP) rmSync(f, { force: true });
});
const NHO = new Map<string, Promise<unknown>>();

/** Bản đột biến của src/agents/<tep>.ts: đổi bằng `doi`, chép tạm `.<tienTo>-<pid>-<n>.ts` cạnh tệp thật (import tương đối vẫn đúng). */
export function dotBienLuoi<T>(tep: string, tienTo: string, ten: string, doi: (s: string) => string): Promise<T> {
  const khoa = `${tep}|${ten}`;
  if (!NHO.has(khoa)) {
    const goc = readFileSync(join(AGENTS, `${tep}.ts`), "utf8");
    const ma = doi(goc);
    assert.notEqual(ma, goc, `đột biến ${ten} không đổi mã — chiều đỏ vô nghĩa`);
    const f = join(AGENTS, `.${tienTo}-${process.pid}-${CHEP.length}.ts`);
    writeFileSync(f, ma);
    CHEP.push(f);
    NHO.set(khoa, import(f));
  }
  return NHO.get(khoa) as Promise<T>;
}

export const trongScript = () => process.env.O_DUONG_TRONG_SCRIPT === "1" || process.env.PROBE_TRONG_SCRIPT === "1";

/** Gọi ở đầu mỗi ca DB của tệp probe `ten`: PROBE_GIA_DO trùng tên thì ném lỗi ghim. */
export function giaDo(ten: string): void {
  if (process.env.PROBE_GIA_DO === ten) assert.fail(`PROBE_GIA_DO: ${ten} ra đỏ có chủ đích`);
}

export const dbUrl = () => process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
