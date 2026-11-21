// kho.ts — NB1 cham-bong-bo-sung-tin: kho kết quả đọc (JSONL ở state/cham-bong-bo-sung-tin/kho.jsonl, máy thu, gitignored). Mỗi dòng
// một lần đọc THÀNH CÔNG, khoá = băm(chữ bài, tên nhóm, tập ô, model, phiên bản lời nhắc) (AC-7). Lời đọc lỗi không vào kho, nên lần
// chạy lại chỉ gọi đúng cặp thẻ × model chưa thành công. Ghi append đồng bộ ngay sau từng lời gọi: lượt bị ngắt không mất dòng đã có.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ModelCham } from "./cau-hinh.js";
import type { LanDoc } from "./doc.js";
import { oCuaThe, type TheCham } from "./doc-db.js";

export type DocOk = LanDoc & { ok: true };
export type DongKho = { khoa: string; run_id: string; luc: string; doc: DocOk };
export type Kho = { co(k: string): DongKho | undefined; ghi(k: string, d: DocOk, runId: string): void; soDong(): number };

export function khoaDung(t: Pick<TheCham, "text" | "group_name" | "de_xuat">, m: Pick<ModelCham, "gateway">, promptVersion: string): string {
  const o = oCuaThe(t as TheCham);
  return createHash("sha256").update(JSON.stringify([t.text, t.group_name, o, m.gateway, promptVersion])).digest("hex");
}

export function moKho(duong: string): Kho {
  const map = new Map<string, DongKho>();
  let n = 0;
  if (existsSync(duong)) {
    for (const l of readFileSync(duong, "utf8").split("\n")) {
      if (!l.trim()) continue;
      try {
        const d = JSON.parse(l) as DongKho;
        if (d.khoa && d.doc?.ok === true) { map.set(d.khoa, d); n++; }
      } catch { /* dòng hỏng (lượt bị ngắt giữa lúc ghi) — bỏ, cặp đó sẽ được gọi lại */ }
    }
  }
  return {
    co: (k) => map.get(k),
    ghi: (k, d, runId) => {
      const dong: DongKho = { khoa: k, run_id: runId, luc: new Date().toISOString(), doc: d };
      mkdirSync(dirname(duong), { recursive: true });
      appendFileSync(duong, JSON.stringify(dong) + "\n");
      map.set(k, dong);
      n++;
    },
    soDong: () => n,
  };
}
