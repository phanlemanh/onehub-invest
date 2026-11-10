// cham-lenh.ts — PL30: chấm bộ đọc gộp trên lát vàng. Chỉ đọc DB (giao dịch chỉ đọc), không ghi bảng nào kể cả ai_calls;
// mỗi lời gọi có thể ghi một dòng vào sổ chi phí ngoài kho (--so, research-local). Tóm tắt (--tom-tat) chỉ có số:
// không chữ bài, không tên người — làm bằng chứng AC-10, ghim băm prompt, bảng chọn và mã.
import { appendFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { keHoach, napCauHinh } from "./cau-hinh.js";
import { bangCham, maSha, type BangCham, type KetQuaThe } from "./cham.js";
import { uocThe } from "./chay.js";
import { gop, hoiGop, type KetQuaGoi, type TaoModel } from "./doc.js";
import { FIELDS, type Field } from "./o.js";
import { PROMPT_SHA, PROMPT_VERSION } from "./prompt.js";
import { docTheTheoLat, type Q } from "./the.js";

export type TomTat = {
  lat: string; split: string; so_the: number; model: string[]; prompt_version: string; prompt_sha: string; cau_hinh_sha: string; ma_sha: string;
  dung: number; mau_so: number; dung_gop: number; dung_gop_bo_9991: number | null; usd_the: number; json_hong: number; giay_trung_vi: number;
  anh_thieu: Record<string, number>; o: BangCham["o"]; luc: string;
};

export async function chamLuot(o: {
  client: Q; lat: string; split?: "dev" | "test"; cauHinh?: string; tranUsd: number; taoModel?: TaoModel; so?: string; log?: (s: string) => void;
}): Promise<{ bang: BangCham; tomTat: TomTat }> {
  const log = o.log ?? console.log;
  const cau = napCauHinh(o.cauHinh);
  const kh = keHoach(cau.cauHinh);
  const the = (await docTheTheoLat(o.client, o.lat, o.split, { chiCoNhan: true })).filter((t) => t.item_id !== undefined);
  const { rows } = await o.client.query(
    `SELECT item_id::int, field, value, not_stated FROM eval_labels WHERE item_id = ANY ($1)`, [the.map((t) => t.item_id)]);
  const vang = new Map<number, Map<Field, string | null>>();
  for (const r of rows as { item_id: number; field: Field; value: string | null; not_stated: boolean }[]) {
    if (!vang.has(r.item_id)) vang.set(r.item_id, new Map());
    vang.get(r.item_id)!.set(r.field, r.not_stated ? null : r.value);
  }
  const uoc = the.reduce((s, t) => s + kh.nhom.reduce((a, n) => a + uocThe(t, n.gia), 0), 0);
  log(`cham ${the.length} the (${o.lat}${o.split ? " " + o.split : ""}), ${kh.nhom.length} model, prompt ${PROMPT_VERSION}: uoc ${uoc.toFixed(4)} USD / tran ${o.tranUsd}`);
  if (uoc > o.tranUsd) throw new Error(`uoc vuot tran: ${uoc.toFixed(4)} > ${o.tranUsd} — khong goi`);
  const kq = new Map<number, KetQuaThe>();
  let chi = 0;
  for (const t of the) {
    const goi = new Map<string, KetQuaGoi>();
    for (const n of kh.nhom) {
      if (chi + uocThe(t, n.gia) > o.tranUsd) throw new Error(`cham tran ${o.tranUsd} USD giua luot (da chi ${chi.toFixed(4)})`);
      const k = await hoiGop({ gateway: n.gateway, gia: n.gia, the: t, taoModel: o.taoModel, recordCall: async () => {} });
      chi += k.usd;
      goi.set(n.gateway, k);
      if (o.so) appendFileSync(o.so, JSON.stringify({ luc: new Date().toISOString(), nhan: `pl30-cham-${o.split ?? "all"}`, model: n.gateway, item_id: t.item_id, usd: k.usd, usd_gateway: k.usd_gateway, vao: k.vao, ra: k.ra }) + "\n");
    }
    const ks = [...goi.values()];
    kq.set(t.item_id!, { gop: gop(goi, kh, t.text), usd: ks.reduce((s, k) => s + k.usd, 0), ms: ks.reduce((s, k) => s + k.ms, 0), json_hong: ks.filter((k) => !k.json_ok).length });
  }
  const giao = FIELDS.filter((f) => !kh.nguoi.includes(f));
  const items = the.map((t) => t.item_id!);
  const bang = bangCham(items, vang, kq, giao);
  const bo = bangCham(items.filter((i) => i !== 9991), vang, kq, giao);
  const tomTat: TomTat = {
    lat: o.lat, split: o.split ?? "all", so_the: the.length, model: kh.nhom.map((n) => n.gateway), prompt_version: PROMPT_VERSION,
    prompt_sha: PROMPT_SHA, cau_hinh_sha: cau.sha, ma_sha: maSha(), dung: bang.dung, mau_so: bang.mau_so,
    dung_gop: bang.mau_so ? bang.dung / bang.mau_so : 0, dung_gop_bo_9991: items.includes(9991) && bo.mau_so ? bo.dung / bo.mau_so : null,
    usd_the: bang.usd_the, json_hong: bang.json_hong, giay_trung_vi: bang.giay_trung_vi,
    anh_thieu: Object.fromEntries(the.filter((t) => t.anh_thieu).map((t) => [String(t.item_id), t.anh_thieu])), o: bang.o, luc: new Date().toISOString(),
  };
  return { bang, tomTat };
}

/** Bảng ô × số đo dạng markdown (chỉ số). */
export function bangMd(t: TomTat): string {
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "–");
  const L = [
    `# Chấm đọc gộp S03 — ${t.lat} ${t.split} (${t.prompt_version})`, "",
    `${t.so_the} thẻ · model ${t.model.join(", ")} · đúng gộp ${t.dung}/${t.mau_so} = ${(100 * t.dung_gop).toFixed(1)}% · ${t.usd_the.toFixed(5)} USD/thẻ · JSON hỏng ${t.json_hong} · ${t.giay_trung_vi.toFixed(1)} giây trung vị`, "",
    "| Ô | Đúng (mọi thẻ) | Có nhãn | Phủ | Đọc thừa |", "|---|---|---|---|---|",
  ];
  for (const f of FIELDS) {
    const d = t.o[f];
    if (d) L.push(`| ${f} | ${d.dung}/${d.n} (${pct(d.dung, d.n)}) | ${d.co_nhan} | ${pct(d.phu, d.co_nhan)} | ${d.thua}/${d.n - d.co_nhan} |`);
  }
  return L.join("\n") + "\n";
}

