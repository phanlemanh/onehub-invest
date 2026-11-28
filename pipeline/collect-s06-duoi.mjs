// collect-s06-duoi.mjs — «thu đuôi» S06 (claudedp-2411-6): mốc → tin mới → mốc mới, dừng khi gặp tin đã có.
//
// Khác collect-chotot.mjs (lượt quét đủ, 2 lần/ngày, tới 210 trang mỗi mục): ở đây mỗi nhịp chỉ lấy trang 1–3 của
// MỘT vùng × mục, theo đúng thứ tự nguồn (mới nhất trước), dừng ngay khi gặp tin máy đã có.
// «Đã có» = list_id nằm trong mốc (id đuôi đã thấy) hoặc trong stg_chotot_ads. KHÔNG lấy list_time làm mốc: đo trên raw
// 24/11 (snapshot lượt 05:30, 0 lời gọi mạng) cho thấy 59% mục ở đầu danh sách là tin cũ được đẩy lại — list_time đổi,
// list_id giữ — nên giờ không nói được mục nào mới đăng.
//
// Hai luật dừng (đo raw 24/11: danh sách sắp không tăng theo list_time trên cả 4 mục — 0 chỗ tăng / 30.673 mục;
// giờ cao điểm 602 mục/giờ ≈ 50 mục mỗi 5 phút = hết một trang):
//   trang-toan-da-co (mặc định) — lấy trang kế khi trang vừa lấy còn tin mới; dừng ở trang đầu tiên không còn tin mới.
//       Chịu được tin đẩy lại xen giữa tin mới: trang 1 có tin đã có vẫn xuống trang 2 nếu trang 1 còn tin mới.
//   gap-da-co — dừng ở trang đầu tiên chứa bất kỳ tin đã có. Rẻ nhất (một lời mỗi nhịp khi bình thường) nhưng giờ
//       cao điểm, tin mới tràn sang trang 2 sẽ bị bỏ sót. Nhật ký giữ từng mục của mọi trang để tính lại luật này.
//
// Chạy phép đo — tiến trình của phiên, KHÔNG qua launchd, không đụng scripts/chotot-daily.sh hay collect-chotot.mjs:
//   node collect-s06-duoi.mjs --vung <group_key> --muc 1000/u --goc <thư mục RIÊNG> [--nhap 5] [--thoi-gian 1440]
//   (--goc KHÔNG được là collector/ hay collector/snapshots/ — mã thoát 6; xem laKhoChuan) [--toi-da-loi 1000]
//   node collect-s06-duoi.mjs --bao-cao <thư mục>      bốn số: lời gọi/phút · tỉ lệ bắt được · độ trễ p50/p90 · bị chặn
//
// DB: CHỈ ĐỌC (BEGIN READ ONLY, có test) — cổng vòng đời nguồn + tra list_id trong stg. Không nạp, không ghi bảng nào.
// Mã thoát: 0 xong · 1 lỗi hệ thống · 3 bị chặn (403/429/trang thử thách) · 4 cổng vòng đời đóng · 5 vượt trần lời gọi.
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { docTrangThai } from "./lib/vong-doi.mjs";

export const LUAT_DUNG = Object.freeze({
  TRANG_TOAN_DA_CO: "trang-toan-da-co",
  GAP_DA_CO: "gap-da-co",
});
export const LY_DO_DUNG = Object.freeze({
  HET_TRANG: "het-trang",
  TRANG_TOAN_DA_CO: LUAT_DUNG.TRANG_TOAN_DA_CO,
  GAP_DA_CO: LUAT_DUNG.GAP_DA_CO,
  TOI_DA_TRANG: "toi-da-trang",
});
export const MA_THOAT = Object.freeze({ XONG: 0, LOI: 1, BI_CHAN: 3, CONG_DONG: 4, VUOT_TRAN_LOI: 5, GOC_SAI: 6 });

const PHUT = 60_000;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
// Địa chỉ API mặc định của nguồn S06 (cùng địa chỉ với collect-chotot.mjs). Ghi đè bằng S06_DUOI_API — biến đặt tên
// theo mã nguồn, tách khỏi biến của lượt quét đủ để môi trường test của bên đó không lừa vào đây.
const API_MAC_DINH = process.env.S06_DUOI_API ?? "https://gateway.chotot.com/v1/public/ad-listing";

// AggregateError (vd ECONNREFUSED khi DB chết) có message rỗng — in đủ code + errors (bài học 22/10 của pipeline).
const chiLoi = (e) => {
  const parts = [e?.code, e?.message].filter(Boolean);
  if (e instanceof AggregateError && e.errors?.length) parts.push(e.errors.map(String).join("; "));
  if (parts.length === 0) parts.push(e?.stack ?? String(e));
  return parts.join(" — ");
};

/** Biến payload gốc thành RawItem — y hệt khuôn collect-chotot.mjs, để import-chotot.mjs đọc đúng một khuôn. */
export function taoItemS06({ city, cg, st, region, region_v2, bayGio = () => new Date() }) {
  return (ad, page) => ({
    source: "chotot-ads",
    sourceId: `ct-${ad.list_id}`,
    kind: "ad",
    fetchedAt: bayGio().toISOString(),
    payload: ad,
    // meta mang đúng chế độ mã của vùng — `region` (tỉnh) hoặc `region_v2` (phường cũ), như collect-chotot.mjs
    meta: { city, ...(region !== undefined ? { region } : { region_v2 }), cg, st, page },
  });
}

/**
 * Một nhịp thu đuôi: lấy trang từ 1, dừng khi gặp tin đã có, trả tin mới và mốc mới.
 * Lỗi lấy trang KHÔNG ném ra: trả trong `loi` kèm nửa phần đã lấy (bị chặn ở trang 2 thì tin trang 1 vẫn giữ).
 * @param {{moc: {daCo: Iterable<number>}, layTrang: (so: number) => Promise<object[]>,
 *          trongStg: (ids: number[]) => Promise<Iterable<number>>, taoItem: (ad: object, so: number) => object,
 *          toiDaTrang?: number, luatDung?: string}} opts
 */
