import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { toRawItems, s08SourceId, fetchPage, fetchProjectDetail } from "../collectors/s08-danh-muc.js";
import type { S08Unit } from "../collectors/s08-danh-muc.js";

/**
 * S08 bước 1 (claudedp-2310-12): item inventory_unit — sourceId ổn định theo
 * căn sha256(S08|project|product_code); payload nguyên vẹn bản ghi API; đủ
 * notSold + sold + detail; không contact_data. Fixture = dữ liệu API thật
 * (không tên miền — base nhận qua tham số/env).
 */

const fixture = JSON.parse(
  // fixture nằm ở src (tsc không chép JSON sang dist) — ../../*2 từ dist/test
  // về src/test, và từ src/test là chính nó
  await readFile(fileURLToPath(new URL("../../src/test/fixtures/s08-ocp2.json", import.meta.url)), "utf8"),
) as { notSold: { data: S08Unit[] }; sold: { data: S08Unit[] }; detail: { data: Record<string, unknown> } };

test("toRawItems: inventory_unit đúng sourceId/meta/payload nguyên vẹn; bỏ bản ghi không mã căn", () => {
  const ns = toRawItems(fixture.notSold.data, { projectId: 900001, projectType: "low_rise", state: "notSold", fetchedAt: "2026-10-24T00:00:00Z" });
  assert.ok(ns.length >= 1);
  const first = fixture.notSold.data[0];
  const it = ns[0];
  assert.equal(it.kind, "inventory_unit");
  assert.equal(it.source, "s08-danh-muc");
  assert.equal(it.sourceId, s08SourceId(900001, String(first.product_code)));
  assert.equal(it.meta?.state, "notSold");
  assert.equal(it.meta?.projectId, "900001");
  assert.deepEqual(it.payload, first, "payload NGUYÊN VẬN bản ghi API");
  assert.equal(JSON.stringify(it).toLowerCase().includes("contact"), false, "không contact_data");

  // bỏ bản ghi không mã căn
  const withJunk = toRawItems([...fixture.notSold.data, { no_code: 1 } as S08Unit], { projectId: 900001, projectType: "low_rise", state: "sold", fetchedAt: "x" });
  assert.equal(withJunk.length, fixture.notSold.data.filter((u) => u.product_code).length);
});

test("fetchPage/fetchProjectDetail: gọi đúng URL + Bearer; phân biệt state; lỗi code≠1 ném rõ", async () => {
  const calls: string[] = [];
  process.env.S08_EP_UNITS = "units-fake";
  process.env.S08_EP_DETAIL = "detail-fake";
  const origFetch = globalThis.fetch;
  const h2s = (h: HeadersInit | undefined): string => {
    if (Array.isArray(h)) return String(h.find((x) => String(x[0]).toLowerCase() === "authorization")?.[1] ?? "");
    if (h && typeof h === "object") return String((h as Record<string, string>).authorization ?? (h as Record<string, string>).Authorization ?? "");
    return "";
  };
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push(u + " | " + h2s(init?.headers));
    if (u.includes("state=sold")) return new Response(JSON.stringify({ code: 1, data: fixture.sold.data }), { status: 200 });
    if (u.includes("/detail-fake/")) return new Response(JSON.stringify({ code: 1, data: fixture.detail }), { status: 200 });
    return new Response(JSON.stringify({ code: 1, data: fixture.notSold.data }), { status: 200 });
  }) as typeof fetch;
  try {
    const p1 = await fetchPage("http://testbase/", "TKN", "900001", "notSold", 1);
    assert.equal(p1.units.length, fixture.notSold.data.length);
    assert.ok(calls[0].includes("project_id=900001") && calls[0].includes("state=notSold") && calls[0].endsWith("Bearer TKN"));
    const p2 = await fetchPage("http://testbase/", "TKN", "900001", "sold", 1);
    assert.equal(p2.units.length, fixture.sold.data.length);
    const d = await fetchProjectDetail("http://testbase/", "TKN", "900001");
    assert.equal(d.project_id, fixture.detail.data.project_id);
    // code≠1 (token hết hạn) → ném rõ
    globalThis.fetch = (async () => new Response(JSON.stringify({ code: 401, error: true }), { status: 200 })) as typeof fetch;
    await assert.rejects(() => fetchPage("http://testbase/", "TKN", "900001", "notSold", 1), /401/);
  } finally {
    globalThis.fetch = origFetch;
    delete process.env.S08_EP_UNITS;
    delete process.env.S08_EP_DETAIL;
  }
});

test("2410-19: strip PII ĐỆ QUY — contact_data lồng mọi độ sâu bị bỏ; catalog item có mặt", async () => {
  const origFetch = globalThis.fetch;
  const detailWithPii = {
    project_id: 900001,
    contact_data: [{ name: "Nguyễn Văn A", phone: "0901234567" }],
    image_data: [{ image_coordinate_name: "KĐ", image_data: [{ image_url: "u" }], contact_data: [{ phone: "09xx" }] }],
    project_info: { project_name: "X", nested: { contact: { phone: "1" }, keep: "ok" } },
  };
  const catalogPage = { code: 1, data: [{ project_id: 900001, project_type: "low_rise", contact_data: [{ name: "B" }] }] };
  process.env.S08_EP_UNITS = "units-fake";
  process.env.S08_EP_CATALOG = "catalog-fake";
  process.env.S08_EP_DETAIL = "detail-fake";
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    const body = u.includes("/detail-fake/") ? { code: 1, data: detailWithPii }
      : u.includes("/catalog-fake/") ? catalogPage
      : { code: 1, data: [] }; // quỹ căn rỗng
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  const prevBase = process.env.S08_API_BASE;
  const prevProjects = process.env.S08_PROJECTS;
  process.env.S08_API_BASE = "http://testbase";
  process.env.S08_PROJECTS = "all";
  try {
    const mod = await import("../collectors/s08-danh-muc.js");
    const fakeCtx = {
      city: { id: "vn", name: "VN", center: [0, 0] },
      rateLimit: { take: async () => {} },
      log: () => {},
      checkpoint: { get: () => undefined, set: () => {} },
      paths: { snapshotRoot: "/tmp", stateDir: "/tmp" },
    };
    const result = await mod.s08DanhMuc.collect(fakeCtx as never);
    const json = JSON.stringify(result.items);
    assert.equal(json.includes("contact"), false, "không còn khoá contact nào ở mọi độ sâu");
    assert.equal(json.includes("phone"), false, "không còn số điện thoại");
    assert.equal(json.includes("Nguyễn Văn A"), false, "không còn tên người");
    assert.ok(json.includes('keep":"ok'), "trường không-phải-người giữ nguyên");
    assert.ok(result.items.some((i: { kind?: string; meta?: { state?: string } }) => i.kind === "project_catalog"), "có item project_catalog");
    assert.ok(result.items.some((i: { kind?: string; meta?: { state?: string } }) => i.kind === "inventory_unit" && i.meta?.state === "detail"), "detail vẫn ghi (đã strip)");
  } finally {
    globalThis.fetch = origFetch;
    if (prevBase === undefined) delete process.env.S08_API_BASE; else process.env.S08_API_BASE = prevBase;
    if (prevProjects === undefined) delete process.env.S08_PROJECTS; else process.env.S08_PROJECTS = prevProjects;
    delete process.env.S08_EP_UNITS;
    delete process.env.S08_EP_CATALOG;
    delete process.env.S08_EP_DETAIL;
  }
});
