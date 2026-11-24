/**
 * Bốn pha của bộ thu S17 (mốc ngày 1, claudedp-2411-20): kiểm phiên · bảng tham chiếu · mặt nạ tile ·
 * dự án (danh sách → chi tiết + cây toà + thư viện ảnh). Trạng thái (`state`) được lưu sau từng bước
 * nên dừng giữa chừng rồi chạy lại chỉ làm phần còn lại. Mọi lời gọi đi qua S17Client (trần, dừng khi
 * bị chặn); mọi item đi qua BatchWriter (lô nhỏ, schemaVersion 17).
 */
import { ConfigError } from "./config.js";
import { HttpStatusError, RunStopped, TemporaryFailure, type S17Client } from "./client.js";
import { hasApartmentTable, makeItem, projectIdOf, tileBases } from "./kinds.js";
import type { BatchWriter } from "./store.js";

export type Phase = "session-check" | "reference" | "tile-mask" | "projects";

/** Một tỉnh trong lưới tile đã chọn sẵn (chỉ điểm nằm trên đất), sinh ngoài bộ thu từ bảng địa giới. */
export type GridEntry = { marketId: string; name: string; tiles: string[] };

export type RunState = {
  listDone: boolean;
  /** Trang danh sách sẽ lấy kế tiếp (tính từ 0) — dừng giữa danh sách rồi chạy lại đi từ đây. */
  listNextPage: number;
  projectIds: string[];
  detailDone: string[];
  detailFailed: Record<string, string>;
  /** Mã quận đã lấy bảng đơn giá đất. */
  priceDone: string[];
  /** Id tỉnh đã quét xong mặt nạ tile. */
  tileDone: string[];
};

export function emptyState(): RunState {
  return { listDone: false, listNextPage: 0, projectIds: [], detailDone: [], detailFailed: {}, priceDone: [], tileDone: [] };
}

export type PhaseSummary = { phase: Phase; calls: number; items: number; failed: number; alive?: boolean };

export type RunOptions = {
  phase: Phase;
  client: S17Client;
  writer: BatchWriter;
  state: RunState;
  save: () => Promise<void>;
  log: (event: Record<string, unknown>) => void;
  now?: () => Date;
  grid?: GridEntry[];
  listSize?: number;
  tileZoom?: number;
  /** Kích thước của tile rỗng (đo 18/11: 1.784 byte). */
  emptyTileBytes?: number;
};

type Envelope<T = unknown> = { status?: boolean; message?: string | null; data?: T; pagination?: unknown; extra?: unknown };
type ListEnvelope = Envelope<{ projects?: { content?: unknown[]; totalElements?: number; totalPages?: number } }>;

const listOf = (data: unknown): unknown[] => (Array.isArray(data) ? data : Array.isArray((data as { content?: unknown[] } | null)?.content) ? (data as { content: unknown[] }).content : []);
const byteCount = (res: { body: string; bytes?: number }): number => res.bytes ?? Buffer.byteLength(res.body);

/**
 * Chỉ lưu trạng thái khi bộ đệm của trình ghi đã rỗng. Trạng thái không bao giờ nói «đã làm» cho việc
 * chưa chốt xuống đĩa (lượt thật 24/11: chốt snapshot hỏng mà trạng thái vẫn ghi đã lấy bốn trang).
 * Nếu gãy giữa chừng, phần đã lấy nhưng chưa ghi nhận sẽ được lấy lại (tối đa một lô).
 */
async function checkpoint(o: RunOptions): Promise<void> {
  if (o.writer.pendingCount === 0) await o.save();
}

/** Chốt phần đang dở rồi lưu trạng thái — dùng ở các điểm kết thúc logic (hết một trang, một tỉnh…). */
async function commit(o: RunOptions): Promise<void> {
  await o.writer.flush();
  await o.save();
}

async function sessionCheck(o: RunOptions): Promise<PhaseSummary> {
  const body = await o.client.getJson<Envelope>("data-available", {});
  return { phase: o.phase, calls: o.client.calls, items: 0, failed: 0, alive: body?.status !== false };
}