export async function thuDuoi({ moc, layTrang, trongStg, taoItem, toiDaTrang = 3, luatDung = LUAT_DUNG.TRANG_TOAN_DA_CO }) {
  const daCo = new Set(moc.daCo);
  const tinMoi = [];
  const trang = [];
  let lyDoDung = null;
  let loi = null;
  for (let so = 1; so <= toiDaTrang; so++) {
    let ads;
    try {
      ads = await layTrang(so);
    } catch (e) {
      loi = { thongBao: e?.message ?? String(e) };
      if (e?.dungLuot) loi.dungLuot = true;
      if (e?.vuotTran) loi.vuotTran = true;
      break;
    }
    // Theo thứ tự nguồn; bỏ mục không có list_id; id trùng trong một trang chỉ tính lần đầu
    const theoId = new Map();
    for (const ad of ads ?? []) if (ad?.list_id && !theoId.has(ad.list_id)) theoId.set(ad.list_id, ad);
    const chuaBiet = [...theoId.keys()].filter((id) => !daCo.has(id));
    const trong = chuaBiet.length > 0 ? new Set(await trongStg(chuaBiet)) : new Set();
    const daCoTrang = new Set();
    for (const [id, ad] of theoId) {
      if (daCo.has(id) || trong.has(id)) {
        daCoTrang.add(id);
        continue;
      }
      daCo.add(id); // id đuôi đã thấy — nhịp sau không nhắc lại, dù lượt nạp chưa đưa vào stg
      tinMoi.push(taoItem(ad, so));
    }
    const soMoi = theoId.size - daCoTrang.size;
    trang.push({ so, soTin: theoId.size, soDaCo: daCoTrang.size, soMoi, daCo: daCoTrang });
    if (theoId.size === 0) {
      lyDoDung = LY_DO_DUNG.HET_TRANG;
      break;
    }
    if (luatDung === LUAT_DUNG.GAP_DA_CO && daCoTrang.size > 0) {
      lyDoDung = LY_DO_DUNG.GAP_DA_CO;
      break;
    }
    if (soMoi === 0) {
      lyDoDung = LY_DO_DUNG.TRANG_TOAN_DA_CO;
      break;
    }
    if (so === toiDaTrang) {
      lyDoDung = LY_DO_DUNG.TOI_DA_TRANG;
      break;
    }
  }
  return { tinMoi, mocMoi: { daCo }, trang, lyDoDung, loi };
}

const UAS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
];
// Nghỉ TRƯỚC mỗi lời gọi nguồn 2–4 giây: chậm hơn nhịp 0,6–1,8 giây của lượt quét đủ, và đứng trước lời nên hai nhịp
// liên tiếp không bao giờ dính nhau.
const NGHI_MAC_DINH = 2000;
const NGHI_TOI_DA = 4000;
const chan = (thongBao) => Object.assign(new Error(thongBao), { dungLuot: true });

/**
 * Bộ lấy trang S06: cùng URL, cùng tham số với collect-chotot.mjs nên thấy đúng danh sách lượt quét đủ thấy.
 * 403/429 và thân không phải JSON kèm 2xx–4xx (trang thử thách) → `dungLuot`, NÉM NGAY, không thử lại (1411-20).
 * Lỗi mạng và 5xx → thử lại tới 3 lần (lùi 1,5 s, 3 s).
 * @param {{api: string, vung: {region?: number, region_v2?: number}, feed: {cg: number, st: string}, limit?: number,
 *          fetchImpl?: Function, sleep?: (ms: number) => Promise<void>, ngauNhien?: () => number,
 *          truocLoiGoi?: () => boolean, khiLoiGoi?: (x: object) => void}} opts
 *   truocLoiGoi — hỏi phép trước MỖI lời (kể cả lần thử lại); trả false thì không gọi nguồn, ném lỗi `vuotTran`.
 *   khiLoiGoi  — báo mỗi lần gọi nguồn: { trang, lan, http, ms, loi, chan, luc }.
 */
export function taoLayTrangS06({
  api, vung, feed, limit = 50, fetchImpl = fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  ngauNhien = Math.random, khiLoiGoi = () => {}, truocLoiGoi,
}) {
  const vungQs = vung.region !== undefined ? `region=${vung.region}` : `region_v2=${vung.region_v2}`;
  return async function layTrang(soTrang) {
    const url = `${api}?${vungQs}&cg=${feed.cg}&st=${feed.st}&o=${soTrang * limit}&page=${soTrang}&limit=${limit}&key_param_included=true`;
    for (let lan = 1; lan <= 3; lan++) {
      if (truocLoiGoi && !truocLoiGoi()) {
        throw Object.assign(new Error(`trần lời gọi nguồn — không lấy trang ${soTrang}`), { vuotTran: true });
      }
      await sleep(NGHI_MAC_DINH + Math.floor(ngauNhien() * (NGHI_TOI_DA - NGHI_MAC_DINH)));
      const batDau = Date.now();
      const luc = new Date(batDau).toISOString();
      let http = null;
      try {
        const res = await fetchImpl(url, {
          headers: { "user-agent": UAS[Math.floor(ngauNhien() * UAS.length)], accept: "application/json" },
        });
        http = res.status;
        if (http === 403 || http === 429) throw chan(`trang ${soTrang}: HTTP ${http}`);
        if (!res.ok) throw new Error(`trang ${soTrang}: HTTP ${http}`);
        const body = await res.json();
        khiLoiGoi({ trang: soTrang, lan, http, ms: Date.now() - batDau, loi: false, chan: false, luc });
        return Array.isArray(body?.ads) ? body.ads : [];
      } catch (e) {
        const biChan = e?.dungLuot === true || (http !== null && http < 500 && e instanceof SyntaxError);
        khiLoiGoi({ trang: soTrang, lan, http, ms: Date.now() - batDau, loi: true, chan: biChan, luc });
        if (biChan) {
          throw chan(e?.dungLuot ? e.message : `trang ${soTrang}: thân không phải JSON (HTTP ${http}) — nghi trang thử thách`);
        }
        if (lan === 3) throw new Error(`trang ${soTrang}: ${e?.message ?? e} (đã thử 3 lần)`);
        await sleep(1500 * lan);
      }
    }
    throw new Error(`trang ${soTrang}: không lấy được`);
  };
}