const CO = new Set(["--lat", "--split", "--tran-usd", "--cau-hinh", "--ra", "--tom-tat", "--so"]);

export async function lenhCham(argv: string[]): Promise<number> {
  const m = new Map<string, string>();
  try {
    for (let i = 0; i < argv.length; i++) {
      if (!CO.has(argv[i])) throw new Error(`cờ không nhận: ${argv[i]}`);
      m.set(argv[i], argv[++i] ?? "");
    }
    const split = m.get("--split");
    if (split !== undefined && split !== "dev" && split !== "test") throw new Error("--split phải là dev hoặc test");
    if (!Number.isFinite(Number(m.get("--tran-usd")))) throw new Error("cần --tran-usd <số USD>");
    napCauHinh(m.get("--cau-hinh"));
  } catch (e) {
    console.error(`doc-gop-s03 cham: ${(e as Error).message}`);
    return 2;
  }
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("doc-gop-s03 cham: thiếu AI_GATEWAY_API_KEY — nạp .env bằng --env-file; chưa gọi model lần nào");
    return 2;
  }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("BEGIN READ ONLY");
    const { tomTat } = await chamLuot({
      client: c, lat: m.get("--lat") ?? "s03-theo-nhom", split: m.get("--split") as "dev" | "test" | undefined, cauHinh: m.get("--cau-hinh"),
      tranUsd: Number(m.get("--tran-usd")), so: m.get("--so"),
    });
    const md = bangMd(tomTat);
    console.log(md);
    if (m.get("--ra")) writeFileSync(m.get("--ra")!, md);
    if (m.get("--tom-tat")) writeFileSync(m.get("--tom-tat")!, JSON.stringify(tomTat, null, 1) + "\n");
    return 0;
  } catch (e) {
    console.error(`doc-gop-s03 cham: ${(e as Error).message}`);
    return 1;
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
