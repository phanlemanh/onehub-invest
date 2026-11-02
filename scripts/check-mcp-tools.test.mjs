// node --test scripts/check-mcp-tools.test.mjs — tin-rao-tren-invest E6: công cụ MCP của tin rao theo sổ bề mặt.
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadEntries } from "./check-api-surface.mjs";
import { MCP_MSG, MCP_MUTATIONS, checkMcpTools, loadManifest } from "./check-mcp-tools.mjs";

const cong_cu = (manifest, name) => manifest.tools.find((t) => t.name === name);

test("E6 bản khai thật qua; oneinvest_get_listings public, oneinvest_get_offers ops", async () => {
  const entries = await loadEntries();
  const manifest = loadManifest();
  assert.deepEqual(checkMcpTools({ entries, manifest }).violations, []);
  assert.equal(cong_cu(manifest, "oneinvest_get_listings").auth, "public");
  assert.equal(cong_cu(manifest, "oneinvest_get_offers").auth, "ops");
  assert.match(cong_cu(manifest, "oneinvest_get_listings").description, /chưa hứa ổn định/);
});

test("E6 đối chứng: bỏ câu chưa hứa ổn định đỏ ON DINH; bảng đột biến còn đúng thông điệp", async () => {
  const base = { entries: await loadEntries(), manifest: loadManifest() };
  const moi = structuredClone(base);
  const t = cong_cu(moi.manifest, "oneinvest_get_listings");
  t.description = t.description.replace(/[^.]*chưa hứa ổn định[^.]*\./, "");
  assert.ok(checkMcpTools(moi).violations.some((v) => v.includes("ON DINH")));
  for (const [id, , msg, fn] of MCP_MUTATIONS) {
    const hong = fn(base);
    assert.ok(hong, `${id} không áp được`);
    const v = checkMcpTools(hong).violations;
    if (msg === null) assert.deepEqual(v, [], id);
    else assert.ok(v.some((x) => x.includes(msg)), `${id}: ${msg}`);
  }
  assert.ok(MCP_MSG.onDinh.startsWith("ON DINH"));
});
