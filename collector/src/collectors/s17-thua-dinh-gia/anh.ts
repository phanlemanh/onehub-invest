/**
 * Phần tải ảnh của bộ thu S17 (mốc mở rộng, claudedp-2411-73): tải TOÀN BỘ ảnh dự án vào kho chuẩn.
 *
 * Ảnh nằm trong payload chi tiết dự án đã thu, dưới dạng link có chữ ký hiệu lực 7 ngày (đo 25/11: `X-Amz-Expires`
 * 604800). Pha ảnh KHÔNG gọi API của nguồn và không cần phiên: chỉ tải tệp tĩnh bằng fetch của Node, theo quy ước
 * chung của DATA-CONTRACT — ảnh gốc trong thư mục snapshot dưới `media/<băm 16 của URL>.<đuôi>`, manifest khai sha256
 * và số byte, item ghi bảng đối chiếu `meta.mediaFiles`.
 *
 * Hai lớp máy chủ (Mạnh chốt 25/11: «Lấy cả ảnh ở máy chủ ngoài»):
 * - «nguon» — máy chủ lưu trữ của chính nguồn (đuôi đọc từ cấu hình local, tầng A). Máy chủ này trả 403 không phải
 *   hết hạn, 429, hay trang HTML thay cho ảnh (trang thử thách) là BỊ CHẶN → dừng cả lượt.
 * - «ngoai» — mọi máy chủ công khai khác (ảnh chèn từ nơi khác), chỉ khi được bật. Máy chủ nào chặn thì ghi lý do
 *   «bị chặn ở máy chủ này», bỏ qua máy chủ đó, không lách — không tính là bị chặn từ nguồn.
 * - «cam» — mọi địa chỉ nội bộ (localhost, dải riêng, liên kết địa phương), giao thức khác http/https, và máy chủ
 *   ngoài khi chưa được bật: không bao giờ gửi lời nào tới. Chuyển hướng cũng được kiểm từng bước theo cùng luật
 *   (fetch không được tự đi theo chuyển hướng).
 *
 * Lỗi của riêng một tệp được phân theo nguyên nhân: vĩnh viễn (hết hạn, sai chữ ký, không còn, 4xx khác, quá cỡ,
 * tệp rỗng, máy chủ không tồn tại, chứng chỉ hỏng) ghi nhận một lần; tạm (mạng, 5xx, hết giờ) thì lượt sau thử lại.
 */
import { createHash } from "node:crypto";
import { lookup as lookupHeDieuHanh } from "node:dns/promises";
import { isIP } from "node:net";

const DUOI_THEO_KIEU: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "application/pdf": ".pdf",
};
const DUOI_THEO_TEN = /^(jpe?g|png|webp|gif|bmp|avif|svg|mp4|pdf)$/i;

/** 16 hex đầu của sha256(URL) — vừa là tên tệp, vừa là khoá tiến độ. Cùng URL (ảnh dùng lại) = cùng tệp. */
export const hashUrl = (url: string): string => createHash("sha256").update(url).digest("hex").slice(0, 16);

export const tenTepCua = (url: string, duoi: string): string => `media/${hashUrl(url)}${duoi}`;

/**
 * Đuôi tệp theo kiểu nội dung; link của nguồn không có đuôi nhưng mang `response-content-type`. Không đoán mò là
 * jpg (quy ước chung đặt .jpg mặc định — ở đây ảnh gốc mới là thứ cần giữ đúng loại).
 */
export function duoiCua(kieu: string | null | undefined, url: string): string {
  let tuUrl: string | null = null;
  try {
    tuUrl = new URL(url).searchParams.get("response-content-type");
  } catch {
    tuUrl = null;
  }
  for (const k of [kieu, tuUrl]) {
    if (!k) continue;
    const d = DUOI_THEO_KIEU[k.split(";")[0].trim().toLowerCase()];
    if (d) return d;
  }
  let m: RegExpMatchArray | null = null;
  try {
    m = new URL(url).pathname.match(/\.([a-z0-9]+)$/i);
  } catch {
    m = null;
  }
  if (m && DUOI_THEO_TEN.test(m[1])) return `.${m[1].toLowerCase().replace("jpeg", "jpg")}`;
  return ".bin";
}

/** Máy chủ (bỏ cổng) bằng đuôi, hoặc kết thúc bằng «.đuôi» — cùng luật cho phép máy chủ của core/media-fetch. */
export function hostDuocPhep(url: string, duoi: string[]): boolean {
  let host: string;
  try {
    host = new URL(url).host.toLowerCase().replace(/:\d+$/, "");
  } catch {
    return false;
  }
  return duoi.some((d) => {
    const x = d.toLowerCase();
    return host === x || host.endsWith(`.${x}`);
  });
}

