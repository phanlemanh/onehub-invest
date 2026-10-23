/**
 * oneinvest-zalo-pipe — message:received (zalouser)
 * Gate Kev :8009 (noul is_bds) → NHÃN, không lọc (claudedp-2310-11): MỌI tin
 * đẩy vào collector kèm điểm kev; quyết định dùng p nằm ở transform. Không
 * ném lỗi — hook quan sát, tác dụng phụ phải tự im lặng.
 */
import { appendFile, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const KEV = process.env.ONEINVEST_KEV_URL ?? "http://127.0.0.1:8009";
const API = process.env.ONEINVEST_API_URL ?? "http://127.0.0.1:9210";
const KEY_FILE = join(homedir(), ".openclaw/credentials/oneinvest-agent.key");
const LOG = join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log");
// ZC6: spool từng-tin-một-file; tên = sourceId server sẽ tính → gửi lại
// không trùng. Chỉ máy local (PII tầng A).
const SPOOL_DIR = process.env.ONEINVEST_HOOK_SPOOL ?? join(homedir(), ".openclaw/spool/oneinvest-zalo-pipe");
const THRESHOLD = 0.9;

const log = (line) =>
  appendFile(LOG, `${new Date().toISOString()} ${line}\n`).catch(() => {});

export default async function (context) {
  // Hình dạng lời gọi khác nhau theo phiên bản runtime: InternalHookEvent đặt
  // payload ở .context; một số đường cũ bọc .event. Đọc phòng thủ cả ba.
  const ev = context?.event ?? context?.context ?? context ?? {};
  if (ev.channelId !== "zalouser") return;
  const meta = ev.metadata ?? {};
  // đa tài khoản: gán nguồn cho mọi dòng log (_phase 2 attribution)
  const account = ev.accountId ?? meta.accountId ?? meta.account ?? "?";
  const group0 = meta.channelName || meta.threadId || ev.conversationId || "zalo-group";

  // DEBUG (tạm): bắt event shape media thật — user xác nhận nhóm có tin kèm
  // ảnh nhưng mediaFacts luôn rỗng ⇒ field name khác dự kiến. Ghi mọi key
  // trông giống media/ảnh; bỏ khi đã map xong.
  try {
    const mediaish = {};
    for (const k of Object.keys(ev)) {
      if (/media|attach|image|photo|file|thumb/i.test(k)) {
        mediaish[k] = JSON.stringify(ev[k])?.slice(0, 300);
      }
    }
    if (Object.keys(mediaish).length > 0) {
      await log(`dbg-media keys=[${Object.keys(ev).join(",")}] ${JSON.stringify(mediaish).slice(0, 600)} group=${group0}`);
    }
  if (meta.__pregate) {
    await log(`dbg-pregate reason=${meta.__pregate} raw=${String(meta.__raw ?? "").slice(0, 400)} group=${group0}`);
  }
  } catch {}

  const text = (ev.content ?? "").trim();
  // Media Zalo: môi giới dán URL ảnh zdn.vn TRỰC TIẾP trong text (khám phá
  // 2026-10-22 nhờ pregate __raw) — extract bổ sung vào media facts.
  const textImageUrls = [...new Set(
    (text.match(/https?:\/\/[a-z0-9.-]+\/(?:[^\s"]+)\.(?:jpe?g|png|webp)(?:\?[^\s]*)?/gi) ?? [])
  )].slice(0, 5);
  const mediaFacts = (ev.media ?? ev.originalMedia ?? [])
    .filter((m) => m && (m.mediaPath || m.mediaUrl))
    .slice(0, 10)
    .map((m) => ({ path: m.mediaPath ?? null, url: m.mediaUrl ?? null, type: m.mediaType ?? null }));
  for (const u of textImageUrls) {
    mediaFacts.push({ path: null, url: u, type: "image/jpeg" });
  }
  const hasMedia = mediaFacts.length > 0;
  if (!text && !hasMedia) {
    await log(`skip (rỗng) group=${group0} account=${account}`);
    return;
  }
  if (!text && hasMedia) {
    await log(`media-only captured (${mediaFacts.length} ảnh) group=${group0} account=${account}`);
  }
  const group = group0;
  // MessageReceivedHookContext.timestamp là Unix ms (number) — API collector
  // cần ISO string; đőd đủ mọi dạng đầu vào.
  const ts =
    typeof ev.timestamp === "number"
      ? new Date(ev.timestamp).toISOString()
      : (ev.timestamp ?? new Date().toISOString());

  // ZC6 (claudedp-2310-5): logic gửi/kev/spool gom ở dist/core/agent-delivery
  // (có test). Dynamic import — dist chưa build thì rơi về hành vi cũ
  // (post thẳng, không spool), không tệ hơn trước ZC6.
  const delivery = await import("../dist/core/agent-delivery.js").catch(() => null);

  // Kev: treo → timeout → p=null; noul không hữu hạn → p=null (ZC6)
  let p = null;
  if (delivery) {
    p = await delivery.kevScore(text, { kev: KEV, timeoutMs: 5_000 });
    if (p === null) await log(`kev null (timeout/gate) group=${group} account=${account}`);
  } else {
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
      if (r.ok) {
        const raw = (await r.json())?.answers?.is_bds?.noul;
        p = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
      }
    } catch (e) {
      await log(`gate-down (đẩy chưa phân loại) ${e.message} group=${group} account=${account}`);
      p = null;
    }
  }

  // NHÃN thay BỘ LỌC (claudedp-2310-11): mọi tin phải vào raw; p đi kèm.
  const message = {
    text,
    ts,
    // G1: người đăng + media + luồng — PII tầng A, chỉ máy local
    senderName: ev.metadata?.senderName ?? null,
    senderId: ev.metadata?.senderId ?? ev.from ?? null,
    conversationId: ev.conversationId ?? null,
    media: mediaFacts.length ? mediaFacts : undefined,
    kev: { p, model: "kev-latest", threshold: THRESHOLD, at: new Date().toISOString() },
  };

  try {
    const key = (await readFile(KEY_FILE, "utf8")).trim();
    if (delivery) {
      // drain spool cũ trước, rồi đẩy tin mới; fail thì vào spool (ZC6)
      const ok = await delivery.deliverWithSpool(
        { api: API, key, spoolDir: SPOOL_DIR },
        group,
        message,
      );
      await log(
        `${ok ? "post" : "spool"} group=${group} p=${p === null ? "null" : p.toFixed(2)} account=${account} by=${ev.metadata?.senderName ?? "?"}${hasMedia ? ` media=${mediaFacts.length}` : ""}`,
      );
      return;
    }
    // fallback (dist chưa build): post thẳng như trước ZC6
    const r = await fetch(`${API}/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ agent_id: "openclaw-hook", group, messages: [message] }),
    });
    const body = await r.text();
    await log(`post ${r.status} ${body.slice(0, 60)} group=${group} p=${p === null ? "null" : p.toFixed(2)} account=${account} by=${ev.metadata?.senderName ?? "?"}${hasMedia ? ` media=${mediaFacts.length}` : ""}`);
  } catch (e) {
    // post-error: nếu có delivery thì cố spool lại (không mất tin ở nguồn)
    if (delivery) {
      await delivery.spoolPut(SPOOL_DIR, { group, message }).catch(() => {});
      await log(`post-error → spool ${e.message} group=${group} account=${account}`);
      return;
    }
    await log(`post-error ${e.message} group=${group} account=${account}`);
  }
}
