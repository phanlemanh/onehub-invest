/**
 * S02 — phiên trên đĩa của profile bộ thu (2511-s02, cách «đi cửa API như các nguồn khác»).
 *
 * Bộ thu KHÔNG mở trình duyệt khi thu. Phiên đăng nhập do Mạnh tự tạo trong profile của bộ thu (lệnh login);
 * Chrome lưu localStorage của ứng dụng trong một kho LevelDB tại
 * `<profile>/Default/Local Storage/leveldb/`. Mô-đun này chỉ ĐỌC các tệp của kho đó, theo đúng định dạng
 * LevelDB — không quét thô chuỗi khoá:
 *   · nhật ký (.log): chuỗi bản ghi [đầu 7 byte | thân], chia khối 32 KB; bản ghi dài quá phần còn lại của
 *     khối bị cắt mảnh FIRST/MIDDLE/LAST; thân là một WriteBatch, khoá ghi đầy đủ;
 *   · bảng (.ldb): khối dữ liệu với khoá NÉN TIỀN TỐ. Đo 26/11 trên profile thật: tiền tố origin chỉ còn
 *     3–6 bản sao mỗi bảng trong khi nhật ký có 31 → quét thô trượt khi bản ghi được dồn sang bảng.
 *     Chân trang trỏ tới khối chỉ mục, mỗi mục chỉ mục trỏ tới một khối dữ liệu;
 *   · mọi phiên bản của một khoá mang số thứ tự ghi; bản có số LỚN NHẤT thắng, bất kể nằm tệp nào.
 * Khối nén snappy được giải ngay trong mô-đun (đo 26/11 trên bảng thật: khối chỉ mục bị nén; khối dữ liệu
 * cũng có thể nén). Khối nén hỏng hoặc tệp hỏng → ném lỗi nói tên tệp: không lặng lẽ dùng bản cũ.
 *
 * Giá trị phiên chỉ đi trong bộ nhớ tiến trình — mô-đun này không in, không ghi.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type BanGhiKhoa = { thuTu: number; xoa: boolean; giaTri: Uint8Array };

const KHOI_LOG = 32_768;
const DAU_LOG = 7;
const CHAN_BANG = 48;
const LOAI_LOG = { DEM: 0, DU: 1, DAU: 2, GIUA: 3, CUOI: 4 } as const;

type Varint = { giaTri: number; dai: number };
type MucKhoi = { khoa: Uint8Array; giaTri: Uint8Array };
type TayCam = { offset: number; kichThuoc: number };

const gopManh = (cacManh: Uint8Array[]): Uint8Array => {
  const ra = new Uint8Array(cacManh.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of cacManh) {
    ra.set(x, o);
    o += x.length;
  }
  return ra;
};

const bangKhoa = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

function docVarint(b: Uint8Array, o: number): Varint | null {
  let giaTri = 0;
  for (let i = 0; i < 5; i++) {
    if (o + i >= b.length) return null;
    const byte = b[o + i];
    giaTri += (byte & 0x7f) * 2 ** (7 * i);
    if ((byte & 0x80) === 0) return { giaTri, dai: i + 1 };
  }
  return null;
}

function docFixed32(b: Uint8Array, o: number): number | null {
  if (o + 4 > b.length) return null;
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

/** Số 64 bit little-endian; chính xác tới 2^53 (số thứ tự ghi thật chỉ cỡ hàng triệu). */
function docFixed64(b: Uint8Array, o: number): number | null {
  const thap = docFixed32(b, o);
  const cao = docFixed32(b, o + 4);
  if (thap === null || cao === null) return null;
  return thap + cao * 2 ** 32;
}

/** Khoá localStorage của Chrome: '_' + origin + 0x00 + 0x01 (Latin-1) + tên khoá. */
export function khoaLocalStorage(origin: string, khoa: string): Uint8Array {
  return Buffer.from(`_${origin}\x00\x01${khoa}`, "latin1");
}

/**
 * Giải nén một đoạn snappy (định dạng gốc) dài `dai` byte tại `o`: varint độ dài giải, rồi chuỗi phần tử —
 * chữ (2 bit thấp = 0) hoặc bản sao đã gặp (lệch 1/2/4 byte, được phép chồng lấn). Trả null nếu đoạn hỏng.
 */
