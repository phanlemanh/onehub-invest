// cham-bong-bo-sung-tin.ts — NB1: lệnh chấm bóng hàng «Bổ sung tin» (design docs/superpowers/specs/2026-11-21-cham-bong-bo-sung-tin-design.md).
//   tsx scripts/cham-bong-bo-sung-tin.ts chay --che-do thu|ap [--gioi-han N] [--tran USD]
//   tsx scripts/cham-bong-bo-sung-tin.ts bao-cao <run_id>
//   tsx scripts/cham-bong-bo-sung-tin.ts ke-the-trong
// Đọc DB trong giao dịch READ ONLY. «thu»: sổ gọi vào tệp; «ap»: sổ gọi vào ai_calls (thứ duy nhất được ghi), chỉ chạy từ main với
// cây sạch (lượt áp sau khi gộp — ROADMAP §3 mục 50). Kết quả ở state/cham-bong-bo-sung-tin/ (gitignored, không lên cloud).
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { taoRecordCallDb } from "../src/runtime/ai-call-log.js";
import { KHOA_DUONG } from "../src/enrich/doc-gop-s03/cau-hinh.js";
import { baoCao, inBaoCao } from "../src/enrich/cham-bong/bao-cao.js";
import { napCauHinhCham } from "../src/enrich/cham-bong/cau-hinh.js";
import { chay, thuMucLuot, type CheDo } from "../src/enrich/cham-bong/chay.js";
import { duongThu, goiModelThat } from "../src/enrich/cham-bong/doc.js";
import { moDocChiDoc } from "../src/enrich/cham-bong/doc-db.js";
import { CAU_DEM_THE_TRONG, keTheTrong } from "../src/enrich/cham-bong/ke-the-trong.js";

const GOC = join(import.meta.dirname, "../..");
const THU_MUC = join(GOC, "state/cham-bong-bo-sung-tin");
const URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const [lenh, ...du] = process.argv.slice(2);
const co = (ten: string) => { const i = du.indexOf(ten); return i >= 0 ? du[i + 1] : undefined; };

async function main(): Promise<number> {
  if (lenh === "chay") {
    const cheDo = co("--che-do") as CheDo;
    if (cheDo !== "thu" && cheDo !== "ap") { console.error("--che-do phải là thu hoặc ap"); return 2; }
    const { cauHinh, sha } = napCauHinhCham();
    if (cheDo === "ap") {
      const nhanh = execFileSync("git", ["-C", GOC, "rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
      const ban = execFileSync("git", ["-C", GOC, "status", "--porcelain", "--untracked-files=no"], { encoding: "utf8" }).trim();
      if (nhanh !== "main" || ban) { console.error(`lượt áp chỉ chạy từ main với cây sạch (đang ở ${nhanh}${ban ? ", cây bẩn" : ""})`); return 2; }
    }
    const thieu = cauHinh.model.filter((m) => !m.duong.some((d) => process.env[KHOA_DUONG[d]]));
    if (thieu.length) {
      console.error(`thiếu khoá cho ${thieu.map((m) => `${m.khoa} (${m.duong.map((d) => KHOA_DUONG[d]).join(" hoặc ")})`).join(", ")}`);
      return 5;
    }
    const runId = `cb-${new Date().toISOString().replace(/[:.]/g, "")}`;
    const tran = co("--tran") ? Number(co("--tran")) : undefined;
    const gioiHan = co("--gioi-han") ? Number(co("--gioi-han")) : undefined;
    console.log(`lượt ${runId} (${cheDo}), cấu hình ${sha.slice(0, 12)}, đường: ${cauHinh.model.map((m) => `${m.khoa}→${duongThu(m).join("/")}`).join(", ")}`);
    const { truy, dong } = await moDocChiDoc(URL);
    try {
      const tk = await chay({ truy, cauHinh, cheDo, goi: goiModelThat, recordCallDb: taoRecordCallDb(), thuMuc: THU_MUC, runId, tranUsd: tran, gioiHanThe: gioiHan });
      console.log(inBaoCao(baoCao(thuMucLuot(THU_MUC, tk.run_id))));
      return tk.dung_vi_tran ? 4 : 0;
    } finally { await dong(); }
  }
  if (lenh === "bao-cao") {
    if (!du[0]) { console.error("thiếu run_id"); return 2; }
    console.log(inBaoCao(baoCao(thuMucLuot(THU_MUC, du[0]))));
    return 0;
  }
  if (lenh === "ke-the-trong") {
    const { truy, dong } = await moDocChiDoc(URL);
    try {
      const k = await keTheTrong(truy);
      console.log("loại đối chiếu | đề xuất cùng tin | lượt sinh | số thẻ");
      for (const d of k.dong) console.log(`${d.loai} | ${d.de_xuat_cung_tin} | ${d.luot} | ${d.so}`);
      console.log(`Tổng ${k.tong} · đếm độc lập ${k.tong_sql}${k.tong === k.tong_sql ? "" : " — LỆCH"}\nCâu đếm: ${CAU_DEM_THE_TRONG.replace(/\s+/g, " ")}`);
      return k.tong === k.tong_sql ? 0 : 1;
    } finally { await dong(); }
  }
  console.error("lệnh: chay --che-do thu|ap [--gioi-han N] [--tran USD] · bao-cao <run_id> · ke-the-trong");
  return 2;
}
process.exitCode = await main();
