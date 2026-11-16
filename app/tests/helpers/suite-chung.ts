// suite-chung.ts — hồ sơ app-test-chap-chon-e4b-sap: ca đo thời gian thật trên DB thật chỉ chạy riêng.
// Bộ test app chung (`npm test`, tám tệp song song) đặt ONEHUB_SUITE_CHUNG=1; dưới tải đó thời gian theo máy chứ
// không theo mã. Executor riêng của hồ sơ (tir_doi_chieu, can_gia_tot_doi_chieu) không đặt biến nên ca chạy thật,
// nguyên trần đã ký.

export const BIEN_SUITE_CHUNG = "ONEHUB_SUITE_CHUNG"

/** Lý do bỏ qua cho `test(…, { skip })` khi đang ở bộ chung; `false` khi chạy riêng. */
export function boQuaTrongSuiteChung(executor: string, env: Record<string, string | undefined> = process.env): string | false {
  return env[BIEN_SUITE_CHUNG] === "1" ? `chạy riêng qua executor ${executor}` : false
}
