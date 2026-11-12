// cho-postgis-tam.mjs — hồ sơ au11-ac3-postgis-tam-chap-chon: chờ PostGIS docker dùng một lần (ảnh kartoza) SẴN SÀNG THẬT.
// Ảnh kartoza khởi tạo xong thì in MOC_KHOI_DONG_LAI, tắt postgres rồi khởi động lại — log có HAI dòng «ready to accept
// connections». pg_isready báo up ngay sau dòng thứ nhất, nên bước chờ cũ (pg_isready + ngủ 3 giây) trả về trước lần khởi
// động lại và dưới tải kết nối của test bị cắt («Connection terminated unexpectedly»).

export const MOC_KHOI_DONG_LAI = "Postgres initialisation process completed";
export const DONG_SAN_SANG = "ready to accept connections";
export const LOI_CHUA_KHOI_DONG_LAI = "chưa thấy khởi động lại sau khởi tạo";
export const LOI_SELECT_CHUA_ON = "SELECT 1 chưa ổn định";

/**
 * Log đã qua lần khởi động lại sau khởi tạo: có dòng mốc VÀ có từ hai dòng sẵn sàng trở lên. Không dựa vào thứ tự dòng: `docker
 * logs` tách stdout (mốc của entrypoint) và stderr (dòng của postgres), nối hai luồng thì mốc đứng trước cả dòng sẵn sàng lần một.
 */
export function daQuaKhoiDongLai(log) {
  const s = String(log ?? "");
  return s.includes(MOC_KHOI_DONG_LAI) && s.split(DONG_SAN_SANG).length - 1 >= 2;
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
  let lien = 0, cuoi = null;
  for (;;) {
    try {
      await chayTruyVan();
      lien++;
      if (lien >= lanLienTiep) return;
    } catch (e) {
      lien = 0;
      cuoi = e;
    }
    if (Date.now() >= het) throw new Error(cuoi ? `${LOI_SELECT_CHUA_ON}: ${cuoi.message}` : LOI_SELECT_CHUA_ON, { cause: cuoi });
    await ngu(cach);
  }
}
