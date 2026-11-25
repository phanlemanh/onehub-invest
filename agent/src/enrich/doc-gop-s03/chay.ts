// chay.ts — PL30: một lượt đọc gộp trên một tập bài có trần tiền, ghi nhãn bạc (silver_labels) + sổ cuộc gọi (ai_calls).
// Tập chỉ là một lát nhãn (--lat, --split) hoặc danh sách bài (--post): không có đường chạy toàn S03 (Hỏi-1 — bật chạy
// hằng ngày là lời riêng của Mạnh). Luật 7: không ghi bảng nào khác. Ghi theo cùng luật với dtb-s03-v1: nhãn JSON hỏng
// được đọc lại, nhãn tốt giữ nguyên, chi phí cộng dồn.
import { SQL_GHI_DOC } from "../doc-toan-bo.js";
import { KIND as KIND_SINH, LISTING_INTENT } from "../../vocab.generated.js";
import type { RecordCall } from "../../runtime/ai-call-log.js";
import { duongDung, keHoach, KHOA_DUONG, napCauHinh, type Duong, type KeHoach, type NhomGoi } from "./cau-hinh.js";
import { hoiGop, kiemTrich, type KetQuaGoi, type TaoAnthropic, type TaoModel } from "./doc.js";
import { laLopDung } from "../../runtime/loi-nha-cung-cap.js";
import { FIELDS, type Field } from "./o.js";
import { chuNguoiDung, HUONG_DAN, PROMPT_SHA, PROMPT_VERSION } from "./prompt.js";
import { docTheTheoLat, docTheTheoPost, type Q, type The } from "./the.js";

export type CoChay = {
  lat?: string; split?: "dev" | "test"; post?: string[]; tranUsd: number; cauHinh?: string; runId?: string; thu?: boolean;
  /** HT6: số lời gọi cùng lúc (mặc định 1 — lệnh chay giữ tuần tự). */
  songSong?: number;
  /** HT6: không phát lời mới từ mốc này (lời đang bay chạy xong). */
  hetGio?: Date | null;
};
export type TomTatChay = {
  the: number; goi: number; loi: number; hong: number; lopLoi: string[]; ghi: number; usd: number; conLai: number; dungTran: boolean; bo: number;
  /** goi-thang-anthropic: lượt dừng sớm vì lớp lỗi làm mọi lời gọi sau hỏng (hết tiền, khoá sai); `loiDung` là chuỗi ai_calls.loi. */
  dung: "het-tien" | "khoa" | null; loiDung: string | null; duongDung: string | null;
  /** Dòng `chuyen-duong` mỗi lần một model lùi sang đường kế (tu_lui): thiếu khoá lúc đầu lượt hay gặp lớp dừng giữa lượt. */
  chuyenDuong: string[];
  /** HT6: lượt ngừng phát vì tới mốc hết giờ; `bayMax` = số lời đang bay cùng lúc lớn nhất đã gặp. */
  hetGio: boolean; bayMax: number;
};
/** Dòng log khi lùi đường — để biết credit một đường đã cạn. */
export const dongChuyenDuong = (gateway: string, tu: Duong, sang: Duong, lyDo: string): string =>
  `JOB WARN [doc-gop-s03] chuyen-duong: ${gateway} ${tu} -> ${sang} (${lyDo})`;
/** Dòng stderr cho cảnh báo bám vào khi lượt dừng sớm. */
export const dongDung = (k: Pick<TomTatChay, "dung" | "loiDung" | "duongDung">): string => {
  const [, http = "-", kieu = "-"] = (k.loiDung ?? "").split(":");
  return `JOB FAIL [doc-gop-s03] ${k.dung}: ${k.duongDung ?? "-"} ${http} ${kieu}`;
};

const CO = new Set(["--lat", "--split", "--post", "--tran-usd", "--cau-hinh", "--run-id", "--thu"]);

