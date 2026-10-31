import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";

/**
 * Máy chủ tự lấy ảnh tin chỉ có URL gốc (S06, S05) cho chế độ `?media=` của /api/zalo-media (anh-goc-qua-may-chu).
 * URL gốc mang tên miền nguồn thật (tầng A, ADR-0007): trình duyệt không bao giờ thấy nó — thân và header phản hồi
 * lỗi là chữ chung, không chép URL hay tên máy, không ghi log.
 * Bảng chặn (design doc §3, AC-4): chỉ `https:`; tên máy phân giải ra địa chỉ riêng/loopback/link-local (IPv4, IPv6,
 * `::ffff:` ánh xạ) → 403; ≤ 3 chuyển hướng, mỗi bước kiểm lại; nguồn không 2xx, không phải ảnh, quá 8 MB → 502; ảnh ngoài jpeg/png/webp/gif → 415;
 * quá 8 giây → 504. Kết nối đi bằng đúng địa chỉ đã kiểm (`lookup` của `https.request` trả địa chỉ ấy) — chống đổi
 * DNS giữa lúc kiểm và lúc nối.
 */

export type DiaChi = { address: string; family: 4 | 6 };
export type TraDns = (host: string) => Promise<DiaChi[]>;
export type PhanHoiNguon = { status: number; headers: Headers; body: AsyncIterable<Uint8Array> };
export type TaiVe = (url: URL, diaChi: DiaChi, signal: AbortSignal) => Promise<PhanHoiNguon>;

export const THOI_HAN_MS = 8000;
export const TRAN_BYTE = 8 * 1024 * 1024;
export const TRAN_CHUYEN_HUONG = 3;

/** Kiểu ảnh được phục vụ (proxy-anh-chan-svg) — cùng tập với bảng MIME của nhánh ảnh đã tải trong zalo-media.ts.
 *  SVG là tài liệu có thể chứa script nên không bao giờ nằm ở đây. */
export const ANH_CHO_PHEP: ReadonlySet<string> = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Hai lớp chắn cho mọi phản hồi ảnh của /api/zalo-media: trình duyệt không đoán kiểu, và tài liệu mở thẳng chạy trong
 *  hộp cát không script. */
export const HEADER_ANH_AN_TOAN: Readonly<Record<string, string>> = {
  "x-content-type-options": "nosniff",
  "content-security-policy": "sandbox; default-src 'none'",
};

/** `content-type` của nguồn → kiểu chuẩn: bỏ tham số, hạ chữ thường, `image/jpg` → `image/jpeg`; vắng → "". */
export function chuanHoaKieu(raw: string | null): string {
  const t = (raw ?? "").split(";")[0].trim().toLowerCase();
  return t === "image/jpg" ? "image/jpeg" : t;
}

const loi = (status: 403 | 404 | 415 | 502 | 504) =>
  new Response(
    status === 403
      ? "nguồn ảnh bị chặn"
      : status === 415
        ? "định dạng ảnh không được phép"
        : status === 504
          ? "nguồn ảnh quá giờ"
          : "không lấy được ảnh",
    {
      status,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...HEADER_ANH_AN_TOAN },
    },
  );

const v4So = (ip: string) => ip.split(".").reduce((n, p) => n * 256 + Number(p), 0);
const trongDai = (ip: string, goc: string, bit: number) => {
  const mask = bit === 0 ? 0 : (0xffffffff << (32 - bit)) >>> 0;
  return ((v4So(ip) & mask) >>> 0) === ((v4So(goc) & mask) >>> 0);
};
const DAI_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["224.0.0.0", 3], // multicast + dành riêng tới hết
];

