/**
 * S08 — danh mục quỹ căn (inventory_unit, PL10 bước 1 / claudedp-2310-12).
 * Mỗi bản ghi = MỘT CĂN trong quỹ chủ đầu tư (mã căn, giá niêm yết, trạng
 * thái notSold/sold) — KHÔNG phải tin rao; không contact_data (endpoint
 * không trả). Chỉ đọc, 1 lần/tuần, ~12 request/run (AGENTS.md luật 5).
 *
 * Xác thực: Authorization Bearer <access_token> từ file token tầng A local
 * (S08_TOKEN_FILE, mặc định ~/.oneinvest/s08-token.json — đăng nhập tay 1
 * lần rồi trích). Tên miền + đường dẫn API KHÔNG nằm trong code: bắt buộc S08_API_BASE
 * (mang TRỌN tiền tố) và ba env endpoint (2610-10 vòng 2).
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Collector, RawItem } from "../core/types.js";

const TOKEN_FILE = process.env.S08_TOKEN_FILE ?? join(homedir(), ".oneinvest/s08-token.json");
// API_BASE đọc TẠI THỜI ĐIỂM collect (không phải lúc module-load) để cấu hình
// runtime/test sau import vẫn tác dụng.
const apiBase = () => process.env.S08_API_BASE ?? ""; // tầng A — mang TRỌN tiền tố, cấu hình local
// 2610-10 vòng 2: ba TÊN endpoint cũng là tầng A (đủ chuỗi để tra ra nguồn) —
// đọc env local, thiếu thì ném rõ như S08_PROJECTS; code chỉ gọi bằng VAI.
const epUnits = () => process.env.S08_EP_UNITS ?? "";
const epCatalog = () => process.env.S08_EP_CATALOG ?? "";
const epDetail = () => process.env.S08_EP_DETAIL ?? "";
const checkEndpoints = () => {
  for (const [v, ten] of [[epUnits(), "S08_EP_UNITS (endpoint danh sách căn)"],
    [epCatalog(), "S08_EP_CATALOG (endpoint danh mục dự án)"],
    [epDetail(), "S08_EP_DETAIL (endpoint chi tiết dự án)"]]) {
    if (!v.trim()) throw new Error(`thiếu env ${ten} (tầng A — cấu hình local, không default trong code)`);
  }
};
/** Danh sách dự án "project_id:type" — mặc định OCP2 → OCP1 → OCP3. */
// 2610-10: KHÔNG hardcode id dự án thật (luật 5 — kho công khai); env local
// (vd ~/.oneinvest/s08.env hoặc lời chạy đêm) khai "all" hoặc "id:loại,…" —
// thiếu thì báo và dừng, không thu mò mặc định.
const projectsArg = () => process.env.S08_PROJECTS ?? "";
// 'all' → khám phá toàn danh mục qua endpoint danh mục khi chạy (mở rộng 24/10:
// Mạnh duyệt 171 dự án; danh mục là nguồn sự thật, thay hardcode).
const PAGE_LIMIT = Number(process.env.S08_PAGE_LIMIT ?? 100);

export type S08Unit = Record<string, unknown> & { product_code?: string };

/** sourceId đề xuất bước 0: sha256(S08|project|product_code) — ổn định theo căn. */
export function s08SourceId(projectId: string | number, productCode: string): string {
  return createHash("sha256").update(`S08|${projectId}|${productCode}`).digest("hex").slice(0, 32);
}

/** Chuyển trang API → RawItem[]. Pure — test bằng fixture không cần mạng. */
export function toRawItems(
  units: S08Unit[],
  ctx: { projectId: string | number; projectType: string; state: "notSold" | "sold"; fetchedAt: string },
): RawItem[] {
  const out: RawItem[] = [];
  for (const u of units) {
    const productCode = typeof u.product_code === "string" ? u.product_code : "";
    if (!productCode) continue; // bản ghi không mã căn — không định danh được
    out.push({
      source: "s08-danh-muc",
      sourceId: s08SourceId(ctx.projectId, productCode),
      kind: "inventory_unit",
      fetchedAt: ctx.fetchedAt,
      // payload NGUYÊN VẬN bản ghi API (đã không chứa contact_data — endpoint
      // chỉ trả trường danh mục; giữ nguyên để pipeline tự suy diễn)
      payload: u,
      meta: {
        city: "vn",
        source: "S08",
        projectId: String(ctx.projectId),
        projectType: u.project_type ?? ctx.projectType,
        state: ctx.state,
        productCode,
      },
    });
  }
  return out;
}

