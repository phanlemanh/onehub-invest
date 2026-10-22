// Che chữ tầng A (SPL, ADR-0007) trong trang ĐANG MỞ trước khi chụp ảnh bằng chứng.
// Chạy trong trang (page.evaluate / javascript_tool) với window.__TIER_A_NAMES = mảng tên thật.
// 1) Mọi phần tử [data-tier-a] → chữ thay bằng █ (tối đa 24 ký tự, giữ bố cục gần đúng).
// 2) Tự kiểm: innerText của trang không còn tên nào trong danh sách (so không phân biệt hoa thường).
// Trả { masked, leaked } — leaked chỉ là SỐ THỨ TỰ trong danh sách, không lặp lại tên thật.
(() => {
  const names = (window.__TIER_A_NAMES || []).filter((n) => typeof n === "string" && n.trim().length >= 3)
  const nodes = Array.from(document.querySelectorAll("[data-tier-a]"))
  for (const el of nodes) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const texts = []
    while (walker.nextNode()) texts.push(walker.currentNode)
    for (const t of texts) {
      const len = Math.min(24, Math.max(3, t.nodeValue.trim().length))
      if (t.nodeValue.trim()) t.nodeValue = "█".repeat(len)
    }
    el.setAttribute("data-tier-a-masked", "")
  }
  const body = (document.body.innerText || "").toLowerCase()
  const leaked = []
  names.forEach((n, i) => {
    if (body.includes(n.trim().toLowerCase())) leaked.push(i)
  })
  return { masked: nodes.length, checkedNames: names.length, leaked }
})()
