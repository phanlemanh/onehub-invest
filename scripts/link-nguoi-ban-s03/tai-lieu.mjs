// tai-lieu.mjs — E11a (AC-11, phần máy đọc được): runtime-map và runbook có mục bộ tra hồ sơ với con số trần và đủ mã tệp chặn,
// mappings.yaml khai luật mới, CONTEXT.md có thuật ngữ username người bán. Đủ hay không để người khác vận hành là E11b (judgment).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, boKiem } from "./chung.mjs";

const doc = (f) => readFileSync(join(ROOT, f), "utf8");
const MA_CHAN = ["khong-co-phien", "http-401", "http-429", "rate-limit", "loi-may-chu", "loi-la", "het-15s", "listener-dong-sau-goi",
  "khac-khong-gian-ma", "sai-khuon-yeu-cau"];

export async function chay() {
  const k = boKiem("tai-lieu");
  const rm = doc("docs/ops/runtime-map.md");
  const muc = rm.slice(rm.indexOf("## Bộ tra hồ sơ người bán S03"));
  k.kiem("runtime-map có mục bộ tra hồ sơ", rm.includes("## Bộ tra hồ sơ người bán S03"));
  for (const [ten, re] of [["20 mã", /≤ 20/], ["60 giây", /≥ 60 giây/], ["30 lời/ngày", /≤ 30/], ["01:00–05:00", /01:00–05:00/], ["15 giây", /15 giây/]]) {
    k.kiem(`runtime-map ghi trần ${ten}`, re.test(muc));
  }
  for (const m of MA_CHAN) k.kiem(`runtime-map xử tệp chặn ${m}`, muc.includes(`\`${m}\``));
  k.kiem("runtime-map: cấm đăng nhập thứ hai, chỉ Mạnh bật lượt lớn, tắt không cần khởi động lại, chưa đo",
    /cấm đăng nhập thứ hai/i.test(muc) && /Lượt lớn chỉ Mạnh bật/.test(muc) && /không cần khởi động lại/.test(muc) && /Chưa đo/.test(muc));
  const rb = doc("docs/ops/runbook-openclaw-hook.md");
  k.kiem("runbook có mục bộ tra, tiền kiểm thêm và dung-goi-Manh",
    rb.includes("## Bộ tra hồ sơ người bán S03") && /Tiền kiểm thêm/.test(rb) && rb.includes("dung-goi-Manh"));
  k.kiem("mappings.yaml khai luật s03_ho_so_theo_tai_khoan kèm sáu điều kiện",
    /code: s03_ho_so_theo_tai_khoan/.test(doc("pipeline/mappings.yaml")) && /Sáu điều kiện ADR-0011/.test(doc("pipeline/mappings.yaml")));
  k.kiem("CONTEXT.md có thuật ngữ username người bán", /\*\*Username người bán\*\*:/.test(doc("CONTEXT.md")));
  return k.ketThuc();
}
