import type { PoolClient } from "pg"

import { pool } from "../db"
import { maskSourceNames, type SourceNameEntry } from "../mask-source-names"
import { ALIAS_KIND } from "../vocab.generated"

/**
 * Danh bạ người trên Ops (`danh-ba-nguoi-tren-ops`) — truy vấn của /ops/people và /ops/people/[partyKey].
 * Chỉ đọc bốn bảng 055 (parties, registry_aliases, party_roles) và nhãn ở ref_lookup; bảng chỉ ở máy thu (Hỏi-3 của
 * DB2b), trên cloud trang không gọi. Không ghi gì: nhãn môi giới là suy luận tính lúc đọc (ADR-0016 §8), không vào cột.
 */

type Q = Pick<PoolClient, "query">

/** Người đăng từ chừng này tin còn sống trở lên mang nhãn suy luận «Có thể là môi giới» (Hỏi-1, Mạnh 30/10). */
export const NGUONG_MOI_GIOI = 5
/** Số người mỗi trang của /ops/people (Hỏi-2: phân trang phía máy chủ). */
export const PAGE_SIZE = 100
/** Trang một người hiện chừng này tin mới nhất; tổng vẫn đếm đủ. */
export const TIN_TOI_DA = 200

const KHOA_NGUOI = /^pty_[0-9A-HJKMNP-TV-Z]{26}$/
const MA_NGUON = /^S0[1-9]$/

export type NguoiHang = {
  partyKey: string
  source: string
  soTin: number
  soBiDanh: number
  ten: string | null
  taiKhoan: string | null
  sdtBam: string | null
}

export type DanhSachNguoi = { rows: NguoiHang[]; total: number; page: number; pages: number }

export type TongQuan = { nguoi: number; vaiSong: number; theoNguon: { source: string; nguoi: number }[] }

export type BiDanh = { kind: string; label: string; value: string; source: string; firstSeen: string; retired: boolean }

export type TinDaDang = { subjectKey: string; method: string; methodLabel: string; tier: string; tierLabel: string; observedAt: string }

export type MotNguoi = {
  partyKey: string
  source: string
  status: string
  statusLabel: string
  aliases: BiDanh[]
  tin: TinDaDang[]
  tongTin: number
  soVaiRut: number
}

export type LocNguoi = { source: string | null; q: string; page: number }

/** `?source=` chỉ nhận mã S0x; giá trị khác bỏ lọc. */
export function parseSource(v: string | undefined): string | null {
  return v && MA_NGUON.test(v) ? v : null
}

/** `?page=` số nguyên ≥ 1; giá trị khác về trang 1. */
export function parsePage(v: string | undefined): number {
  const n = v && /^\d+$/.test(v) ? Number(v) : 1
  return n >= 1 ? n : 1
}

export function laMoiGioi(soTin: number): boolean {
  return soTin >= NGUONG_MOI_GIOI
}

/**
 * Giá trị bí danh để hiện: vai dưới Vận hành → null (ẩn); SĐT băm → 8 ký tự đầu; tên và tài khoản đi qua bộ che tên
 * nguồn chung (một tên người bán S06 ở máy thu chứa tên nguồn thật) — danh sách tên rỗng thì «—» (đóng chặt).
 */
export function hienBiDanh(kind: string, value: string, entries: SourceNameEntry[], xem: boolean): string | null {
  if (!xem) return null
  if (kind === ALIAS_KIND.sdt_bam) return `${value.slice(0, 8)}…`
  return maskSourceNames(value, entries) ?? "—"
}

/** Khớp tìm: bí danh tên hoặc tài khoản còn dùng chứa chuỗi tìm, không phân biệt hoa thường. */
const LOC = `p.status = 'active' AND ($1::text IS NULL OR p.source = $1)
  AND ($2::text = '' OR EXISTS (
    SELECT 1 FROM registry_aliases a
    WHERE a.object_key = p.party_key AND a.retired_at IS NULL AND a.kind IN ('${ALIAS_KIND.ten}', '${ALIAS_KIND.tai_khoan_nguon}')
      AND strpos(lower(a.value), lower($2)) > 0))`

export async function danhBaTongQuan(q: Q = pool): Promise<TongQuan> {
  const { rows } = await q.query<{ source: string; nguoi: number; vai: number }>(
    `SELECT p.source, count(*)::int AS nguoi,
            coalesce(sum((SELECT count(*) FROM party_roles r
                          WHERE r.party_key = p.party_key AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL)), 0)::int AS vai
     FROM parties p WHERE p.status = 'active' GROUP BY p.source ORDER BY p.source`,
  )
  return {
    nguoi: rows.reduce((s, r) => s + r.nguoi, 0),
    vaiSong: rows.reduce((s, r) => s + r.vai, 0),
    theoNguon: rows.map((r) => ({ source: r.source, nguoi: r.nguoi })),
  }
}

