/**
 * Bảy pha của bộ thu S17 (mốc ngày 1 và 2, claudedp-2411-20 và -21): kiểm phiên · bảng tham chiếu · mặt nạ
 * tile · dự án (danh sách → chi tiết + cây toà + thư viện ảnh) · căn hộ · thửa · dự án thấp tầng. Trạng thái (`state`) được lưu sau từng bước
 * nên dừng giữa chừng rồi chạy lại chỉ làm phần còn lại. Mọi lời gọi đi qua S17Client (trần, dừng khi
 * bị chặn); mọi item đi qua BatchWriter (lô nhỏ, schemaVersion 17).
 */
import { ConfigError } from "./config.js";
import { HttpStatusError, RunStopped, TemporaryFailure, type S17Client } from "./client.js";
import { assertNoSoftError, hasApartmentTable, makeItem, projectIdOf, tileBases } from "./kinds.js";
import type { BatchWriter } from "./store.js";

export type Phase = "session-check" | "reference" | "tile-mask" | "projects" | "apartments" | "parcels" | "lowrise";

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
  apartmentBuildings: Record<string, { tongDong: number; soLot: number; khop: boolean; rong?: boolean }>;
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
  /**
   * Số lượt đã bị nguồn chặn (403, 429). Mạnh 24/11: được tăng tốc thận trọng; bị chặn lần một thì chỉ còn
   * nhịp cũ một luồng, lần hai thì dừng hẳn chờ người quyết.
   */
  blockedRuns: number;
  /** Số dư đã biết gần nhất (chỉ ở máy): đối chiếu với số dư trước lượt kế, vì lượt dừng giữa chừng không đọc được số sau. */
  soDuLanCuoi?: number;
  /** Mốc ngày 2 — mã địa chính của thửa đã ghi (khử trùng toàn cục). */
  parcelSeen: string[];
  /** Mốc ngày 2 — điểm đã hỏi hồ sơ: "<khu>|<phương pháp>|lat,lng". */
  parcelPointDone: string[];
  /** Mốc ngày 2 — khu đã ghi bản gộp. */
  parcelKhuDone: string[];
  /** Mốc ngày 2 — tên đường đã gợi ý: "<khu>|<tên đường>". */
  parcelStreetDone: string[];
  /** Mốc ngày 2 — điểm hoặc tên đường hỏi lỗi, kèm lý do. */
  parcelLoi: Record<string, string>;
  /** Mốc ngày 2 — số đếm dồn của từng khu. */
  parcelKhu: Record<string, ParcelStats>;
  /** Mốc ngày 2 — tên đường gặp được trong khu. */
  parcelDuong: Record<string, string[]>;
  /** Mốc ngày 2 — id đã quét và nguồn trả rỗng (không có bản ghi thấp tầng). */
  lowriseSweepChecked: number[];
  /** Mốc ngày 2 — dự án thấp tầng: từ khoá đã gợi ý, id đã gom, id đã có chi tiết, id lỗi, id → từ khoá gặp. */
  lowriseTermsDone: string[];
  lowriseIds: string[];
  lowriseDone: string[];
  lowriseFailed: Record<string, string>;
  lowriseTermsOf: Record<string, string[]>;
};

/** Số đếm dồn của một khu thí điểm. */
export type ParcelStats = {
  soDiemLuoi: number;
  soDiemGoiY: number;
  soThuaLuoi: number;
  soThuaGoiY: number;
  soTrung: number;
  soKhongCo: number;
  soLoi: number;
  soCauGoiY: number;
  soLoiGoiY: number;
  /** MỌI lời đã dùng cho khu này (cả lượt chạy trước): hồ sơ, gợi ý, lời kiểm phiên, thử lại. */
  loi: number;
};
const parcelStatsRong = (): ParcelStats => ({ soDiemLuoi: 0, soDiemGoiY: 0, soThuaLuoi: 0, soThuaGoiY: 0, soTrung: 0, soKhongCo: 0, soLoi: 0, soCauGoiY: 0, soLoiGoiY: 0, loi: 0 });

