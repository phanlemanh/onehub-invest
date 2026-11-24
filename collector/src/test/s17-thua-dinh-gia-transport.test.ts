import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { nodeTransport } from "../collectors/s17-thua-dinh-gia/transport-node.js";

/**
 * Vận chuyển bằng fetch của Node cho phần CÔNG KHAI của S17 (không mang phiên): JSON trả thân chữ, ảnh
 * trả số byte, lỗi mạng ném ra để lớp gọi thử lại. Kiểm bằng một máy chủ HTTP cục bộ.
 */

async function withServer(handler: (url: string, headers: IncomingHttpHeaders, res: import("node:http").ServerResponse) => void, fn: (port: number) => Promise<void>): Promise<void> {
  const server: Server = createServer((req, res) => handler(String(req.url), req.headers, res));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    await fn((server.address() as AddressInfo).port);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

test("nodeTransport: JSON trả thân chữ; ảnh trả số byte, không kéo thân chữ", async () => {
  const seen: IncomingHttpHeaders[] = [];
  await withServer(
    (url, headers, res) => {
      seen.push(headers);
      if (url === "/a") {
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end('{"ok":1}');
      } else {
        res.writeHead(200, { "content-type": "image/png" });
        res.end(Buffer.alloc(1784));
      }
    },
    async (port) => {
      const t = nodeTransport();
      const a = await t(`http://127.0.0.1:${port}/a`, { accept: "application/json" });
      assert.deepEqual(a, { status: 200, contentType: "application/json; charset=utf-8", body: '{"ok":1}' });
      const b = await t(`http://127.0.0.1:${port}/b.png`, {});
      assert.equal(b.status, 200);
      assert.equal(b.bytes, 1784, "ảnh chỉ cần số byte (tile rỗng = 1.784)");
      assert.equal(b.body, "");
      assert.match(String(seen[0]["user-agent"]), /^Mozilla\//, "gửi user-agent của trình duyệt");
      assert.equal(seen[0].accept, "application/json");
    },
  );
});

test("nodeTransport: lỗi mạng ném ra (lớp gọi sẽ thử lại hoặc đối chiếu phiên)", async () => {
  let port = 0;
  await withServer((_url, _headers, res) => res.end(), async (p) => {
    port = p;
  });
  await assert.rejects(nodeTransport()(`http://127.0.0.1:${port}/x`, {}));
});
