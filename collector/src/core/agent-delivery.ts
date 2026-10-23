/**
 * ZC6 (claudedp-2310-5) — cơ chế gửi tin hook → collector không mất dữ liệu:
 * spool cục bộ append-only (mỗi tin 1 file) + gửi lại khi collector sống lại.
 * Handler (openclaw/handler.js) gọi các hàm này qua dist; nếu dist chưa build
 * thì handler rơi về hành vi cũ (post thẳng) — không tệ hơn trước.
 *
 * Tên file spool = sourceId mà collector-api SẼ tính cho tin đó (sha256 theo
 * DATA-CONTRACT + ZC1) → gửi lại giữ nguyên id, dedup phía server gánh trùng;
 * thư mục từng-file tránh read-modify-write nên nhiều hook chạy đồng thời
 * không mất dòng.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type SpoolMediaFact = { path?: string | null; url?: string | null; type?: string | null };
export type SpoolMessage = {
  text: string;
  ts: string;
  senderName?: string | null;
  senderId?: string | null;
  conversationId?: string | null;
  media?: SpoolMediaFact[];
  kev?: { p: number | null; model: string; threshold: number; at: string } | null;
};
export type SpoolRecord = { group: string; message: SpoolMessage };

export type DeliveryConfig = {
  api: string; // gốc http của collector (vd http://127.0.0.1:9210)
  key: string; // API key
  spoolDir: string;
};

/** sourceId collector-api sẽ tính (đúng công thức server.ts incl. ZC1). */
export function spoolKey(rec: SpoolRecord): string {
  const m = rec.message;
  const h = createHash("sha256").update(`${rec.group}|${m.ts}|${m.text}`);
  if (!m.text) {
    const urls = (m.media ?? [])
      .map((x) => x.url ?? x.path ?? "")
      .filter(Boolean)
      .join(",");
    h.update(`|${m.senderId ?? ""}|${urls}`);
  }
  return h.digest("hex").slice(0, 32);
}

/** Thả tin vào spool (append-only, O_EXCL — tin trùng không nhân file). */
export async function spoolPut(spoolDir: string, rec: SpoolRecord): Promise<void> {
  await mkdir(spoolDir, { recursive: true });
  await writeFile(join(spoolDir, `${spoolKey(rec)}.json`), JSON.stringify(rec), { flag: "wx" }).catch(
    (err: NodeJS.ErrnoException) => {
      if (err.code !== "EEXIST") throw err; // trùng = tin đã nằm spool, im
    },
  );
}

/** POST 1 tin tới /agent-report; true khi 2xx. */
async function postOne(cfg: DeliveryConfig, rec: SpoolRecord): Promise<boolean> {
  try {
    const r = await fetch(`${cfg.api}/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({ agent_id: "openclaw-hook", group: rec.group, messages: [rec.message] }),
      signal: AbortSignal.timeout(8_000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Xả spool: gửi lại từng tin, xoá file khi thành công. Trả số gửi/đọng. */
export async function spoolDrain(
  cfg: DeliveryConfig,
): Promise<{ sent: number; kept: number }> {
  let files: string[] = [];
  try {
    files = (await readdir(cfg.spoolDir)).filter((f) => f.endsWith(".json"));
  } catch {
    return { sent: 0, kept: 0 }; // chưa có spool — bình thường
  }
  let sent = 0;
  for (const f of files) {
    try {
      const rec = JSON.parse(await readFile(join(cfg.spoolDir, f), "utf8")) as SpoolRecord;
      if (await postOne(cfg, rec)) {
        await rm(join(cfg.spoolDir, f)).catch(() => {});
        sent++;
      }
    } catch {
      // file hỏng/đọc loãng — giữ nguyên đợi lượt sau, không gãy drain
    }
  }
  return { sent, kept: files.length - sent };
}

/** Đường gửi chính: drain spool cũ TRƯỚC, rồi đẩy tin mới; fail thì spool. */
export async function deliverWithSpool(cfg: DeliveryConfig, group: string, message: SpoolMessage): Promise<boolean> {
  await spoolDrain(cfg);
  const ok = await postOne(cfg, { group, message });
  if (!ok) await spoolPut(cfg.spoolDir, { group, message });
  return ok;
}

/** noul từ gate: chỉ số hữu hạn mới nhận, còn lại (NaN/Infinity/string/null) → null. */
export function parseNoul(p: unknown): number | null {
  return typeof p === "number" && Number.isFinite(p) ? p : null;
}

/** Hỏi Kev :8009 điểm is_bds cho text; treo/timeout/lỗi → null (chưa phân loại). */
export async function kevScore(
  text: string,
  opts: { kev: string; timeoutMs?: number },
): Promise<number | null> {
  try {
    const r = await fetch(`${opts.kev}/v1/systemone`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        state: text,
        model: "kev-latest",
        questions: {
          is_bds: {
            type: "noul",
            instructions: "Đây có phải là tin rao bất động sản (bán/cho thuê/mua nhà, đất, chung cư)?",
            criteria: {
              true: "Tin đăng rao bán, cho thuê, hoặc tìm mua BĐS, có thể kèm giá/diện tích/địa điểm",
              false: "Trò chuyện, chào hỏi, hỏi đáp, cảm ơn, tin tức, quảng cáo khác chủ đề",
            },
          },
        },
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5_000),
    });
    if (!r.ok) return null;
    return parseNoul((await r.json())?.answers?.is_bds?.noul);
  } catch {
    return null;
  }
}
