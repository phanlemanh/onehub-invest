import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { SnapshotWriter } from "../core/storage.js";
import { fetchMessageMedia, type MediaFetchOptions } from "../core/media-fetch.js";
import type { RawItem } from "../core/types.js";

/**
 * Collector API — POST /agent-report (ADR-0006 sửa đổi bởi ADR-0007).
 *
 * Agent (OpenClaw) đẩy tin nhóm Zalo: KHÔNG ghi DB trực tiếp — buffer in-memory
 * rồi flush thành raw snapshot theo DATA-CONTRACT (source=zalo-agent, gzip +
 * sha256 manifest). Transform/canonical là việc của pipeline, chạy trên raw.
 *
 * Fail closed: không có key nào được cấu hình → từ chối mọi request.
 * Dedup: sourceId = sha256(group|ts|text) — agent retry mạng không nhân bản.
 * `extracted` của agent là dữ liệu ngoài → lưu NGUYÊN VẬN trong payload để
 * benchmark đối chiếu; canonical không bao giờ tin nó.
 */

export type AgentMediaFact = { path?: string | null; url?: string | null; type?: string | null };
/** Kev-nhãn (claudedp-2310-11): điểm gate đi CÙNG tin — p=null khi gate down. */
export type AgentKevFact = { p: number | null; model: string; threshold: number; at: string };
export type AgentMessage = {
  id?: string;
  text: string;
  ts: string;
  extracted?: unknown;
  senderName?: string | null;
  senderId?: string | null;
  conversationId?: string | null;
  media?: AgentMediaFact[];
  kev?: AgentKevFact | null;
};

export type AgentReportBody = {
  agent_id: string;
  group: string;
  messages: AgentMessage[];
};

export type IngestResult = { status: number; body: Record<string, unknown> };

export type AgentServerOptions = {
  snapshotRoot: string;
  /** Dedup sống qua restart: id đã thấy lưu stateDir/agent-seen.json. */
  stateDir?: string;
  city: string;
  keys: string[];
  flushAfterItems?: number; // default 50
  /** Ghi đè tuỳ chọn tải media (mặc định: chỉ *.zdn.vn, ≤10MB, timeout 10s). */
  media?: MediaFetchOptions;
};

/** Đọc body gộp BUFFER rồi decode một lần — nối chuỗi từng chunk sẽ corrupt
 *  ký tự đa byte bị chặn ngang ranh giới chunk (payload phải NGUYÊN VẬN). */
export async function readBody(req: { on: Function }): Promise<string> {
  const chunks: Buffer[] = [];
  req.on("data", (c: Buffer) => chunks.push(c));
  await new Promise<void>((done) => req.on("end", done));
  return Buffer.concat(chunks).toString("utf8");
}

const SEEN_CAP = 5000;

/** Còn ít hơn ngưỡng này tới deadline shutdown → bỏ/huỷ bước media (tin > ảnh). */
const MEDIA_CUTOFF_MS = 10_000;

function keyOk(keys: string[], auth: string | null): boolean {
  if (keys.length === 0 || !auth) return false; // fail closed
  const given = Buffer.from(auth.replace(/^Bearer\s+/i, ""));
  return keys.some((k) => {
    const want = Buffer.from(k);
    return given.length === want.length && timingSafeEqual(given, want);
  });
}

