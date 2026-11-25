/**
 * Pha ảnh dự án của bộ thu S17 (mốc mở rộng, claudedp-2411-73): tải TOÀN BỘ ảnh dự án vào kho chuẩn.
 *
 * Ảnh nằm trong payload chi tiết dự án đã thu, dưới dạng link có chữ ký hiệu lực 7 ngày (đo 25/11: `X-Amz-Expires`
 * 604800). Pha này KHÔNG gọi API của nguồn và không cần phiên: chỉ tải tệp tĩnh bằng fetch của Node, từ đúng các máy
 * chủ lưu trữ của nguồn (đuôi máy chủ đọc từ cấu hình local — tầng A), theo quy ước chung của DATA-CONTRACT: ảnh gốc
 * trong thư mục snapshot dưới `media/<băm 16 của URL>.<đuôi>`, manifest khai sha256 và số byte, item ghi bảng đối
 * chiếu `meta.mediaFiles`.
 *
 * Rào an toàn: 403 (không phải link hết hạn hay sai chữ ký) và 429 là BỊ CHẶN → dừng cả lượt; nhiều lỗi mạng liền
 * nhau → dừng; lỗi của riêng một tệp (hết hạn, không còn, quá cỡ, timeout) chỉ ghi vào bảng đối chiếu, không làm mất
 * gì cả. Không tải từ máy chủ ngoài (ảnh chèn từ nơi khác) — chỉ ghi lại trong bảng đối chiếu kèm lý do.
 */
import { createHash } from "node:crypto";

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

export type LoiAnh = "ok" | "chan" | "het-han" | "sai-chu-ky" | "khong-con" | "loi";

/**
 * Phân loại phản hồi của máy chủ ảnh. "chan" là bị chặn thật (dừng cả lượt); link ký số đã quá hạn thì kho lưu trữ
 * cũng trả 403 kèm XML «Request has expired» — đó là "het-han", không phải bị chặn.
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
  return "loi";
}

export type KetQuaTai = { url: string; loi: LoiAnh; bytes?: Buffer; kieu?: string; http: number; chiTiet?: string };

export type TaiAnhOptions = {
  maxBytes: number;
  timeoutMs: number;
  userAgent: string;
  /** Đệm thử trong test; mặc định fetch toàn cục. */
  fetchImpl?: typeof fetch;
};

export async function taiAnh(url: string, o: TaiAnhOptions): Promise<KetQuaTai> {
  try {
    const res = await (o.fetchImpl ?? fetch)(url, {
      headers: { "user-agent": o.userAgent },
      redirect: "follow",
      signal: AbortSignal.timeout(o.timeoutMs),
    });
    if (res.status !== 200) {
      const than = (await res.text().catch(() => "")).slice(0, 4000);
      return { url, loi: phanLoiPhanHoi(res.status, res.headers.get("content-type"), than), http: res.status, chiTiet: than.replace(/\s+/g, " ").slice(0, 120) };
    }
    const reader = res.body?.getReader();
    if (!reader) return { url, loi: "loi", http: res.status, chiTiet: "no-body" };
    const chunks: Buffer[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > o.maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { url, loi: "loi", http: res.status, chiTiet: "qua-co" };
      }
      chunks.push(Buffer.from(value));
    }
    return { url, loi: "ok", bytes: Buffer.concat(chunks), kieu: res.headers.get("content-type") ?? "", http: res.status };
  } catch (e) {
    const hetGio = e instanceof Error && /timed out|TimeoutError|abort/i.test(`${e.name} ${e.message}`);
    return { url, loi: "loi", http: 0, chiTiet: hetGio ? "timeout" : "mang" };
  }
}
