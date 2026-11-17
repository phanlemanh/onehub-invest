// s16-fixture.mjs — DA33 nap-s16-vao-danh-ba: fixture tổng hợp viết trước đủ 11 kind S16 (mã tiền tố Q, không payload thật,
// không tên nguồn). Dùng chung cho pipeline/lib/s16-danh-muc.test.mjs và pipeline/scripts/danh-ba-s16.itest.mjs.
const csv = (dau, dong) => [dau, ...dong].join("\n");
export const FIXTURE = [
  { sourceId: "du-q1", kind: "du-an", payload: { url: "https://q.example/du-an/q1", html: "<p>q</p>" } },
  { sourceId: "phan-q1", kind: "phan-khu", payload: { url: "https://q.example/pk/q1?x=1", html: "<p>pk</p>" } },
  { sourceId: "dang-ban", kind: "du-an-dang-ban", payload: { items: [{ id: 1, url: "https://q.example/d/1" }] } },
  { sourceId: "mngt-khu", kind: "mngt-khu", payload: { tenTep: "k", csv: csv("\uFEFFdu_an_alias,du_an,khu_id,khu_ten,khu_alias,so_can",
    ["qb-qa,Q Du An A,k1,Q Khu 1,q-khu-1,10", "qb-qa,Q Du An A,k2,Q Khu 2,q-khu-2,5", "qb-qa,Q, Du An A,k9,x,y,1"]) } },
  { sourceId: "mngt-toa", kind: "mngt-toa", payload: { tenTep: "t", csv: csv("du_an_alias,du_an,khu_alias,toa_id,toa_ten,so_can",
    ["qb-qa,Q Du An A,q-khu-1,t1,QS2.08,3", "qb-qa,Q Du An A,q-khu-2,t2,QSA5,2"]) } },
  { sourceId: "mngt-can", kind: "mngt-can", payload: { tenTep: "c", csv: csv("du_an_alias,du_an,khu_alias,toa_ten,ma_can",
    ["qb-qa,Q Du An A,q-khu-1,QS2.08,QS2.081101", "qb-qa,Q Du An A,q-khu-1,QS2.08,QS2.081101", "qb-qa,Q Du An A,q-khu-1,QS2.08,QS2.081102",
     "qb-qa,Q Du An A,q-khu-2,QSA5,QSA501S01"]) } },
  { sourceId: "tin-q", kind: "tin-niem-yet", payload: { items: [{ id: 7, url: "/tin/7" }] } },
  { sourceId: "toa-kha", kind: "mngt-toa-khong-alias", payload: { toaKhongAlias: {
    "qb-qa|k3": { khu: { projAlias: "qb-qa", khuId: "k3", name: "Q Khu 3", docCount: 2 }, toa: [{ value: "t3", docCount: 2, name: "QHA11-SP" }] } } } },
  { sourceId: "can-moi", kind: "mngt-can-moi", payload: {
    theoTang: JSON.stringify({ toa: "qb-qa|k3|t3", toaTen: "QHA11-SP", tongKhai: 2, can: [
      { du_an: "qb-qa", khu: "Q Khu 3", toa: "QHA11-SP", tang: "10", ma_can: "QHA11-SP.10-02" }] }) + "\n{hong",
    khongTang: "" } },
  { sourceId: "mngt-pha3", kind: "mngt-can-pha3", payload: { jsonl: JSON.stringify({ key: "qb-qa|k1|t1", toaTen: "QS2.08", khai: 3, can: [
    { du_an: "qb-qa", khu: "k1", toa: "QS2.08", ma_can: "QS2.081103", doc: 1 }] }) } },
  { sourceId: "mngt-prog", kind: "mngt-toa-progress", payload: { progress: { "qb-qa|k1|t1": { xong: true } } } },
  { kind: "du-an", payload: {} },                       // thiếu sourceId
  { sourceId: "la", kind: "khong-co", payload: {} },     // kind lạ
];