/** Địa chỉ nội bộ: không bao giờ gửi lời nào tới. */
function mayChuNoiBo(host: string): boolean {
  if (host === "" || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".home.arpa")) return true;
  if (host.includes(":")) {
    // IPv6: chỉ nhận dạng ánh xạ IPv4 để kiểm tiếp (URL chuẩn hoá «::ffff:8.8.8.8» thành «::ffff:808:808»);
    // mọi địa chỉ IPv6 khác coi là cấm (không cần tới).
    const cham = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(host);
    if (cham) return ip4NoiBo(cham[1]);
    const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(host);
    if (hex) {
      const a = parseInt(hex[1], 16);
      const b = parseInt(hex[2], 16);
      return ip4NoiBo(`${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`);
    }
    return true;
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return ip4NoiBo(host);
  // Dạng số lạ của IPv4 (thập phân, hex, thiếu từng octet): không đoán — cấm.
  return /^(0x[0-9a-f]+|[\d.]+)$/.test(host);
}

function ip4NoiBo(ip: string): boolean {
  const o = ip.split(".").map(Number);
  if (o.length !== 4 || o.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return true;
  return (
    o[0] === 0 ||
    o[0] === 10 ||
    (o[0] === 100 && o[1] >= 64 && o[1] <= 127) ||
    o[0] === 127 ||
    (o[0] === 169 && o[1] === 254) ||
    (o[0] === 172 && o[1] >= 16 && o[1] <= 31) ||
    (o[0] === 192 && o[1] === 168) ||
    o[0] >= 224
  );
}

/** IPv6 → tám nhóm 16 bit (nhận cả dạng kết hợp `…:a.b.c.d` và `[địa chỉ]`); không đọc được → null. */
function ip6ThanhSo(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const iVung = s.indexOf("%"); // định danh vùng của link-local: bỏ
  if (iVung >= 0) s = s.slice(0, iVung);
  let v4: number[] | null = null;
  const cuoiV4 = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (cuoiV4) {
    v4 = cuoiV4[2].split(".").map(Number);
    s = `${cuoiV4[1]}0:0`;
  }
  const phan = s.split("::");
  if (phan.length > 2) return null;
  const trai = phan[0] ? phan[0].split(":") : [];
  const phai = phan.length === 2 ? (phan[1] ? phan[1].split(":") : []) : [];
  const n = trai.length + phai.length;
  if (n > 8 || (phan.length === 1 && n !== 8)) return null;
  const ra = [...trai, ...Array(8 - n).fill("0"), ...phai].map((x) => (/^[0-9a-f]{1,4}$/.test(x) ? parseInt(x, 16) : NaN));
  if (ra.some((x) => Number.isNaN(x))) return null;
  if (v4) {
    ra[6] = (v4[0] << 8) | v4[1];
    ra[7] = (v4[2] << 8) | v4[3];
  }
  return ra;
}

function ip6NoiBo(r: number[]): boolean {
  const [a, b, c, d, e, f, g, h] = r;
  const ip4Cua = (x: number, y: number) => `${x >> 8}.${x & 255}.${y >> 8}.${y & 255}`;
  if (a === 0 && b === 0 && c === 0 && d === 0) {
    if (e === 0 && f === 0xffff) return ip4NoiBo(ip4Cua(g, h)); // ::ffff:a.b.c.d
    return true; // ::, ::1 và các dạng cũ của ::/96
  }
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) return ip4NoiBo(ip4Cua(g, h)); // NAT64 64:ff9b::/96
  if (a === 0x2002) return ip4NoiBo(ip4Cua(b, c)); // 6to4 mang IPv4 trong hai nhóm đầu
  if (a === 0x100 && b === 0 && c === 0 && d === 0) return true; // 100::/64 (chỉ bỏ đi)
  if (a === 0x2001 && (b === 0 || b === 0xdb8)) return true; // Teredo 2001::/32, tài liệu 2001:db8::/32
  if ((a & 0xfe00) === 0xfc00 || (a & 0xffc0) === 0xfe80 || (a & 0xff00) === 0xff00) return true; // ULA, link-local, multicast
  return (a & 0xe000) !== 0x2000; // ngoài dải unicast công khai 2000::/3
}

/**
 * Địa chỉ IP có thuộc dải nội bộ/đặc biệt không (cho kết quả giải tên máy chủ): IPv4 dải riêng, IPv6 loopback/ULA/
 * link-local/multicast và mọi dạng mang IPv4 trong ruột. Không đọc được → coi là nội bộ (cấm).
 */
export function diaChiNoiBo(ip: string): boolean {
  const s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const v6 = ip6ThanhSo(s);
  if (v6) return ip6NoiBo(v6);
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(s) ? ip4NoiBo(s) : true;
}