/** Cờ của lệnh chay; cờ lạ (kể cả --toan-bo, --all) ném lỗi gọi tên cờ. */
export function docCo(argv: string[]): CoChay {
  const m = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`đối số lạ: ${a}`);
    if (!CO.has(a)) throw new Error(`cờ không nhận: ${a} (chỉ ${[...CO].join(" ")}; không có đường chạy toàn S03)`);
    if (a === "--thu") m.set(a, "1");
    else m.set(a, argv[++i] ?? "");
  }
  const lat = m.get("--lat"), post = m.get("--post");
  if (!!lat === !!post) throw new Error("cần đúng một trong --lat hoặc --post");
  const split = m.get("--split");
  if (split !== undefined && split !== "dev" && split !== "test") throw new Error(`--split phải là dev hoặc test, nhận ${split}`);
  const tranUsd = Number(m.get("--tran-usd"));
  if (!m.has("--tran-usd") || !Number.isFinite(tranUsd) || tranUsd < 0) throw new Error("cần --tran-usd <số USD ≥ 0>");
  return {
    lat, split: split as CoChay["split"], post: post ? post.split(",").filter(Boolean) : undefined, tranUsd,
    cauHinh: m.get("--cau-hinh"), runId: m.get("--run-id"), thu: m.has("--thu"),
  };
}

/** Ước một lời gọi (USD): chữ ~3,2 ký tự/token, ảnh ~1.600 token, ra ~1.500 token (đo 07/11). Chỉ để chặn trần trước. */
export function uocThe(t: The, gia: { vao: number; ra: number }): number {
  const vao = (HUONG_DAN.length + chuNguoiDung(t).length) / 3.2 + t.anh.length * 1600;
  return (vao * gia.vao + 1500 * gia.ra) / 1e6;
}