export function giaiSnappy(b: Uint8Array, o: number, dai: number): Uint8Array | null {
  const het = o + dai;
  const chieuDai = docVarint(b, o);
  if (!chieuDai || chieuDai.giaTri > 4 * 1024 * 1024) return null;
  const ra = new Uint8Array(chieuDai.giaTri);
  let p = o + chieuDai.dai;
  let q = 0;
  while (q < ra.length) {
    if (p >= het) return null;
    const tag = b[p++];
    const loai = tag & 3;
    if (loai === 0) {
      let daiChu = tag >> 2;
      if (daiChu >= 60) {
        const soByte = daiChu - 59;
        if (p + soByte > het) return null;
        daiChu = 0;
        for (let i = 0; i < soByte; i++) daiChu += b[p + i] * 2 ** (8 * i);
        p += soByte;
      }
      daiChu += 1;
      if (p + daiChu > het || q + daiChu > ra.length) return null;
      ra.set(b.subarray(p, p + daiChu), q);
      p += daiChu;
      q += daiChu;
      continue;
    }
    let daiBanSao: number;
    let lech: number;
    if (loai === 1) {
      if (p + 1 > het) return null;
      daiBanSao = 4 + ((tag >> 2) & 7);
      lech = ((tag >> 5) << 8) | b[p];
      p += 1;
    } else if (loai === 2) {
      if (p + 2 > het) return null;
      daiBanSao = (tag >> 2) + 1;
      lech = b[p] | (b[p + 1] << 8);
      p += 2;
    } else {
      if (p + 4 > het) return null;
      daiBanSao = (tag >> 2) + 1;
      lech = b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | b[p + 3] * 2 ** 24;
      p += 4;
    }
    if (lech === 0 || lech > q || q + daiBanSao > ra.length) return null;
    for (let i = 0; i < daiBanSao; i++, q++) ra[q] = ra[q - lech];
  }
  return ra;
}

/** Giá trị localStorage: byte đầu là mã hoá — 0x01 Latin-1, 0x00 UTF-16LE. */
export function giaiMaGiaTri(giaTri: Uint8Array): string {
  if (giaTri.length === 0) return "";
  const than = Buffer.from(giaTri.subarray(1));
  return giaTri[0] === 0 ? than.toString("utf16le") : than.toString("latin1");
}

// ---------------------------------------------------------------- nhật ký (.log)

/** Mục mang `khoa` trong một WriteBatch → vào `kq`. Batch hỏng (vượt biên, loại lạ) thì bỏ phần còn lại. */
function themBatch(than: Uint8Array, khoa: Uint8Array, kq: BanGhiKhoa[]): void {
  const goc = docFixed64(than, 0);
  const soMuc = docFixed32(than, 8);
  if (goc === null || soMuc === null) return;
  let o = 12;
  for (let i = 0; i < soMuc; i++) {
    const loai = than[o++];
    if (loai !== 0 && loai !== 1) return;
    const kd = docVarint(than, o);
    if (!kd || o + kd.dai + kd.giaTri > than.length) return;
    const k = than.subarray(o + kd.dai, o + kd.dai + kd.giaTri);
    o += kd.dai + kd.giaTri;
    if (loai === 0) {
      if (bangKhoa(k, khoa)) kq.push({ thuTu: goc + i, xoa: true, giaTri: new Uint8Array() });
      continue;
    }
    const vd = docVarint(than, o);
    if (!vd || o + vd.dai + vd.giaTri > than.length) return;
    if (bangKhoa(k, khoa)) {
      kq.push({ thuTu: goc + i, xoa: false, giaTri: than.subarray(o + vd.dai, o + vd.dai + vd.giaTri) });
    }
    o += vd.dai + vd.giaTri;
  }
}