/** Giải tên máy chủ thành mọi địa chỉ; mặc định dùng bộ giải của hệ điều hành (cùng nguồn với fetch). */
export type GiaiTen = (host: string) => Promise<string[]>;

const GIAI_TEN_MAC_DINH: GiaiTen = async (host) => (await lookupHeDieuHanh(host, { all: true, verbatim: true })).map((x) => x.address);

/** Máy chủ ngoài có tên trỏ tới (một trong các) địa chỉ nội bộ thì không được kết nối. */
async function giaiVaoNoiBo(host: string, giai: GiaiTen): Promise<boolean> {
  if (isIP(host)) return false; // địa chỉ viết thẳng: phanLoaiMayChu đã kiểm
  return (await giai(host)).some(diaChiNoiBo);
}

export type LopMayChu = "nguon" | "ngoai" | "cam";

export type MayChuOptions = {
  /** Đuôi máy chủ lưu trữ của chính nguồn — đọc từ cấu hình local (tầng A). */
  duoiNguon: string[];
  /** Có lấy ảnh ở máy chủ ngoài hay không (Mạnh chốt 25/11). */
  keNgoai: boolean;
};

/** Phân loại URL theo lớp máy chủ, trước khi gửi lời nào. */
export function phanLoaiMayChu(url: string, o: MayChuOptions): LopMayChu {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "cam";
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return "cam";
  if (mayChuNoiBo(u.hostname.toLowerCase().replace(/^\[|\]$/g, ""))) return "cam";
  if (hostDuocPhep(url, o.duoiNguon)) return "nguon";
  return o.keNgoai ? "ngoai" : "cam";
}

export type LoiAnh =
  | "ok"
  /** Bị chặn thật ở máy chủ của nguồn: dừng cả lượt. */
  | "chan"
  | "het-han"
  | "sai-chu-ky"
  | "khong-con"
  /** 4xx khác (400, 422…): tham số sai, hỏi lại cũng vậy. */
  | "http-4xx"
  /** Lỗi tạm: mạng, 5xx, hết giờ. */
  | "loi"
  | "qua-co"
  /** Tệp 0 byte: không phải ảnh. */
  | "rong"
  | "cam-may-chu"
  | "chuyen-huong-cam"
  | "qua-nhieu-chuyen-huong"
  | "may-chu-khong-ton-tai"
  | "may-chu-khong-tra-loi"
  | "chung-chi"
  /** Máy chủ ngoài chặn (403, 429, trang thử thách): bỏ qua máy chủ đó. */
  | "chan-o-may-chu"
  /** Quá số lượt thử với lỗi tạm. */
  | "qua-so-lan-thu";

/** Lỗi vĩnh viễn: hỏi lại cũng vậy, ghi nhận một lần rồi thôi. Chỉ `loi` là tạm (và `chan` là dừng cả lượt). */
export const LOI_VINH_VIEN_ANH: ReadonlySet<string> = new Set<LoiAnh>([
  "het-han",
  "sai-chu-ky",
  "khong-con",
  "http-4xx",
  "qua-co",
  "rong",
  "cam-may-chu",
  "chuyen-huong-cam",
  "qua-nhieu-chuyen-huong",
  "may-chu-khong-ton-tai",
  "may-chu-khong-tra-loi",
  "chung-chi",
  "chan-o-may-chu",
  "qua-so-lan-thu",
]);

/**
 * Phân loại phản hồi không phải 200 của máy chủ ảnh. Link ký số đã quá hạn thì kho lưu trữ cũng trả 403 kèm XML
 * «Request has expired» — đó là "het-han", không phải bị chặn.
 */
export function phanLoiPhanHoi(status: number, contentType: string | null | undefined, than: string): LoiAnh {
  if (status === 200) return "ok";
  if (status === 403) {
    if (/Request has expired|ExpiredToken/i.test(than)) return "het-han";
    if (/SignatureDoesNotMatch/i.test(than)) return "sai-chu-ky";
    return "chan";
  }
  if (status === 429) return "chan";
  if (status === 404 || status === 410) return "khong-con";
  if (status >= 400 && status < 500) return "http-4xx";
  return "loi";
}

/** Lỗi mạng theo nguyên nhân: không phân giải được tên hay chứng chỉ hỏng là vĩnh viễn; còn lại là tạm. Nhận cả lỗi của fetch (code trong `cause`) và của bộ giải tên (code ở gốc). */
function phanLoiMang(e: unknown): { loi: LoiAnh; chiTiet: string } {
  const goc = e as { cause?: { code?: unknown }; code?: unknown } | null;
  const code = String(goc?.cause?.code ?? goc?.code ?? "");
  if (/^ENOTFOUND|^EAI_FAIL|^EAI_NODATA|^EAI_NONAME/.test(code)) return { loi: "may-chu-khong-ton-tai", chiTiet: code };
  if (/^CERT_|^ERR_TLS_|SELF_SIGNED|ALTNAME/.test(code)) return { loi: "chung-chi", chiTiet: code };
  if (/^ECONNREFUSED|^ENETUNREACH|^EHOSTUNREACH/.test(code)) return { loi: "may-chu-khong-tra-loi", chiTiet: code };
  if (/TIMEOUT|timed out/i.test(`${code} ${e instanceof Error ? e.name : ""}`)) return { loi: "loi", chiTiet: "timeout" };
  return { loi: "loi", chiTiet: code || (e instanceof Error ? e.name : "mang") };
}

