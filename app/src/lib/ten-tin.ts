/** Tên trên tin: S05 ghi chữ «unknown» khi nguồn không có tên — không phải một tên. Rỗng, toàn khoảng trắng cũng là không có tên. */
export const tenTin = (v: string | null) => {
  const ten = v !== null && v.trim() !== "" ? v : null;
  return ten?.trim().toLowerCase() === "unknown" ? null : ten;
};
