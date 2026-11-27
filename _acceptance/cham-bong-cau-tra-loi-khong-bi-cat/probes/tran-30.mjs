// tran-30.mjs — in mức chi cao nhất (mọi lời gọi chạm trần token ra của thẻ) của 30 thẻ đầu theo xepThe, theo từng model, bằng hàm của
// chính bộ chạy. Đọc DB trong giao dịch READ ONLY. Dùng (từ agent/): node --import tsx tran-30.mjs [--tran USD]
const AGENT = new URL("../../../agent/", import.meta.url).pathname;
const { moDocChiDoc, docThe, xepThe, oCuaThe } = await import(AGENT + "src/enrich/cham-bong/doc-db.ts");
const { loiNhac } = await import(AGENT + "src/enrich/cham-bong/prompt.ts");
const { tranTokenRa } = await import(AGENT + "src/enrich/cham-bong/doc.ts");
const { napCauHinhCham } = await import(AGENT + "src/enrich/cham-bong/cau-hinh.ts");
const i = process.argv.indexOf("--tran");
const TRAN = i > 0 ? Number(process.argv[i + 1]) : 0.1;
const { cauHinh } = napCauHinhCham();
const { truy, dong } = await moDocChiDoc(process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest");
try {
  const ds = xepThe((await docThe(truy)).the).slice(0, 30);
  const theoO = {};
  let tong = 0;
  for (const m of cauHinh.model) {
    let usd = 0;
    for (const t of ds) {
      const o = oCuaThe(t);
      const p = loiNhac({ text: t.text, group_name: t.group_name, o });
      usd += ((p.system.length + p.user.length) / 3 * m.gia_vao + tranTokenRa(o.length) * m.gia_ra) / 1e6;
    }
    console.log(`${m.khoa} (${m.gateway}): mức chi cao nhất ${usd.toFixed(4)} USD`);
    tong += usd;
  }
  for (const t of ds) theoO[oCuaThe(t).length] = (theoO[oCuaThe(t).length] ?? 0) + 1;
  console.log(`${ds.length} thẻ, số thẻ theo số ô: ${JSON.stringify(theoO)}`);
  console.log(`tổng mức chi cao nhất ${tong.toFixed(4)} USD, trần ${TRAN} USD`);
  if (!(tong <= TRAN)) { console.log(`vượt trần: ${tong.toFixed(4)} > ${TRAN}`); process.exitCode = 1; }
} finally { await dong(); }
