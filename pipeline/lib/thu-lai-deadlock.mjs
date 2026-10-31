// thu-lai-deadlock.mjs — hồ sơ resolve-thu-lai-deadlock: chạy lại đúng câu bị Postgres huỷ vì deadlock (40P01).
// Chỉ mã 40P01; mọi lỗi khác ném ngay. Câu bị huỷ được Postgres hoàn lại trọn, nên câu tự commit chạy lại an toàn.
// Hết lượt → ném nguyên lỗi 40P01 cuối cùng (người gọi thoát như trước).

export const MAC_DINH = Object.freeze({ lan: 3, nhip: Object.freeze([500, 1000, 2000]) });

const choThat = (ms) => new Promise((r) => setTimeout(r, ms));

/** 40 ký tự đầu của câu SQL đã gộp khoảng trắng — nhãn cho dòng log, không mang tham số. */
export function nhanCau(sql) {
  return String(sql).replace(/\s+/g, " ").trim().slice(0, 40);
}

/** Bọc client pg: `query(sql, params)` thử lại khi gặp 40P01, tối đa `lan` lần, chờ `nhip[k-1]` ms trước lần thử thứ k. */
export function boc(client, { lan = MAC_DINH.lan, nhip = MAC_DINH.nhip, cho = choThat, ghiLoi = (s) => process.stderr.write(s + "\n") } = {}) {
  let soLanThuLai = 0;
  let soCauGui = 0;
  return {
    async query(sql, params) {
      for (let k = 0; ; k++) {
        soCauGui++;
        try {
          return await client.query(sql, params);
        } catch (e) {
          if (e?.code !== "40P01" || k >= lan) throw e;
          const ms = nhip[Math.min(k, nhip.length - 1)];
          ghiLoi(`resolve-properties: deadlock (40P01) ở «${nhanCau(sql)}», thử lại ${k + 1}/${lan} sau ${ms}ms`);
          soLanThuLai++;
          await cho(ms);
        }
      }
    },
    get soLanThuLai() { return soLanThuLai; },
    get soCauGui() { return soCauGui; },
  };
}
