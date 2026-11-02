// AC-1 vế hai: danh mục code=1 + trang rỗng là hết danh mục, không ném; code≠1 vẫn ném. fetch giả, không gọi nguồn.
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
process.env.S08_EP_CATALOG = "catalog-gia";
const { fetchProjectCatalog } = await import(resolve(ROOT, "collector/dist/collectors/s08-danh-muc.js"));

let loi = 0;
const kiem = (ok, dong) => { console.log(`${ok ? "ok  " : "FAIL"} ${dong}`); if (!ok) loi = 1; };
const voi = async (body) => {
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 200 });
  try {
    return { tong: await fetchProjectCatalog("http://testbase", "TKN-GIA", async () => {}) };
  } catch (e) {
    return { nem: String(e.message) };
  }
};
const rong = await voi({ code: 1, data: [] });
kiem(rong.tong === 0 && !rong.nem, "code=1 + data rỗng: kết thúc bình thường, 0 dự án");
const thieu = await voi({ code: 1 });
kiem(thieu.tong === 0 && !thieu.nem, "code=1 + thiếu data: kết thúc bình thường, 0 dự án");
const khong = await voi({ code: 0, data: [] });
kiem(/code=0/.test(khong.nem ?? ""), "should-NOT-fire: code=0 không được coi là hết danh mục");
const vang = await voi({ data: [] });
kiem(/code=undefined/.test(vang.nem ?? ""), "should-NOT-fire: thiếu code không được coi là hết danh mục");
if (!loi) console.log("RONG OK");
process.exit(loi);
