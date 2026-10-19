import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";

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

export type AgentMessage = { id?: string; text: string; ts: string; extracted?: unknown };

export type AgentReportBody = {
  agent_id: string;
  group: string;
  messages: AgentMessage[];
};

export type IngestResult = { status: number; body: Record<string, unknown> };

export type AgentServerOptions = {
  snapshotRoot: string;
  city: string;
  keys: string[];
  flushAfterItems?: number; // default 50
};

const SEEN_CAP = 5000;

function keyOk(keys: string[], auth: string | null): boolean {
  if (keys.length === 0 || !auth) return false; // fail closed
  const given = Buffer.from(auth.replace(/^Bearer\s+/i, ""));
  return keys.some((k) => {
    const want = Buffer.from(k);
    return given.length === want.length && timingSafeEqual(given, want);
  });
}

export function createAgentServer(opts: AgentServerOptions) {
  const { snapshotRoot, city, keys } = opts;
  const flushAfterItems = opts.flushAfterItems ?? 50;

  let buffer: RawItem[] = [];
  const seen = new Set<string>();
  let writer: SnapshotWriter | null = null;
  let duplicatesTotal = 0;
  let acceptedTotal = 0;

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
        payload: { text: m.text, group: b.group, agent_id: b.agent_id, extracted: m.extracted },
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
    buffer = [];
    await writer.write(items);
    const manifest = await writer.finalize({
      discovered: items.length,
      captured: items.length,
      failed: 0,
      methods: { agentReport: items.length },
      notes: [`agent ingest; duplicates bỏ từ đầu chạy: ${duplicatesTotal}`],
    });
    writer = null; // snapshot mới cho lần flush sau
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
    let raw = "";
    req.on("data", (c) => (raw += c));
    await new Promise<void>((done) => req.on("end", done));
    let body: unknown;
    try {
      body = JSON.parse(raw);
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