/** Sổ cuộc gọi trên cùng kết nối (để lượt chạy trong giao dịch của người gọi). Chỉ số và tên lớp lỗi. */
export const ghiAiCallQua = (c: Q): RecordCall => async (r) => {
  await c.query(
    `INSERT INTO ai_calls (khach, viec, model, input_tokens, output_tokens, latency_ms, ok, loi, trace) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [r.khach ?? "pipeline", r.viec, r.model, r.inputTokens, r.outputTokens, Math.max(0, Math.round(r.latencyMs)), r.ok, r.loi, r.trace]);
};

// Mã hợp lệ lấy từ sổ chung (pipeline/mappings.yaml → vocab.generated); «unknown» là chỗ máy tự điền, model không được trả.
const Y_DINH = new Set<string>(Object.values(LISTING_INTENT).filter((v) => v !== LISTING_INTENT.unknown));
const KIND = new Set<string>(Object.values(KIND_SINH));

/** Tham số SQL_GHI_DOC cho một lời gọi (một model, một bài). */
export function dongNhan(t: The, n: NhomGoi, k: KetQuaGoi, cau: { sha: string }, runId: string): unknown[] {
  const o = Object.fromEntries(FIELDS.flatMap((f) => (k.json?.[f] ? [[f, kiemTrich(k.json[f]!, t.text)]] : [])));
  const giao = (f: Field) => n.o.includes(f);
  const yd = giao("listing_intent") ? o.listing_intent : undefined;
  const intent = yd && typeof yd.v === "string" && Y_DINH.has(yd.v) ? yd.v : "unknown";
  const kv = giao("kind") ? o.kind?.v : undefined;
  const probabilities = {
    nguon: "doc-gop", duong: k.duong ?? n.duong[0], cau_hinh_sha: cau.sha, prompt_sha: PROMPT_SHA, o_duoc_giao: n.o, o,
    so_anh: t.anh.length, anh_thieu: t.anh_thieu, token_vao: k.vao, token_ra: k.ra, finish: k.finish ?? null,
  };
  return [
    "S03", t.post_id, t.text_hash, `gateway:${n.gateway}`, PROMPT_VERSION, intent,
    typeof kv === "string" && KIND.has(kv) ? kv : null, null, probabilities,
    yd?.trich || null, yd ? yd.trich_ok : null, k.json_ok, k.json_ok ? null : k.error_kind, k.ms, k.usd, runId,
  ];
}

/**
 * Một lượt đọc gộp. Hai tuỳ chọn của PL34 `doc-gop-hang-ngay` (không truyền thì y như `chay` của PL30):
 * - `doDaDoc`: chạy câu dò «đã có nhãn» cả khi người gọi truyền sẵn `the`.
 * - `goiDenTran`: không từ chối cả lượt khi tổng ước vượt trần; trước mỗi lời gọi, ước lời ấy bằng max(ước công thức, tiền
 *   thật lớn nhất đã gặp trong lượt) cộng tiền thật đã chi, vượt trần thì dừng.
 */
export async function chayLuot(o: {
  client: Q; co: CoChay; taoModel?: TaoModel; taoAnthropic?: TaoAnthropic; recordCall?: RecordCall; the?: The[];
  uoc?: (t: The, gia: { vao: number; ra: number }) => number; log?: (s: string) => void;
  doDaDoc?: boolean; goiDenTran?: boolean; env?: NodeJS.ProcessEnv;
  /** HT6: số lời cùng lúc (thắng co.songSong); đồng hồ và nhịp 429 tiêm được cho test. */
  songSong?: number; dongHo?: () => number; nhip?: { tamDungMs?: number; tangLaiMs?: number };
}): Promise<TomTatChay> {
  const log = o.log ?? console.log;
  const cau = napCauHinh(o.co.cauHinh); // bảng sai → ném trước mọi lời gọi
  const kh: KeHoach = keHoach(cau.cauHinh);
  const runId = o.co.runId ?? `doc-gop-${new Date().toISOString()}`;
  const uoc = o.uoc ?? uocThe;
  const tatCa = o.the ?? (o.co.lat ? await docTheTheoLat(o.client, o.co.lat, o.co.split) : await docTheTheoPost(o.client, o.co.post ?? []));
  const the = tatCa.filter((t) => t.text.trim() || t.anh.length);
  const kq: TomTatChay = { the: the.length, goi: 0, loi: 0, hong: 0, lopLoi: [], ghi: 0, usd: 0, conLai: 0, dungTran: false, bo: tatCa.length - the.length, dung: null, loiDung: null, duongDung: null, chuyenDuong: [], hetGio: false, bayMax: 0 };
  if (kq.bo) log(`bo ${kq.bo} bai khong chu khong anh`);

  // Đã có nhãn đọc được cùng (bài, chữ, model, prompt) → không gọi lại.
  const da = new Set<string>();
  if (!o.the || o.doDaDoc) {
    const { rows } = await o.client.query(
      `SELECT post_id, text_hash, model FROM silver_labels WHERE source_code = 'S03' AND prompt_version = $1 AND json_ok AND post_id = ANY ($2)`,
      [PROMPT_VERSION, the.map((t) => t.post_id)]);
    for (const r of rows as { post_id: string; text_hash: string; model: string }[]) da.add(`${r.post_id}|${r.text_hash}|${r.model}`);
  }
  const viec = the.flatMap((t) => kh.nhom.filter((n) => !da.has(`${t.post_id}|${t.text_hash}|gateway:${n.gateway}`)).map((n) => ({ t, n })));
  const uocTong = viec.reduce((s, v) => s + uoc(v.t, v.n.gia), 0);
  log(`chay ${viec.length} loi goi tren ${the.length} bai, prompt ${PROMPT_VERSION}, bang ${cau.sha.slice(0, 12)}: uoc ${uocTong.toFixed(4)} USD / tran ${o.co.tranUsd}`);
  if (!o.goiDenTran && uocTong > o.co.tranUsd && viec.length) {
    log(`uoc vuot tran: ${uocTong.toFixed(4)} > ${o.co.tranUsd} — khong goi`);
    return { ...kq, conLai: viec.length, dungTran: true };
  }
  const record = o.recordCall ?? ghiAiCallQua(o.client);
  // Đường còn dùng của từng model. Không tự lùi: đúng đường đầu (lệnh đã kiểm khoá). Tự lùi: bỏ đường thiếu khoá (ghi chuyen-duong);
  // không đường nào có khoá thì giữ đường đầu để lời gọi tự hỏng và được báo như cũ.
  const env = o.env ?? process.env;
  const con = new Map<string, Duong[]>();
  for (const n of kh.nhom) {
    const dung = kh.tuLui ? duongDung(n, true, env) : [n.duong[0]];
    if (kh.tuLui && dung.length && dung[0] !== n.duong[0]) {
      const d = dongChuyenDuong(n.gateway, n.duong[0], dung[0], `thieu-khoa ${KHOA_DUONG[n.duong[0]]}`);
      kq.chuyenDuong.push(d);
      log(d);
    }
    con.set(n.gateway, dung.length ? dung : [n.duong[0]]);
  }
  // HT6 doc-gop-song-song-va-luot-bu: hàng đợi + tối đa `songSong` lời đang bay. Trần tiền giữ chỗ TRƯỚC khi phát (đã chi + đang
  // giữ + ước lời này ≤ trần) nên song song không vượt trần hơn bản tuần tự; với 1 lời thì y hệt vòng tuần tự cũ. Lớp dừng, hết giờ:
  // ngừng phát, chờ lời đang bay. 429 (han-muc): hạ một lời cùng lúc, tạm ngừng phát, yên một quãng thì tăng lại.
  const toiDa = Math.max(1, Math.floor(o.songSong ?? o.co.songSong ?? 1));
  const hetGio = o.co.hetGio ?? null;
  const bayGio = o.dongHo ?? Date.now;
  const tamDungMs = o.nhip?.tamDungMs ?? 30_000;
  const tangLaiMs = o.nhip?.tangLaiMs ?? 60_000;
  let datNhat = 0; // tiền thật lớn nhất của một lời gọi trong lượt (goiDenTran)
  let tro = 0; // chỉ số kế trong viec
  const lai: number[] = []; // việc xếp lại (lùi đường) — phát trước
  let giu = 0, dangBay = 0, gioiHan = toiDa, tamDungDen = 0, moc429 = 0, ngung = false;
  let loiNem: unknown = null; // lỗi ghi DB giữa lượt: ngừng phát rồi ném lại như bản tuần tự
  const conHang = () => viec.length - tro + lai.length;
  await new Promise<void>((xong) => {
    let henGio: NodeJS.Timeout | null = null;
    const ketThuc = () => { if (dangBay === 0 && !henGio) xong(); };
    const henPhat = (ms: number) => { if (!henGio) henGio = setTimeout(() => { henGio = null; phat(); }, Math.max(1, ms)); };
    const xuLy = async (i: number, k: Awaited<ReturnType<typeof hoiGop>>, ds: Duong[]) => {
      const { t, n } = viec[i];
      kq.goi++;
      kq.usd += k.usd;
      datNhat = Math.max(datNhat, k.usd);
      if (k.error_kind === "json-hong") kq.hong++;
      if (k.error_kind && k.error_kind !== "json-hong") { // lỗi gọi: không lưu, lượt sau gọi lại; đếm để lệnh báo (S4-r1 t6)
        kq.loi++;
        if (!kq.lopLoi.includes(k.error_kind)) kq.lopLoi.push(k.error_kind);
        log(`loi goi ${n.gateway} bai ${t.post_id}: ${k.error_kind}`);
        if (laLopDung(k.lop) && kh.tuLui && (ds.length > 1 || (k.duong && ds[0] !== k.duong))) {
          // tự lùi: đường này cạn tiền / khoá sai → thử lại bài này ở đường kế. Chỉ lời đầu tiên gặp lỗi chuyển đường (một dòng).
          if (ds[0] === k.duong) {
            const d = dongChuyenDuong(n.gateway, ds[0], ds[1], k.error_kind);
            kq.chuyenDuong.push(d);
            log(d);
            ds.shift();
          }
          lai.push(i);
          return;
        }
        if (laLopDung(k.lop)) { // hết tiền / khoá sai, không còn đường: mọi lời gọi sau cũng hỏng — ngừng phát, không bắn tiếp
          if (!kq.dung) {
            Object.assign(kq, { dung: k.lop, loiDung: k.error_kind, duongDung: k.duong ?? ds[0] });
            log(`dung som: ${k.lop} (${k.error_kind})`);
          }
          ngung = true;
          return;
        }
        if (k.lop === "han-muc") { // quá nhịp: SDK đã thử lại; hạ nhịp và tạm ngừng phát
          gioiHan = Math.max(1, gioiHan - 1);
          tamDungDen = bayGio() + tamDungMs;
          moc429 = bayGio();
          log(`han-muc: ha con ${gioiHan} loi cung luc, tam ngung ${Math.round(tamDungMs / 1000)}s`);
        }
        return;
      }
      if (!o.co.thu) kq.ghi += (await o.client.query(SQL_GHI_DOC, dongNhan(t, n, k, cau, runId))).rowCount ?? 0;
    };
    const phat = () => {
      while (!ngung && !kq.dung && dangBay < gioiHan) {
        const bay = bayGio();
        if (gioiHan < toiDa && bay - moc429 >= tangLaiMs) { gioiHan++; moc429 = bay; log(`han-muc: tang lai ${gioiHan} loi cung luc`); continue; }
        if (bay < tamDungDen) { henPhat(tamDungDen - bay); break; }
        if (!conHang()) break;
        if (hetGio && bay >= hetGio.getTime()) {
          if (!kq.hetGio) log(`het gio ${hetGio.toISOString()}: ngung phat, con ${conHang()} loi goi`);
          kq.hetGio = true;
          ngung = true;
          break;
        }
        const i = lai.length ? lai[0] : tro;
        const { t, n } = viec[i];
        const uocLoi = o.goiDenTran ? Math.max(uoc(t, n.gia), datNhat) : uoc(t, n.gia);
        if (kq.usd + giu + uocLoi > o.co.tranUsd) {
          if (dangBay > 0) break; // chờ lời đang bay xong — tiền thật có thể nhỏ hơn phần giữ
          kq.dungTran = true;
          ngung = true;
          log(`cham tran ${o.co.tranUsd} USD: da chi ${kq.usd.toFixed(4)}, con lai ${conHang()}`);
          break;
        }
        if (lai.length) lai.shift(); else tro++;
        const ds = con.get(n.gateway)!;
        giu += uocLoi;
        dangBay++;
        kq.bayMax = Math.max(kq.bayMax, dangBay);
        hoiGop({ gateway: n.gateway, duong: ds[0], gia: n.gia, the: t, taoModel: o.taoModel, taoAnthropic: o.taoAnthropic, recordCall: record, trace: runId })
          .then((k) => xuLy(i, k, ds))
          .catch((e) => { loiNem ??= e; ngung = true; })
          .finally(() => { giu -= uocLoi; dangBay--; phat(); ketThuc(); });
      }
      ketThuc();
    };
    phat();
  });
  if (loiNem) throw loiNem;
  kq.conLai = conHang();
  log(`xong: ${kq.goi} loi goi (${kq.loi} loi goi, ${kq.hong} json hong), ${kq.ghi} dong nhan, ${kq.usd.toFixed(4)} USD${kq.dungTran ? ", dung vi tran" : ""}${kq.hetGio ? ", dung vi het gio" : ""}, toi da ${kq.bayMax} loi cung luc`);
  return kq;
}
