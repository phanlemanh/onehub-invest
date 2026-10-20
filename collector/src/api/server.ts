import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { SnapshotWriter } from "../core/storage.js";
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
export type AgentMessage = {
  id?: string;
  text: string;
  ts: string;
  extracted?: unknown;
  senderName?: string | null;
  senderId?: string | null;
  conversationId?: string | null;
  media?: AgentMediaFact[];
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

  const sourceIdOf = (group: string, ts: string, text: string) =>
    createHash("sha256").update(`${group}|${ts}|${text}`).digest("hex").slice(0, 32);

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
      const sourceId = sourceIdOf(b.group!, m.ts, m.text);
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
        meta: { city, agent: b.agent_id, group: b.group, ts: m.ts },
      });
      accepted++;
    }
    acceptedTotal += accepted;
    duplicatesTotal += duplicates;
    return { status: 202, body: { accepted, duplicates } };
  }

  async function flush(): Promise<{ snapshotId: string } | null> {
    if (buffer.length === 0) return null; // không ghi snapshot rỗng (Review Focus #4)
    writer ??= new SnapshotWriter(snapshotRoot, city, "zalo-agent");
    const items = buffer;
    const ids = items.map((i) => i.sourceId);
    // KHÔNG clear buffer trước khi ghi xong — flush fail giữ items cho lần
    // sau (đã ack 202 không được mất âm thầm — review I1a)
    await writer.write(items);
    const manifest = await writer.finalize({
      discovered: items.length,
      captured: items.length,
      failed: 0,
      methods: { agentReport: items.length },
      notes: [`agent ingest; duplicates bỏ từ đầu chạy: ${duplicatesTotal}`],
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
