# PL20 — Chấm độ đúng trên lát hai-khu-ghep-b (n1) · hai-khu-ghep-c (n2)

Tệp đầu ra máy đóng băng: `b537a022f5821c802ce84bcda33db22f761d84cdb9f61593a181c790494256a5` (n1) · `c42fa719a731ae12ccaa97bba5cdbd74a9c6f471d75b01112a119d1471ad5658` (n2). Ngưỡng: cận dưới Wilson 95% từ 0.95, mỗi nhóm 110 bài.

**Kết luận: chưa đạt.** Nguồn phải tắt: C, F.

| Nhóm | Nguồn | Đã chấm | Đúng | Sai | Cận dưới Wilson | Trạng thái |
|---|---|---:|---:|---:|---:|---|
| n1 | A, B | 110/110 | 109 | 1 | 0.9503 | dat |
| n2 | C, F | 110/110 | 108 | 2 | 0.9361 | hut |

## Theo nguồn

| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |
|---|---|---:|---:|---:|
| n1 | A | 108 | 107 | 99.1% |
| n1 | B | 2 | 2 | 100.0% |
| n2 | F | 89 | 87 | 97.8% |
| n2 | C | 21 | 21 | 100.0% |

## Theo mức gắn

| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |
|---|---|---:|---:|---:|
| n1 | toa | 94 | 94 | 100.0% |
| n1 | vung | 16 | 15 | 93.8% |
| n2 | vung | 89 | 87 | 97.8% |
| n2 | toa | 21 | 21 | 100.0% |

## Theo khu

| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |
|---|---|---:|---:|---:|
| n1 | 1 | 39 | 39 | 100.0% |
| n1 | 16 | 71 | 70 | 98.6% |
| n2 | 1 | 14 | 14 | 100.0% |
| n2 | 16 | 96 | 94 | 97.9% |

## Bài máy sai — soát lỗ danh bạ trước khi kết luận

| Nhóm | Bài | Máy gắn | Người ghi (toà · khu) | Quy về danh bạ |
|---|---|---|---|---|
| n1 | 19440fe2b2c8fd114b49296b75cf54c2 | vung/49 | — · the sapphire 1 | không quy được |
| n2 | 00e5c7bbba8cc05376a5ef1b3991f4ee | vung/389 | — · the rainbow | vung=48 |
| n2 | 3605b344d86c8576e148fc0e05540c31 | vung/389 | — · the rainbow | vung=48 |

## Mạnh sửa nháp của trợ lý

| Nhóm | Có nháp | Giữ nguyên | Sửa | Mạnh tự quyết | Thẻ cài (đếm riêng) | Tỉ lệ sửa (trừ thẻ cài) |
|---|---:|---:|---:|---:|---:|---:|
| n1 | 110 | 104 | 1 | 5 | 0 | 5.5% |
| n2 | 110 | 101 | 0 | 0 | 9 | 0.0% |

## Số theo cách gắn thẻ

| Nhóm | Cách gắn | Bài | Đúng | Tỉ lệ | Lưu trước giờ duyệt |
|---|---|---:|---:|---:|---|
| n1 | manh-tung-the | 110 | 109 | 99.1% | — |
| n2 | duyet-lo-truoc-luu | 110 | 108 | 98.2% | — |

## Số để đối chiếu