export type KetQuaTai = { url: string; loi: LoiAnh; bytes?: Buffer; kieu?: string; http: number; chiTiet?: string };

export type TaiAnhOptions = MayChuOptions & {
  maxBytes: number;
  timeoutMs: number;
  userAgent: string;
  /** Đệm thử trong test; mặc định fetch toàn cục. */
  fetchImpl?: typeof fetch;
  /** Đệm thử trong test; mặc định hỏi bộ giải của hệ điều hành (chỉ máy chủ ngoài mới hỏi). */
  dnsLookup?: GiaiTen;
  /** Số bước chuyển hướng nhiều nhất (mặc định 5). */
  toiDaChuyenHuong?: number;
};

const CHUYEN_HUONG = new Set([301, 302, 303, 307, 308]);

/**
 * Tải một tệp. Không bao giờ để fetch tự đi theo chuyển hướng: mỗi bước đều kiểm máy chủ đích trước khi gửi. Máy chủ
 * ngoài lấy từ nội dung dự án nên tên có thể trỏ vào dải riêng: giải tên xong mới kết nối (khoảng hở: tên đổi bản ghi
 * giữa lúc giải và lúc kết nối — hẹp, chấp nhận ở máy thu này).
 */
export async function taiAnh(url: string, o: TaiAnhOptions): Promise<KetQuaTai> {
  const toiDa = o.toiDaChuyenHuong ?? 5;
  let hienTai = url;
  for (let buoc = 0; buoc <= toiDa; buoc++) {
    const lop = phanLoaiMayChu(hienTai, o);
    if (lop === "cam") return { url, loi: buoc === 0 ? "cam-may-chu" : "chuyen-huong-cam", http: 0 };
    if (lop === "ngoai") {
      let vaoNoiBo: boolean;
      try {
        vaoNoiBo = await giaiVaoNoiBo(new URL(hienTai).hostname.replace(/^\[|\]$/g, ""), o.dnsLookup ?? GIAI_TEN_MAC_DINH);
      } catch (e) {
        return { url, http: 0, ...phanLoiMang(e) };
      }
      if (vaoNoiBo) return { url, loi: buoc === 0 ? "cam-may-chu" : "chuyen-huong-cam", http: 0, chiTiet: "dns-noi-bo" };
    }
    let res: Response;
    try {
      res = await (o.fetchImpl ?? fetch)(hienTai, { headers: { "user-agent": o.userAgent }, redirect: "manual", signal: AbortSignal.timeout(o.timeoutMs) });
    } catch (e) {
      return { url, http: 0, ...phanLoiMang(e) };
    }
    if (CHUYEN_HUONG.has(res.status)) {
      const den = res.headers.get("location");
      if (!den) return { url, loi: "khong-con", http: res.status, chiTiet: "chuyen-huong-khong-dich" };
      let dich: URL;
      try {
        dich = new URL(den, hienTai);
      } catch {
        return { url, loi: "chuyen-huong-cam", http: res.status };
      }
      hienTai = dich.href;
      continue;
    }
    const kieu = res.headers.get("content-type") ?? "";
    if (res.status === 200) {
      // 200 nhưng là trang HTML: trang thử thách thay cho ảnh — bị chặn, không lưu.
      if (/text\/html|application\/xhtml/i.test(kieu)) return { url, loi: "chan", http: 200, chiTiet: "trang-html" };
      const reader = res.body?.getReader();
      if (!reader) return { url, loi: "rong", http: 200, chiTiet: "no-body" };
      const chunks: Buffer[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > o.maxBytes) {
          await reader.cancel().catch(() => undefined);
          return { url, loi: "qua-co", http: 200 };
        }
        chunks.push(Buffer.from(value));
      }
      if (total === 0) return { url, loi: "rong", http: 200 };
      return { url, loi: "ok", bytes: Buffer.concat(chunks), kieu, http: 200 };
    }
    const than = (await res.text().catch(() => "")).slice(0, 4000);
    return { url, loi: phanLoiPhanHoi(res.status, kieu, than), http: res.status, chiTiet: than.replace(/\s+/g, " ").slice(0, 120) };
  }
  return { url, loi: "qua-nhieu-chuyen-huong", http: 0 };
}