/**
 * Ghi một snapshot theo DATA-CONTRACT, cùng khuôn collect-chotot.mjs (schemaVersion 1, gzip + sha256 manifest).
 * Đâm trùng tên trong cùng một giây thì thêm hậu tố -n — snapshot luôn ghi mới, không bao giờ ghi đè.
 */
export async function ghiSnapshot({ goc, city, items, coverage, bayGio = () => new Date() }) {
  const gocCity = join(goc, "snapshots", city);
  await mkdir(gocCity, { recursive: true });
  const coc = bayGio().toISOString().replace(/[:.]/g, "").slice(0, 17);
  let snapshotId = `${city}__chotot-ads__${coc}`;
  for (let n = 1; existsSync(join(gocCity, snapshotId)); n++) snapshotId = `${city}__chotot-ads__${coc}-${n}`;
  const dir = join(gocCity, snapshotId);
  await mkdir(dir); // không recursive: thư mục đã có thì ném lỗi, không ghi đè
  const files = [];
  for (let i = 0; i < items.length; i += 1000) {
    const name = `items-${String(files.length + 1).padStart(4, "0")}.json.gz`;
    const gz = gzipSync(JSON.stringify(items.slice(i, i + 1000)));
    await writeFile(join(dir, name), gz);
    files.push({ name, sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length });
  }
  const finishedAt = bayGio().toISOString();
  const manifest = {
    schemaVersion: 1,
    snapshotId,
    city,
    source: "chotot-ads",
    startedAt: coverage.startedAt ?? finishedAt,
    finishedAt,
    counts: { items: items.length, failed: coverage.failed ?? 0 },
    coverage: {
      discovered: coverage.discovered ?? items.length,
      captured: items.length,
      failed: coverage.failed ?? 0,
      methods: { gatewayApi: items.length },
      notes: coverage.notes ?? [],
    },
    files,
  };
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

/** Tra stg theo list_id — chỉ SELECT trong phiên chỉ đọc. Id rỗng thì không chạy câu nào. */
export function taoTraStg(client) {
  return async (ids) => {
    if (ids.length === 0) return new Set();
    const { rows } = await client.query(`SELECT list_id FROM stg_chotot_ads WHERE list_id = ANY($1::bigint[])`, [ids]);
    return new Set(rows.map((r) => Number(r.list_id)));
  };
}

/**
 * Tập «lượt quét đủ» để so: id trong stg của đúng vùng × mục, đăng trong cửa sổ.
 * Giờ đăng = orig_list_time nếu có, nếu không thì list_time. Nguồn chỉ điền orig_list_time khi tin ĐƯỢC ĐẨY LẠI lần
 * đầu (đo 24/11: list_time lúc đó thành giờ đẩy, orig_list_time thành giờ đăng gốc); tin chưa từng bị đẩy thì không
 * có orig_list_time và list_time chính là giờ đăng. Lọc theo orig_list_time một mình sẽ bỏ quên mọi tin mới chưa bị đẩy.
 */
export async function quetDuStg(client, { cityCode, adType, t0, t1 }) {
  const { rows } = await client.query(
    `SELECT list_id FROM stg_chotot_ads
      WHERE city_code = $1 AND ad_type = $2
        AND COALESCE(NULLIF((payload->>'orig_list_time')::bigint, 0), (payload->>'list_time')::bigint) >= $3
        AND COALESCE(NULLIF((payload->>'orig_list_time')::bigint, 0), (payload->>'list_time')::bigint) < $4`,
    [cityCode, adType, t0, t1],
  );
  return new Set(rows.map((r) => Number(r.list_id)));
}

/** Mở phiên DB CHỈ ĐỌC: BEGIN READ ONLY rồi tự kiểm — Postgres từ chối mọi câu ghi trong phiên này. */
export async function moDbChiDoc(connectionString) {
  const pg = (await import("pg")).default;
  const c = new pg.Client({ connectionString });
  await c.connect();
  try {
    await c.query("BEGIN READ ONLY");
    const { rows } = await c.query("SHOW transaction_read_only");
    if (rows[0]?.transaction_read_only !== "on") throw new Error("phiên không ở chế độ chỉ đọc");
  } catch (e) {
    await c.end().catch(() => {});
    throw new Error(`moDbChiDoc: không mở được phiên chỉ đọc — ${chiLoi(e)}`);
  }
  return {
    query: (sql, params) => c.query(sql, params),
    dong: async () => {
      await c.query("ROLLBACK").catch(() => {});
      await c.end().catch(() => {});
    },
  };
}

async function docMoc(goc) {
  try {
    return JSON.parse(await readFile(join(goc, "moc.json"), "utf8")).daCo ?? [];
  } catch {
    return []; // chưa có mốc = lần chạy đầu
  }
}
async function luuMoc(goc, daCo) {
  await writeFile(join(goc, "moc.json.tmp"), JSON.stringify({ daCo: [...daCo] }));
  await rename(join(goc, "moc.json.tmp"), join(goc, "moc.json"));
}
async function phienCuoi(goc) {
  let cung = 0;
  try {
    const lu = await readFile(join(goc, "nhat-ky.jsonl"), "utf8");
    for (const dong of lu.split("\n")) {
      if (!dong.trim()) continue;
      const p = JSON.parse(dong).phien;
      if (Number.isInteger(p) && p > cung) cung = p;
    }
  } catch {
    return 0; // chưa có nhật ký
  }
  return cung;
}

/**
 * HÀNG RÀOO kho chuẩn (claudedp-2511-26): script hằng ngày nạp snapshot có TÊN MỚI NHẤT mỗi thành phố trong
 * `collector/snapshots`. Bộ thu đuôi ghi vào đó thì snapshot đuôi (mới hơn) bị nhầm làm snapshot ngày. Vì vậy
 * `--goc` KHÔNG được là `collector` hay `collector/snapshots` của BẤT KỲ checkout nào — tính theo đường dẫn đã
 * resolve symlink và realpath. Phép đo phải ghi ra thư mục riêng.
 */
export function laKhoChuan(goc) {
  // goc có thể chưa tồn tại (phép đo mới): resolve symlink theo bậc cha gần nhất đã có, rồi nối phần còn lại
  let q = resolve(goc);
  const phanDu = [];
  let x = q;
  while (!existsSync(x)) {
    const cha = dirname(x);
    if (cha === x) break; // tới gốc mà vẫn không có: dừng, không lặp vô hạn
    phanDu.unshift(basename(x));
    x = cha;
  }
  q = join(realpathSync(x), ...phanDu);
  const ten = basename(q);
  if (ten !== "snapshots" && ten !== "collector") return false;
  if (ten === "collector") return existsSync(join(q, "snapshots")) || existsSync(join(q, "package.json"));
  return basename(dirname(q)) === "collector";
}

/**
 * Vòng lặp của phép đo: mỗi nhịp hỏi cổng vòng đời (fail-closed: DB lỗi → 0 lời gọi nguồn) rồi chạy một nhịp thu đuôi.
 * Mọi thứ nặng hoặc ngoài máy đều cắm được (moDb, taoLayTrang, sleep, bayGio, bao) để test chạy không DB, không mạng, không chờ.
 * @returns {Promise<{ma: number, soPhien: number, soLoiGoi: number, soLoi: number, soLuotLoi: number, biChan: number}>}
 */
export async function chayDoi({
  vung, feed, goc,
  nhapPhut = 5, thoiGianPhut = 1440, toiDaLoi = 1000, toiDaTrang = 3,
  luatDung = LUAT_DUNG.TRANG_TOAN_DA_CO, motLan = false, dry = false,
  moDb, taoLayTrang,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  bayGio = () => Date.now(),
  bao = () => {}, // nhận một dòng tóm tắt mỗi lượt
}) {
  if (laKhoChuan(goc)) {
    // mã 6 — khác mọi mã đã có để nhật ký lượt chấm phân biệt được với cổng đóng (4) hay trần lời (5)
    return { ma: MA_THOAT.GOC_SAI, soPhien: 0, soLoiGoi: 0, soLoi: 0, soLuotLoi: 0, biChan: 0 };
  }
  await mkdir(goc, { recursive: true });
  const t0 = bayGio();
  const hetHan = t0 + thoiGianPhut * PHUT;
  // Chạy lại trong cùng thư mục = nối tiếp phép đo cũ: giữ mốc và tiếp tục đánh số lượt
  const daCo = new Set(await docMoc(goc));
  let phien = await phienCuoi(goc);
  const dem = { soLoiGoi: 0, soLoi: 0, soLuotLoi: 0, biChan: 0 };
  const truocLoiGoi = () => {
    if (dem.soLoiGoi >= toiDaLoi) return false;
    dem.soLoiGoi++;
    return true;
  };
  let loiGoiHienTai = null; // mảng ghi các lần gọi nguồn của lượt đang chạy (mỗi lượt một mảng mới)
  const layTrang = taoLayTrang({
    truocLoiGoi,
    khiLoiGoi: (x) => {
      if (x.loi && !x.chan) dem.soLoi++;
      loiGoiHienTai?.push(x);
    },
  });
  const taoItem = taoItemS06({
    city: vung.cityCode, cg: feed.cg, st: feed.st,
    ...(vung.region !== undefined ? { region: vung.region } : { region_v2: vung.region_v2 }),
    bayGio: () => new Date(bayGio()),
  });
  const ghi = (dong) => appendFile(join(goc, "nhat-ky.jsonl"), JSON.stringify(dong) + "\n");
  let ma = MA_THOAT.XONG;
  let trangThai = "dang-chay"; // tệp trạng thái ghi ngay từ đầu và sau mỗi lượt, để theo dõi giữa chừng
  let soPhienChay = 0;
  let i = 0;
  const luuTrangThai = () => writeFile(join(goc, "trang-thai.json"), JSON.stringify({
    pid: process.pid, cityCode: vung.cityCode, adType: feed.st, muc: `${feed.cg}/${feed.st}`,
    nhapPhut, toiDaTrang, toiDaLoi, luatDung,
    batDau: new Date(t0).toISOString(), hetHan: new Date(hetHan).toISOString(),
    trangThai, soPhien: soPhienChay, soLoiGoi: dem.soLoiGoi, soLoi: dem.soLoi, soLuotLoi: dem.soLuotLoi, biChan: dem.biChan,
    lucCapNhat: new Date(bayGio()).toISOString(),
  }, null, 2));

  try {
    await luuTrangThai();
    for (;;) {
      if (bayGio() >= hetHan) break;
      i++;
      const rec = {
        k: "phien", phien: null, batDau: new Date(bayGio()).toISOString(), ketThuc: null,
        soLoiGoi: 0, soLoi: 0, chan: 0, dbLoi: 0, vuotTran: 0, loiDb: null, loiNguon: null,
        lyDoDung: null, trang: [], tinMoi: [], snapshot: null,
      };
      const truoc = { ...dem };
      const loiGoi = []; // mọi lần gọi nguồn của lượt này
      loiGoiHienTai = loiGoi;
      const gocTrang = new Map(); // số trang → { luc, ads } để nhật ký giữ từng mục
      let maLuot = null;
      let r = null;
      // (a) cổng vòng đời — ở đây chỉ có DB; lỗi DB → bỏ lượt, 0 lời gọi nguồn (fail-closed)
      let db = null;
      try {
        db = await moDb();
        const cong = await docTrangThai(db, "S06", vung.group_key);
        if (!cong.run) maLuot = MA_THOAT.CONG_DONG;
      } catch (e) {
        rec.dbLoi = 1;
        rec.loiDb = chiLoi(e);
      }
      if (maLuot === null && !rec.dbLoi) {
        // (b) nguồn + stg. Lỗi có mã (mất kết nối DB giữa lượt) → bỏ lượt; lỗi khác là lỗi hệ thống → ném ra, dừng.
        try {
          r = await thuDuoi({
            moc: { daCo }, toiDaTrang, luatDung,
            layTrang: async (so) => {
              const luc = bayGio();
              const ads = await layTrang(so);
              gocTrang.set(so, { luc, ads });
              return ads;
            },
            trongStg: taoTraStg(db),
            taoItem,
          });
        } catch (e) {
          if (e?.code) {
            rec.dbLoi = 1;
            rec.loiDb = chiLoi(e);
          } else {
            throw e;
          }
        }
      }
      if (db) await db.dong().catch(() => {});

      if (maLuot === MA_THOAT.CONG_DONG) {
        ma = MA_THOAT.CONG_DONG;
        trangThai = "cong-dong";
        await ghi({ k: "cong-dong", luc: rec.batDau });
        break;
      }
      // Qua cổng rồi mới tính là một lượt — lượt dừng ở cổng không chiếm số lượt
      phien++;
      soPhienChay++;
      rec.phien = phien;
      if (r) {
        rec.lyDoDung = r.lyDoDung;
        rec.tinMoi = r.tinMoi.map((it) => it.payload.list_id);
        rec.soLoiGoi = dem.soLoiGoi - truoc.soLoiGoi;
        rec.soLoi = dem.soLoi - truoc.soLoi;
        for (const t of r.trang) {
          const { luc, ads } = gocTrang.get(t.so);
          const theoId = new Map();
          for (const ad of ads) if (ad?.list_id && !theoId.has(ad.list_id)) theoId.set(ad.list_id, ad);
          const lan = loiGoiOf(loiGoi, t.so);
          rec.trang.push({
            so: t.so, luc: new Date(luc).toISOString(), soLan: lan.length || 1, ms: lan.at(-1)?.ms ?? null, http: lan.at(-1)?.http ?? null,
            soTin: t.soTin, soDaCo: t.soDaCo, soMoi: t.soMoi,
            // từng mục: id, list_time, orig_list_time, đã có (1) hay mới (0) — để tính lại luật dừng khác sau này
            tin: [...theoId].map(([id, ad]) => [id, ad.list_time ?? null, ad.orig_list_time ?? null, t.daCo.has(id) ? 1 : 0]),
          });
        }
        // Trang hỏng (không lấy được): vẫn ghi số lần thử và mã HTTP để số lời gọi không mất
        for (const so of [...new Set(loiGoi.map((x) => x.trang))].filter((so) => !gocTrang.has(so))) {
          const lan = loiGoiOf(loiGoi, so);
          rec.trang.push({
            so, luc: lan[0].luc, soLan: lan.length, ms: lan.at(-1).ms, http: lan.at(-1).http,
            soTin: 0, soDaCo: 0, soMoi: 0, tin: [], loi: r.loi?.thongBao ?? null,
          });
        }
        rec.trang.sort((a, b) => a.so - b.so);
        if (r.tinMoi.length > 0 && !dry) {
          const m = await ghiSnapshot({
            goc, city: vung.group_key, items: r.tinMoi, bayGio: () => new Date(bayGio()),
            coverage: {
              startedAt: rec.batDau, failed: 0,
              discovered: r.trang.reduce((s, t) => s + t.soTin, 0),
              notes: [`thu-duoi ${feed.cg}/${feed.st} · phien ${phien} · dung: ${r.lyDoDung ?? "loi"}`],
            },
          });
          rec.snapshot = m.snapshotId;
        }
        daCo.clear();
        for (const id of r.mocMoi.daCo) daCo.add(id);
        await luuMoc(goc, daCo);
        if (r.loi?.dungLuot) {
          rec.chan = 1;
          dem.biChan++;
          maLuot = MA_THOAT.BI_CHAN;
          trangThai = "bi-chan";
        } else if (r.loi?.vuotTran) {
          rec.vuotTran = 1;
          maLuot = MA_THOAT.VUOT_TRAN_LOI;
          trangThai = "vuot-tran";
        } else if (r.loi) {
          rec.loiNguon = r.loi.thongBao;
          dem.soLuotLoi++;
        }
      }
      rec.ketThuc = new Date(bayGio()).toISOString();
      await ghi(rec);
      if (rec.chan) await ghi({ k: "chan", phien, luc: rec.ketThuc, thongBao: r?.loi?.thongBao ?? null });
      await luuTrangThai();
      bao(`phien ${phien} · tin moi ${rec.tinMoi.length} · loi goi ${rec.soLoiGoi} · ${
        rec.dbLoi ? "DB loi — bo luot" : rec.chan ? "BI CHAN — dung ca phep do" : rec.loiNguon ? `loi nguon: ${rec.loiNguon}` : `dung: ${rec.lyDoDung}`}`);
      if (maLuot !== null) {
        ma = maLuot;
        break;
      }
      if (motLan) break;
      // nhịp: lượt kế bắt đầu đúng mỗi nhapPhut kể từ mốc bắt đầu (trễ hơn mốc thì chạy ngay, không dồn);
      // nhịp kế đã nằm ngoài thời gian đo thì dừng ngay, không ngủ nốt một nhịp
      if (i * nhapPhut >= thoiGianPhut) break;
      const cho = t0 + i * nhapPhut * PHUT - bayGio();
      if (cho > 0) await sleep(cho);
    }
    // vòng lặp dừng vì hết giờ hoặc --mot-lan; các cách dừng khác (chặn, cổng đóng, trần lời) đã ghi lý do riêng
    if (trangThai === "dang-chay") trangThai = "xong";
  } catch (e) {
    ma = MA_THOAT.LOI;
    trangThai = "loi";
    await ghi({ k: "loi", phien, luc: new Date(bayGio()).toISOString(), thongBao: chiLoi(e) }).catch(() => {});
    throw e;
  } finally {
    await luuTrangThai().catch(() => {});
  }
  return {
    ma, soPhien: soPhienChay, soLoiGoi: dem.soLoiGoi, soLoi: dem.soLoi, soLuotLoi: dem.soLuotLoi, biChan: dem.biChan,
  };
}
function loiGoiOf(loiGoi, so) {
  return loiGoi.filter((x) => x.trang === so);
}

/** Phân vị theo hạng gần nhất (p50 của 4 số = số thứ 2, p90 = số thứ 4). */
function phanVi(p, xs) {
  if (xs.length === 0) return null;
  return xs.sort((a, b) => a - b)[Math.max(0, Math.ceil(p * xs.length) - 1)];
}
const namTrong = (t, t0, t1) => t >= t0 && t < t1;

/**
 * Bốn số của phép đo từ nhật ký (không cần DB): lời gọi/phút, độ trễ đăng → thu p50/p90 (giây), số lần bị chặn,
 * và số lời mà từng luật dừng đã dùng — tính lại từ từng mục đã ghi, không gọi nguồn.
 * Chỉ tin đăng GỐC trong cửa sổ [t0, t1) mới tính là «tin mới đăng»; tin cũ đẩy lại và tin đăng trước cửa sổ không tính.
 */
export function tinhBaoCao(dong, { t0, t1 }) {
  const phien = dong.filter((d) => d.k === "phien");
  const gop = (k) => phien.reduce((s, d) => s + (d[k] ?? 0), 0);
  const soLoiGoi = gop("soLoiGoi");
  const soPhut = phien.length === 0 ? 0 : (Math.max(...phien.map((d) => Date.parse(d.ketThuc ?? d.batDau))) - Date.parse(phien[0].batDau)) / 60000;
  const luat = {
    [LUAT_DUNG.TRANG_TOAN_DA_CO]: { soTrang: 0, boSot: 0 },
    [LUAT_DUNG.GAP_DA_CO]: { soTrang: 0, boSot: 0 },
  };
  const doTre = [];
  const dinhMoiNhat = []; // tuổi (giây) của mục mới nhất ở đầu trang 1, mỗi lượt một số
  let doTreAm = 0, tinMoiDang = 0, truocCuaSo = 0, dayLaiCu = 0, tronLuaDau = 0;
  let soPhienThanhCong = 0, soLuotLoi = 0;
  for (const d of phien) {
    if (d.dbLoi) continue;
    if (d.loiNguon) soLuotLoi++;
    if (d.chan || d.loiNguon) continue; // lượt không chạy tới đâu: không có dữ liệu để tính
    soPhienThanhCong++;
    // nhật ký ghi đúng tới trang dừng của luật mặc định
    luat[LUAT_DUNG.TRANG_TOAN_DA_CO].soTrang += d.trang.length;
    // luật gap-da-co đã dừng ở trang đầu tiên có tin đã có; tin mới ở các trang sau đó là số nó bỏ sót
    const iDung = d.trang.findIndex((t) => t.soDaCo > 0);
    const soTrangGap = iDung >= 0 ? iDung + 1 : d.trang.length;
    luat[LUAT_DUNG.GAP_DA_CO].soTrang += soTrangGap;
    d.trang.forEach((t, idx) => {
      if (idx >= soTrangGap) luat[LUAT_DUNG.GAP_DA_CO].boSot += t.tin.filter((x) => x[3] === 0).length;
    });
    // Sàn trễ phía nguồn: mục mới nhất ở đầu trang 1 đã bao nhiêu tuổi khi lượt này lấy
    const trang1 = d.trang.find((t) => t.so === 1);
    if (trang1 && trang1.tin.length > 0) {
      dinhMoiNhat.push(Math.round((Date.parse(trang1.luc) - Math.max(...trang1.tin.map((x) => x[1]))) / 1000));
    }
    for (const t of d.trang) {
      for (const [id, listTime, origTime, daCo] of t.tin) {
        if (daCo !== 0) continue;
        // Giờ đăng: orig_list_time nếu có, nếu không thì list_time (tin chưa từng bị đẩy lại — xem quetDuStg)
        const gioDang = origTime || listTime;
        if (!namTrong(gioDang, t0, t1)) {
          // mục máy chưa có nhưng không phải tin mới đăng của cửa sổ — chia loại để đọc đúng con số
          if (gioDang < t0) {
            truocCuaSo++;
            if (origTime && listTime - origTime >= 3600_000) dayLaiCu++; // cũ đẩy lại: list_time mới hơn hẳn giờ đăng gốc
            else tronLuaDau++; // đăng trước t0 nhưng chưa tới tay máy (tồn đọng lúc bắt đầu đo)
          }
          continue;
        }
        tinMoiDang++;
        const giayTre = (Date.parse(t.luc) - gioDang) / 1000;
        if (giayTre < 0) {
          doTreAm++; // list_time sau giờ lấy: lệch giờ nguồn
          continue;
        }
        doTre.push(Math.round(giayTre * 10) / 10);
      }
    }
  }
  return {
    soPhien: phien.length,
    soPhienThanhCong,
    soLuotLoi,
    soLoiGoi,
    soLoi: gop("soLoi"),
    biChan: gop("chan"),
    soPhut: Math.round(soPhut * 100) / 100,
    loiGoiMoiPhut: soPhut > 0 ? Math.round((soLoiGoi / soPhut) * 1000) / 1000 : null,
    tinMoiDang,
    truocCuaSo,
    dayLaiCu,
    tronLuaDau,
    doTre: { soLuong: doTre.length, p50: phanVi(0.5, doTre), p90: phanVi(0.9, doTre) },
    doTreAm,
    dinhMoiNhat: { soLuong: dinhMoiNhat.length, min: dinhMoiNhat.length ? Math.min(...dinhMoiNhat) : null, p50: phanVi(0.5, dinhMoiNhat) },
    luat,
  };
}

/**
 * Cửa sổ [t0, t1) của báo cáo: từ giờ bắt đầu phép đo tới ngay sau lượt cuối, không vượt giờ dự kiến kết thúc
 * và không vượt hiện tại. Thiếu tệp trạng thái (phiên cũ chỉ ghi lúc kết thúc) thì lấy mốc từ nhật ký.
 */
export function cuaSoDo(tt, dong, bayGio = () => Date.now()) {
  const phien = dong.filter((d) => d.k === "phien");
  if (phien.length === 0) throw new Error("chưa có lượt nào trong nhật ký — chưa tính được cửa sổ");
  const t0 = Date.parse(tt?.batDau ?? phien[0].batDau);
  const sauLanCuoi = Math.max(...phien.map((d) => Date.parse(d.ketThuc ?? d.batDau))) + 1;
  return { t0, t1: Math.min(sauLanCuoi, bayGio(), tt?.hetHan ? Date.parse(tt.hetHan) : Infinity) };
}

/**
 * Lượt quét đủ mới nhất của vùng đã nạp XONG vào stg chưa. Bộ nạp ghi từng dòng trong vài chục phút, và so với một
 * tập còn dở cho tỉ lệ sai hẳn: 24/11 tính giữa lúc 30.623 dòng mới vào một phần thì ra «97%, 221 tin lượt quét đủ
 * không có»; nạp xong thì số thật là 98,3%. «Xong» = số dòng stg mang snapshot mới nhất đạt 99% số item manifest
 * khai (importer bỏ tin thiếu region_v2 dưới 1%).
 */
export async function quetDuDaNapXong(client, { cityCode }) {
  const chua = (lyDo) => ({ xong: false, lyDo, luc: null, snapshotId: null, items: null, daNap: null });
  const luc = (await client.query(`SELECT max(captured_at) AS luc FROM stg_chotot_ads WHERE city_code = $1`, [cityCode])).rows[0]?.luc ?? null;
  if (!luc) return chua("stg-chua-co-tin-cua-vung");
  const gio = luc instanceof Date ? luc.toISOString() : luc;
  const snap = (await client.query(
    `SELECT snapshot_id, manifest FROM airbnb_snapshots WHERE source = 'chotot-ads' AND collected_at = $1 ORDER BY snapshot_id DESC LIMIT 1`,
    [luc],
  )).rows[0];
  if (!snap) return { ...chua("khong-thay-manifest-cua-luot-moi-nhat"), luc: gio };
  const items = Number(snap.manifest?.counts?.items ?? 0);
  const daNap = (await client.query(`SELECT count(*)::int AS n FROM stg_chotot_ads WHERE snapshot_id = $1`, [snap.snapshot_id])).rows[0].n;
  const xong = items > 0 && daNap >= items * 0.99;
  return { xong, ...(xong ? {} : { lyDo: "chua-nap-xong" }), luc: gio, snapshotId: snap.snapshot_id, items, daNap };
}

/** Tỉ lệ tin mới đăng (giờ gốc trong cửa sổ) mà đuôi thấy và lượt quét đủ cũng có. */
export function tinhTiLeBatDuoc(dong, { t0, t1, quetDu }) {
  const duoi = new Set(); // mã đuôi đưa ra là tin MỚI (cờ 0) và đăng trong cửa sổ
  const daCoMa = new Set(); // mã đuôi từng thấy với cờ «đã có» — máy biết mã đó từ trước
  for (const d of dong) {
    if (d.k !== "phien" || d.chan || d.dbLoi) continue;
    for (const t of d.trang ?? []) {
      for (const [id, listTime, origTime, daCo] of t.tin) {
        if (daCo !== 0) {
          daCoMa.add(id);
        } else if (namTrong(origTime || listTime, t0, t1)) {
          duoi.add(id); // giờ đăng = orig_list_time nếu có, nếu không thì list_time (xem quetDuStg)
        }
      }
    }
  }
  const g = new Set([...quetDu].map(Number));
  let batDuoc = 0;
  for (const id of duoi) if (g.has(id)) batDuoc++;
  // Trong tập lượt quét đủ có cả TIN CŨ ĐƯỢC LÀM MỚI: mã máy đã biết, list_time đổi thành hôm nay, không có
  // orig_list_time (đo 24/11: 151/654 mã). Chúng không phải tin mới và đuôi bỏ qua theo thiết kế (đã có theo mã).
  // Mẫu số của tỉ lệ chỉ gồm TIN MỚI; còn mã đuôi chưa từng thấy thì vẫn tính là tin mới bị bỏ sót.
  const thieuDaCoMa = [...g].filter((id) => !duoi.has(id) && daCoMa.has(id)).sort((a, b) => a - b);
  const tinMoi = g.size - thieuDaCoMa.length;
  const thieu = [...g].filter((id) => !duoi.has(id) && !daCoMa.has(id)).sort((a, b) => a - b);
  const chiDuoi = [...duoi].filter((id) => !g.has(id)).sort((a, b) => a - b);
  return {
    quetDu: g.size, // số mã lượt quét đủ có giờ đăng trong cửa sổ (gồm cả tin cũ được làm mới)
    daCoMa: thieuDaCoMa.length, // trong số đó: mã máy đã biết từ trước — không là tin mới
    tinMoi, // quetDu − daCoMa: mẫu số của tỉ lệ
    duoi: duoi.size,
    batDuoc,
    tiLe: tinMoi > 0 ? Math.round((batDuoc / tinMoi) * 10000) / 10000 : null,
    thieu, // tin mới mà đuôi không bắt được
    chiDuoi,
    thieuDaCoMa,
  };
}

async function docNhatKy(goc) {
  return (await readFile(join(goc, "nhat-ky.jsonl"), "utf8")).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

/**
 * Báo cáo cả phép đo: bốn số từ nhật ký, kèm tỉ lệ bắt được so với lượt quét đủ nếu biết vùng × mục
 * (tệp trạng thái `tt` null = phép đo chạy bằng phiên cũ chưa ghi trạng thái).
 */
export async function baoCao({ tt, dong, bayGio = () => Date.now(), moDb }) {
  const { t0, t1 } = cuaSoDo(tt ?? {}, dong, bayGio);
  const kq = {
    cuaSo: { t0: new Date(t0).toISOString(), t1: new Date(t1).toISOString() },
    trangThai: tt?.trangThai ?? "dang-chay",
    ...tinhBaoCao(dong, { t0, t1 }),
  };
  if (tt?.cityCode && tt.adType) {
    try {
      const db = await moDb();
      try {
        // Chỉ so khi lượt quét đủ mới nhất đã nạp XONG — tập còn dở cho tỉ lệ sai (xem quetDuDaNapXong)
        const nap = await quetDuDaNapXong(db, { cityCode: tt.cityCode });
        kq.quetDuNapXong = nap;
        kq.quetDuCapNhatLuc = nap.luc; // giờ lượt quét đủ mới nhất đã nạp — tỉ lệ so chỉ có nghĩa khi trễ hơn t1
        if (!nap.xong) {
          kq.batDuoc = null;
          kq.batDuocLoi = nap.daNap === null
            ? `chưa biết lượt quét đủ để so (${nap.lyDo})`
            : `lượt quét đủ mới nhất chưa nạp xong (${nap.daNap}/${nap.items} dòng) — chưa so được`;
        } else {
          const quetDu = await quetDuStg(db, { cityCode: tt.cityCode, adType: tt.adType, t0, t1 });
          kq.batDuoc = tinhTiLeBatDuoc(dong, { t0, t1, quetDu });
        }
      } finally {
        await db.dong();
      }
    } catch (e) {
      kq.batDuoc = null;
      kq.batDuocLoi = chiLoi(e);
    }
  }
  return kq;
}

function docDoiSo(argv) {
  const lay = (ten) => {
    const i = argv.indexOf(ten);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const so = (ten, macDinh) => {
    const v = lay(ten);
    if (v === undefined) return macDinh;
    if (!/^\d+$/.test(v)) throw new Error(`${ten} phải là số nguyên dương, nhận «${v}»`);
    return Number(v);
  };
  return {
    vung: lay("--vung"), muc: lay("--muc") ?? "1000/u", goc: lay("--goc"), luatDung: lay("--luat-dung") ?? LUAT_DUNG.TRANG_TOAN_DA_CO,
    nhapPhut: so("--nhap", 5), thoiGianPhut: so("--thoi-gian", 1440), toiDaLoi: so("--toi-da-loi", 1000), toiDaTrang: so("--toi-da-trang", 3),
    motLan: argv.includes("--mot-lan"), dry: argv.includes("--dry"),
  };
}

async function main(argv) {
  if (argv.includes("--bao-cao")) {
    const goc = argv[argv.indexOf("--bao-cao") + 1];
    let tt = null;
    try {
      tt = JSON.parse(await readFile(join(goc, "trang-thai.json"), "utf8"));
    } catch {
      tt = null; // đang chạy bằng phiên cũ chưa ghi trạng thái
    }
    console.log(JSON.stringify(await baoCao({ tt, dong: await docNhatKy(goc), moDb: () => moDbChiDoc(DB_URL) }), null, 2));
    return 0;
  }
  const o = docDoiSo(argv);
  if (!o.vung || !o.goc) throw new Error("cách dùng: node collect-s06-duoi.mjs --vung <group_key> --goc <thư mục> [--muc cg/st] [--nhap 5] [--thoi-gian 1440]");
  if (!Object.values(LUAT_DUNG).includes(o.luatDung)) throw new Error(`--luat-dung phải là một trong ${Object.values(LUAT_DUNG).join(", ")}`);
  const m = /^(\d{4})\/([su])$/.exec(o.muc ?? "");
  if (!m) throw new Error("--muc phải dạng <cg>/<st>, ví dụ 1000/u");
  const feed = { cg: Number(m[1]), st: m[2] };
  // Mã vùng chỉ lấy từ DB (source_groups), không tin đối số — cùng nguồn sự thật với collect-chotot.mjs
  const db = await moDbChiDoc(DB_URL);
  let params;
  try {
    params = (await db.query(`SELECT params FROM source_groups WHERE source_code = $1 AND group_key = $2`, ["S06", o.vung])).rows[0]?.params;
  } finally {
    await db.dong();
  }
  if (!params || (params.region === undefined && params.region_v2 === undefined)) {
    console.error(`S06 vung-khong-ro — không có vùng đang chạy với group_key đã cho, hoặc thiếu region/region_v2 trong params`);
    return 2;
  }
  const vung = {
    group_key: o.vung, cityCode: params.cityCode,
    ...(params.region !== undefined ? { region: params.region } : { region_v2: params.region_v2 }),
  };
  // Chốt cứng: quá thời gian đo 10 phút mà vòng lặp chưa tự dừng thì buộc dừng, không để tiến trình treo
  const canhGio = setTimeout(() => {
    console.error("S06 thu-duoi: quá thời gian đo 10 phút — buộc dừng");
    process.exit(1);
  }, (o.thoiGianPhut + 10) * PHUT);
  canhGio.unref();
  const khongNghi = process.env.S06_DUOI_KHONG_NGHI === "1"; // chỉ cho chạy thử với nguồn giả
  const kq = await chayDoi({
    vung, feed, goc: o.goc,
    nhapPhut: o.nhapPhut, thoiGianPhut: o.thoiGianPhut, toiDaLoi: o.toiDaLoi, toiDaTrang: o.toiDaTrang,
    luatDung: o.luatDung, motLan: o.motLan, dry: o.dry,
    bao: (dong) => console.log(`[S06 thu-duoi] ${dong}`),
    moDb: () => moDbChiDoc(DB_URL),
    taoLayTrang: (x) => taoLayTrangS06({ api: API_MAC_DINH, vung, feed, ...x, ...(khongNghi ? { sleep: async () => {} } : {}) }),
  });
  if (kq.ma === MA_THOAT.GOC_SAI) {
    console.error("S06 thu-duoi: TỪ CHỐI — --goc trỏ vào kho chuẩn (collector hoặc collector/snapshots). Script hằng ngày nạp snapshot có tên mới nhất, nên bộ thu đuôi phải ghi ra thư mục riêng.");
  }
  console.log(`[S06 thu-duoi] ket thuc · ma ${kq.ma} · phien ${kq.soPhien} · loi goi ${kq.soLoiGoi} · loi ${kq.soLoi} · bi chan ${kq.biChan}`);
  return kq.ma;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (ma) => { process.exitCode = ma; },
    (e) => { console.error("❌ S06 thu-duoi:", chiLoi(e)); process.exitCode = 1; },
  );
}
