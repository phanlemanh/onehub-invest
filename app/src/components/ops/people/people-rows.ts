import type { SourceNameEntry } from "@/lib/mask-source-names"
import { hienBiDanh, laMoiGioi, type NguoiHang } from "@/lib/ops/people"

import type { HangNguoi } from "./people-text"

/** Hàng bảng sau khi áp quyền xem và bộ che tên nguồn (phía máy chủ — giá trị bí danh không tới trình duyệt viewer). */
export function hangNguoi(r: NguoiHang, entries: SourceNameEntry[], xem: boolean): HangNguoi {
  const hien = (kind: string, v: string | null) => (v == null ? null : hienBiDanh(kind, v, entries, xem))
  return {
    partyKey: r.partyKey,
    source: r.source,
    soTin: r.soTin,
    soBiDanh: r.soBiDanh,
    moiGioi: laMoiGioi(r.soTin),
    an: !xem,
    ten: hien("ten", r.ten),
    taiKhoan: hien("tai_khoan_nguon", r.taiKhoan),
    sdtBam: hien(r.sdtKind, r.sdtBam),
  }
}
