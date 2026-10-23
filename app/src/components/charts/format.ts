/** "Tháng 10/2026" — tiêu đề tooltip của một tháng (ngày đầu tháng, UTC ms). */
export const formatLongMonth = (day: number) => {
  const d = new Date(day)
  return `Tháng ${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`
}