```json
{"dat":false,"nguon_phai_tat":["C","F"],"nhom":{"n1":{"tong":110,"n":110,"dung":109,"sai":1,"chua_gan":0,"lech":[],"ds_sai":[{"ref_id":"19440fe2b2c8fd114b49296b75cf54c2","may":"vung/49","nhan":[{"building":null,"subzone":"the sapphire 1","quy":{}}]}],"theo_nguon":{"A":{"n":108,"dung":107},"B":{"n":2,"dung":2}},"theo_muc":{"toa":{"n":94,"dung":94},"vung":{"n":16,"dung":15}},"theo_khu":{"1":{"n":39,"dung":39},"16":{"n":71,"dung":70}},"wilson":0.9503,"trang":"dat"},"n2":{"tong":110,"n":110,"dung":108,"sai":2,"chua_gan":0,"lech":[],"ds_sai":[{"ref_id":"00e5c7bbba8cc05376a5ef1b3991f4ee","may":"vung/389","nhan":[{"building":null,"subzone":"the rainbow","quy":{"vung":"48"}}]},{"ref_id":"3605b344d86c8576e148fc0e05540c31","may":"vung/389","nhan":[{"building":null,"subzone":"the rainbow","quy":{"vung":"48"}}]}],"theo_nguon":{"F":{"n":89,"dung":87},"C":{"n":21,"dung":21}},"theo_muc":{"vung":{"n":89,"dung":87},"toa":{"n":21,"dung":21}},"theo_khu":{"1":{"n":14,"dung":14},"16":{"n":96,"dung":94}},"wilson":0.9361,"trang":"hut"}},"lat":"hai-khu-ghep-b (n1) · hai-khu-ghep-c (n2)","tep":"`b537a022f5821c802ce84bcda33db22f761d84cdb9f61593a181c790494256a5` (n1) · `c42fa719a731ae12ccaa97bba5cdbd74a9c6f471d75b01112a119d1471ad5658` (n2)","sua_nhap":{"n1":{"co_nhap":110,"giu":104,"sua":1,"tu_quyet":5,"ds_sua":["19440fe2b2c8fd114b49296b75cf54c2"],"ds_tu_quyet":["019164799bab41883c7d5d1018df3278","14c0192f3b3d6dc0c676569816e9a5d4","2b4c71cfd46174a0739006eee49ae4cf","69a138db9c36970b482df88864f6fcb4","ad5a00f831e9925055be44d9949fc2b1"]},"n2":{"co_nhap":110,"giu":101,"sua":0,"tu_quyet":0,"ds_sua":[],"ds_tu_quyet":[],"the_cai":9}},"loai_the":{"n1":{"manh-tung-the":{"n":110,"dung":109,"ds":["019164799bab41883c7d5d1018df3278","0e538607bf35a34f9300dc93f7ded35a","0ff73b43c59a0ad094a86837d6c0fd33","147b917a3531046512724614fde46bc3","14c0192f3b3d6dc0c676569816e9a5d4","19440fe2b2c8fd114b49296b75cf54c2","1c037933810adbfb4fd099b8104079bc","1ca4568162205bb840af37b67ace31cd","1d26ed588356045e9739a03b6cb83157","2af921cfdac440192ecd10f981c715b3","2b4c71cfd46174a0739006eee49ae4cf","2d72bf11a6b02f6e0507e08c6f5ff480","2f73d4f693d041fab22a77265cfa7557","2ff60159f1a36f0a3c9ab6a393a29a00","312a9e331ca3eb89a2f771c0446b8bbb","32778a86d0f79cb6c4e2d5bbc01fe274","40d5d669b2c9708053ae690a6d56d3de","42d780574e2a239a9dd2aa3d314199e6","44c91f4297ef7f7137f95646d8ca76e4","4542a9965f79a40bccde519b1d603565","458d9425fde00131c6fbdbc9cba6ef02","468f0bc6eea51a4a2f47e33d30eca3e8","46c914278104681a305d39a7ed36da91","479d9b6362723e2a1d4cea7a1979f65c","47cb2642c106b081da35670ba4a0acd0","4e1467c27d89db3bfc5a6d36d673b6ec","50e9dc1dfc3d265b21005d0263e29318","52345372a17235b444beac895ac489f5","5b0f962da6dafd7cbfcb23d8eaff3f83","5b6f86eb5b18d1139c264915f64ee8d2","5c636b26b54ef8b571b55904f3f4e496","5e9a6ff1297bcbf593b72a6dc739df42","60f138a9b866fe28db30ae2d75f23cc6","619f1b4cb325e597d5d4a4aa19660f77","61e73681145708fb5ec2fdc07d4368ef","63d9fc58f43e3e5347955820926a36a7","65ef5b9f3265d90fdfa21cf42cd758f9","677c995cc030d3e1c0d72f80896ded28","67ec1b9d0c295d41c851c01a2d3a2d37","69a138db9c36970b482df88864f6fcb4","6a358f0da1af6bf42a7e1be0daa51ea2","6cb3c5236317c2a20bbd445a35dbabb1","6cbc47f19d081d51a8d73dbaf4fba242","6f5ef8e3e3e305df8c3909b85b5489f6","704a14fe0a8a005ce7998f741ce7b443","72f3d6549bf775d0c9e9c3012accb74b","747383dbfc48b89805c04e2ce9ab455d","797f2d7c7e7ee14279149e544360da90","7a6afb87778139b0a0c89fa7f6fa4278","7c33ddf7782e219577e267411fadb2d1","7da572ec432ef766f6e66e671b384a2a","7e0b5d2701791d626590ba4d00abfa6a","80f7e56c9aaf992887db03565711cc07","83d366b564495a5706ea848486cb8829","88bf93d61994e70fb237e9a24055d7d3","8a2b8deab94c1ec2cdb8af01e92adf32","8ae2da26af14f9c878fff6e948e13319","8afbbdfd0f8f119cdb7a7ae4409cadbc","8baffb234d5b287a6fed6dc72e23e4b6","943a959bbf0f07c696ede0f34b8523ab","96a48e6ec5ecb8f0dc10aa1ec458ea17","97d8715bf54a9189286e4d1e6d8c167e","991799d176f0539bba2d5ff90197392f","9d832058fb36c1cce618591a83014a2e","9f1b1fb14a544fbf3f7361f239859db1","9f86dd42918ff14b5fb9599f5a4cca03","9fac383933e0d710dd4103a6c029b147","a4540e65f8845bee32b27b9a59255fa2","a5d116d1ea1138b855eaf3cd3fdeefc5","a66384688a854ee6855f24324446644c","abe342372a15b933422ef95b87a8d6c0","abf0e55c4397c9a7997eb65ea614637b","ad5a00f831e9925055be44d9949fc2b1","aee3413aba4050841c75200823103861","af4a75a698dd0ca040987a8276b76134","afd4f9fd8c727f324a29cbcafe9a1a18","b9328e1e73436580bc0c30d8a149242b","bf2327d2adbc6940ff079ca43c613c29","bf2a3d79f9cc2bb8958d84ce43e98f23","c186cc6575044a0085b83125fa5d74a4","c3f3096de7e8adbf81c49fd07ee3bac6","c548cd367d07d4a1b337b81f1a54ff44","c8081564493817cea407938628dcb254","c823f2c2b75d6b434afadc3139004fcf","ca964d7376177df94a4a26d6569dfc9b","ccb04f383ebcb87f0ebd49db2f40546f","d2cc082b6d642b5381b686171bb8e6a8","d2da506fb875f69b4ec457fe43119efa","d6147a49ea2ad9894e6a234bc53c737d","d6d5726c8b1490c2548b8e4441f9adf2","d995f32f1427e5e1c33ac5763474b0e5","dc12ae7d393850dbe501c97175a31358","e181a8b79c1fd0ef0793e1766759b8da","e2f427f110a92595d47e05d59ddce112","e32e5dafa46034525b4900b64b81a0d2","e486e5280f2375df6fd531d027d3e669","e5d1814ee662d3994a35e4a95bd686ea","e75ce2a3e6d2374de841cf6fc8ba2c66","e97ed379ba79b65bd2d9e5ab325f335d","edd8eb9bae80a26342d41ec185a0a50e","ee3338d00167d769fd5e78b763d389cc","ee56af19fa69ce119d8cfc290c8f7280","ef1b713d4a366364583267a105b67936","f17135a56807928f1943ee53a445d04b","f28332f49c3d6f4958d5488ccc86dd20","f5683600df89a2c34560222669aae593","f8edad0be2ec3af4b5438f48e323df6f","f9aaed70569935dc1c7758c6e0499d74","fc6eef580bbba5d4ca58fb8781a11b54","fe9916ee7d13f6b399eb42d8ed521c37"],"luu_truoc_gio_duyet":[]},"duyet-lo-truoc-luu":{"n":0,"dung":0,"ds":[],"luu_truoc_gio_duyet":[]},"luu-truoc-duyet-hoi-to":{"n":0,"dung":0,"ds":[],"luu_truoc_gio_duyet":[]}},"n2":{"manh-tung-the":{"n":0,"dung":0,"ds":[],"luu_truoc_gio_duyet":[]},"duyet-lo-truoc-luu":{"n":110,"dung":108,"ds":["00e5c7bbba8cc05376a5ef1b3991f4ee","010f0f796c52d38829a9d5037273aa58","019f8f94086ea32f6cb660dd2db6c33e","02577752979d20157171e7984cc932e3","02877ef46624bc6dbd61ff1459ace7ca","02d64f1a09fffb2283bfa7cee38d4d56","04199d9ca1a5bd495d9b5230b19eebc3","05be315c67cec25c3ae3f3478730d86e","07b00c8dc472ed8b6e997e166d20af2f","07b84a54b309ae2d6c4c0acbafa44d0c","0806a0e837365c6ebbd6f43519387bef","0b2ebf6fb12d29583cf7ebc18bffd85e","0de8382bf4f3189e21b23d473c45e429","0f1a28b2db663049bd454dca9b18b0dc","0f4328fdcb7f8d1a8729d7eec7da7aab","10c9678d2859539c6f66678ba8b520ec","12235e512fa84575f848ca2d75d62639","143dc8a7b912a56ce43a85f2985d4088","1571171a11aec0233cf0682c411fef77","1627ff55ec68f4e65ae8eb6649a4414d","166e194071b48457c80c29e20a23a533","17320b0c82695ee0a04c79678228deb5","175efc1d0c0b1196ebfefd6ea6d0f1b0","182bb3e6f93a8faf8a1d8291c7bb5a26","19f70342172eaf75be33a576cbd1cd13","1b66c89c059ccc12dfc007f71076dcb3","1b7e5c716f7d74da9be4e2fc980752a6","1bdd047f5e548a60b16d9c642bfbdcf9","1c77e6ef9c298b97d7d34b46935b68a1","21cc7e2e57a8bb7c944cf86981dd72a5","220df5aa43dd63d2b965d07d1ec99a58","220edd04e9bb97443e9848b80b82cb1a","235d2afca7dda7752fd355bee8440821","23ecee4c13e919488fe0d00e7781efa8","2932a6ca0d0e865e65d71376bc5b8777","29601d6ca5c9a5432162459f126c3aa5","298c021a475ff97f62091b48cf7a55b0","29b1d1c30dca6f25dfa12628cd620384","2b1f9f0db82b781aef45bcdc0c68ee8e","2cadeadf14d0d91bb2d1e18f1f317214","2cf896f0141f2d5d5e37b9bfe7b7c43b","2f16cf6243be256a337b8e6bdcb25b94","2f4b36c1bef04ca4422089c48de42cc3","2f8b833cd5294690711151a9f6ea274d","32d9959a1306f7beb9dafab21050d90a","348beeaf4a4c298017543a1765d851dd","34e00f250df0a6b838ccf7795acf7411","353af57b25d44944a5239589d1283f70","3605b344d86c8576e148fc0e05540c31","375c190a0a0e3152db0ddb8486f3cbc4","37add7d8a6b960916730850bd2c0c058","3c56685ae566c971965efa430ccedbee","3e45eac98a6bd5a41ce5cb2cf55d23dc","3fdb1138ae3f705580bbb91c748bbdde","41f8fb336d0f0cfda58d8f4f7846b60d","436b7925593841b052b0ae1078e92171","43f6df5546ad9ec5348d00fd3daca38a","4712d46ce8f409ffc0f03972a159f675","486f50d2163696d6de64a0222198cfb1","496405be66cfed3f09bd9cb924463c0f","4f69eef7717ca0d422b99debdbeeee12","4f6eb0537e494716927b4ae637fe41e2","512857096ffef79c5a426d57d7edd00f","55094e67915ab4a0dbbac0bdfaa275ef","562dc63dc27a21371fc563f57b4ef4d3","563992b37cd9b8811c7f341a697e2ad3","5771ad8730b04a26a0ba8d356398a10f","5845325cd89ae15c1ca7b055a77fc6e3","59c178e5f4006907eb17e2d843bc6fa9","5a86900786a2afc4d2530f53176315b4","5cbeb4ebd8163fdb4ad6d0fe825fd158","5d0a26ff119cb7ad4c80e12cfc133857","5e860183be2030089654059b59d87c60","617f61dcebe36280c19e5ab8e2465d9c","62152cc5d163a6af2309a62809a38a65","63198b0505874a6e41bf39102ea1d78f","6456816cc4c6b46b9bd467b0cf2a84a8","65d068db069e50ee6563f744bbac81e0","6699d16f7127a8b389e7d9b69266f852","6daffa5b0f6eda658fff2fe7303f3e20","70ac917f8efdcc851f5b8e241b44ec29","70ee29276be24d2e802a05d3c3cc105e","7304591095ac3bfd5a1b3688c35c712e","734dc06bf92262307009294499e3c64b","7554c61eab3b9532c1eb8d008654ec6c","77b9cfec58ad1e58f57c29eeda105051","78f3e09ae59c5e286d1a3daea2a5a18b","7bee9a0a1cd467b285ad1cd71b6433fe","7c1125fb5505289acb717ea7d05cb5bb","7c23a24a3fb09650c791ccf3e82829f0","8a80630f22c13892137909ca87a4a91a","8d9e101e1fd526604f292d2c92df5c70","926869b431074da4965f00eb3c7a492d","a551db9f6529ab908faad3d7b419d29c","b114e5a70481aedba63c713f91a1e52b","b17b69d971563c608667d9b50cb3568c","b1c65d50504e8e39dee70f513e57846a","b2b900377ede7588555779fa80295e6a","b4ceebb7b66df6f072406aa9d0bbe478","b9da7d30b6fe962064451c4099623682","bea79ab9c578a1333bd657681bff4c02","c58e81eafd0c814319a733bf48853f19","c694752a0ee8eca68002ac7f7376d4c2","c9478f12349097838ef846eb2364325d","d0c21b556b2ddf5dcce2fd9155d2cc60","d48a7d88d954426c21fc32d8a9890d87","d54d934ba55130910ec2bc3216037d42","e4c212953d1c95106156f6d073efbb66","e85a8ec4b61f6fb739b83d79356e218e","fed1a8fb0efbb032b110a8624b805860"],"luu_truoc_gio_duyet":[]},"luu-truoc-duyet-hoi-to":{"n":0,"dung":0,"ds":[],"luu_truoc_gio_duyet":[]}}}}
```
