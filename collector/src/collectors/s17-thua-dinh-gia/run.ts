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

export type Phase = "session-check" | "reference" | "tile-mask" | "projects" | "apartments";

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
  /** Mốc ngày 2 — toà đã liệt kê xong: "<id dự án>/<toà>" → danh sách mã căn duy nhất. */
  apartmentCodes: Record<string, string[]>;
  /** Mốc ngày 2 — toà đã ghi bản gộp: "<id dự án>/<toà>" → số dòng nguồn công bố cho toà, số lượt quét, có khớp không. */
  apartmentBuildings: Record<string, { tongDong: number; soLot: number; khop: boolean }>;
  /** Mốc ngày 2 — căn đã có chi tiết, và căn lấy lỗi: "<id dự án>/<mã căn>". */
  apartmentDetailDone: string[];
  apartmentDetailFailed: Record<string, string>;
  /** Mốc ngày 2 — toà chứng minh đã khớp tổng nguồn. */
  apartmentProved: boolean;
  /** Mốc ngày 2 — toà của từng dự án mẫu (để chạy lại không phải hỏi lại chi tiết dự án). */
  apartmentToa: Record<string, string[]>;
  /** Mốc ngày 2 — số căn nguồn công bố trong chi tiết dự án (null khi không đọc được). */
  apartmentSoCan: Record<string, number | null>;
  /** Mốc ngày 2 — dự án đã ghi bản gộp. */
  apartmentDuAnGop: string[];
};

export function emptyState(): RunState {
  return {
    listDone: false, listNextPage: 0, projectIds: [], detailDone: [], detailFailed: {}, priceDone: [], tileDone: [],
    apartmentCodes: {}, apartmentBuildings: {}, apartmentDetailDone: [], apartmentDetailFailed: {}, apartmentProved: false, apartmentToa: {}, apartmentSoCan: {}, apartmentDuAnGop: [],
  };
}

export type PhaseSummary = { phase: Phase; calls: number; items: number; failed: number; alive?: boolean; so?: Record<string, number> };

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
  /** Mốc ngày 2 — danh sách dự án mẫu cần lấy căn. */
  projects?: string[];
  /** Mốc ngày 2 — toà dùng để chứng minh liệt kê trọn (thuộc dự án mẫu đầu tiên). */
  proveBuilding?: string;
  /** Mục một trang của lời liệt kê căn (đo 24/11: nguồn chịu 100). */
  apartmentPageSize?: number;
  /** Chỉ liệt kê các toà và ghi bản gộp dự án: không cổng chứng minh, không lấy căn (để đo trước khi quyết). */
  listOnly?: boolean;
};

/** «2,432» → 2432; không đọc được → null. */
export function parseCount(text: unknown): number | null {
  if (typeof text === "number" && Number.isFinite(text)) return text;
  if (typeof text !== "string") return null;
  const t = text.replace(/[\s.,]/g, "");
  return /^\d+$/.test(t) ? Number(t) : null;
}

type ApartmentListEnvelope = Envelope<{ content?: Array<{ text?: unknown; sub_text?: unknown }>; totalElements?: number; totalPages?: number }>;
/**
 * Số lượt quét tối đa cho một toà khi thứ tự trang không ổn định. Đo 24/11: toà P11 cần ba lượt, toà P9 còn
 * thiếu 18 mã sau ba lượt mà mỗi lượt vẫn thêm được mã — trần nâng lên tám; lượt không thêm mã thì dừng ngay.
 */
const MAX_APARTMENT_LOT = 8;

