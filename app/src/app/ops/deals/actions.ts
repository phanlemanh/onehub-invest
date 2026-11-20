"use server";

import { getSessionUser } from "@/lib/auth";
import { dealHang, dealTheoVai, getCanCungTieuChi } from "@/lib/deals";
import { docThamSoDeal, type DealHang, type ThamSoDeal } from "@/lib/deals-chi-tiet";
import { canAccessOps, xemNoiDungTin } from "@/lib/ops-access";

/** Kết quả tab «Căn cùng tiêu chí» gửi xuống sheet: tổng trên toàn tập và tối đa 20 căn đầu, đã lọc theo vai. */
export type KetQuaCungTieuChi = { moTa: string[]; bo: string[]; tong: number; can: DealHang[] };

/**
 * Tab «Căn cùng tiêu chí» của sheet (CG17): đọc trên toàn tập đã lọc ở máy chủ, chỉ cho phiên có quyền Ops. Tham số lọc đi qua đúng bộ
 * đọc URL của trang, nên giá trị lạ bị bỏ như trên trang. Tên, SĐT, ảnh, chữ bài, địa chỉ dưới phường bị bỏ theo vai trước khi rời máy chủ.
 * `null` khi chưa có bảng hạng: sheet so trong danh sách đã tải.
 */
export async function layCanCungTieuChi(offerId: string, thamSo: Partial<ThamSoDeal>, chiPhuong: boolean): Promise<KetQuaCungTieuChi | null> {
  const user = await getSessionUser();
  if (!user || !canAccessOps(user)) throw new Error("Cần đăng nhập ops");
  if (typeof offerId !== "string" || offerId.length === 0 || offerId.length > 200) throw new Error("Mã căn không hợp lệ");
  const t = docThamSoDeal(Object.fromEntries(Object.entries(thamSo ?? {}).map(([k, v]) => [k, v === null || v === undefined ? undefined : String(v)])));
  const kq = await getCanCungTieuChi(offerId, t, chiPhuong === true);
  if (!kq) return null;
  const xemNoiDung = xemNoiDungTin(user);
  return {
    moTa: kq.moTa,
    bo: kq.bo,
    tong: kq.tong,
    can: kq.rows.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu: kq.mayThu })),
  };
}
