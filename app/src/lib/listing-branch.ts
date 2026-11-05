/** Trang `/listing/[id]` phục vụ hai loại: tin rao (`offer_…`) và listing thuê ngắn hạn (mọi id còn lại). */
export function listingBranch(id: string): "offer" | "rent_st" {
  return id.startsWith("offer_") ? "offer" : "rent_st"
}

/** Id trên đường dẫn; mã hoá hỏng hay có ký tự Postgres không nhận thì null, trang trả 404 thay vì 500. */
export function listingIdOf(raw: string): string | null {
  try {
    const id = decodeURIComponent(raw)
    return id.includes("\0") ? null : id
  } catch {
    return null
  }
}