/** Chữ dùng trong sourceId: chữ thường, khoảng trắng thành gạch nối, dấu câu thành gạch nối. */
export function sourceIdSlug(text: string): string {
  return text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Liệt kê TRỌN một toà: quét hết các trang, gộp theo mã căn (`content[].text`). Thứ tự trang của nguồn không
 * ổn định (mục trôi giữa các trang) nên mã duy nhất có thể thiếu: thiếu thì quét thêm lượt, tối đa
 * MAX_APARTMENT_LOT. Kết quả: số mã duy nhất so với tổng nguồn công bố.
 */
async function listApartments(o: RunOptions, projectId: string, building: string): Promise<{ codes: string[]; total: number; lots: number; khop: boolean }> {
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const size = o.apartmentPageSize ?? 100;
  const unique = new Set<string>();
  let total = 0;
  let lots = 0;
  for (lots = 1; lots <= MAX_APARTMENT_LOT; lots++) {
    let page = 0;
    let totalPages = Infinity;
    let fresh = 0;
    while (page < totalPages) {
      const request = { thap: building, text: building, project_id: projectId, page, size };
      const body = await o.client.getJson<ApartmentListEnvelope>("apartment-list", request);
      const content = body?.data?.content ?? [];
      totalPages = Number(body?.data?.totalPages ?? 0);
      total = Number(body?.data?.totalElements ?? 0);
      for (const c of content) {
        const code = String(c?.text ?? "").trim();
        if (code && !unique.has(code)) {
          unique.add(code);
          fresh++;
        }
      }
      await o.writer.add(
        makeItem(
          "can_ho_list",
          `du-an-${projectId}-toa-${sourceIdSlug(building)}-trang-${page + 1}${lots > 1 ? `-lot-${lots}` : ""}`,
          { json: body },
          { request: { ...request, project_id: projectId }, tongCan: total, soTrang: totalPages, soMuc: content.length, lot: lots, maMoi: fresh },
          at(),
        ),
      );
      if (!content.length || page >= 2000) break;
      page++;
    }
    // Hết lượt: khớp thì dừng. Một lượt KHÔNG thêm được mã nào nghĩa là thiếu mã là có hệ thống (dòng
    // trùng trong chính lời liệt kê, đo 24/11), không phải trôi trang — quét nữa cũng vô ích.
    if (unique.size >= total || (lots >= 2 && fresh === 0)) break;
  }
  return { codes: [...unique], total, lots: Math.min(lots, MAX_APARTMENT_LOT), khop: unique.size === total };
}

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
      // Thư viện ảnh là phần phụ (ảnh không nằm trong mốc ngày 1): lỗi thì vẫn giữ hồ sơ và cây toà,
      // ghi lý do vào meta.galleryLoi. Chỉ bị chặn hay hết phiên mới dừng cả lượt.
      let gallery: Envelope | null = null;
      let galleryLoi: string | undefined;
      try {
        gallery = await o.client.getJson<Envelope>("gallery", { id });
      } catch (e) {
        if (e instanceof RunStopped) throw e;
        galleryLoi = e instanceof Error ? e.message : String(e);
      }
      await o.writer.add(
        makeItem("du_an_detail", `du-an-${id}`, { detail, filterOptions, gallery }, { request: { id }, coBangCan: hasApartmentTable(detail), ...(galleryLoi ? { galleryLoi } : {}) }, at()),
      );
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

/**
 * Mốc ngày 2, pha căn hộ: chứng minh liệt kê TRỌN toà chứng minh (số mã duy nhất = tổng nguồn công bố) rồi
 * mới lấy căn; sau đó mỗi dự án mẫu: liệt kê hết các toà (lấy toà từ chi tiết dự án) rồi lấy chi tiết từng mã.
 * Toà thường không khớp thì vẫn lấy căn theo mã đã có và ghi rõ chênh lệch; toà chứng minh không khớp là dừng.
 */
async function apartments(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const projectIds = (o.projects ?? []).map((x) => x.trim()).filter(Boolean);
  if (!projectIds.length) throw new ConfigError("pha căn hộ cần ít nhất một dự án mẫu (--project)");
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  let items = 0;
  let failed = 0;
  let buildings = 0;
  let buildingsKhop = 0;
  const done = new Set(o.state.apartmentDetailDone);

  const listOne = async (projectId: string, building: string, isProof: boolean): Promise<void> => {
    const key = `${projectId}/${building}`;
    if (!o.state.apartmentBuildings[key]) {
      const r = await listApartments(o, projectId, building);
      await o.writer.add(
        makeItem(
          "can_ho_toa",
          `du-an-${projectId}-toa-${sourceIdSlug(building)}`,
          { maCan: r.codes },
          { request: { project_id: projectId, thap: building }, tongCan: r.total, maDuNhieu: r.codes.length, soLot: r.lots, khop: r.khop, laToaChungMinh: isProof },
          at(),
        ),
      );
      items++;
      buildings++;
      if (r.khop) buildingsKhop++;
      o.state.apartmentCodes[key] = r.codes;
      o.state.apartmentBuildings[key] = { tongDong: r.total, soLot: r.lots, khop: r.khop };
      await commit(o);
      o.log({ suKien: "toa-liet-ke", duAn: projectId, toa: building, tongDong: r.total, maDuNhieu: r.codes.length, soLot: r.lots, khop: r.khop, chungMinh: isProof });
      if (isProof && !r.khop && !o.listOnly) {
        throw new RunStopped("proof-failed", `toà ${building} của dự án ${projectId}: ${r.codes.length} mã duy nhất trên tổng ${r.total} nguồn công bố sau ${r.lots} lượt quét`);
      }
      // Chỉ đánh dấu «đã chứng minh» khi thực sự khớp (chế độ chỉ liệt kê không cổng nhưng cũng không tính là chứng minh).
      if (isProof && r.khop) o.state.apartmentProved = true;
    }
  };

  for (const projectId of projectIds) {
    // Toà lấy từ chi tiết dự án (một lời, chỉ hỏi một lần rồi giữ trong trạng thái); toà chứng minh đứng đầu
    // dự án mẫu đầu tiên.
    let names = o.state.apartmentToa[projectId];
    let soCanNguon: number | null = null;
    if (!names) {
      const detail = await o.client.getJson<Envelope>("project-detail", { id: projectId });
      const props = (detail?.data as { properties?: { danh_sach_thap?: unknown; so_can?: unknown } } | null)?.properties;
      names = (Array.isArray(props?.danh_sach_thap) ? props.danh_sach_thap : []).map((x) => String(x ?? "").trim()).filter(Boolean);
      o.state.apartmentToa[projectId] = names;
      o.state.apartmentSoCan[projectId] = parseCount(props?.so_can);
    }
    soCanNguon = o.state.apartmentSoCan[projectId] ?? null;
    const prove = projectId === projectIds[0] ? (o.proveBuilding ?? names[0]) : undefined;
    if (prove && !names.includes(prove)) throw new ConfigError(`dự án ${projectId} không có toà «${prove}» để chứng minh`);
    if (prove) names = [prove, ...names.filter((x) => x !== prove)];
    if (!names.length) throw new ConfigError(`dự án ${projectId} không có toà nào trong chi tiết`);
    for (const name of names) await listOne(projectId, name, name === prove);
    // Bản gộp cả dự án: số mã duy nhất của mọi toà so với số căn nguồn công bố trong chi tiết dự án, và so với
    // tổng số DÒNG của lời liệt kê (đo 24/11: một toà trả 719 dòng nhưng chỉ 599 mã duy nhất).
    if (!o.state.apartmentDuAnGop.includes(projectId)) {
      const maDuNhieu = names.reduce((n, x) => n + (o.state.apartmentCodes[`${projectId}/${x}`]?.length ?? 0), 0);
      const tongDong = names.reduce((n, x) => n + (o.state.apartmentBuildings[`${projectId}/${x}`]?.tongDong ?? 0), 0);
      await o.writer.add(
        makeItem(
          "can_ho_du_an",
          `du-an-${projectId}`,
          { toa: names.map((x) => ({ thap: x, maDuNhieu: o.state.apartmentCodes[`${projectId}/${x}`]?.length ?? 0, tongDong: o.state.apartmentBuildings[`${projectId}/${x}`]?.tongDong ?? 0, soLot: o.state.apartmentBuildings[`${projectId}/${x}`]?.soLot ?? 0 })) },
          { request: { id: projectId }, soToa: names.length, maDuNhieu, tongDong, soCanNguon, khop: soCanNguon === null ? null : maDuNhieu === soCanNguon, khopTongDong: maDuNhieu === tongDong },
          at(),
        ),
      );
      items++;
      o.state.apartmentDuAnGop.push(projectId);
      await commit(o);
      o.log({ suKien: "du-an-can-ho", duAn: projectId, soToa: names.length, maDuNhieu, tongDong, soCanNguon });
    }
    if (o.listOnly) continue;
    for (const name of names) {
      for (const code of o.state.apartmentCodes[`${projectId}/${name}`] ?? []) {
        const key = `${projectId}/${code}`;
        if (done.has(key) || key in o.state.apartmentDetailFailed) continue;
        try {
          const body = await o.client.getJson<Envelope>("apartment-detail", { project_id: projectId, ma_can: code });
          const got = String((body?.data as { properties?: { ma_can?: unknown } } | null)?.properties?.ma_can ?? "").trim();
          if (got !== code) {
            o.state.apartmentDetailFailed[key] = `khớp mã căn: gửi «${code}» nhận «${got}»`;
            failed++;
          } else {
            await o.writer.add(makeItem("can_ho_detail", `du-an-${projectId}-can-${sourceIdSlug(code)}`, { json: body }, { request: { project_id: projectId, ma_can: code }, khopMaCan: true, toa: name }, at()));
            o.state.apartmentDetailDone.push(key);
            items++;
          }
        } catch (e) {
          if (e instanceof RunStopped) throw e;
          o.state.apartmentDetailFailed[key] = e instanceof Error ? e.message : String(e);
          failed++;
        }
        await checkpoint(o);
        if ((items + failed) % 50 === 0 && items + failed > 0) {
          o.log({ suKien: "tien-do-can", duAn: projectId, daXong: o.state.apartmentDetailDone.length, thatBai: Object.keys(o.state.apartmentDetailFailed).length });
        }
      }
    }
  }
  await commit(o);
  return {
    phase: o.phase,
    calls: o.client.calls - started,
    items,
    failed,
    so: { soToa: buildings, soToaKhop: buildingsKhop, soMaCan: Object.values(o.state.apartmentCodes).reduce((n, xs) => n + xs.length, 0), soCanDaLay: o.state.apartmentDetailDone.length, soCanThatBai: Object.keys(o.state.apartmentDetailFailed).length },
  };
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
    case "apartments":
      return apartments(o);
  }
}

export { HttpStatusError };
