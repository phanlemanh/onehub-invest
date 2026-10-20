/**
 * oneinvest-zalo-pipe — message:received (zalouser)
 * Gate Kev :8009 (noul is_bds, ngưỡng 0.9) → POST :9210/agent-report.
 * Không ném lỗi — hook quan sát, tác dụng phụ phải tự im lặng.
 */
import { appendFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const KEV = process.env.ONEINVEST_KEV_URL ?? "http://127.0.0.1:8009";
const API = process.env.ONEINVEST_API_URL ?? "http://127.0.0.1:9210";
const KEY_FILE = join(homedir(), ".openclaw/credentials/oneinvest-agent.key");
const LOG = join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log");
const THRESHOLD = 0.9;

const log = (line) =>
  appendFile(LOG, `${new Date().toISOString()} ${line}\n`).catch(() => {});

export default async function (context) {
  // Hình dạng lời gọi khác nhau theo phiên bản runtime: InternalHookEvent đặt
  // payload ở .context; một số đường cũ bọc .event. Đọc phòng thủ cả ba.
  const ev = context?.event ?? context?.context ?? context ?? {};
  if (ev.channelId !== "zalouser") return;
  const text = (ev.content ?? "").trim();
  const mediaFacts = (ev.media ?? ev.originalMedia ?? [])
    .filter((m) => m && (m.mediaPath || m.mediaUrl))
    .slice(0, 10)
    .map((m) => ({ path: m.mediaPath ?? null, url: m.mediaUrl ?? null, type: m.mediaType ?? null }));
  const hasMedia = mediaFacts.length > 0;
  if (!text && !hasMedia) {
    await log(`skip (rỗng) group=${ev.metadata?.channelName ?? "?"} account=${account}`);
    return;
  }
  if (!text && hasMedia) {
    await log(`media-only captured (${mediaFacts.length} ảnh) group=${ev.metadata?.channelName ?? "?"} account=${account}`);
  }
  const meta = ev.metadata ?? {};
  const group = meta.channelName || meta.threadId || ev.conversationId || "zalo-group";
  // đa tài khoản: gán nguồn cho mọi dòng log (_phase 2 attribution)
  const account = ev.accountId ?? meta.accountId ?? meta.account ?? "?";
  // MessageReceivedHookContext.timestamp là Unix ms (number) — API collector
  // cần ISO string; đőd đủ mọi dạng đầu vào.
  const ts =
    typeof ev.timestamp === "number"
      ? new Date(ev.timestamp).toISOString()
      : (ev.timestamp ?? new Date().toISOString());

  let p = null;
  try {
    const r = await fetch(`${KEV}/v1/systemone`, {
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
    });
    if (r.ok) p = (await r.json())?.answers?.is_bds?.noul ?? null;
  } catch (e) {
    await log(`gate-error ${e.message} group=${group} account=${account}`);
    return;
  }
  if (p === null || p < THRESHOLD) {
    await log(`skip p=${p === null ? "null" : p.toFixed(2)} group=${group} account=${account}`);
    return;
  }

  try {
    const key = (await readFile(KEY_FILE, "utf8")).trim();
    const r = await fetch(`${API}/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        agent_id: "openclaw-hook",
        group,
        messages: [
          {
            text,
            ts,
            // G1: người đăng + media + luồng — PII tầng A, chỉ máy local
            senderName: ev.metadata?.senderName ?? null,
            senderId: ev.metadata?.senderId ?? ev.from ?? null,
            conversationId: ev.conversationId ?? null,
            media: mediaFacts.length ? mediaFacts : undefined,
          },
        ],
      }),
    });
    const body = await r.text();
    await log(`post ${r.status} ${body.slice(0, 60)} group=${group} p=${p.toFixed(2)} account=${account} by=${ev.metadata?.senderName ?? "?"}${hasMedia ? ` media=${mediaFacts.length}` : ""}`);
  } catch (e) {
    await log(`post-error ${e.message} group=${group} account=${account}`);
  }
}