export function emptyState(): RunState {
  return {
    listDone: false, listNextPage: 0, projectIds: [], detailDone: [], detailFailed: {}, priceDone: [], tileDone: [],
    apartmentCodes: {}, apartmentBuildings: {}, apartmentDetailDone: [], apartmentDetailFailed: {}, apartmentProved: false, apartmentToa: {}, apartmentSoCan: {}, apartmentDuAnGop: [],
    parcelSeen: [], parcelPointDone: [], parcelKhuDone: [], parcelStreetDone: [], parcelLoi: {}, parcelKhu: {}, parcelDuong: {},
    lowriseSweepChecked: [], lowriseTermsDone: [], lowriseIds: [], lowriseDone: [], lowriseFailed: {}, lowriseTermsOf: {},
    blockedRuns: 0,
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
  /** Mốc ngày 2 — các khu thí điểm của pha thửa. */
  parcels?: ParcelArea[];
  /** Số lời một đợt cho đường nhiều lời (1 = tuần tự). */
  concurrency?: number;
  /** Mốc ngày 2 — từ khoá gợi ý để khám phá dự án thấp tầng. */
  lowriseTerms?: string[];
  /** Mốc ngày 2 — quét dự án thấp tầng theo id (chi tiết có cờ; id không có bản ghi trả rỗng). */
  lowriseSweep?: { from: number; to: number };
};

/** Một khu thí điểm của pha thửa: lưới toạ độ sinh ngoài bộ thu từ đa giác khu trên máy thu. */
export type ParcelArea = { khuVucId: string; ten: string; dienTichKm2: number; buocM: number; diem: Array<[number, number]> };

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

/**
 * Chữ dùng trong sourceId: ASCII, chữ thường, khoảng trắng và dấu câu thành gạch nối; tiếng Việt bỏ dấu
 * («Hàng Đào» → hang-dao, «3312A Tòa Park 12» → 3312a-toa-park-12).
 */
export function sourceIdSlug(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[Đđ]/g, "d")
    .normalize("NFD")
    .replace(/[\p{M}]+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Liệt kê TRỌN một toà: quét hết các trang, gộp theo mã căn (`content[].text`). Thứ tự trang của nguồn không
 * ổn định (mục trôi giữa các trang) nên mã duy nhất có thể thiếu: thiếu thì quét thêm lượt, tối đa
 * MAX_APARTMENT_LOT. Kết quả: số mã duy nhất so với tổng nguồn công bố.
 */
async function listApartments(o: RunOptions, projectId: string, building: string): Promise<{ codes: string[]; total: number; lots: number; khop: boolean; rong: boolean }> {
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
      assertNoSoftError(body, `lời liệt kê căn của toà ${building} (dự án ${projectId})`);
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
    // Liệt kê không trả dòng nào, hoặc không có mã nào, KHÔNG phải «khớp»: 0 = 0 là chứng minh rỗng (lượt soát 24/11).
    const coDuLieu = total > 0 && unique.size > 0;
    if (!coDuLieu || unique.size >= total || (lots >= 2 && fresh === 0)) break;
  }
  const khop = total > 0 && unique.size > 0 && unique.size === total;
  return { codes: [...unique], total, lots: Math.min(lots, MAX_APARTMENT_LOT), khop, rong: !khop && unique.size === 0 };
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
      o.state.apartmentBuildings[key] = { tongDong: r.total, soLot: r.lots, khop: r.khop, rong: r.rong };
      await commit(o);
      o.log({ suKien: "toa-liet-ke", duAn: projectId, toa: building, tongDong: r.total, maDuNhieu: r.codes.length, soLot: r.lots, khop: r.khop, chungMinh: isProof });
    }
    // Cổng chứng minh đứng SAU cả hai đường (vừa liệt kê hay đã có trong trạng thái). Lượt soát 24/11: cổng nằm trong
    // nhánh «chưa có» nên chạy lại sau proof-failed đi thẳng vào lấy căn (0 lời liệt kê, 4 căn, trả ok).
    // Chế độ chỉ liệt kê không có cổng nhưng cũng không được tính là chứng minh.
    if (!isProof || o.listOnly) return;
    const toa = o.state.apartmentBuildings[key];
    if (!toa.khop) {
      const soMa = o.state.apartmentCodes[key]?.length ?? 0;
      throw new RunStopped(
        "proof-failed",
        toa.rong
          ? `toà ${building} của dự án ${projectId}: lời liệt kê không trả dòng nào (tổng nguồn công bố ${toa.tongDong}) — không có gì để chứng minh`
          : `toà ${building} của dự án ${projectId}: ${soMa} mã duy nhất trên tổng ${toa.tongDong} nguồn công bố sau ${toa.soLot} lượt quét`,
      );
    }
    // Chỉ đánh dấu «đã chứng minh» khi thực sự khớp.
    o.state.apartmentProved = true;
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

/** Một đợt hồ sơ thửa: tối đa PARCEL_CHUNK điểm một lần (rồi chốt xuống đĩa). */
const PARCEL_CHUNK = 40;
/** Mỗi khu hỏi gợi ý tối đa MAX_SUGGEST_TERMS tên đường, lặp tối đa MAX_SUGGEST_ROUNDS vòng. */
const MAX_SUGGEST_TERMS = 40;
const MAX_SUGGEST_ROUNDS = 3;
const diemKey = (khu: string, phuongPhap: string, lat: number, lng: number): string => `${khu}|${phuongPhap}|${lat},${lng}`;

/**
 * Mốc ngày 2, pha thửa: quét lưới toạ độ (mỗi điểm hỏi hồ sơ thửa ở toạ độ đó), lấy tên đường từ những thửa
 * vừa có rồi hỏi gợi ý theo tên đường để thêm toạ độ, hỏi tiếp. Khử trùng toàn cục theo mã địa chính (ogc_fid —
 * bền); một thửa một item. Điểm hỏi lỗi được ghi lại và không hỏi lại; bị chặn hay hết phiên thì dừng, điểm chưa
 * xong không được đánh dấu.
 */
async function parcels(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const cacKhu = o.parcels ?? [];
  if (!cacKhu.length) throw new ConfigError("pha thửa cần ít nhất một khu thí điểm (--parcels-grid)");
  for (const k of cacKhu) {
    if (!/^[a-z0-9-]+$/.test(k.khuVucId) || !(k.dienTichKm2 > 0) || !k.diem.length) {
      throw new ConfigError(`khu thí điểm «${k.khuVucId}» khai sai: id chữ thường, diện tích > 0, có ít nhất một điểm`);
    }
  }
  const concurrency = o.concurrency ?? 1;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new ConfigError("concurrency phải là số nguyên từ 1 đến 4");
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  let items = 0;
  let failed = 0;

  const hoiHoSo = async (khu: ParcelArea, phuongPhap: "grid" | "suggest", diem: Array<[number, number]>): Promise<void> => {
    const st = o.state.parcelKhu[khu.khuVucId];
    const con = diem.filter(([lat, lng]) => !o.state.parcelPointDone.includes(diemKey(khu.khuVucId, phuongPhap, lat, lng)));
    for (let i = 0; i < con.length; i += PARCEL_CHUNK) {
      const part = con.slice(i, i + PARCEL_CHUNK);
      const mocDot = o.client.calls;
      const ketQua = await o.client.getJsonMany<Envelope>(
        part.map(([latitude, longitude]) => ({ role: "parcel-profile" as const, params: { loaiTimKiem: "nha_pho", latitude, longitude } })),
        concurrency,
      );
      let dung: RunStopped | null = null;
      for (let k = 0; k < part.length; k++) {
        const [lat, lng] = part[k];
        const key = diemKey(khu.khuVucId, phuongPhap, lat, lng);
        const r = ketQua[k];
        if (!r.ok) {
          if (r.error instanceof RunStopped) {
            dung = r.error; // điểm này và mọi điểm sau chưa xong
            break;
          }
          st.soLoi++;
          failed++;
          o.state.parcelLoi[key] = r.error.message;
          o.state.parcelPointDone.push(key);
          continue;
        }
        try {
          assertNoSoftError(r.value, `hồ sơ thửa ở toạ độ ${lat},${lng}`);
        } catch (e) {
          dung = e as RunStopped; // lỗi mềm của nguồn: không được đọc là «không có thửa»
          break;
        }
        if (phuongPhap === "grid") st.soDiemLuoi++;
        else st.soDiemGoiY++;
        const props = (r.value?.data as { properties?: Record<string, unknown> } | null)?.properties;
        const ogc = props?.ogc_fid;
        if (ogc === undefined || ogc === null || ogc === "") {
          st.soKhongCo++; // điểm không nằm trong thửa nào (đo 24/11: nguồn trả data null, ~0,1 s)
        } else {
          const id = String(ogc);
          if (o.state.parcelSeen.includes(id)) st.soTrung++;
          else {
            o.state.parcelSeen.push(id);
            if (phuongPhap === "grid") st.soThuaLuoi++;
            else st.soThuaGoiY++;
            const duong = String(props?.vi_tri_duong ?? "").trim();
            if (duong && !(o.state.parcelDuong[khu.khuVucId] ?? []).includes(duong)) (o.state.parcelDuong[khu.khuVucId] ??= []).push(duong);
            await o.writer.add(
              makeItem(
                "thua",
                `thua-${id}`,
                { json: r.value },
                {
                  request: { latitude: lat, longitude: lng, loaiTimKiem: "nha_pho" },
                  phuongPhap,
                  khuVuc: khu.khuVucId,
                  ogcFid: id,
                  soTo: props?.so_to ?? null,
                  soThua: props?.so_thua ?? null,
                  dienTich: props?.dien_tich ?? null,
                  duong: duong || null,
                  maPhuong: props?.ma_phuong ?? null,
                  maQuan: props?.ma_quan ?? null,
                  maThanhPho: props?.ma_thanh_pho ?? null,
                },
                at(),
              ),
            );
            items++;
          }
        }
        o.state.parcelPointDone.push(key);
      }
      st.loi += o.client.calls - mocDot; // mọi lời của đợt này: hồ sơ, lời kiểm phiên, thử lại
      await commit(o); // phần đã xong trong đợt này được chốt và ghi nhận trước khi báo dừng
      if (dung) throw dung;
    }
  };

  for (const khu of cacKhu) {
    if (o.state.parcelKhuDone.includes(khu.khuVucId)) continue;
    const st = (o.state.parcelKhu[khu.khuVucId] ??= parcelStatsRong());
    await hoiHoSo(khu, "grid", khu.diem);
    // Gợi ý theo tên đường gặp được trong khu (nguồn nắp khoảng 15 mục mỗi từ khoá).
    for (let vong = 0; vong < MAX_SUGGEST_ROUNDS && st.soCauGoiY + st.soLoiGoiY < MAX_SUGGEST_TERMS; vong++) {
      const duongMoi = (o.state.parcelDuong[khu.khuVucId] ?? []).filter((d) => !o.state.parcelStreetDone.includes(`${khu.khuVucId}|${d}`));
      duongMoi.splice(MAX_SUGGEST_TERMS - st.soCauGoiY - st.soLoiGoiY);
      if (!duongMoi.length) break;
      const diemMoi = new Map<string, [number, number]>();
      for (const term of duongMoi) {
        const moc = o.client.calls;
        try {
          const body = await o.client.getJson<Envelope>("parcel-suggest", { term, size: 50 });
          const muc = listOf(body?.data).flatMap((g) => listOf((g as { items?: unknown }).items));
          await o.writer.add(makeItem("thua_goi_y", `goi-y-${khu.khuVucId}-${sourceIdSlug(term)}`, { json: body }, { request: { term, size: 50 }, khuVuc: khu.khuVucId, soMuc: muc.length }, at()));
          items++;
          st.soCauGoiY++;
          for (const m of muc) {
            const ex = (m as { extra?: { latitude?: unknown; longitude?: unknown } }).extra ?? {};
            const lat = Number(ex.latitude);
            const lng = Number(ex.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0) diemMoi.set(`${lat},${lng}`, [lat, lng]);
          }
        } catch (e) {
          if (e instanceof RunStopped) {
            await commit(o);
            throw e;
          }
          st.soLoiGoiY++;
          failed++;
          o.state.parcelLoi[`${khu.khuVucId}|goi-y|${term}`] = e instanceof Error ? e.message : String(e);
        }
        st.loi += o.client.calls - moc;
        o.state.parcelStreetDone.push(`${khu.khuVucId}|${term}`);
        await commit(o);
      }
      await hoiHoSo(khu, "suggest", [...diemMoi.values()]);
      o.log({ suKien: "thua-goi-y", khuVuc: khu.khuVucId, vong, soDuong: duongMoi.length, soDiemMoi: diemMoi.size });
    }
    const tongLoi = st.loi; // MỌI lời đã dùng cho khu này, kể cả lượt chạy trước: không bỏ ra điểm lỗi, lời kiểm phiên, thử lại
    const soThua = st.soThuaLuoi + st.soThuaGoiY;
    await o.writer.add(
      makeItem(
        "thua_khu_vuc",
        `khu-vuc-${khu.khuVucId}`,
        { ...st },
        {
          request: { dienTichKm2: khu.dienTichKm2, buocM: khu.buocM, soDiemLuuGiac: khu.diem.length },
          ten: khu.ten,
          thuaMoiKm2: Math.round((st.soThuaLuoi / khu.dienTichKm2) * 10) / 10,
          loiMoiKm2: Math.round((tongLoi / khu.dienTichKm2) * 10) / 10,
          tongLoi,
          soThua,
        },
        at(),
      ),
    );
    items++;
    o.state.parcelKhuDone.push(khu.khuVucId);
    await commit(o);
    o.log({ suKien: "thua-khu-xong", khuVuc: khu.khuVucId, ...st, tongLoi });
  }
  return {
    phase: o.phase,
    calls: o.client.calls - started,
    items,
    failed,
    so: {
      soKhu: cacKhu.filter((k) => o.state.parcelKhuDone.includes(k.khuVucId)).length,
      soThua: o.state.parcelSeen.length,
      soDiemLuoi: Object.values(o.state.parcelKhu).reduce((n, x) => n + x.soDiemLuoi, 0),
      soDiemGoiY: Object.values(o.state.parcelKhu).reduce((n, x) => n + x.soDiemGoiY, 0),
      soCauGoiY: Object.values(o.state.parcelKhu).reduce((n, x) => n + x.soCauGoiY, 0),
      soLoi: Object.values(o.state.parcelKhu).reduce((n, x) => n + x.soLoi, 0),
    },
  };
}

/** Namespace của dự án thấp tầng trong phản hồi nguồn (đo 24/11). */
export const LOWRISE_NAMESPACE = "du_an_nha_dat";
/** Quét thấp tầng theo id: tối đa 5.000 id một lượt, mỗi đợt 50 id rồi chốt xuống đĩa. */
const MAX_LOWRISE_SWEEP = 5000;
const LOWRISE_SWEEP_CHUNK = 50;

/**
 * Mốc ngày 2, pha dự án thấp tầng: không có lời liệt kê riêng, chỉ khám phá qua gợi ý theo từ khoá với cờ
 * for_house (đo 24/11). Mục gợi ý mang namespace thấp tầng mới được gom; chi tiết PHẢI lấy có cờ — không có cờ
 * nguồn trả một dự án căn hộ khác trùng id. Chi tiết có cờ mà vẫn không thuộc namespace thấp tầng thì không ghi.
 */
async function lowrise(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const terms = [...new Set((o.lowriseTerms ?? []).map((t) => t.trim()).filter(Boolean))];
  if (!terms.length && !o.lowriseSweep) throw new ConfigError("pha thấp tầng cần dải id quét (--thap-tang-id-tu/den) hoặc ít nhất một từ khoá (--thap-tang-terms)");
  const concurrency = o.concurrency ?? 1;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new ConfigError("concurrency phải là số nguyên từ 1 đến 4");
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  let items = 0;
  let failed = 0;
  let ngoai = 0;
  let khongCo = 0;
  if (o.lowriseSweep) {
    // Đo 24/11: chi tiết CÓ cờ với id không có bản ghi thấp tầng trả data null (71 byte, ~0,2 s); id có bản ghi
    // trả đúng dự án thấp tầng. Quét theo id vì thế liệt kê TRỌN namespace thấp tầng, không cần đoán từ khoá.
    const { from, to } = o.lowriseSweep;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
      throw new ConfigError("dải id quét phải là hai số nguyên, từ ≥ 1 và đến ≥ từ");
    }
    if (to - from > MAX_LOWRISE_SWEEP) throw new ConfigError(`dải id quét quá rộng: tối đa ${MAX_LOWRISE_SWEEP.toLocaleString("vi-VN")} id một lượt`);
    const daQuet = new Set(o.state.lowriseSweepChecked);
    const ids: number[] = [];
    for (let id = from; id <= to; id++) {
      if (!daQuet.has(id) && !o.state.lowriseDone.includes(String(id)) && !(String(id) in o.state.lowriseFailed)) ids.push(id);
    }
    for (let i = 0; i < ids.length; i += LOWRISE_SWEEP_CHUNK) {
      const part = ids.slice(i, i + LOWRISE_SWEEP_CHUNK);
      const t0 = Date.now();
      const ketQua = await o.client.getJsonMany<Envelope>(part.map((id) => ({ role: "project-detail" as const, params: { id, for_house: "true" } })), concurrency);
      let dung: RunStopped | null = null;
      let loiDot = 0;
      for (let k = 0; k < part.length; k++) {
        const id = part[k];
        const r = ketQua[k];
        if (!r.ok) {
          if (r.error instanceof RunStopped) {
            dung = r.error;
            break;
          }
          o.state.lowriseFailed[String(id)] = r.error.message;
          failed++;
          loiDot++;
          continue;
        }
        try {
          assertNoSoftError(r.value, `chi tiết thấp tầng id ${id}`);
        } catch (e) {
          dung = e as RunStopped; // lỗi mềm của nguồn: không được đọc là «id rỗng»
          break;
        }
        const d = r.value?.data as { estate_type?: unknown; properties?: { ten_du_an?: unknown } } | null | undefined;
        if (d === null || d === undefined) {
          khongCo++;
          o.state.lowriseSweepChecked.push(id);
          continue;
        }
        const estate = String(d.estate_type ?? "");
        if (estate !== LOWRISE_NAMESPACE) {
          o.state.lowriseFailed[String(id)] = `chi tiết id ${id} có cờ for_house trả namespace «${estate || "?"}» — không phải dự án thấp tầng`;
          failed++;
          continue;
        }
        const ten = String(d.properties?.ten_du_an ?? "");
        await o.writer.add(makeItem("du_an_thap_tang", `du-an-nha-dat-${id}`, { json: r.value }, { request: { id, for_house: "true" }, phuongPhap: "id-sweep", estateType: estate, ten }, at()));
        o.state.lowriseDone.push(String(id));
        items++;
      }
      await commit(o); // phần đã xong trong đợt này được chốt và ghi nhận trước khi báo dừng
      if (dung) throw dung;
      // Thời gian và số lỗi của đợt: số đo tốc độ lấy từ dữ liệu thật, và dấu hiệu lời nào chậm hơn hạn của trang.
      o.log({ suKien: "thap-tang-quet", daQuet: o.state.lowriseSweepChecked.length, thay: o.state.lowriseDone.length, loi: loiDot, ms: Date.now() - t0 });
    }
  }
  for (const term of terms) {
    if (o.state.lowriseTermsDone.includes(term)) continue;
    try {
      const body = await o.client.getJson<Envelope>("project-suggest", { term, for_house: "true", size: 50 });
      assertNoSoftError(body, `gợi ý thấp tầng theo từ khoá «${term}»`);
      const muc = listOf(body?.data).flatMap((g) => listOf((g as { items?: unknown }).items));
      const thapTang = muc.filter((m) => (m as { source?: unknown }).source === LOWRISE_NAMESPACE && String((m as { id?: unknown }).id ?? "").trim());
      ngoai += muc.length - thapTang.length;
      await o.writer.add(makeItem("du_an_goi_y_thap_tang", `goi-y-thap-tang-${sourceIdSlug(term)}`, { json: body }, { request: { term, for_house: "true", size: 50 }, soMuc: muc.length, soThapTang: thapTang.length }, at()));
      items++;
      for (const m of thapTang) {
        const id = String((m as { id: unknown }).id).trim();
        if (!o.state.lowriseIds.includes(id)) o.state.lowriseIds.push(id);
        const ds = (o.state.lowriseTermsOf[id] ??= []);
        if (!ds.includes(term)) ds.push(term);
      }
    } catch (e) {
      if (e instanceof RunStopped) {
        await commit(o);
        throw e;
      }
      failed++;
      o.state.lowriseFailed[`goi-y|${term}`] = e instanceof Error ? e.message : String(e);
    }
    o.state.lowriseTermsDone.push(term);
    await commit(o);
  }
  for (const id of o.state.lowriseIds) {
    if (o.state.lowriseDone.includes(id) || id in o.state.lowriseFailed) continue;
    try {
      const body = await o.client.getJson<Envelope>("project-detail", { id, for_house: "true" });
      const estate = String((body?.data as { estate_type?: unknown } | null)?.estate_type ?? "");
      if (estate !== LOWRISE_NAMESPACE) {
        o.state.lowriseFailed[id] = `chi tiết id ${id} có cờ for_house vẫn trả namespace «${estate || "?"}» — không phải dự án thấp tầng`;
        failed++;
      } else {
        const ten = String(((body?.data as { properties?: { ten_du_an?: unknown } } | null)?.properties)?.ten_du_an ?? "");
        await o.writer.add(makeItem("du_an_thap_tang", `du-an-nha-dat-${id}`, { json: body }, { request: { id, for_house: "true" }, phuongPhap: "suggest", estateType: estate, ten, tuCacTuKhoa: [...(o.state.lowriseTermsOf[id] ?? [])] }, at()));
        o.state.lowriseDone.push(id);
        items++;
      }
    } catch (e) {
      if (e instanceof RunStopped) {
        await commit(o);
        throw e;
      }
      failed++;
      o.state.lowriseFailed[id] = e instanceof Error ? e.message : String(e);
    }
    await commit(o);
  }
  return {
    phase: o.phase,
    calls: o.client.calls - started,
    items,
    failed,
    so: { soTuKhoa: terms.length, soDuAnThapTang: o.state.lowriseDone.length, ngoaiNamespace: ngoai, khongCoBanGhi: khongCo },
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
    case "parcels":
      return parcels(o);
    case "lowrise":
      return lowrise(o);
  }
}

export { HttpStatusError };
