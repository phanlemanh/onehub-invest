/**
 * Pha `apartments-all` — lấy căn và chi tiết căn của TOÀN BỘ dự án có bảng căn (mốc mở rộng, claudedp-2411-73).
 *
 * Việc phải làm đọc từ kho (catalog.ts): dự án nào có bảng căn, tên toà nào — không hỏi lại chi tiết dự án. Thứ tự:
 * số căn nguồn khai từ lớn xuống nhỏ (dự án to trước cho nhiều căn sớm), sắp theo lựa chọn `tuSoCan`, `denSoCan`,
 * `ids`, `gioiHan` (số dự án một lượt — để chạy thang đầu).
 *
 * Cùng kind và cùng ý nghĩa với pha căn hộ của mốc ngày 2 (`can_ho_list`, `can_ho_toa`, `can_ho_detail`,
 * `can_ho_du_an`), khác ở ba chỗ:
 * - trang của một lượt liệt kê được lấy SONG SONG (trang 0 trước để biết số trang); `maMoi` vẫn tính dồn theo
 *   thứ tự trang;
 * - chi tiết căn lấy theo đợt (`concurrency` lời một đợt);
 * - KHÔNG có cổng chứng minh dừng cả lượt cho từng dự án: mỗi toà vẫn ghi `khop` (và `rong` khi liệt kê không trả
 *   dòng nào), số toà không khớp nằm trong bản gộp dự án để báo ở mỗi mốc.
 *
 * Tiến độ: nhật ký chỉ-ghi-thêm, một tệp mỗi dự án (`can-ho-<id>.jsonl`) — lô chốt xong mới ghi dòng. Chạy lại chỉ
 * làm phần còn lại: toà đã liệt kê không liệt kê lại, căn đã lấy (đã ghi nhận lỗi vĩnh viễn) không hỏi lại.
 */
import { join } from "node:path";

import { MAX_CONCURRENCY, RunStopped } from "./client.js";
import { projectCatalog } from "./catalog.js";
import { ConfigError } from "./config.js";
import { assertNoSoftError, makeItem, MAX_APARTMENT_LOT, sourceIdSlug } from "./kinds.js";
import type { PhaseSummary, RunOptions } from "./run.js";
import { NhatKyTienDo, chotVaLuu } from "./tien-do.js";

export type TatCaDuAnOptions = {
  /** Chỉ dự án có số căn nguồn khai từ mức này. */
  tuSoCan?: number;
  /** Chỉ dự án có số căn nguồn khai tới mức này. */
  denSoCan?: number;
  /** Số dự án nhiều nhất làm trong lượt này (không kể dự án đã xong). */
  gioiHan?: number;
  /** Chỉ đúng các dự án này. */
  ids?: string[];
  /** Số lời một đợt (1 = tuần tự). */
  concurrency: number;
  /** Mục một trang của lời liệt kê căn (đo 24/11: nguồn chịu 100). */
  apartmentPageSize?: number;
  /** Số căn một đợt lấy chi tiết rồi chốt. */
  motDot?: number;
};

type Envelope<T = unknown> = { status?: boolean; message?: string | null; data?: T; pagination?: unknown; extra?: unknown };
type TrangList = Envelope<{ content?: Array<{ text?: unknown }>; totalElements?: number; totalPages?: number }>;
type ChiTietCan = Envelope<{ properties?: { ma_can?: unknown } }>;

type ToaDaLietKe = { tongDong: number; soLot: number; khop: boolean; rong: boolean; maCan: string[] };
type TienDo = { toa: Map<string, ToaDaLietKe>; daLay: Set<string>; loi: Map<string, string>; xong: boolean };

function docTienDo(lines: Array<Record<string, unknown>>): TienDo {
  const out: TienDo = { toa: new Map(), daLay: new Set(), loi: new Map(), xong: false };
  for (const r of lines) {
    if (typeof r.toa === "string") {
      out.toa.set(r.toa, {
        tongDong: Number(r.tongDong),
        soLot: Number(r.soLot),
        khop: r.khop === true,
        rong: r.rong === true,
        maCan: (r.maCan as string[] | undefined) ?? [],
      });
    }
    for (const c of (r.daLay as string[] | undefined) ?? []) out.daLay.add(c);
    for (const [c, loi] of Object.entries((r.loi ?? {}) as Record<string, string>)) out.loi.set(c, loi);
    if (r.xong === true) out.xong = true;
  }
  return out;
}

/**
 * Liệt kê TRỌN một toà: trang 0 trước (biết số trang), các trang còn lại lấy song song; thiếu mã thì quét thêm lượt
 * (tối đa MAX_APARTMENT_LOT, lượt không thêm mã thì dừng). Ghi item `can_ho_list` từng trang (CHƯA chốt — nơi gọi
 * chốt cùng bản gộp toà). Liệt kê rỗng (0 dòng) hoặc nguồn báo lỗi mềm không được coi là khớp.
 */
