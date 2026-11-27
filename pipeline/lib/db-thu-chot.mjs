// db-thu-chot.mjs — chốt chặn chung cho test có lệnh phá (DROP/TRUNCATE/DELETE): chỉ chạy trên DB thử tên
// oneinvest_suite_* (tên db/db-thu.sh --chay cấp). Danh sách CHO PHÉP theo tên DB — mọi cách viết URL khác
// (postgresql://, ?sslmode, host 127.0.0.1, thiếu mật khẩu) đều quy về tên rồi mới so, nên DB máy thu
// `oneinvest` không lọt. Hồ sơ s08-nap-sua AC-5; hàng test-pha-chi-chay-db-suite áp cho các tệp còn lại.

export const MAU_DB_THU = /^oneinvest_suite_[a-z0-9_]+$/;

/** Tên DB từ URL Postgres (postgres:// hay postgresql://, bỏ query, giải %xx). URL hỏng → "". */
export function tenDbThu(url) {
  if (!url) return "";
  try {
    const u = new URL(String(url).replace(/^postgres(ql)?:/i, "http:"));
    return decodeURIComponent(u.pathname.replace(/^\//, "").split("/")[0] ?? "");
  } catch {
    return "";
  }
}

/** Lý do từ chối (chuỗi) hoặc null khi URL trỏ DB thử hợp lệ. Không bao giờ nhắc URL đầy đủ. */
export function lyDoTuChoi(url) {
  if (!url) return "thiếu DATABASE_URL";
  const ten = tenDbThu(url);
  if (!ten) return "DATABASE_URL không đọc được tên DB";
  if (!MAU_DB_THU.test(ten)) return `DB '${ten}' không phải DB thử oneinvest_suite_*`;
  return null;
}

/**
 * Gọi ở đầu tệp test, TRƯỚC mọi kết nối. Trả URL khi hợp lệ.
 * Thiếu URL: `khiThieu: "bo-qua"` → in một dòng và thoát 0 (tệp không chạy ca nào); mặc định → thoát 2.
 * Có URL mà tên không khớp → luôn thoát 2.
 */
export function chotDbThu({ ten = "test", url = process.env.DATABASE_URL, khiThieu = "tu-choi" } = {}) {
  const lyDo = lyDoTuChoi(url);
  if (lyDo === null) return url;
  if (!url && khiThieu === "bo-qua") {
    console.log(`${ten}: bỏ qua — thiếu DATABASE_URL (chạy qua db/db-thu.sh oneinvest_suite_<bộ> --chay)`);
    process.exit(0);
  }
  console.error(`${ten}: từ chối — ${lyDo}; test có lệnh phá chỉ chạy trên DB thử (db/db-thu.sh oneinvest_suite_<bộ> --chay)`);
  process.exit(2);
}

// HT35 (test-khong-roi-ve-db-chung): test TỰ DỰNG bảng thật rồi ghi. Trên máy người, M5, máy thu chỉ DB oneinvest_suite_*
// được chạy; trên runner CI (CI=true) DB là dịch vụ dùng một lần nên ca VẪN CHẠY, không bỏ qua:
//   - thiếu DATABASE_URL → DB dịch vụ của ci-test.yml (localhost:5433, tên «oneinvest», dựng từ migration) — Mạnh chốt ở HT23;
//   - URL tên khác «oneinvest» (bước scripts của suite-neu-doi đặt oneinvest_ci_scripts_<pid>) → nhận.
// URL ghi tường minh tên «oneinvest» thì TỪ CHỐI cả khi CI=true: đó là tên DB chung của máy, và runner CI không bao giờ đặt nó.
// Giới hạn đã khai: một người tự đặt CI=true trên máy mà KHÔNG đặt URL thì rào nhường (cùng luật HT23).
// DB dịch vụ CI: chỉ dùng khi CI=true và thiếu URL — tức process.env.DATABASE_URL vắng (cùng dạng HT23, DT-AC-7 nhận dạng này).
export const URL_DB_CI = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** URL CI được phép, hoặc null khi không ở runner CI / URL là tên DB chung. Không nối DB. */
export function urlCiChoPhep(url = process.env.DATABASE_URL, env = process.env) {
  if (env.CI !== "true") return null;
  if (!url) return URL_DB_CI;
  const ten = tenDbThu(url);
  return ten && ten !== "oneinvest" ? url : null;
}

/** URL cho test có câu ghi: CI theo `urlCiChoPhep`, ngoài CI chỉ oneinvest_suite_*. Sai → NÉM trước mọi kết nối. */
export function urlDbTestGhi({ ten = "test", url = process.env.DATABASE_URL, env = process.env } = {}) {
  const ci = urlCiChoPhep(url, env);
  if (ci) return ci;
  const lyDo = lyDoTuChoi(url);
  if (lyDo === null) return url;
  throw new Error(`${ten}: từ chối — ${lyDo}; test tự dựng bảng rồi ghi chỉ chạy trên DB thử (db/db-thu.sh oneinvest_suite_<bộ> --chay)`);
}