/** Mọi phiên bản của `khoa` trong một tệp nhật ký. Gặp bản ghi hỏng/ghi dở thì dừng ở đó, như LevelDB. */
export function docKhoaTuLog(b: Uint8Array, khoa: Uint8Array): BanGhiKhoa[] {
  const kq: BanGhiKhoa[] = [];
  let manhDangGi: Uint8Array[] | null = null; // mảnh FIRST/MIDDLE đang chờ LAST
  let o = 0;
  while (o + DAU_LOG <= b.length) {
    const conLaiKhoi = KHOI_LOG - (o % KHOI_LOG);
    if (conLaiKhoi < DAU_LOG) {
      o += conLaiKhoi; // đầu không vừa hết khối → LevelDB đệm số 0
      continue;
    }
    const dai = b[o + 4] | (b[o + 5] << 8);
    const loai = b[o + 6];
    if (loai === LOAI_LOG.DEM) {
      o += conLaiKhoi; // vùng đệm, hoặc phần tệp chưa ghi tới
      continue;
    }
    if (dai > conLaiKhoi - DAU_LOG) break; // hứa dài hơn khối → ghi dở
    const manh = b.subarray(o + DAU_LOG, o + DAU_LOG + dai);
    o += DAU_LOG + dai;
    if (loai === LOAI_LOG.DU) {
      if (manhDangGi) break;
      themBatch(manh, khoa, kq);
    } else if (loai === LOAI_LOG.DAU) {
      if (manhDangGi) break;
      manhDangGi = [manh];
    } else if (loai === LOAI_LOG.GIUA || loai === LOAI_LOG.CUOI) {
      if (!manhDangGi) break;
      manhDangGi.push(manh);
      if (loai === LOAI_LOG.CUOI) {
        themBatch(gopManh(manhDangGi), khoa, kq);
        manhDangGi = null;
      }
    } else break;
  }
  return kq;
}

// ---------------------------------------------------------------- bảng (.ldb)

function docTayCam(b: Uint8Array, o: number): (TayCam & { dai: number }) | null {
  const offset = docVarint(b, o);
  if (!offset) return null;
  const kichThuoc = docVarint(b, o + offset.dai);
  if (!kichThuoc) return null;
  return { offset: offset.giaTri, kichThuoc: kichThuoc.giaTri, dai: offset.dai + kichThuoc.dai };
}

/** Đọc thân một khối (chưa nén). Mảng điểm khởi động lại phải khớp ranh giới mục — sai là tệp hỏng. */
function docKhoi(noiDung: Uint8Array): MucKhoi[] {
  const loi = (chiTiet: string): never => {
    throw new Error(`khối bảng hỏng (${chiTiet})`);
  };
  const soDiem = docFixed32(noiDung, noiDung.length - 4);
  if (!soDiem) return loi("không có điểm khởi động lại");
  const hetMuc = noiDung.length - 4 - 4 * soDiem;
  if (hetMuc < 0) return loi("mảng điểm khởi động lại vượt quá khối");
  const diem = new Set<number>();
  for (let i = 0; i < soDiem; i++) {
    const d = docFixed32(noiDung, hetMuc + 4 * i);
    if (d === null || d >= hetMuc) return loi("điểm khởi động lại vượt quá phần mục");
    diem.add(d);
  }
  if (!diem.has(0)) return loi("điểm khởi động lại đầu không ở 0");
  const kq: MucKhoi[] = [];
  let doi: Uint8Array = new Uint8Array();
  let o = 0;
  while (o < hetMuc) {
    const chung = docVarint(noiDung, o);
    const rieng = chung && docVarint(noiDung, o + chung.dai);
    const daiGiaTri = rieng && docVarint(noiDung, o + chung.dai + rieng.dai);
    if (!chung || !rieng || !daiGiaTri) return loi("đầu mục cắt cụt");
    const dauKhoa = o + chung.dai + rieng.dai + daiGiaTri.dai;
    const dauGiaTri = dauKhoa + rieng.giaTri;
    const hetGiaTri = dauGiaTri + daiGiaTri.giaTri;
    if (chung.giaTri > doi.length || hetGiaTri > hetMuc) return loi("mục vượt quá khối");
    if (diem.has(o) && chung.giaTri !== 0) return loi("mục tại điểm khởi động lại lại nén tiền tố");
    const khoaMoi = gopManh([doi.subarray(0, chung.giaTri), noiDung.subarray(dauKhoa, dauGiaTri)]);
    kq.push({ khoa: khoaMoi, giaTri: noiDung.subarray(dauGiaTri, hetGiaTri) });
    doi = khoaMoi;
    o = hetGiaTri;
  }
  return kq;
}

