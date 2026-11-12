// cho-postgis-tam.mjs — hồ sơ au11-ac3-postgis-tam-chap-chon: chờ PostGIS docker dùng một lần (ảnh kartoza) SẴN SÀNG THẬT.
// Ảnh kartoza khởi tạo xong thì in MOC_KHOI_DONG_LAI, tắt postgres rồi khởi động lại — log có HAI dòng «ready to accept
// connections». pg_isready báo up ngay sau dòng thứ nhất, nên bước chờ cũ (pg_isready + ngủ 3 giây) trả về trước lần khởi
// động lại và dưới tải kết nối của test bị cắt («Connection terminated unexpectedly»).

export const MOC_KHOI_DONG_LAI = "Postgres initialisation process completed";
export const DONG_SAN_SANG = "ready to accept connections";
export const LOI_CHUA_KHOI_DONG_LAI = "chưa thấy khởi động lại sau khởi tạo";
export const LOI_SELECT_CHUA_ON = "SELECT 1 chưa ổn định";

/** Log (gộp stdout và stderr) đã qua lần khởi động lại sau khởi tạo: có dòng mốc và SAU nó có dòng sẵn sàng. */
export function daQuaKhoiDongLai(log) {
  const s = String(log ?? "");
  const i = s.indexOf(MOC_KHOI_DONG_LAI);
  return i >= 0 && s.indexOf(DONG_SAN_SANG, i + MOC_KHOI_DONG_LAI.length) >= 0;
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Chờ tới khi log qua lần khởi động lại, rồi `chayTruyVan()` thành công `lanLienTiep` lần liền nhau cách `cach` ms (một lần lỗi
 * đếm lại từ đầu). Quá `han` ms thì ném Error mang đúng tên bước chưa xong.
 * @param {{ docLog: () => string, chayTruyVan: () => Promise<unknown>, han?: number, nhip?: number, cach?: number, lanLienTiep?: number }} o
 */
export async function choPostgisTam({ docLog, chayTruyVan, han = 180_000, nhip = 1000, cach = 1000, lanLienTiep = 2 }) {
  const het = Date.now() + han;
  while (!daQuaKhoiDongLai(docLog())) {
    if (Date.now() >= het) throw new Error(LOI_CHUA_KHOI_DONG_LAI);
    await ngu(nhip);
  }
  let lien = 0;
  for (;;) {
    try {
      await chayTruyVan();
      lien++;
      if (lien >= lanLienTiep) return;
    } catch {
      lien = 0;
    }
    if (Date.now() >= het) throw new Error(LOI_SELECT_CHUA_ON);
    await ngu(cach);
  }
}