export async function createAgentServer(opts: AgentServerOptions) {
  const { snapshotRoot, city, keys } = opts;
  const flushAfterItems = opts.flushAfterItems ?? 50;

  let buffer: RawItem[] = [];
  const seen = new Set<string>();
  let writer: SnapshotWriter | null = null;
  let flushing: Promise<{ snapshotId: string } | null> | null = null;
  /** AbortController của lượt flush ĐANG CHẠY (P2): caller muộn truyền
   *  deadlineAt vẫn huỷ được ảnh của chính lượt đó qua flush(). */
  let flushAbort: AbortController | null = null;
  let duplicatesTotal = 0;
  let acceptedTotal = 0;
  const newIds: string[] = []; // id mới từ lần flush trước — persist xuống state

  // Dedup sống qua restart (review I3): nạp id đã thấy từ stateDir
  const stateFile = opts.stateDir ? join(opts.stateDir, "agent-seen.json") : null;
  if (stateFile) {
    try {
      const arr = JSON.parse(await readFile(stateFile, "utf8")) as string[];
      for (const id of arr) seen.add(id);
    } catch { /* chưa có file — lần đầu */ }
  }

  // ZC1 (claudedp-2310-14): tin CHỈ CÓ ẢNH (text rỗng) — hai tin cùng nhóm
  // cùng ts đụng nhau ở công thức cũ, tin sau bị bỏ ở dedup. Thêm sender +
  // danh sách URL/path media PHỤ SAU text rỗng để tách. Tin CÓ TEXT (dù kèm
  // ảnh) GIỮ NGUYÊN id cũ — không đổi id các tin đã có.
  // ZC1 nối tiếp (claudedp-2310-6): media hỏng (không mảng / phần tử rác)
  // bị LỌC làm lành thay vì làm 500 cả lô; url/path chuẩn hoá (trim + bỏ
  // query/fragment rỗng) và SORT trước băm — thứ tự media không ổn định
  // phải không tạo id mới. Tin CÓ TEXT giữ nguyên công thức legacy.
  const normMedia = (media: unknown): AgentMediaFact[] => {
    if (!Array.isArray(media)) return [];
    return media.filter(
      (m): m is AgentMediaFact =>
        typeof m === "object" &&
        m !== null &&
        (typeof (m as AgentMediaFact).url === "string" || typeof (m as AgentMediaFact).path === "string"),
    );
  };
  // An toàn kiểu (vòng 2 mở lại): đầu vào có thể là số/object từ media rác;
  // chọn CHUỖI ĐẦU TIÊN — url string có nội dung (sau norm) thì dùng, không thì
  // path string, không thì rỗng. Giải quyết {url:5} (5.trim() nổ) và
  // {url:"",path:"/a"} vs {url:"",path:"/b"} (url rỗng che path → gộp nhầm).
  const normRef = (x: unknown): string =>
    typeof x === "string" ? x.trim().replace(/[?#]+$/, "") : "";
  const mediaRefOf = (m: AgentMediaFact): string => {
    const u = normRef(m.url);
    if (u) return u;
    return normRef(m.path);
  };
  const sourceIdOf = (
    group: string,
    ts: string,
    text: string,
    extra?: { senderId?: string | null; media?: AgentMediaFact[] },
  ) => {
    const h = createHash("sha256").update(`${group}|${ts}|${text}`);
    if (!text && extra) {
      const urls = (extra.media ?? [])
        .map((m) => mediaRefOf(m))
        .filter(Boolean)
        .sort()
        .join(",");
      h.update(`|${extra.senderId ?? ""}|${urls}`);
    }
    return h.digest("hex").slice(0, 32);
  };

  function ingest(body: unknown, auth: string | null): IngestResult {
    if (!keyOk(keys, auth)) return { status: 401, body: { error: "unauthorized" } };
    if (typeof body !== "object" || body === null) {
      return { status: 400, body: { error: "body phải là JSON object" } };
    }
    const b = body as Partial<AgentReportBody>;
    if (!b.agent_id || !b.group || !Array.isArray(b.messages) || b.messages.length === 0) {
      return { status: 400, body: { error: "cần agent_id, group, messages (không rỗng)" } };
    }
    for (const m of b.messages) {
      if (!m || typeof m.text !== "string" || typeof m.ts !== "string") {
        return { status: 400, body: { error: "mỗi message cần text + ts" } };
      }
    }
    let accepted = 0;
    let duplicates = 0;
    for (const m of b.messages!) {
      // ZC1 nối tiếp (mở lại 2310-6): trim CHỈ để quyết định media-only;
      // băm tin chữ bằng text NGUYÊN BẢN (giữ id legacy), media làm lành
      // CHỈ dùng cho băm — payload giữ nguyên vẹn như nhận (DATA-CONTRACT).
      const textTrimmedEmpty = m.text.trim() === "";
      const mediaForHash = textTrimmedEmpty ? normMedia(m.media) : undefined;
      const sourceId = sourceIdOf(
        b.group!,
        m.ts,
        textTrimmedEmpty ? "" : m.text,
        { senderId: m.senderId, media: mediaForHash },
      );
      if (seen.has(sourceId)) {
        duplicates++;
        continue;
      }
      seen.add(sourceId);
      if (seen.size > SEEN_CAP) seen.delete(seen.values().next().value as string);
      buffer.push({
        source: "zalo-agent",
        sourceId,
        kind: "post",
        fetchedAt: new Date().toISOString(),
        payload: {
          text: m.text,
          group: b.group,
          agent_id: b.agent_id,
          extracted: m.extracted,
          // G1: người đăng + media (PII tầng A — chỉ máy local, không sync)
          senderName: m.senderName ?? null,
          senderId: m.senderId ?? null,
          conversationId: m.conversationId ?? null,
          media: m.media ?? null,
        },
        meta: {
          city,
          agent: b.agent_id,
          group: b.group,
          ts: m.ts,
          // Kev-nhãn: điểm gate là DỮ LIỆU đi cùng tin (p=null = gate down),
          // quyết định dùng p ở đâu nằm ở transform — không lọc ở collector.
          ...(m.kev ? { kev: m.kev } : {}),
        },
      });
      accepted++;
    }
    acceptedTotal += accepted;
    duplicatesTotal += duplicates;
    return { status: 202, body: { accepted, duplicates } };
  }

  async function doFlush(
    flushOpts?: { skipMedia?: boolean; deadlineAt?: number },
  ): Promise<{ snapshotId: string } | null> {
    if (buffer.length === 0) return null; // không ghi snapshot rỗng (Review Focus #4)
    writer ??= new SnapshotWriter(snapshotRoot, city, "zalo-agent");
    // BẢN CHÉP mảng: tin ingest vào giữa chừng (đang tải ảnh) không lọt vào
    // lượt này — nó nằm lại buffer cho lần flush sau, có ảnh của nó.
    const items = buffer.slice();
    // N1 media: URL ảnh Zalo (zdn.vn) CÓ HẠN — tải về máy TRƯỚC khi gzip items
    // để meta.mediaFiles nằm trong items-*.json.gz. Fail-open: lỗi tải chỉ ghi
    // error trong meta; lỗi hệ thống bỏ qua bước media, tin vẫn phải chảy.
    // Shutdown: sát deadline → skipMedia (không bắt đầu tải); ĐANG tải thì
    // AbortSignal huỷ ở mốc còn MEDIA_CUTOFF tới deadlineAt — không để ảnh
    // treo kéo flush vượt deadline (claudedp-2310-3).
    // ac LUÔN được tạo (kể cả lượt không deadline — định kỳ/auto-flush) và
    // exposures qua flushAbort để một caller muộn truyền deadlineAt vẫn huỷ
    // được ảnh của CHÍNH lượt đang chạy (P2 vòng 3).
    const ac = new AbortController();
    flushAbort = ac;
    let mediaNote = "";
    if (flushOpts?.skipMedia) {
      mediaNote = "; media skipped: sát deadline shutdown";
    } else {
      let abortT: ReturnType<typeof setTimeout> | undefined;
      if (flushOpts?.deadlineAt) {
        const inMs = flushOpts.deadlineAt - Date.now() - MEDIA_CUTOFF_MS;
        abortT = setTimeout(() => ac.abort(), Math.max(0, inMs));
      }
      try {
        const w = writer;
        const stats = await fetchMessageMedia({
          items,
          putFile: (name, bytes) => w.addExtraFile(name, bytes),
          options: opts.media,
          signal: ac.signal,
        });
        if (stats.fetched > 0 || stats.failed > 0) {
          mediaNote = `; media fetched=${stats.fetched} failed=${stats.failed}`;
        }
      } catch (err) {
        mediaNote = `; media skipped: ${err instanceof Error ? err.message : String(err)}`;
      } finally {
        if (abortT) clearTimeout(abortT);
      }
    }
    if (flushAbort === ac) flushAbort = null;
    const ids = items.map((i) => i.sourceId);
    // KHÔNG clear buffer trước khi ghi xong — flush fail giữ items cho lần
    // sau (đã ack 202 không được mất âm thầm — review I1a)
    await writer.write(items);
    const manifest = await writer.finalize({
      discovered: items.length,
      captured: items.length,
      failed: 0,
      methods: { agentReport: items.length },
      notes: [`agent ingest; duplicates bỏ từ đầu chạy: ${duplicatesTotal}${mediaNote}`],
    });
    writer = null; // snapshot mới cho lần flush sau
    buffer = buffer.filter((i) => !ids.includes(i.sourceId));
    if (stateFile) {
      newIds.push(...ids);
      // FIFO cap 5000 — bỏ cũ, giữ mới
      while (seen.size + newIds.length > 5000 && newIds.length > 0) {
        seen.delete(seen.values().next().value as string);
      }
      const persist = [...seen, ...newIds].slice(-5000);
      await mkdir(dirname(stateFile), { recursive: true });
      await writeFile(stateFile, JSON.stringify(persist));
      for (const id of newIds) seen.add(id);
      newIds.length = 0;
    }
    return { snapshotId: manifest.snapshotId };
  }

  /**
   * Single-flight: flush giờ chờ tải ảnh (vài chục giây tới vài phút) nên
   * hai nguồn kích — interval 60s và POST đủ flushAfterItems — có thể chồng
   * nhau. Đang có flush chạy thì caller sau chung đúng promise đó; không ghi
   * đôi snapshot, không finalize manifest hai lần. (Lượt đang chạy không đổi
   * theo flushOpts — shutdown sát deadline sẽ gọi lại lượt mới sau lượt này.)
   */
  function flush(
    flushOpts?: { skipMedia?: boolean; deadlineAt?: number },
  ): Promise<{ snapshotId: string } | null> {
    if (flushing) {
      // P2 (claudedp-2310-3 vòng 3): lượt ĐANG CHẠY (định kỳ 60s hoặc
      // auto-flush ≥50 tin) được bắt đầu KHÔNG deadline — shutdown tới muộn
      // truyền deadlineAt thì single-flight trả đúng promise cũ. Gắn nốt hẹn
      // giờ abort vào AbortController của chính lượt đó: còn < MEDIA_CUTOFF
      // tới mốc thì ảnh đang tải bị huỷ, tin vẫn chảy.
      if (flushOpts?.deadlineAt) {
        const ac = flushAbort;
        if (ac) {
          const inMs = flushOpts.deadlineAt - Date.now() - MEDIA_CUTOFF_MS;
          const t = setTimeout(() => ac.abort(), Math.max(0, inMs));
          t.unref?.(); // không giữ process vì timer này
        }
      }
      return flushing;
    }
    flushing = doFlush(flushOpts).finally(() => {
      flushing = null;
    });
    return flushing;
  }

  /** Bọc http: parse JSON, gọi ingest, auto-flush khi đủ flushAfterItems. */
  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const json = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "POST" || !req.url?.startsWith("/agent-report")) {
      return json(404, { error: "not found" });
    }
    let body: unknown;
    try {
      body = JSON.parse(await readBody(req as unknown as { on: Function }));
    } catch {
      return json(400, { error: "JSON không hợp lệ" });
    }
    const r = ingest(body, req.headers.authorization ?? null);
    if (r.status === 202 && buffer.length >= flushAfterItems) {
      const m = await flush();
      return json(r.status, { ...r.body, flushed: m?.snapshotId });
    }
    return json(r.status, r.body);
  }

  return { ingest, flush, handle, stats: () => ({ accepted: acceptedTotal, duplicates: duplicatesTotal, buffered: buffer.length }) };
}

export type AgentServer = ReturnType<typeof createAgentServer>;
