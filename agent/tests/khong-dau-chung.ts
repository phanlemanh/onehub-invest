// khong-dau-chung.ts — bộ đo KD-AC-6 dùng chung cho tests/judge-entity-khong-dau.test.ts (tập viết trước, suite) và
// probes/khong-dau-that.test.ts (dữ liệu thật, ngoài suite — hồ sơ l2-bao-thu-doi-probe-that). Không import khoaDuong.
type CoKhoa = { khoaDuong(v: string): string[] };
/** Bỏ dấu viết riêng trong test (không dùng boDau của luật): NFD, bỏ U+0300–U+036F, đ/Đ/ð/Ð → d/D. */
export const boDauTest = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đð]/g, "d").replace(/[ĐÐ]/g, "D");
/** Bộ loại tự viết: trên dạng bỏ dấu viết thường, bỏ cụm vị trí + số nhà đầu chuỗi rồi xét tiền tố duong/pho (HD2). */
export function biLoai(v: string): boolean {
  const s = boDauTest(v).toLowerCase().trim()
    // Hồ sơ tach-o-duong-dau-vao-ban: khoaDuong còn bỏ số nhà trần trước dấu phẩy («33/3, Đường 25A») và cụm vị trí đứng
    // sau chữ khác («Ngách xxx Ngõ 364 Phố Giải Phóng») — tiền tố duong/pho lộ ra ở đó cũng mang hai cách đọc HD2, cùng lớp loại.
    // Hồ sơ l2-bao-thu-doi-probe-that: L2 chỉ bóc số nhà khi sau phẩy là tiền tố đường hay cụm vị trí — loại theo đúng luật ấy.
    .replace(/^\d[\w/-]*\s*,\s*(?=(?:duong|pho|ngo|ngach|hem|kiet)[\s.-]|d\.)/, "")
    .replace(/^((so|ngo|ngach|hem|kiet)\.?\s*\d[\w/-]*[\s,]+)+/, "")
    .replace(/^\d[\w/-]*\s+/, "")
    .replace(/^(?:.*\S\s+)?(?:ngo|ngach|hem|kiet)\.?\s*\d[\w/-]*\s+/, "");
  return /^(duong|pho)[\s-]/.test(s);
}
/**
 * Tiền tố vị trí gõ sai dấu kèm số («kiêt 90 trần duy chiến», dữ liệu thật 04/11): khoaDuong chỉ nhận đúng dấu hoặc không dấu ở cụm kèm số, nên có dấu
 * giữ cả cụm còn không dấu thì bỏ. Đây là giới hạn đã biết, đếm riêng; các lớp dị biệt khác vẫn đỏ.
 */
// Hồ sơ tach-o-duong-dau-vao-ban: khoaDuong nay bỏ cả cụm ngõ/ngách/hẻm/kiệt đứng sau chữ khác (không áp cho «số»), nên tiền tố
// gõ sai dấu của đúng bốn từ ấy ở giữa chuỗi («đường kiêt 69 truong Đinh») cùng lớp giới hạn này.
const saiDau = (tu: string, ds: RegExp) => ds.test(boDauTest(tu)) && !/^(?:số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)$/.test(tu);
export const goSaiDauTienTo = (v: string) => {
  const t = v.normalize("NFC").trim().toLowerCase();
  const m = t.match(/^(\p{L}+)\.?\s*\d/u);
  if (m && saiDau(m[1], /^(?:so|ngo|ngach|hem|kiet)$/)) return true;
  return [...t.matchAll(/\S\s+(\p{L}+)\.?\s*\d/gu)].some((x) => saiDau(x[1], /^(?:ngo|ngach|hem|kiet)$/));
};
export const khoa = (mod: CoKhoa, v: string) => JSON.stringify([...mod.khoaDuong(v)].sort());
export function kiemAc6(mod: CoKhoa, ds: string[]): { so: number; loai: number; lech: string[] } {
  let so = 0;
  let loai = 0;
  const lech: string[] = [];
  for (const v of ds) {
    if (biLoai(v)) {
      loai++;
      continue;
    }
    so++;
    if (khoa(mod, v) !== khoa(mod, boDauTest(v))) lech.push(v);
  }
  return { so, loai, lech };
}