/** Bảng tham chiếu: từ điển, danh mục tỉnh → quận, đơn giá đất theo quận. Ba vai này công khai, không cần phiên. */
async function reference(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  let items = 0;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const size = (data: unknown): number | null => (Array.isArray(data) ? data.length : data && typeof data === "object" ? Object.keys(data).length : null);
  const one = async (sourceId: string, request: Record<string, unknown>, body: Envelope, extra: Record<string, unknown> = {}): Promise<void> => {
    await o.writer.add(makeItem("static_config", sourceId, { json: body }, { request, congKhai: true, soPhanTu: size(body?.data), ...extra }, at()));
    items++;
  };

  const full = await o.client.getJson<Envelope>("full-config", {});
  await one("static-cau-hinh-day-du", {}, full);
  const provinces = await o.client.getJson<Envelope>("province-catalog", {});
  await one("static-danh-muc-tinh", {}, provinces, { soTinh: listOf(provinces?.data).length });
  for (const type of [1, 2, 3]) await one(`static-tu-dien-thuoc-tinh-${type}`, { property_type: type }, await o.client.getJson<Envelope>("attribute-dictionary", { property_type: type }));
  for (const type of [1, 2]) await one(`static-giay-to-phap-ly-${type}`, { type }, await o.client.getJson<Envelope>("legal-docs", { type }));
  for (const [role, sourceId] of [["asset-type", "static-loai-tai-san"], ["confidence", "static-do-tin-cay"], ["land-purpose", "static-muc-dich-su-dung-dat"]] as const) {
    await one(sourceId, {}, await o.client.getJson<Envelope>(role, {}));
  }

  const codeOf = (entry: unknown): string => {
    const v = (entry as { code?: unknown } | null)?.code;
    return v === undefined || v === null ? "" : String(v);
  };
  // Mã tỉnh trùng trong danh mục (đo 24/11: 71 mục, 63 mã — 8 mã vừa là tỉnh mới vừa là tỉnh cũ đã sáp
  // nhập): mỗi mã chỉ lấy danh sách quận MỘT lần. Mục không có mã (mục trống đầu danh sách) bị bỏ và đếm.
  const provinceCodes = [...new Set(listOf(provinces?.data).map(codeOf).filter(Boolean))];
  let districtsSeen = 0;
  for (const provinceCode of provinceCodes) {
    const catalog = await o.client.getJson<Envelope>("province-catalog", { area_code: provinceCode });
    const entries = listOf(catalog?.data);
    const districts = entries.filter((d) => codeOf(d));
    await one(`static-danh-muc-quan-${provinceCode}`, { area_code: provinceCode }, catalog, { soQuan: districts.length, boQuaKhongMa: entries.length - districts.length });
    for (const d of districts) {
      const districtCode = codeOf(d);
      districtsSeen++;
      if (o.state.priceDone.includes(districtCode)) continue;
      const price = await o.client.getJson<Envelope>("land-price-by-district", { districtCode });
      const rows = listOf(price?.data).length || listOf((price?.data as { vt_list?: unknown } | null)?.vt_list).length;
      await o.writer.add(makeItem("gia_ubnd", `ubnd-${districtCode}`, { json: price }, { request: { districtCode, provinceCode }, congKhai: true, soViTri: rows }, at()));
      items++;
      o.state.priceDone.push(districtCode);
      await checkpoint(o);
    }
    o.log({ suKien: "gia-dat-theo-quan", maTinh: provinceCode, soQuan: districts.length });
  }
  await commit(o);
  o.log({ suKien: "tham-chieu-xong", soQuanDaThay: districtsSeen, soQuanDaLay: o.state.priceDone.length });
  return { phase: o.phase, calls: o.client.calls - started, items, failed: 0 };
}

/** Mặt nạ vùng có ranh thửa: quét các tile đã chọn, chỉ giữ tile có dữ liệu; không tải ảnh vào snapshot. */
async function tileMask(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const zoom = o.tileZoom ?? 17;
  const empty = o.emptyTileBytes ?? 1784;
  const grid = o.grid ?? [];
  // Kiểm cả lưới TRƯỚC lời gọi đầu: địa chỉ phải là "z/x/y" đúng mức quét, nếu không dừng mà không gọi nguồn.
  const badGrid = grid.find((g) => !/^vn-[a-z0-9-]+$/.test(g.marketId) || g.tiles.some((t) => !new RegExp(`^${zoom}/\\d{1,8}/\\d{1,8}$`).test(t)));
  if (badGrid) throw new ConfigError(`lưới tile có địa chỉ sai khuôn "z/x/y" (mong mức ${zoom}) ở tỉnh ${badGrid.marketId}`);
  const full = await o.client.getJson<Envelope>("full-config", {});
  const base = tileBases(full).ranh_thua;
  if (!base) throw new ConfigError("cấu hình đầy đủ của nguồn không có cơ sở tile ranh thửa");
  let items = 0;
  let failed = 0;
  for (const entry of grid) {
    if (o.state.tileDone.includes(entry.marketId)) continue;
    const has: string[] = [];
    let rong = 0;
    let vang = 0;
    let loi = 0;
    for (const tile of entry.tiles) {
      let res;
      try {
        res = await o.client.getTile(base, tile);
      } catch (e) {
        if (e instanceof TemporaryFailure) {
          loi++;
          continue;
        }
        throw e;
      }
      if (res.status === 404 || res.status === 204) vang++;
      else if (res.status >= 400) loi++;
      else if (byteCount(res) === empty) rong++;
      else has.push(tile);
    }
    await o.writer.add(
      makeItem(
        "tile_coverage",
        `coverage-${entry.marketId}`,
        { tiles: has },
        { request: { zoom }, congKhai: true, ten: entry.name, soDiemQuet: entry.tiles.length, trong: has.length, rong, vang, loi },
        (o.now ?? (() => new Date()))().toISOString(),
      ),
    );
    items++;
    failed += loi;
    o.state.tileDone.push(entry.marketId);
    await commit(o);
    o.log({ suKien: "mat-na-tile", tinh: entry.marketId, soDiemQuet: entry.tiles.length, trong: has.length, rong, vang, loi });
  }
  return { phase: o.phase, calls: o.client.calls - started, items, failed };
}