export async function danhSachNguoi(loc: LocNguoi, q: Q = pool): Promise<DanhSachNguoi> {
  const tim = loc.q.trim()
  const { rows: dem } = await q.query<{ n: number }>(`SELECT count(*)::int AS n FROM parties p WHERE ${LOC}`, [loc.source, tim])
  const total = dem[0]?.n ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = loc.page > pages ? 1 : loc.page
  const { rows: nguoi } = await q.query<{ party_key: string; source: string; so_tin: number }>(
    `SELECT p.party_key, p.source,
            (SELECT count(DISTINCT r.subject_key) FROM party_roles r
             WHERE r.party_key = p.party_key AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL)::int AS so_tin
     FROM parties p WHERE ${LOC}
     ORDER BY so_tin DESC, p.party_key LIMIT $3 OFFSET $4`,
    [loc.source, tim, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  )
  const keys = nguoi.map((r) => r.party_key)
  const { rows: bd } = keys.length
    ? await q.query<{ object_key: string; kind: string; value: string }>(
        `SELECT object_key, kind, value FROM registry_aliases
         WHERE object_key = ANY($1) AND retired_at IS NULL ORDER BY first_seen DESC, id DESC`,
        [keys],
      )
    : { rows: [] }
  const theoNguoi = new Map<string, { kind: string; value: string }[]>()
  for (const a of bd) theoNguoi.set(a.object_key, [...(theoNguoi.get(a.object_key) ?? []), a])
  const dau = (ds: { kind: string; value: string }[], kind: string) => ds.find((a) => a.kind === kind)?.value ?? null
  return {
    total,
    page,
    pages,
    rows: nguoi.map((r) => {
      const ds = theoNguoi.get(r.party_key) ?? []
      return {
        partyKey: r.party_key,
        source: r.source,
        soTin: r.so_tin,
        soBiDanh: ds.length,
        ten: dau(ds, "ten"),
        taiKhoan: dau(ds, "tai_khoan_nguon"),
        sdtBam: dau(ds, "sdt_bam"),
      }
    }),
  }
}

/** Một người theo khoá; khoá sai khuôn hoặc không có → null (trang trả 404). */
export async function motNguoi(key: string, q: Q = pool): Promise<MotNguoi | null> {
  if (!KHOA_NGUOI.test(key)) return null
  const { rows: p } = await q.query<{ party_key: string; source: string; status: string; label: string | null }>(
    `SELECT p.party_key, p.source, p.status, l.label_vi AS label FROM parties p
     LEFT JOIN ref_lookup l ON l.lookup_name = 'registry_status' AND l.lookup_value = p.status
     WHERE p.party_key = $1`,
    [key],
  )
  if (!p[0]) return null
  const [aliases, tin, dem] = await Promise.all([
    q.query<{ kind: string; label: string | null; value: string; source: string; first_seen: Date; retired_at: Date | null }>(
      `SELECT a.kind, l.label_vi AS label, a.value, a.source, a.first_seen, a.retired_at FROM registry_aliases a
       LEFT JOIN ref_lookup l ON l.lookup_name = 'alias_kind' AND l.lookup_value = a.kind
       WHERE a.object_key = $1 ORDER BY a.retired_at NULLS FIRST, a.first_seen, a.id`,
      [key],
    ),
    q.query<{ subject_key: string; method: string; method_label: string | null; tier: string; tier_label: string | null; observed_at: Date }>(
      `SELECT r.subject_key, r.method, lm.label_vi AS method_label, r.evidence_tier AS tier, lt.label_vi AS tier_label, r.observed_at
       FROM party_roles r
       LEFT JOIN ref_lookup lm ON lm.lookup_name = 'assertion_method' AND lm.lookup_value = r.method
       LEFT JOIN ref_lookup lt ON lt.lookup_name = 'evidence_tier' AND lt.lookup_value = r.evidence_tier
       WHERE r.party_key = $1 AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL
       ORDER BY r.observed_at DESC, r.id DESC LIMIT ${TIN_TOI_DA}`,
      [key],
    ),
    q.query<{ tong: number; rut: number }>(
      `SELECT count(DISTINCT subject_key) FILTER (WHERE retracted_at IS NULL)::int AS tong,
              count(*) FILTER (WHERE retracted_at IS NOT NULL)::int AS rut
       FROM party_roles WHERE party_key = $1 AND role = 'nguoi_dang'`,
      [key],
    ),
  ])
  return {
    partyKey: p[0].party_key,
    source: p[0].source,
    status: p[0].status,
    statusLabel: p[0].label ?? p[0].status,
    aliases: aliases.rows.map((a) => ({
      kind: a.kind,
      label: a.label ?? a.kind,
      value: a.value,
      source: a.source,
      firstSeen: a.first_seen.toISOString(),
      retired: a.retired_at != null,
    })),
    tin: tin.rows.map((t) => ({
      subjectKey: t.subject_key,
      method: t.method,
      methodLabel: t.method_label ?? t.method,
      tier: t.tier,
      tierLabel: t.tier_label ?? t.tier,
      observedAt: t.observed_at.toISOString(),
    })),
    tongTin: dem.rows[0]?.tong ?? 0,
    soVaiRut: dem.rows[0]?.rut ?? 0,
  }
}
