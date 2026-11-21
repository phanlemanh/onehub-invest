// chay.ts — NB1 cham-bong-bo-sung-tin: bộ chạy lượt chấm bóng. Mỗi thẻ chờ còn đề xuất được đọc đúng một lần bởi mỗi model (AC-1),
// thẻ xếp theo ô ưu tiên (AC-8), trần tiền kiểm TRƯỚC mỗi lời gọi (AC-8), cặp thẻ × model đã có lời đọc thành công trong kho không
// gọi lại (AC-7). Chế độ «thu»: sổ gọi vào tệp; «ap»: sổ gọi vào bảng ai_calls (AC-6) — thứ duy nhất được ghi vào DB (AC-5).
// Bộ chạy không nhận kết nối ghi nào ngoài writer sổ gọi.
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RecordCall } from "../../runtime/ai-call-log.js";
import type { CauHinhCham, ModelCham } from "./cau-hinh.js";
import { docMot, MAX_TOKEN_RA, type GoiModel } from "./doc.js";
import { docThe, oCuaThe, xepThe, type BoQua, type TheCham, type Truy } from "./doc-db.js";
import { khoaGiaTri, ketCuc, laCaBien, type KetCuc } from "./ket-cuc.js";
import { khoaDung, moKho, type DongKho } from "./kho.js";
import { loiNhac } from "./prompt.js";

export type CheDo = "thu" | "ap";
export type TongKet = {
  run_id: string; che_do: CheDo; prompt_version: string; models: string[]; tran_usd: number;
  so_the: number; so_de_xuat: number; the_du: number; the_cho: number;
  goi_moi: number; dung_lai: number; loi_goi: number; vao: number; ra: number; usd: number;
  dung_vi_tran: boolean; bo_qua: BoQua[];
};
export type DongDoc = {
  loai: "doc"; run_id: string; review_id: number; offer_id: string; proposal_id: number; field: string; source: string;
  value_de_xuat: string; o_da_co: boolean; model: string; lan_doc: 0 | 1; khoa: string; v: string | null; ly_do: string | null;
  trich: string; can_cu: string; sha_loi_nhac: string;
};
export type DongKetCuc = {
  loai: "ket-cuc"; run_id: string; review_id: number; proposal_id: number; field: string; source: string; o_da_co: boolean;
  lech_tren_the: boolean; du_hai: boolean; ket_cuc: KetCuc | null; ca_bien: boolean | null;
};

export const thuMucLuot = (thuMuc: string, runId: string) => join(thuMuc, runId);

/** Ước chi phí lời gọi đầu của một model khi chưa có lời gọi nào: ký tự lời nhắc / 3 token vào, MAX_TOKEN_RA token ra. */
function uocDau(m: ModelCham, t: TheCham): number {
  const p = loiNhac({ text: t.text, group_name: t.group_name, o: oCuaThe(t) });
  return ((p.system.length + p.user.length) / 3 * m.gia_vao + MAX_TOKEN_RA * m.gia_ra) / 1e6;
}

