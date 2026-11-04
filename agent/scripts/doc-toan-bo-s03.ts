// doc-toan-bo-s03.ts — hồ sơ s03-llm-doc-toan-bo: Haiku đọc mọi tin S03 có chữ, máy tự điền «căn hộ» theo luật trích dẫn, bất đồng lên
// /ops/review. Giá, diện tích chỉ đối chiếu. Logic ở src/enrich/doc-toan-bo.ts — script này chỉ nối CLI + DB. Tốn tiền: lượt thật
// chạy sau khi Mạnh ký hồ sơ, pg_dump trước. Khoá cloud: AI_GATEWAY_API_KEY (người chạy nạp .env).
//
// Chạy:
//   npx tsx scripts/doc-toan-bo-s03.ts --xu-lai-trich [--thu]        # xét lại đề xuất bỏ vì khong-tu-khoa bằng nhãn đã đọc, không gọi model
//   npx tsx scripts/doc-toan-bo-s03.ts --mau 383 --nhan <tệp nhãn>   # đo độ đúng, ghi nhãn và dòng mẫu, không ghi canonical
//   npx tsx scripts/doc-toan-bo-s03.ts                               # lượt thật, cần dòng mẫu đạt; trần 3 USD, 500 thẻ mới
//   npx tsx scripts/doc-toan-bo-s03.ts --thu                         # gọi model, không ghi dòng nào
//   npx tsx scripts/doc-toan-bo-s03.ts --dem                         # chỉ đếm, 0 USD
//   Cờ thêm: --tran-usd <số> --tran-the <số> --nguong-dung <số>
// Hoàn tác: `--dem` in các run_id; lấy id đề xuất applied của run đó rồi chạy scripts/enrich-revert.ts --ids … --actor hitl:<tên>.
// Mã thoát: 0 xong · 1 hỏng ngoài vòng · 2 cờ sai hoặc thiếu khoá · 3 xong lượt nhưng còn bài chưa đọc được · 4 dừng vì trần · 5 mẫu dưới ngưỡng · 6 chưa có mẫu đạt.
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import type { LanguageModel } from "ai";

import { resetContextCache, resolveContext } from "../src/agents/context-resolver.js";
import type { Nhan } from "../src/agents/nhan-bac-s03.js";
import { chayLuot, CO_DO_USD_NGAY, coMauDat, demLuot, docTepNhan, doMau, LUAT_VERSION, NGUONG_DUNG_MAC_DINH, PROMPT_VERSION, xuLaiTrich } from "../src/enrich/doc-toan-bo.js";
import type { GiaoDich, ResolveFn } from "../src/enrich/run.js";

export const TRAN_USD_MAC_DINH = 3;
export const TRAN_THE_MAC_DINH = 500;

export type Co = { tranUsd: number; tranThe: number; thu: boolean; dem: boolean; xuLai: boolean; mau: number | null; nhan: string | null; nguong: number };

const CO_BAT_TAT = new Set(["--thu", "--dem", "--xu-lai-trich"]);
const CO_CO_GIA_TRI = new Set(["--tran-usd", "--tran-the", "--nguong-dung", "--mau", "--nhan"]);

/**
 * Ném lỗi khi cờ sai. Cờ lạ, cờ lặp, cờ thiếu giá trị đều bị từ chối: gõ nhầm --thu không được thành lượt thật tốn tiền.
 * Không có cờ đổi model: lượt này là Haiku (Hỏi-2).
 */
export function docCo(argv: string[]): Co {
  const giaTri = new Map<string, string>();
  const daGap = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!CO_BAT_TAT.has(a) && !CO_CO_GIA_TRI.has(a)) throw new Error(`doc-toan-bo-s03: cờ không biết: ${a}`);
    if (daGap.has(a)) throw new Error(`doc-toan-bo-s03: cờ lặp: ${a}`);
    daGap.add(a);
    if (CO_CO_GIA_TRI.has(a)) {
      const v = argv[++i];
      if (v === undefined || v === "" || v.startsWith("--")) throw new Error(`doc-toan-bo-s03: ${a} thiếu giá trị`);
      giaTri.set(a, v);
    }
  }
  const lay = (k: string) => giaTri.get(`--${k}`);
  const tranUsd = Number(lay("tran-usd") ?? TRAN_USD_MAC_DINH);
  const tranThe = Number(lay("tran-the") ?? TRAN_THE_MAC_DINH);
  const nguong = Number(lay("nguong-dung") ?? NGUONG_DUNG_MAC_DINH);
  const mauRaw = lay("mau");
  const mau = mauRaw === undefined ? null : Number(mauRaw);
  const nhan = lay("nhan") ?? null;
  if (!Number.isFinite(tranUsd) || tranUsd < 0) throw new Error("doc-toan-bo-s03: --tran-usd phải là số không âm");
  if (!Number.isInteger(tranThe) || tranThe < 0) throw new Error("doc-toan-bo-s03: --tran-the phải là số nguyên không âm");
  if (!Number.isFinite(nguong) || nguong <= 0 || nguong > 1) throw new Error("doc-toan-bo-s03: --nguong-dung phải trong (0, 1]");
  if (mau !== null && (!Number.isInteger(mau) || mau <= 0)) throw new Error("doc-toan-bo-s03: --mau phải là số nguyên dương");
  if ((mau === null) !== (nhan === null)) throw new Error("doc-toan-bo-s03: --mau và --nhan phải đi cùng nhau");
  if (daGap.has("--xu-lai-trich") && (daGap.has("--dem") || mau !== null)) throw new Error("doc-toan-bo-s03: --xu-lai-trich không đi cùng --dem, --mau");
  return { tranUsd, tranThe, thu: daGap.has("--thu"), dem: daGap.has("--dem"), xuLai: daGap.has("--xu-lai-trich"), mau, nhan, nguong };
}