/** Đọc trang API (search) — tách ra để test đổi globalThis.fetch. */
export async function fetchPage(
  base: string,
  token: string,
  projectId: string,
  state: "notSold" | "sold",
  page: number,
): Promise<{ units: S08Unit[]; total: number }> {
  const url =
    `${base}/${epUnits()}/` +
    `?project_id=${projectId}&state=${state}&page=${page}&limit=${PAGE_LIMIT}`;
  const r = await fetch(url, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`S08 API ${r.status} (project ${projectId} state ${state} page ${page})`);
  const j = (await r.json()) as { code?: number; data?: S08Unit[]; total_records?: number };
  if (j.code !== 1 || !Array.isArray(j.data)) throw new Error(`S08 API trả code=${j.code} — token hết hạn?`);
  // total_records nằm ở bản ghi đầu (đo 23/10); trang trống → 0
  return { units: j.data, total: Number(j.total_records ?? j.data[0]?.total_records ?? j.data.length) };
}

/** Danh mục dự án (endpoint danh mục) — dùng khi S08_PROJECTS=all. */
export async function fetchProjectCatalog(
  base: string,
  token: string,
  onPage: (page: { id: string; type: string; raw: Record<string, unknown> }[]) => Promise<void>,
): Promise<number> {
  let page = 1;
  let total = 0;
  for (;;) {
    const r = await fetch(
      `${base}/${epCatalog()}/?limit=${PAGE_LIMIT}&page=${page}`,
      { headers: { accept: "application/json", authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) },
    );
    if (!r.ok) throw new Error(`S08 catalog ${r.status} (page ${page})`);
    const j = (await r.json()) as { code?: number; data?: { project_id: string | number; project_type?: string }[] };
    if (j.code !== 1 || !Array.isArray(j.data) || j.data.length === 0) break;
    await onPage(j.data.map((d) => ({ id: String(d.project_id), type: d.project_type ?? "unknown", raw: d as Record<string, unknown> })));
    total += j.data.length;
    if (j.data.length < PAGE_LIMIT) break;
    page++;
  }
  return total;
}

/** Chi tiết dự án (phân khu trên mặt bằng + project_type chuẩn). */
export async function fetchProjectDetail(
  base: string,
  token: string,
  projectId: string,
): Promise<Record<string, unknown>> {
  const r = await fetch(`${base}/${epDetail()}/?project_id=${projectId}`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`S08 detail ${r.status} (project ${projectId})`);
  const j = (await r.json()) as { code?: number; data?: Record<string, unknown> };
  if (j.code !== 1 || !j.data) throw new Error(`S08 detail code=${j.code}`);
  return j.data;
}