export async function chay(o: {
  truy: Truy; cauHinh: CauHinhCham; cheDo: CheDo; goi: GoiModel; recordCallDb: RecordCall; thuMuc: string; runId: string;
  tranUsd?: number; gioiHanThe?: number; env?: NodeJS.ProcessEnv;
}): Promise<TongKet> {
  const dir = thuMucLuot(o.thuMuc, o.runId);
  mkdirSync(dir, { recursive: true });
  const kho = moKho(join(o.thuMuc, "kho.jsonl"));
  const tran = o.tranUsd ?? o.cauHinh.tran_usd;
  const pv = o.cauHinh.prompt_version;
  const trace = `cham-bong:${o.runId}`;
  const soGoiTep = join(dir, "so-goi.jsonl");
  const recordCall: RecordCall = o.cheDo === "thu" ? async (r) => { appendFileSync(soGoiTep, JSON.stringify(r) + "\n"); } : o.recordCallDb;

  const { the: tatCa, bo_qua } = await docThe(o.truy);
  const ds = xepThe(tatCa).slice(0, o.gioiHanThe ?? Infinity);
  const tk: TongKet = {
    run_id: o.runId, che_do: o.cheDo, prompt_version: pv, models: o.cauHinh.model.map((m) => m.gateway), tran_usd: tran,
    so_the: ds.length, so_de_xuat: ds.reduce((s, t) => s + t.de_xuat.length, 0), the_du: 0, the_cho: 0,
    goi_moi: 0, dung_lai: 0, loi_goi: 0, vao: 0, ra: 0, usd: 0, dung_vi_tran: false, bo_qua,
  };
  const daChi = new Map<string, { n: number; usd: number }>();
  try {
    vong: for (const t of ds) {
      const dauVao = { text: t.text, group_name: t.group_name, o: oCuaThe(t) };
      for (const m of o.cauHinh.model) {
        const k = khoaDung(t, m, pv);
        if (kho.co(k)) { tk.dung_lai++; continue; }
        const ls = daChi.get(m.gateway);
        const uoc = ls && ls.n ? ls.usd / ls.n : uocDau(m, t);
        if (tk.usd + uoc > tran) { tk.dung_vi_tran = true; break vong; }
        const d = await docMot({ model: m, dauVao, goi: o.goi, recordCall, trace, env: o.env });
        tk.goi_moi++;
        tk.usd += d.usd;
        tk.vao += d.vao ?? 0;
        tk.ra += d.ra ?? 0;
        daChi.set(m.gateway, { n: (ls?.n ?? 0) + 1, usd: (ls?.usd ?? 0) + d.usd });
        if (d.ok) kho.ghi(k, d, o.runId);
        else tk.loi_goi++;
      }
    }
  } finally {
    ghiKetQua(dir, o.runId, ds, o.cauHinh, kho.co, tk);
    writeFileSync(join(dir, "tong-ket.json"), JSON.stringify(tk, null, 2) + "\n");
  }
  return tk;
}

/** Dựng tệp kết quả của lượt từ kho: mỗi đề xuất × model có lời đọc thành công một dòng «doc», mỗi đề xuất một dòng «ket-cuc».
 * Hai đề xuất cùng ô dùng chung ô của cùng lần đọc. Tất định theo kho, nên in lại được mà không gọi model. */
function ghiKetQua(dir: string, runId: string, ds: TheCham[], c: CauHinhCham, co: (k: string) => DongKho | undefined, tk: TongKet): void {
  const dong: string[] = [];
  let du = 0;
  for (const t of ds) {
    // Chỉ lời đọc thành công là kết quả (kho chỉ nhận lời đọc ok; lọc lại để tệp kết quả không bao giờ dựng từ lời lỗi).
    const lan = c.model.map((m) => { const l = co(khoaDung(t, m, c.prompt_version)); return l?.doc.ok ? l : undefined; });
    const duHai = lan.every(Boolean);
    if (duHai) du++;
    for (const p of t.de_xuat) {
      const lech = new Set(t.de_xuat.filter((x) => x.field === p.field).map((x) => khoaGiaTri(x.value))).size > 1;
      lan.forEach((l, i) => {
        if (!l) return;
        const ox = l.doc.o[p.field];
        const d: DongDoc = {
          loai: "doc", run_id: runId, review_id: t.review_id, offer_id: t.offer_id, proposal_id: p.id, field: p.field, source: p.source,
          value_de_xuat: p.value, o_da_co: p.o_da_co, model: c.model[i].gateway, lan_doc: i as 0 | 1, khoa: l.khoa,
          v: ox.v, ly_do: ox.ly_do, trich: ox.trich, can_cu: ox.can_cu, sha_loi_nhac: l.doc.sha_loi_nhac,
        };
        dong.push(JSON.stringify(d));
      });
      const kc = duHai ? ketCuc(p.value, lan[0]!.doc.o[p.field], lan[1]!.doc.o[p.field]) : null;
      const r: DongKetCuc = {
        loai: "ket-cuc", run_id: runId, review_id: t.review_id, proposal_id: p.id, field: p.field, source: p.source, o_da_co: p.o_da_co,
        lech_tren_the: lech, du_hai: duHai, ket_cuc: kc, ca_bien: kc === null ? null : laCaBien(kc, lech),
      };
      dong.push(JSON.stringify(r));
    }
  }
  tk.the_du = du;
  tk.the_cho = ds.length - du;
  writeFileSync(join(dir, "ket-qua.jsonl"), dong.length ? dong.join("\n") + "\n" : "");
}