/** Địa chỉ không được phép gọi tới: riêng, loopback, link-local, không xác định, multicast; IPv6 tương ứng và `::ffff:` ánh xạ. */
export function laDiaChiChan(ip: string): boolean {
  const kieu = isIP(ip);
  if (kieu === 4) return DAI_V4.some(([goc, bit]) => trongDai(ip, goc, bit));
  if (kieu !== 6) return true; // không phải IP → chặn
  const v = ip.toLowerCase();
  const anhXa = v.match(/^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/) ?? v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (anhXa) return laDiaChiChan(anhXa[1]);
  const hex = v.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const a = parseInt(hex[1], 16);
    const b = parseInt(hex[2], 16);
    return laDiaChiChan(`${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`);
  }
  if (v === "::" || v === "::1") return true;
  const dau = parseInt(v.split(":")[0] || "0", 16);
  if ((dau & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((dau & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((dau & 0xff00) === 0xff00) return true; // multicast ff00::/8
  return false;
}

const traDnsMacDinh: TraDns = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((a) => ({ address: a.address, family: a.family === 6 ? 6 : 4 }));

/** Gọi https tới đúng `diaChi` đã kiểm (SNI và header Host vẫn là tên máy gốc). */
const taiVeMacDinh: TaiVe = (url, diaChi, signal) =>
  new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        signal,
        headers: { accept: "image/*", "user-agent": "onehub-ops-media/1" },
        lookup: (_h, opts, cb) => {
          // Node gọi lookup với all: true ở bản mới — trả mảng; ngược lại trả một địa chỉ.
          if ((opts as { all?: boolean }).all) (cb as (e: null, a: DiaChi[]) => void)(null, [diaChi]);
          else (cb as (e: null, a: string, f: number) => void)(null, diaChi.address, diaChi.family);
        },
      },
      (res) => {
        const headers = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (typeof v === "string") headers.set(k, v);
          else if (Array.isArray(v)) headers.set(k, v.join(", "));
        }
        resolve({ status: res.statusCode ?? 0, headers, body: res });
      },
    );
    req.on("error", reject);
    req.end();
  });

const laQuaGio = (err: unknown) => {
  const name = (err as { name?: string } | null)?.name;
  return name === "TimeoutError" || name === "AbortError";
};

export async function layAnhGoc(
  url: string,
  deps: { traDns?: TraDns; taiVe?: TaiVe; thoiHanMs?: number; tranByte?: number; tranChuyenHuong?: number } = {},
): Promise<Response> {
  const traDns = deps.traDns ?? traDnsMacDinh;
  const taiVe = deps.taiVe ?? taiVeMacDinh;
  const tranByte = deps.tranByte ?? TRAN_BYTE;
  const tranChuyenHuong = deps.tranChuyenHuong ?? TRAN_CHUYEN_HUONG;
  const signal = AbortSignal.timeout(deps.thoiHanMs ?? THOI_HAN_MS);

  let cur: URL;
  try {
    cur = new URL(url);
  } catch {
    return loi(502);
  }

  try {
    for (let buoc = 0; ; buoc++) {
      if (cur.protocol !== "https:") return loi(403);
      const host = cur.hostname.replace(/^\[|\]$/g, "");
      let diaChi: DiaChi[];
      if (isIP(host)) diaChi = [{ address: host, family: isIP(host) === 6 ? 6 : 4 }];
      else {
        try {
          diaChi = await traDns(host);
        } catch (err) {
          if (signal.aborted || laQuaGio(err)) return loi(504);
          return loi(502);
        }
      }
      if (diaChi.length === 0) return loi(502);
      if (diaChi.some((d) => laDiaChiChan(d.address))) return loi(403);
      if (signal.aborted) return loi(504);

      const res = await taiVe(cur, diaChi[0], signal);
      if (res.status >= 300 && res.status < 400) {
        if (buoc >= tranChuyenHuong) return loi(502);
        const loc = res.headers.get("location");
        if (!loc) return loi(502);
        try {
          cur = new URL(loc, cur);
        } catch {
          return loi(502);
        }
        continue;
      }
      if (res.status < 200 || res.status >= 300) return loi(502);
      const type = chuanHoaKieu(res.headers.get("content-type"));
      if (!type.startsWith("image/")) return loi(502);
      // Kiểu ảnh ngoài danh sách (SVG, icon, avif…) bị từ chối TRƯỚC khi đọc thân nguồn.
      if (!ANH_CHO_PHEP.has(type)) return loi(415);
      const khai = Number(res.headers.get("content-length"));
      if (Number.isFinite(khai) && khai > tranByte) return loi(502);

      const phan: Uint8Array[] = [];
      let tong = 0;
      for await (const chunk of res.body) {
        tong += chunk.byteLength;
        if (tong > tranByte) return loi(502);
        phan.push(chunk);
      }
      if (signal.aborted) return loi(504);
      const buf = new Uint8Array(tong);
      let o = 0;
      for (const p of phan) {
        buf.set(p, o);
        o += p.byteLength;
      }
      return new Response(buf, {
        headers: { "content-type": type, "cache-control": "private, max-age=300", ...HEADER_ANH_AN_TOAN },
      });
    }
  } catch (err) {
    if (signal.aborted || laQuaGio(err)) return loi(504);
    return loi(502);
  }
}
