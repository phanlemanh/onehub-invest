// Lỗi DB tạm thời khi nhiều bộ test (nhiều phiên, nhiều dãy) cùng chạy trên DB local :5433 dùng chung — hồ sơ
// test-nen-on22-on12. Chỉ thử lại đúng các mã tạm thời; lỗi khác ném ngay để ca vẫn đỏ vì lỗi thật.
export const MA_TAM_THOI = new Set(["53300", "40P01", "57P03"]) // hết suất kết nối · deadlock · DB đang khởi động

export const laLoiTamThoi = (e: unknown): boolean => MA_TAM_THOI.has(String((e as { code?: unknown })?.code ?? ""))

/** stderr của tiến trình con (bên ghi push-ops-facts) mang lỗi DB tạm thời. */
export const laLoiBenGhiTam = (stderr: string): boolean =>
  /too many clients|deadlock detected|the database system is starting up|\b(53300|40P01|57P03)\b/.test(stderr)

export async function thuLaiDbTam<T>(
  fn: () => Promise<T>,
  { lan = 3, choMs = 500, bao = (dong: string) => console.log(dong) } = {},
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn()
    } catch (e) {
      if (!laLoiTamThoi(e) || i >= lan) throw e
      bao(`# lỗi DB tạm thời ${(e as { code: string }).code} — thử lại lần ${i + 1}/${lan}`)
      await new Promise((r) => setTimeout(r, choMs * i))
    }
  }
}