export async function lietKeToa(
  o: RunOptions,
  projectId: string,
  building: string,
  concurrency: number,
): Promise<{ codes: string[]; total: number; lots: number; khop: boolean; rong: boolean; soTrangDaGhi: number }> {
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const size = o.apartmentPageSize ?? 100;
  const requestOf = (page: number) => ({ thap: building, text: building, project_id: projectId, page, size });
  const unique = new Set<string>();
  let total = 0;
  let lots = 0;
  let soTrangDaGhi = 0;
  for (lots = 1; lots <= MAX_APARTMENT_LOT; lots++) {
    const dau = await o.client.getJson<TrangList>("apartment-list", requestOf(0));
    assertNoSoftError(dau, `lời liệt kê căn của toà ${building} (dự án ${projectId})`);
    total = Number(dau?.data?.totalElements ?? 0);
    const soTrang = Number(dau?.data?.totalPages ?? 0);
    const pages: TrangList[] = [dau];
    if (soTrang > 1) {
      // Một trang thiếu là thiếu mã: trang nào lỗi thì dừng ở đó, không ghi bản gộp toà thiếu trang.
      const rs = await o.client.getJsonMany<TrangList>(
        Array.from({ length: Math.min(soTrang - 1, 2000) }, (_, i) => ({ role: "apartment-list" as const, params: requestOf(i + 1) })),
        concurrency,
      );
      for (const r of rs) if (!r.ok) throw r.error;
      pages.push(...(rs as Array<{ ok: true; value: TrangList }>).map((r) => r.value));
    }
    let maMoi = 0;
    for (const [page, body] of pages.entries()) {
      soTrangDaGhi++;
      const content = body?.data?.content ?? [];
      for (const c of content) {
        const code = String(c?.text ?? "").trim();
        if (code && !unique.has(code)) {
          unique.add(code);
          maMoi++;
        }
      }
      await o.writer.add(
        makeItem(
          "can_ho_list",
          `du-an-${projectId}-toa-${sourceIdSlug(building)}-trang-${page + 1}${lots > 1 ? `-lot-${lots}` : ""}`,
          { json: body },
          { request: { ...requestOf(page), project_id: projectId }, tongCan: total, soTrang, soMuc: content.length, lot: lots, maMoi },
          at(),
        ),
      );
    }
    // Một lượt KHÔNG thêm được mã nào nghĩa là thiếu mã là có hệ thống (dòng trùng trong chính lời liệt kê), không
    // phải trôi trang — quét nữa cũng vô ích. Liệt kê không trả dòng nào cũng không phải «khớp» (0 = 0).
    if (maMoi === 0 || unique.size >= total) break;
  }
  const khop = total > 0 && unique.size > 0 && unique.size === total;
  return { codes: [...unique], total, lots: Math.min(lots, MAX_APARTMENT_LOT), khop, rong: unique.size === 0, soTrangDaGhi: soTrangDaGhi };
}