export const s08DanhMuc: Collector = {
  id: "s08-danh-muc",
  description: "S08 inventory_unit quỹ căn OCP1-3 (REST+Bearer token local, chỉ đọc, 1 lần/tuần)",
  requestsPerSecond: 0.3, // ~13 request/run — nhẹ hơn mọi nguồn hiện có
  async collect(ctx) {
    const { log, rateLimit } = ctx;
    const API_BASE = apiBase();
    if (!API_BASE) throw new Error("thiếu env S08_API_BASE (tầng A — cấu hình local, không default trong code)");
    checkEndpoints();
    const { access_token: token } = JSON.parse(await readFile(TOKEN_FILE, "utf8")) as {
      access_token: string;
    };
    if (!token) throw new Error(`không có access_token trong ${TOKEN_FILE} — đăng nhập tay rồi trích lại`);

    const items: RawItem[] = [];
    const methods: Record<string, number> = {};
    const startedAt = new Date().toISOString();

    // Danh sách dự án: 'all' → khám phá từ catalog; ngược lại liệt kê tường minh
    // Chặn PII bằng máy (2410-19): bỏ mọi khoá người (contact_data, name/
    // phone/avatar của người liên hệ) ĐỆ QUY khỏi payload trước khi ghi raw.
    const stripPersonData = (o: unknown): unknown => {
      if (Array.isArray(o)) return o.map(stripPersonData);
      if (o && typeof o === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
          if (/contact_data|contact/i.test(k)) continue; // khoá liên hệ người
          out[k] = stripPersonData(v);
        }
        return out;
      }
      return o;
    };

    let projects: { id: string; type: string; raw?: Record<string, unknown> }[];
    const PROJECTS_ARG = projectsArg();
    if (!PROJECTS_ARG.trim()) {
      throw new Error("thiếu S08_PROJECTS (env local: 'all' hoặc 'id:loại,…') — không thu mò mặc định (2610-10)");
    }
    if (PROJECTS_ARG.trim() === "all") {
      projects = [];
      const n = await fetchProjectCatalog(API_BASE, token, async (page) => {
        projects.push(...page);
        // item danh mục (gộp v4): mỗi dự án 1 RawItem — raw đã lọc PII
        for (const d of page) {
          items.push({
            source: "s08-danh-muc",
            sourceId: createHash("sha256").update(`S08|project|${d.id}`).digest("hex").slice(0, 32),
            kind: "project_catalog",
            fetchedAt: startedAt,
            payload: stripPersonData(d.raw) as Record<string, unknown>,
            meta: { city: "vn", source: "S08", projectId: d.id, projectType: d.type, state: "catalog", productCode: `project-${d.id}` },
          });
        }
        methods.projectCatalog = (methods.projectCatalog ?? 0) + page.length;
      });
      log(`danh mục: ${n} dự án từ endpoint danh mục (S08_PROJECTS=all)`);
    } else {
      projects = PROJECTS_ARG.split(",").map((x) => x.trim()).filter(Boolean).map((x) => {
        const [id, type] = x.split(":");
        return { id, type: type ?? "unknown" };
      });
    }

    for (const p of projects) {
      // chi tiết dự án trước (project_type chuẩn + image_data phân khu)
      await rateLimit.take();
      let detail: Record<string, unknown> | null = null;
      try {
        detail = await fetchProjectDetail(API_BASE, token, p.id);
        const dType = detail.project_type;
        if (typeof dType === "string") p.type = dType;
      } catch (e) {
        log(`project ${p.id}: detail lỗi (${e instanceof Error ? e.message : e}) — vẫn thu search`);
      }
      if (detail) {
        const sid = `project-${p.id}`;
        // 2310-12 + 2410-19(2): chặn PII bằng MÁY — strip đệ quy mọi khoá
        // người (contact_data…) thay vì chỉ destructuring một khoá.
        const detailRest = stripPersonData(detail) as Record<string, unknown>;
        items.push({
          source: "s08-danh-muc",
          sourceId: createHash("sha256").update(`S08|project|${p.id}`).digest("hex").slice(0, 32),
          kind: "inventory_unit",
          fetchedAt: startedAt,
          payload: detailRest,
          meta: { city: "vn", source: "S08", projectId: String(p.id), projectType: p.type, state: "detail", productCode: sid },
        });
        methods.projectDetail = (methods.projectDetail ?? 0) + 1;
      }

      for (const state of ["notSold", "sold"] as const) {
        let page = 1;
        let total = Infinity;
        let got = 0;
        while (got < total) {
          await rateLimit.take();
          const { units, total: t } = await fetchPage(API_BASE, token, p.id, state, page);
          total = t;
          const raw = toRawItems(units, { projectId: p.id, projectType: p.type, state, fetchedAt: startedAt });
          items.push(...raw);
          methods[`${state}Items`] = (methods[`${state}Items`] ?? 0) + raw.length;
          got += units.length;
          log(`project ${p.id} ${state}: trang ${page} → ${raw.length}/${units.length} (total ${total})`);
          if (units.length === 0) break; // hết sạch — chống vòng vô hạn
          page++;
        }
      }
    }

    return {
      items,
      coverage: {
        discovered: items.length,
        captured: items.length,
        failed: 0,
        methods,
        notes: [`S08 quỹ căn ${projects.length} dự án; chỉ đọc, không contact_data`],
      },
    };
  },
};
