# Soát phat-bieu-cat-chuyen --thu trước/sau HT5 (AC-7)

Máy sinh bằng `node _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs --chay` lúc 2026-11-22T12:14:36.703Z, mỗi lượt một bản chép db-thu, giao dịch ROLLBACK.

## Main f962afade (mã thoát 1)

```text
trước:
  S03  property_type=8160  bedrooms=8237  bathrooms=0  street_raw=0  block_raw=4639
  S05  property_type=30  bedrooms=29  bathrooms=1  street_raw=0  block_raw=3
  S06  property_type=129764  bedrooms=88404  bathrooms=64546  street_raw=126835  block_raw=4651
sau:
  S03  property_type=8164  bedrooms=8239  bathrooms=0  street_raw=0  block_raw=4641
  S05  property_type=30  bedrooms=32  bathrooms=1  street_raw=0  block_raw=3
  S06  property_type=129764  bedrooms=88404  bathrooms=64546  street_raw=126835  block_raw=4651
S05 property_type NULL → unknown: 0 (khai trước)
legacy mới: 1
  lệch offer_0dc32597e2a07c36 · property_type: «unknown» → «apartment»
  lệch offer_0dc32597e2a07c36 · bedrooms: «null» → «0»
  lệch offer_0dc32597e2a07c36 · block_raw: «null» → «G2»
  lệch offer_0bc1d2ef8473be69 · property_type: «unknown» → «apartment»
  lệch offer_d08a9ca2fafd0cc9 · property_type: «unknown» → «apartment»
  lệch offer_d08a9ca2fafd0cc9 · block_raw: «null» → «OCP1»
  lệch offer_598510fdfd62f725 · property_type: «unknown» → «apartment»
  lệch offer_598510fdfd62f725 · bedrooms: «null» → «0»
  lệch offer_ecc39732cddebea0 · bedrooms: «null» → «1»
  lệch offer_fa865d75765627d0 · bedrooms: «null» → «1»
lượt hai — legacy mới: 0
cat-chuyen: LỆCH — không ghi (ROLLBACK)
```

## Nhánh HT5 (mã thoát 1)

```text
trước:
  S03  property_type=8160  bedrooms=8237  bathrooms=0  street_raw=0  block_raw=4639
  S05  property_type=30  bedrooms=29  bathrooms=1  street_raw=0  block_raw=3
  S06  property_type=129764  bedrooms=88404  bathrooms=64546  street_raw=126835  block_raw=4651
sau:
  S03  property_type=8164  bedrooms=8239  bathrooms=0  street_raw=0  block_raw=4641
  S05  property_type=30  bedrooms=32  bathrooms=1  street_raw=0  block_raw=3
  S06  property_type=129764  bedrooms=88404  bathrooms=64546  street_raw=126835  block_raw=4651
S05 property_type NULL → unknown: 0 (khai trước)
legacy mới: 1
  lệch offer_0dc32597e2a07c36 · property_type: «unknown» → «apartment»
  lệch offer_0dc32597e2a07c36 · bedrooms: «null» → «0»
  lệch offer_0dc32597e2a07c36 · block_raw: «null» → «G2»
  lệch offer_0bc1d2ef8473be69 · property_type: «unknown» → «apartment»
  lệch offer_d08a9ca2fafd0cc9 · property_type: «unknown» → «apartment»
  lệch offer_d08a9ca2fafd0cc9 · block_raw: «null» → «OCP1»
  lệch offer_598510fdfd62f725 · property_type: «unknown» → «apartment»
  lệch offer_598510fdfd62f725 · bedrooms: «null» → «0»
  lệch offer_ecc39732cddebea0 · bedrooms: «null» → «1»
  lệch offer_fa865d75765627d0 · bedrooms: «null» → «1»
lượt hai — legacy mới: 0
cat-chuyen: LỆCH — không ghi (ROLLBACK)
```

## Dòng lệch

| Dòng | Lý do |
|---|---|
| (không có) | hai lượt in cùng bộ dòng số |