export async function apartmentsAll(o: RunOptions, luaChon: TatCaDuAnOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const concurrency = luaChon.concurrency;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY) {
    throw new ConfigError(`concurrency phải là số nguyên từ 1 đến ${MAX_CONCURRENCY}`);
  }
  const motDot = luaChon.motDot ?? 100; // 100 căn một lô = 100 căn một snapshot
  const ids = new Set(luaChon.ids ?? []);
  const trongKhoang = (d: { soCan: number | null }): boolean =>
    (luaChon.tuSoCan === undefined || (d.soCan ?? 0) >= luaChon.tuSoCan) && (luaChon.denSoCan === undefined || (d.soCan ?? Number.MAX_SAFE_INTEGER) <= luaChon.denSoCan);
  const duAn = (await projectCatalog(o.snapshotRoot as string)).filter((d) => trongKhoang(d) && (!ids.size || ids.has(d.id)));
  let conLai = luaChon.gioiHan ?? Number.POSITIVE_INFINITY;

  let items = 0;
  let failed = 0;
  let soDuAnXong = 0;
  let soDuAnDaXongTruoc = 0;
  let soToa = 0;
  let soToaKhop = 0;
  let maDuNhieu = 0;
  let soDaLay = 0;
  let soLoi = 0;
  let dung: RunStopped | null = null;

  for (const d of duAn) {
    if (dung || conLai <= 0) break;
    const tienDo = new NhatKyTienDo(join(o.tienDoDir as string, `can-ho-${d.id}.jsonl`));
    const td = docTienDo(await tienDo.readAll());
    if (td.xong) {
      soDuAnDaXongTruoc++;
      continue;
    }
    conLai--;
    const t0 = Date.now();

    // 1. Liệt kê các toà chưa có trong tiến độ.
    for (const toa of d.toa) {
      if (td.toa.has(toa)) continue;
      const r = await lietKeToa(o, d.id, toa, concurrency);
      await o.writer.add(
        makeItem(
          "can_ho_toa",
          `du-an-${d.id}-toa-${sourceIdSlug(toa)}`,
          { maCan: r.codes },
          { request: { project_id: d.id, thap: toa }, tongCan: r.total, maDuNhieu: r.codes.length, soLot: r.lots, khop: r.khop, rong: r.rong, laToaChungMinh: false },
          at(),
        ),
      );
      await chotVaLuu(o);
      await tienDo.append({ toa, tongDong: r.total, soLot: r.lots, khop: r.khop, rong: r.rong, maCan: r.codes });
      td.toa.set(toa, { tongDong: r.total, soLot: r.lots, khop: r.khop, rong: r.rong, maCan: r.codes });
      items += r.soTrangDaGhi + 1; // trang liệt kê + bản gộp toà
    }

    // 2. Chi tiết căn còn thiếu, theo đợt.
    for (const [tenToa, x] of td.toa) {
      if (dung) break;
      const con = x.maCan.filter((c) => !td.daLay.has(c) && !td.loi.has(c));
      for (let i = 0; i < con.length; i += motDot) {
        if (dung) break;
        const phan = con.slice(i, i + motDot);
        const rs = await o.client.getJsonMany<ChiTietCan>(
          phan.map((ma_can) => ({ role: "apartment-detail" as const, params: { project_id: d.id, ma_can } })),
          concurrency,
        );
        const daLay: string[] = [];
        const loi: Record<string, string> = {};
        for (let k = 0; k < phan.length; k++) {
          const code = phan[k];
          const r = rs[k];
          if (!r.ok) {
            if (r.error instanceof RunStopped) {
              dung = r.error; // phần chưa xong: lượt sau
              continue;
            }
            loi[code] = r.error.message;
            continue;
          }
          // Nguồn tra chi tiết căn khớp theo ĐOẠN ĐẦU của từng từ trong mã: đối chiếu `ma_can`, lệch thì KHÔNG ghi.
          const got = String((r.value?.data as { properties?: { ma_can?: unknown } } | null)?.properties?.ma_can ?? "").trim();
          if (got !== code) loi[code] = `khớp mã căn: gửi «${code}» nhận «${got}»`;
          else {
            await o.writer.add(makeItem("can_ho_detail", `du-an-${d.id}-can-${sourceIdSlug(code)}`, { json: r.value }, { request: { project_id: d.id, ma_can: code }, khopMaCan: true, toa: tenToa }, at()));
            daLay.push(code);
          }
        }
        await chotVaLuu(o);
        await tienDo.append({ ...(daLay.length ? { daLay } : {}), ...(Object.keys(loi).length ? { loi } : {}) });
        for (const c of daLay) td.daLay.add(c);
        for (const [c, l] of Object.entries(loi)) td.loi.set(c, l);
        items += daLay.length;
        failed += Object.keys(loi).length;
      }
    }
    if (dung) break;

    // 3. Bản gộp dự án rồi đánh dấu xong.
    const cacToa = [...td.toa.entries()];
    const tong = cacToa.reduce((n, [, x]) => n + x.maCan.length, 0);
    const tongDong = cacToa.reduce((n, [, x]) => n + x.tongDong, 0);
    const khopToa = cacToa.filter(([, x]) => x.khop).length;
    await o.writer.add(
      makeItem(
        "can_ho_du_an",
        `du-an-${d.id}`,
        { toa: cacToa.map(([thap, x]) => ({ thap, maDuNhieu: x.maCan.length, tongDong: x.tongDong, soLot: x.soLot })) },
        {
          request: { id: d.id },
          soToa: cacToa.length,
          soToaKhop: khopToa,
          maDuNhieu: tong,
          tongDong,
          soCanNguon: d.soCan,
          khop: d.soCan === null ? null : tong === d.soCan,
          khopTongDong: tong === tongDong,
          soDaLay: td.daLay.size,
          soKhongLayDuoc: td.loi.size,
          moRong: true,
        },
        at(),
      ),
    );
    items++;
    await chotVaLuu(o);
    await tienDo.append({ xong: true, soToa: cacToa.length, soToaKhop: khopToa, maDuNhieu: tong, soDaLay: td.daLay.size, soLoi: td.loi.size });
    soDuAnXong++;
    soToa += cacToa.length;
    soToaKhop += khopToa;
    maDuNhieu += tong;
    soDaLay += td.daLay.size;
    soLoi += td.loi.size;
    o.log({ suKien: "can-ho-du-an-xong", duAn: d.id, soToa: cacToa.length, soToaKhop: khopToa, maDuNhieu: tong, soDaLay: td.daLay.size, soLoi: td.loi.size, ms: Date.now() - t0 });
  }
  if (dung) throw dung;
  return {
    phase: o.phase,
    calls: o.client.calls - started,
    items,
    failed,
    so: { soDuAnXong, soDuAnDaXongTruoc, soToa, soToaKhop, maDuNhieu, soDaLay, soLoi },
  };
}
