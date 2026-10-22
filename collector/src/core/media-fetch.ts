import { createHash } from "node:crypto";

import type { RawItem } from "./types.js";

/**
 * N1 media: tải ảnh từ URL trong payload.media (CDN Zalo *.zdn.vn — URL CÓ
 * HẠN) về thư mục snapshot ngay lúc flush, trước khi gzip items. Mapping ghi
 * ở RawItem.meta.mediaFiles; payload giữ NGUYÊN VĂN (DATA-CONTRACT). Fail-open:
 * URL hỏng/đói mạng chỉ ghi error trong meta — không bao giờ làm mất tin.
 */

export type MediaFileEntry = {
  url: string;
  file?: string;
  sha256?: string;
  bytes?: number;
  error?: string;
};

export type MediaFetchOptions = {
  /** Chỉ tải URL có host (bỏ port) bằng suffix hoặc kết thúc bằng "." + suffix. */
  allowedHostSuffixes?: string[];
  maxBytes?: number;
  timeoutMs?: number;
  /** Cap số URL duy nhất mỗi lần flush — chặn flush lag khi bùng nổ ảnh. */
  maxPerFlush?: number;
  concurrency?: number;
  userAgent?: string;
};

const DEFAULTS = {
  allowedHostSuffixes: ["zdn.vn"],
  maxBytes: 10 * 1024 * 1024,
  timeoutMs: 10_000,
  maxPerFlush: 100,
  concurrency: 4,
  userAgent: "oneinvest-collector/1",
};

const EXT_RE = /\.(jpe?g|png|webp|gif|bmp)(?:[?#]|$)/i;

function hostAllowed(hostWithPort: string, suffixes: string[]): boolean {
  const host = hostWithPort.toLowerCase().replace(/:\d+$/, "");
  return suffixes.some(
    (s) => host === s.toLowerCase() || host.endsWith("." + s.toLowerCase()),
  );
}

function mediaUrlsOf(item: RawItem): string[] {
  const media = (item.payload as { media?: unknown } | null | undefined)?.media;
  if (!Array.isArray(media)) return [];
  const urls: string[] = [];
  for (const m of media) {
    if (m && typeof m === "object" && typeof (m as { url?: unknown }).url === "string") {
      urls.push((m as { url: string }).url);
    }
  }
  return urls;
}

async function downloadOne(
  url: string,
  opts: { maxBytes: number; timeoutMs: number; userAgent: string; allowedHostSuffixes: string[] },
): Promise<{ bytes: Buffer; error?: string }> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": opts.userAgent },
    });
    if (res.status !== 200) return { bytes: Buffer.alloc(0), error: `http-${res.status}` };
    // redirect đã follow — host URL CUỐI cũng phải thuộc allowlist, kẻo
    // kẻ đăng tin dùng redirect zdn.vn → máy lạ để chộm request nội bộ.
    try {
      const finalHost = new URL(res.url).host;
      if (!hostAllowed(finalHost, opts.allowedHostSuffixes)) {
        controller.abort();
        return { bytes: Buffer.alloc(0), error: "redirect-host" };
      }
    } catch {
      // res.url không parse được — giữ URL gốc đã kiểm trước fetch
    }
    const reader = res.body?.getReader();
    if (!reader) return { bytes: Buffer.alloc(0), error: "no-body" };
    const chunks: Buffer[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > opts.maxBytes) {
        controller.abort();
        return { bytes: Buffer.alloc(0), error: "too-large" };
      }
      chunks.push(Buffer.from(value));
    }
    return { bytes: Buffer.concat(chunks) };
  } catch {
    return { bytes: Buffer.alloc(0), error: timedOut ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMessageMedia(params: {
  items: RawItem[];
  /** Ghi file vào snapshot; trả null nếu tên đã ghi (dedup URL trong 1 flush). */
  putFile: (name: string, bytes: Buffer) => Promise<{ sha256: string; bytes: number } | null>;
  options?: MediaFetchOptions;
}): Promise<{ fetched: number; failed: number }> {
  const opts = { ...DEFAULTS, ...(params.options ?? {}) };

  // Gom URL duy nhất theo thứ tự xuất hiện, cap maxPerFlush
  const entries = new Map<string, MediaFileEntry | null>();
  const queue: string[] = [];
  const perItem: { item: RawItem; urls: string[] }[] = [];
  for (const item of params.items) {
    const raw = mediaUrlsOf(item);
    if (raw.length === 0) continue;
    const urls: string[] = [];
    for (const url of raw) {
      if (!entries.has(url)) {
        if (queue.length >= opts.maxPerFlush) break;
        entries.set(url, null);
        queue.push(url);
      }
      urls.push(url);
    }
    perItem.push({ item, urls });
  }
  if (queue.length === 0) return { fetched: 0, failed: 0 };

  const worker = async (): Promise<void> => {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        entries.set(url, { url, error: "bad-url" });
        continue;
      }
      if (
        (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        !hostAllowed(parsed.host, opts.allowedHostSuffixes)
      ) {
        entries.set(url, { url, error: "host-not-allowed" });
        continue;
      }
      const m = EXT_RE.exec(parsed.pathname);
      const ext = m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
      // Tên theo băm URL: cùng URL (repost) = cùng file, ổn định giữa các item
      const name = `media/${createHash("sha256").update(url).digest("hex").slice(0, 16)}${ext}`;
      const dl = await downloadOne(url, opts);
      if (dl.error) {
        entries.set(url, { url, error: dl.error });
        continue;
      }
      try {
        const written = await params.putFile(name, dl.bytes);
        entries.set(
          url,
          written
            ? { url, file: name, sha256: written.sha256, bytes: written.bytes }
            : { url, file: name }, // đã ghi trong flush này — tái dùng
        );
      } catch {
        entries.set(url, { url, error: "write-failed" });
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(opts.concurrency, queue.length) }, worker),
  );

  let fetched = 0;
  let failed = 0;
  for (const { item, urls } of perItem) {
    const files: MediaFileEntry[] = [];
    for (const url of urls) {
      const e = entries.get(url);
      if (!e) continue; // URL bị cắt bởi maxPerFlush — payload vẫn còn URL gốc
      files.push(e);
      if (e.file) fetched++;
      else failed++;
    }
    if (files.length > 0) {
      item.meta = { ...(item.meta ?? {}), mediaFiles: files };
    }
  }
  return { fetched, failed };
}
