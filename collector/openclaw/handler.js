/**
 * oneinvest-zalo-pipe — message:received (zalouser)
 * Gate Kev :8009 (noul is_bds) → NHÃN, không lọc (claudedp-2310-11): MỌI tin
 * đẩy vào collector kèm điểm kev; quyết định dùng p nằm ở transform. Không
 * ném lỗi — hook quan sát, tác dụng phụ phải tự im lặng.
 *
 * ZC6 (claudedp-2310-5 mở lại): TỰ CHỨA toàn bộ logic spool/kev — hook chạy
 * trong tiến trình gateway, KHÔNG import từ bản build collector (đường tương
 * đối chết khi cài vào ~/.openclaw/hooks/; build collector đổi giữa chừng
 * cũng không ảnh hưởng hook). Tên file spool là HASH RIÊNG (không tự đoán
 * sourceId của server — server tự dedup khi gửi lại).
 */
import { appendFile, readFile, writeFile, mkdir, readdir, rename, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const KEV = process.env.ONEINVEST_KEV_URL ?? "http://127.0.0.1:8009";
const API = process.env.ONEINVEST_API_URL ?? "http://127.0.0.1:9210";
const KEY_FILE = join(homedir(), ".openclaw/credentials/oneinvest-agent.key");
const LOG = join(homedir(), ".openclaw/logs/oneinvest-zalo-pipe.log");
// Spool từng-tin-một-file (append-only, O_EXCL). Chỉ máy local (PII tầng A).
const SPOOL_DIR = process.env.ONEINVEST_HOOK_SPOOL ?? join(homedir(), ".openclaw/spool/oneinvest-zalo-pipe");
const THRESHOLD = 0.9;

const log = (line) =>
  appendFile(LOG, `${new Date().toISOString()} ${line}\n`).catch(() => {});

// ---- spool ZC6: hash riêng chỉ để ĐẶT TÊN file (idempotent khi gửi lại
// trùng) — dedup thật nằm ở collector (sourceId server), không sao chép
// công thức của server (mở lại 2310-5: hai công thức sẽ lệch khi server đổi).
const normRef = (s) => String(s ?? "").trim().replace(/[?#]+$/, "");
const spoolFileFor = (group, message) => {
  const urls = (message.media ?? [])
    .map((m) => normRef(m.url ?? m.path))
    .filter(Boolean)
    .sort()
    .join(",");
  const h = createHash("sha256")
    .update([group, message.ts, message.text, message.senderId ?? "", urls].join("|"))
    .digest("hex")
    .slice(0, 32);
  return join(SPOOL_DIR, `${h}.json`);
};

async function spoolPut(group, message) {
  await mkdir(SPOOL_DIR, { recursive: true }).catch(() => {});
  await writeFile(spoolFileFor(group, message), JSON.stringify({ group, message }), {
    flag: "wx",
  }).catch((e) => {
    if (e?.code !== "EEXIST") throw e; // tin trùng đã nằm spool — im
  });
}

// Trả {status, body, ok} — body 60 ký tự đầu cho KHUÔN LOG CŨ
// 'post <status> <body> group=…' (vòng 3: 5 nơi đọc ' post 202' + '"accepted":'
// gồm push-ops-facts, collections-queries silent-gate, audit-all, harness kev-nhan).
async function postOne(key, group, message) {
  try {
    const r = await fetch(`${API}/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ agent_id: "openclaw-hook", group, messages: [message] }),
      signal: AbortSignal.timeout(8_000),
    });
    const body = (await r.text()).slice(0, 60);
    return { status: r.status, body, ok: r.ok };
  } catch {
    return { status: 0, body: "", ok: false }; // status 0 = mạng/timeout
  }
}

/**
 * Xả spool (vòng 3 claudedp-2310-5; 2410-23 claudedp):
 * - DỪNG ở file hỏng ĐẦU TIÊN (collector treo → mỗi file hết 8s; chờ tuần tự
 *   cả hàng làm gateway chờ theo) và CAP SPOOL_DRAIN_MAX file mỗi lượt (50).
 * - 2410-23: chỉ 400/413/422 là 4xx VĨNH VIỄN → rejected/ (không chặn hàng,
 *   không gửi lại). 401/403/404 và mọi 4xx khác (kể cả 408/429) là TẠM THỜI —
 *   giữ lại spool thử lượt sau, log 'spool-held <status>' MỘT dòng mỗi lượt.
 * - 2410-23: TRẦN THỜI GIAN cho CẢ LƯỢT xả (mặc định 10s từ đầu lượt,
 *   ONEINVEST_HOOK_DRAIN_BUDGET_MS) — hết trần thì dừng xả, phần còn lại để
 *   lượt sau; tin mới vẫn gửi một lần với timeout hiện có.
 * - Mạng/timeout/5xx (status 0/5xx): giữ lại đợi lượt sau.
 */
const SPOOL_DRAIN_MAX = 50;
const SPOOL_DRAIN_BUDGET_MS = Number(process.env.ONEINVEST_HOOK_DRAIN_BUDGET_MS ?? 10_000);
const REJECT_4XX = new Set([400, 413, 422]);
const SPOOL_REJECTED = join(SPOOL_DIR, "rejected");
async function drainSpool(key) {
  let files = [];
  try {
    files = (await readdir(SPOOL_DIR)).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return; // chưa có spool
  }
  const batDau = Date.now();
  const giuLai = new Set(); // log 'spool-held <status>' một dòng mỗi lượt
  for (const f of files.slice(0, SPOOL_DRAIN_MAX)) {
    if (Date.now() - batDau >= SPOOL_DRAIN_BUDGET_MS) break; // hết trần lượt — phần còn lại để lượt sau
    let rec;
    try {
      rec = JSON.parse(await readFile(join(SPOOL_DIR, f), "utf8"));
    } catch {
      continue; // file hỏng định dạng — bỏ qua file này, không tính là 'hỏng đầu'
    }
    const r = await postOne(key, rec.group, rec.message);
    if (r.ok) {
      await rm(join(SPOOL_DIR, f)).catch(() => {});
      continue;
    }
    if (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429) {
      if (REJECT_4XX.has(r.status)) {
        // vĩnh viễn — chuyển rejected, KHÔNG chặn hàng
        await mkdir(SPOOL_REJECTED, { recursive: true }).catch(() => {});
        await rename(join(SPOOL_DIR, f), join(SPOOL_REJECTED, f)).catch(() => {});
        await log(`spool-rejected ${r.status} ${r.body.slice(0, 40)} file=${f}`);
        continue;
      }
      // 401/403/404 + 4xx khác (2410-23): tạm thời — giữ file, không chặn hàng
      giuLai.add(r.status);
      continue;
    }
    // collector treo/lỗi tạm thời — DỪNG ở file hỏng đầu, đợi lượt sau
    // (break, không return: log 'spool-held' đã thu trong lượt vẫn phải ra)
    break;
  }
  for (const st of [...giuLai].sort((a, b) => a - b)) {
    await log(`spool-held ${st}`);
  }
}

/** Kev :8009 điểm is_bds; timeout 5s (treo thì hook KHÔNG treo); chỉ nhận
 *  số hữu hạn (NaN/Infinity/string → null = chưa phân loại). */
async function kevScore(text) {
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
      signal: AbortSignal.timeout(5_000),
    });
    if (!r.ok) return null;
    const raw = (await r.json())?.answers?.is_bds?.noul;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  } catch {
    return null;
  }
}

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

  const p = await kevScore(text);
  if (p === null) await log(`kev null (timeout/gate) group=${group} account=${account}`);

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
    // drain spool cũ trước, rồi đẩy tin mới; fail thì vào spool (ZC6)
    await drainSpool(key);
    const r = await postOne(key, group, message);
    if (!r.ok) {
      await spoolPut(group, message);
      await log(`spool +1 group=${group} account=${account}`);
      return;
    }
    // KHUÔN LOG CŨ — 'post <status> <body60>' (5 nơi đọc chuỗi này, vòng 3)
    await log(`post ${r.status} ${r.body} group=${group} p=${p === null ? "null" : p.toFixed(2)} account=${account} by=${ev.metadata?.senderName ?? "?"}${hasMedia ? ` media=${mediaFacts.length}` : ""}`);
  } catch (e) {
    // bất kỳ lỗi ngoài (đọc key/đĩa) — cố spool lại để không mất tin ở nguồn
    try {
      await spoolPut(group, message);
      await log(`post-error → spool ${e.message} group=${group} account=${account}`);
    } catch (e2) {
      await log(`post-error (spool cũng lỗi) ${e.message}/${e2.message} group=${group} account=${account}`);
    }
  }
}