export type Noi = {
  client: pg.Client;
  khoa: string | undefined;
  resolve: ResolveFn;
  wilson: (dung: number, n: number) => number | null;
  log: (dong: string) => void;
  giaoDich?: GiaoDich;
  hoi?: (chuDaGat: string) => Promise<Nhan>;
  languageModel?: LanguageModel;
  cam?: string[];
  chiTin?: string[];
};

/** Trả mã thoát; kiểm khoá và dòng mẫu TRƯỚC lời gọi đầu. */
export async function chayLenh(co: Co, n: Noi): Promise<number> {
  const c = n.client;
  if (co.dem) {
    const d = await demLuot(c);
    const pt = (x: number) => (d.mau ? `${((x / d.mau) * 100).toFixed(1)}%` : "n/a");
    n.log(`mẫu (tin S03 sống): ${d.mau} · đã đọc: ${d.daDoc} nhãn · thẻ chờ: ${d.theCho}`);
    n.log(`có đề xuất: ${d.coDeXuat} (${pt(d.coDeXuat)}) · kể skipped: ${d.coDeXuatKeSkipped} (${pt(d.coDeXuatKeSkipped)}) · AI đã áp: ${d.aiDaAp} (${pt(d.aiDaAp)})`);
    n.log(`cuộc gọi: ${d.goiOk}/${d.goi} thành công${d.goi ? ` (${((d.goiOk / d.goi) * 100).toFixed(1)}%)` : ""}`);
    for (const x of d.chiTheoNgay) n.log(`chi ${x.ngay}: ${x.usd.toFixed(4)} USD${x.do ? ` ← CỜ ĐỎ quá ${CO_DO_USD_NGAY} USD/ngày` : ""}`);
    if (d.runIds.length) n.log(`run_id để hoàn tác: ${d.runIds.join(", ")}`);
    return 0;
  }
  if (co.xuLai) {
    // Không gọi model nên không cần khoá; --thu chỉ đọc nên không qua cổng mẫu.
    if (!co.thu && !(await coMauDat(c))) {
      n.log(`doc-toan-bo-s03: từ chối xử lại — chưa có mẫu đạt ngưỡng cho prompt ${PROMPT_VERSION}, luật ${LUAT_VERSION}; chạy --mau trước`);
      return 6;
    }
    const kq = await xuLaiTrich({ client: c, runId: `doc-toan-bo-xu-lai-${new Date().toISOString()}`, thu: co.thu, cam: n.cam, chiTin: n.chiTin, resolve: n.resolve, giaoDich: n.giaoDich });
    const d = await demLuot(c);
    const sau = d.aiDaAp + (co.thu ? kq.dat : 0);
    n.log(`${co.thu ? "[--thu, không ghi] " : ""}xét ${kq.xet} · qua luật ${kq.dat} · đã áp ${kq.daAp} · giữ nguyên ${JSON.stringify(kq.giuNguyen)} · lỗi ghi ${kq.loiGhi.length}`);
    n.log(`AI đã áp ${co.thu ? "dự kiến " : ""}${sau}/${d.mau}${d.mau ? ` (${((sau / d.mau) * 100).toFixed(1)}%)` : ""}`);
    return kq.loiGhi.length > 0 ? 1 : 0;
  }
  if (!n.khoa && !n.hoi && !n.languageModel) {
    n.log("doc-toan-bo-s03: thiếu AI_GATEWAY_API_KEY — nạp .env rồi chạy lại; chưa gọi model lần nào");
    return 2;
  }
  const runId = `doc-toan-bo-${new Date().toISOString()}`;
  if (co.mau !== null) {
    const kq = await doMau({
      client: c, runId, nhan: docTepNhan(await readFile(co.nhan!, "utf8")), n: co.mau, nguong: co.nguong, tranUsd: co.tranUsd, thu: co.thu,
      cam: n.cam, hoi: n.hoi, languageModel: n.languageModel, resolve: n.resolve, wilson: n.wilson,
    });
    const cd = kq.canDuoi === null ? "n/a" : kq.canDuoi.toFixed(3);
    n.log(`mẫu ${kq.n} bài · máy áp ${kq.ap} (${(kq.tiLeAp * 100).toFixed(1)}%) · đúng ${kq.dung} · cận dưới Wilson ${cd} · thẻ dự kiến ${kq.the} · chi ${kq.usd.toFixed(4)} USD · thiếu chữ ${kq.thieuChu}`);
    n.log(`nhánh số phòng: máy áp ${kq.apMoi} · đúng ${kq.dungMoi} · cận dưới Wilson ${kq.canDuoiMoi === null ? "n/a" : kq.canDuoiMoi.toFixed(3)} · luật ${LUAT_VERSION}`);
    if (kq.chuaDoc > 0) n.log(`chưa đọc được ${kq.chuaDoc} bài, không tính vào phép đo; chạy lại để đọc lại`);
    n.log(kq.dat ? `ĐẠT ngưỡng ${co.nguong}, prompt ${PROMPT_VERSION}, luật ${LUAT_VERSION}` : `DƯỚI NGƯỠNG ${co.nguong} (toàn mẫu ít nhất 100 ca, nhánh số phòng ít nhất 30 ca): lượt thật sẽ từ chối chạy`);
    return kq.dat ? 0 : 5;
  }
  if (!co.thu && !(await coMauDat(c))) {
    n.log(`doc-toan-bo-s03: từ chối chạy thật — chưa có mẫu đạt ngưỡng cho prompt ${PROMPT_VERSION}, luật ${LUAT_VERSION}; chạy --mau trước`);
    return 6;
  }
  const kq = await chayLuot({
    client: c, runId, tranUsd: co.tranUsd, tranThe: co.tranThe, thu: co.thu, cam: n.cam, chiTin: n.chiTin,
    hoi: n.hoi, languageModel: n.languageModel, resolve: n.resolve, giaoDich: n.giaoDich,
  });
  n.log(`${co.thu ? "[--thu, không ghi] " : ""}tin có chữ ${kq.tin} · không chữ ${kq.khongChu} · đã đọc ${kq.daDoc} · còn lại ${kq.conLai} · chi ${kq.tongUsd.toFixed(4)} USD`);
  n.log(`đề xuất mới ${kq.deXuat} · đã áp ${kq.daAp} · thẻ mới ${kq.theMoi} · lỗi gọi ${JSON.stringify(kq.loi)} · lỗi ghi ${kq.loiGhi.length}`);
  if (kq.tinChoThe > 0) n.log(`dừng tạo thẻ: chạm trần ${co.tranThe} thẻ mới, ${kq.tinChoThe} tin để lượt sau`);
  if (kq.dungTran) { n.log(`dừng: bài kế sẽ vượt trần ${co.tranUsd} USD; chạy lại để đọc tiếp ${kq.conLai} bài`); return 4; }
  if (kq.loiGhi.length > 0) return 1;
  if (kq.conLai > 0) { n.log(`chưa xong: ${kq.conLai} bài chưa đọc được; chạy lại để đọc lại`); return 3; }
  return 0;
}

async function main() {
  let co: Co;
  try { co = docCo(process.argv.slice(2)); } catch (e) { console.error((e as Error).message); process.exit(2); }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", application_name: "doc-toan-bo-s03" });
  try { await c.connect(); } catch (e) {
    console.error(`doc-toan-bo-s03: không nối được DB (${(e as { code?: string }).code ?? "lỗi"})`);
    process.exit(1);
  }
  resetContextCache();
  // Mỗi tin một giao dịch: lỗi ở một tin chỉ lui lại tin đó.
  const giaoDich: GiaoDich = async (fn) => {
    await c.query("BEGIN");
    try { const r = await fn(); await c.query("COMMIT"); return r; } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; }
  };
  // eval-classify.mjs kéo `pg` của pipeline, job CI agent không có — nạp lúc chạy.
  // @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
  const { wilsonDuoi } = await import("../../pipeline/lib/eval-classify.mjs");
  try {
    process.exitCode = await chayLenh(co, { client: c, khoa: process.env.AI_GATEWAY_API_KEY, resolve: resolveContext, wilson: wilsonDuoi, log: console.log, giaoDich });
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e instanceof Error ? e.name : e); process.exit(1); });
