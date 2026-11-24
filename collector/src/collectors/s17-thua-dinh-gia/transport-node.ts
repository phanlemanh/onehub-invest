/**
 * Vận chuyển bằng fetch của Node — CHỈ cho phần công khai của S17 (từ điển, đơn giá đất, tile): không mang
 * phiên, không có cookie. Gửi header như trang web của nguồn (Origin, Referer, user-agent trình duyệt):
 * ngoài lớp phiên, nguồn chỉ chặn theo Origin.
 */
import type { Response, Transport } from "./client.js";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const TIMEOUT_MS = 30_000;
const TEXT_LIKE = /json|text|javascript|xml|form/i;

type WebResponse = {
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

/** Chữ giữ nguyên thân; nhị phân (ảnh tile) chỉ giữ số byte — bộ thu không cần nội dung tile. */
export async function fromWebResponse(res: WebResponse): Promise<Response> {
  const contentType = res.headers.get("content-type") ?? "";
  if (TEXT_LIKE.test(contentType)) return { status: res.status, contentType, body: await res.text() };
  const buf = await res.arrayBuffer();
  return { status: res.status, contentType, body: "", bytes: buf.byteLength };
}

export function nodeTransport(): Transport {
  return async (url, headers) => {
    const res = await fetch(url, { headers: { ...headers, "user-agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return fromWebResponse(res);
  };
}