async function fetchProjectList(o: RunOptions, size: number): Promise<void> {
  let page = o.state.listNextPage;
  let totalPages = Infinity;
  const seen = new Set(o.state.projectIds);
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  while (page < totalPages) {
    const body = await o.client.getJson<ListEnvelope>("project-list", { query: "", page, size });
    const content = body?.data?.projects?.content ?? [];
    totalPages = Number(body?.data?.projects?.totalPages ?? 0);
    let noId = 0;
    for (const entry of content) {
      const id = projectIdOf(entry);
      if (id === null) noId++;
      else if (!seen.has(id)) {
        seen.add(id);
        o.state.projectIds.push(id);
      }
    }
    await o.writer.add(
      makeItem(
        "du_an_list",
        `trang-${page + 1}`,
        { json: body },
        { request: { query: "", page, size }, tongDuAn: Number(body?.data?.projects?.totalElements ?? 0), soTrang: totalPages, soMuc: content.length, khongId: noId },
        at(),
      ),
    );
    o.state.listNextPage = page + 1;
    await commit(o);
    o.log({ suKien: "danh-sach-du-an", trang: page, soMuc: content.length, khongId: noId, tongDuAn: Number(body?.data?.projects?.totalElements ?? 0) });
    if (!content.length) break;
    page++;
    if (page > 1000) throw new RunStopped("call-cap", "danh sách dự án quá 1.000 trang — dừng để không lặp vô hạn");
  }
  o.state.listDone = true;
  await commit(o);
}

async function projects(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const size = o.listSize ?? 100;
  if (!o.state.listDone) await fetchProjectList(o, size);
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  let items = 0;
  let failed = 0;
  const done = new Set(o.state.detailDone);
  for (const id of o.state.projectIds) {
    if (done.has(id) || id in o.state.detailFailed) continue;
    try {
      const detail = await o.client.getJson<Envelope>("project-detail", { id });
      const filterOptions = await o.client.getJson<Envelope>("building-tree", { id });
      const gallery = await o.client.getJson<Envelope>("gallery", { id });
      await o.writer.add(makeItem("du_an_detail", `du-an-${id}`, { detail, filterOptions, gallery }, { request: { id }, coBangCan: hasApartmentTable(detail) }, at()));
      o.state.detailDone.push(id);
      items++;
    } catch (e) {
      if (e instanceof RunStopped) throw e;
      // 4xx khác, lỗi tạm, thân không phải JSON: tính thất bại của riêng dự án này, đi tiếp
      o.state.detailFailed[id] = e instanceof Error ? e.message : String(e);
      failed++;
    }
    await checkpoint(o);
    if ((items + failed) % 50 === 0 && items + failed > 0) {
      o.log({ suKien: "tien-do-chi-tiet", daXong: o.state.detailDone.length, thatBai: Object.keys(o.state.detailFailed).length, tong: o.state.projectIds.length });
    }
  }
  await commit(o);
  return { phase: o.phase, calls: o.client.calls - started, items, failed };
}

export async function runPhase(o: RunOptions): Promise<PhaseSummary> {
  switch (o.phase) {
    case "session-check":
      return sessionCheck(o);
    case "reference":
      return reference(o);
    case "tile-mask":
      return tileMask(o);
    case "projects":
      return projects(o);
  }
}

export { HttpStatusError };