/** Khối tại tay cam; khối nén snappy thì giải trước. Loại nén khác hoặc khối hỏng → ném. */
function docKhoiTai(b: Uint8Array, tayCam: TayCam, vai: string): MucKhoi[] {
  const { offset, kichThuoc } = tayCam;
  if (offset + kichThuoc + 5 > b.length) throw new Error(`tay cam khối ${vai} vượt quá tệp`);
  const loaiNen = b[offset + kichThuoc];
  if (loaiNen === 0) return docKhoi(b.subarray(offset, offset + kichThuoc));
  const giai = loaiNen === 1 ? giaiSnappy(b, offset, kichThuoc) : null;
  if (!giai) throw new Error(`khối ${vai} nén hỏng hoặc loại ${loaiNen} — không giải được`);
  return docKhoi(giai);
}

/** So khoá nội bộ: khoá người so từng byte; bằng nhau thì số thứ tự LỚN HƠN đứng TRƯỚC. */
function soKhoaNoiBo(a: Uint8Array, b: Uint8Array): number {
  const da = a.length - 8;
  const db = b.length - 8;
  for (let i = 0; i < Math.min(da, db); i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  if (da !== db) return da < db ? -1 : 1;
  const sa = docFixed64(a, da) ?? 0;
  const sb = docFixed64(b, db) ?? 0;
  return sa === sb ? 0 : sa > sb ? -1 : 1;
}

/** Khoá tìm «mọi phiên bản»: khoá người + số thứ tự lớn nhất đọc chính xác được (2^53-1), loại giá trị. */
const TIM_MOI_PHIEN_BAN = new Uint8Array([0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f]);

/**
 * Các phiên bản của `khoa` trong KHỐI ỨNG VIÊN của bảng — bản MỚI NHẤT bao giờ cũng nằm ở đó: khoá nội bộ
 * sắp theo thứ tự GIẢM dần của số thứ tự nên khối đầu tiên chạm tới là khối của bản mới nhất. Các bản cũ hơn
 * có thể tràn sang khối sau (đo 26/11 trên bảng thật 000005) — không cần đọc vì chỉ bản mới nhất được dùng.
 */
export function docKhoaTuBang(b: Uint8Array, khoa: Uint8Array): BanGhiKhoa[] {
  const kq: BanGhiKhoa[] = [];
  if (b.length < CHAN_BANG) return kq;
  if (docFixed32(b, b.length - 8) !== 0x8b80fb57 || docFixed32(b, b.length - 4) !== 0xdb477524) {
    throw new Error("không phải bảng LevelDB (số magic sai)");
  }
  const chan = b.length - CHAN_BANG;
  const meta = docTayCam(b, chan);
  const chiMuc = meta && docTayCam(b, chan + meta.dai);
  if (!chiMuc) throw new Error("chân trang bảng hỏng");
  // khối duy nhất có thể chứa khoá: mục chỉ mục ĐẦU TIÊN có khoá ≥ khoá tìm
  const tim = gopManh([khoa, TIM_MOI_PHIEN_BAN]);
  const mucChiMuc = docKhoiTai(b, chiMuc, "chỉ mục").find((e) => soKhoaNoiBo(e.khoa, tim) >= 0);
  const tayCam = mucChiMuc && docTayCam(mucChiMuc.giaTri, 0);
  if (!tayCam) return kq;
  for (const e of docKhoiTai(b, tayCam, "ứng viên")) {
    if (e.khoa.length < 8) throw new Error("khoá nội bộ ngắn hơn 8 byte");
    if (!bangKhoa(e.khoa.subarray(0, e.khoa.length - 8), khoa)) continue;
    const dongGoi = docFixed64(e.khoa, e.khoa.length - 8) ?? 0;
    kq.push({ thuTu: Math.floor(dongGoi / 256), xoa: dongGoi % 256 === 0, giaTri: e.giaTri });
  }
  return kq;
}

// ---------------------------------------------------------------- tra đổi token qua cửa API

/** Cửa xác thực của ứng dụng — cùng máy chủ với API dữ liệu, có trong cấu hình công khai của gói JS. */
export const AUTH_API = "https://api.airdna.co/auth";
/** client_id công khai của ứng dụng (faApplicationId trong gói JS) — không phải bí mật. */
export const CLIENT_ID = "5f040464-0aef-48a1-a1d1-daa9fbf81415";
/** Mỗi lời chờ tối đa bấy nhiêu (ứng dụng cũng đặt 15 giây) — nguồn treo không treo lượt. */
const TRAN_CHO_MS = 15_000;
/** Lỗi mạng/5xx: mỗi lời thử lại tối đa bấy nhiêu lần (ứng dụng để 3). 4xx không thử lại. */
const SO_LAN_THU = 3;

/**
 * Lỗi XÁC THỰC — phiên chết hoặc bị từ chối (401/403 phản hồi JSON): dừng CẢ LƯỢT, việc kế tiếp là Mạnh đăng
 * nhập lại. Khác với một lời gọi lỗi lẻ (mạng, 5xx).
 */
export class LoiXacThuc extends Error {
  constructor(nguyenNhan: unknown) {
    super(nguyenNhan instanceof Error ? nguyenNhan.message : String(nguyenNhan), { cause: nguyenNhan });
    this.name = "LoiXacThuc";
  }
}

/** Lỗi BỊ CHẶN — 429, trang thử thách, hay lỗi kèm trang HTML: dừng cả lượt NGAY, không lách. */
export class LoiBiChan extends Error {
  constructor(thongTin: string) {
    super(thongTin);
    this.name = "LoiBiChan";
  }
}

export type PhanHoiSo = { trangThai: number; cfMitigated: string | null; kieuNoiDung: string };
export type LoaiPhanHoi = "ok" | "xac-thuc" | "bi-chan" | "tam-thoi" | "loi";

/** Phân loại một phản hồi HTTP: ok · bị chặn (dừng, không lách) · xác thực (phiên chết) · tạm thời (được thử lại) · lỗi khác. */
export function phanLoaiPhanHoi(r: PhanHoiSo): LoaiPhanHoi {
  if (r.trangThai >= 200 && r.trangThai < 300) return "ok";
  if (r.trangThai === 429 || r.cfMitigated === "challenge" || (r.trangThai >= 400 && /text\/html/i.test(r.kieuNoiDung))) {
    return "bi-chan";
  }
  if (r.trangThai === 401 || r.trangThai === 403) return "xac-thuc";
  if (r.trangThai >= 500) return "tam-thoi";
  return "loi";
}

export type CuaXacThuc = {
  rateLimit: { take(n?: number): Promise<void> };
  /** Chỉ để test nối vào — mặc định fetch toàn cục. */
  fetchImpl?: typeof fetch;
  log?: (...a: unknown[]) => void;
};

/** Một lời POST tới cửa xác thực. Mỗi lần gửi (kể cả thử lại) = một rateLimit.take(). */
async function goiXacThuc(
  duong: string,
  than: unknown,
  idToken: string | null,
  cua: CuaXacThuc,
  vai: string,
): Promise<Record<string, unknown>> {
  const fetchImpl = cua.fetchImpl ?? fetch;
  for (let lan = 1; ; lan++) {
    await cua.rateLimit.take();
    let res: Response;
    try {
      res = await fetchImpl(`${AUTH_API}${duong}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(than),
        signal: AbortSignal.timeout(TRAN_CHO_MS),
      });
    } catch (e) {
      if (lan >= SO_LAN_THU) throw new Error(`${vai}: lỗi mạng sau ${lan} lần — ${e instanceof Error ? e.message : String(e)}`);
      cua.log?.(`  ↻ ${vai}: lỗi mạng, thử lại (${lan + 1}/${SO_LAN_THU})`);
      continue;
    }
    const loai = phanLoaiPhanHoi({
      trangThai: res.status,
      cfMitigated: res.headers.get("cf-mitigated"),
      kieuNoiDung: res.headers.get("content-type") ?? "",
    });
    // thông điệp chỉ mang tên bước và mã trạng thái — không bao giờ mang giá trị phiên
    if (loai === "bi-chan") {
      throw new LoiBiChan(`BỊ CHẶN ở ${vai} (HTTP ${res.status}${res.headers.get("cf-mitigated") === "challenge" ? ", trang thử thách" : ""}) — dừng cả lượt, không lách`);
    }
    if (loai === "xac-thuc") throw new LoiXacThuc(new Error(`HTTP ${res.status} ở ${vai} — phiên bị từ chối`));
    if (loai === "tam-thoi" && lan < SO_LAN_THU) {
      cua.log?.(`  ↻ ${vai}: HTTP ${res.status}, thử lại (${lan + 1}/${SO_LAN_THU})`);
      continue;
    }
    if (loai !== "ok") throw new Error(`HTTP ${res.status} ở ${vai}`);
    try {
      return (await res.json()) as Record<string, unknown>;
    } catch {
      throw new Error(`thân phản hồi ở ${vai} không phải JSON`);
    }
  }
}

/**
 * Tra đổi refresh token lấy appToken bằng đúng hai lời ứng dụng vẫn gửi:
 *   POST /v1/fetch_id_token   thân {refresh_token, client_id}        → {id_token, refresh_token?}
 *   POST /v1/fetch_app_token  đầu Authorization: Bearer <id_token>   → {token}   (appToken, hạn 15 phút)
 * Thân lời hai để rỗng: tài khoản thường không giả danh (impersonate_id, ingress_params đều rỗng trên đĩa).
 * `refreshToken` trả về là cái để dùng tiếp trong lượt — khác cái đưa vào khi nguồn xoay phiên.
 */
export async function doiToken(
  refreshToken: string,
  cua: CuaXacThuc,
): Promise<{ appToken: string; refreshToken: string }> {
  if (!refreshToken) throw new LoiXacThuc(new Error("profile không có refresh token — cần đăng nhập lại"));
  const kq1 = await goiXacThuc("/v1/fetch_id_token", { refresh_token: refreshToken, client_id: CLIENT_ID }, null, cua, "fetch_id_token");
  const idToken = typeof kq1.id_token === "string" ? kq1.id_token : "";
  if (!idToken) throw new LoiXacThuc(new Error("fetch_id_token: phản hồi không có id_token"));
  const diTiep = typeof kq1.refresh_token === "string" && kq1.refresh_token ? kq1.refresh_token : refreshToken;
  const kq2 = await goiXacThuc("/v1/fetch_app_token", {}, idToken, cua, "fetch_app_token");
  const appToken = typeof kq2.token === "string" ? kq2.token : "";
  if (!appToken) throw new LoiXacThuc(new Error("fetch_app_token: phản hồi không có token"));
  return { appToken, refreshToken: diTiep };
}

// ---------------------------------------------------------------- cả kho của profile

/**
 * Bản ghi `khoa` MỚI NHẤT trong kho localStorage của profile, đã giải mã và parse JSON.
 * Trả null khi profile chưa đăng nhập (không có kho, không có bản ghi, hoặc bản mới nhất là xoá, hoặc không
 * phải JSON). Có tệp không đọc được → ném lỗi nói tên tệp: khi đó không biết bản mới nhất nằm ở đâu.
 */
export function docPhienTuProfile(thuMucProfile: string, khoa: Uint8Array): unknown {
  const thuMuc = join(thuMucProfile, "Default", "Local Storage", "leveldb");
  let teps: string[];
  try {
    teps = readdirSync(thuMuc);
  } catch {
    return null;
  }
  let moiNhat: BanGhiKhoa | null = null;
  for (const ten of teps.filter((t) => /\.(log|ldb)$/.test(t))) {
    const b = readFileSync(join(thuMuc, ten));
    let cac: BanGhiKhoa[];
    try {
      cac = ten.endsWith(".log") ? docKhoaTuLog(b, khoa) : docKhoaTuBang(b, khoa);
    } catch (e) {
      throw new Error(`${ten}: không đọc được bản ghi phiên — ${e instanceof Error ? e.message : String(e)}`, {
        cause: e,
      });
    }
    for (const r of cac) {
      if (!moiNhat || r.thuTu > moiNhat.thuTu) moiNhat = r;
    }
  }
  if (!moiNhat || moiNhat.xoa) return null;
  try {
    return JSON.parse(giaiMaGiaTri(moiNhat.giaTri));
  } catch {
    return null;
  }
}
