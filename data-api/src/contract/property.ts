/**
 * Property (danh bạ nhà) — danh sách khoá DUY NHẤT của phần tử toà và căn mà data-api trả ra (PB6,
 * `_acceptance/data-api-property-danh-ba-nha`). Route dựng phần tử từ đây, `/openapi.json` sinh schema từ đây, test so mọi
 * khoá trả về với đây.
 *
 * «Property» của OneHub là danh bạ nhà (toà, căn — định danh UPI), KHÔNG phải resource `Property` của RESO (resource đó là
 * một tin rao). Tên trường bên trong theo RESO Data Dictionary 2.1: `Building.*` cho toà, `Property.*` cho trường căn mà DD
 * chỉ có ở Property (UnitNumber, UnitFloorLocation, …). Thêm khoá: tra DD 2.1 trước; không có tương đương mới là extension,
 * và extension phải có mục trong `pipeline/mappings.yaml` (`api_extensions`, đủ sáu điều kiện ADR-0011 Qđ 3).
 *
 * Cố ý KHÔNG có: `UniversalPropertySubId` và khoá trục (kho dựng SubId = <khoá trục>:<tầng> — phát ra thì khách lặp tầng dò
 * được cả cột căn), mã căn hay mã dự án của nguồn, `OriginatingSystemName` (căn là của OneHub, nguồn chỉ là bằng chứng).
 */

export type KhoaHopDong = {
  /** Tên khoá trả ra (camelCase). */
  key: string;
  /** Resource DD 2.1 có field này, hoặc "extension". */
  resource: "Building" | "Property" | "extension";
  /** Tên field DD 2.1 (PascalCase) khi không phải extension. */
  ddField?: string;
  /** Kiểu JSON để sinh schema. */
  type: "string" | "integer" | "number";
  /** Giá trị lookup trả ra là StandardName của lookup DD này (null = chữ tự do hoặc giá trị local đã khai). */
  lookup?: string;
  /** Giá trị local không thuộc lookup DD (khai lý do; probe miễn có tên). */
  localValue?: string;
  why: string;
};

/** Phần tử toà — `GET /v1/properties/<UniversalPropertyId>` và mỗi phần tử của `GET /v1/properties?project=`. */
export const BUILDING_KEYS: readonly KhoaHopDong[] = [
  { key: "universalPropertyId", resource: "Building", ddField: "UniversalPropertyId", type: "string", why: "UPI của toà (ADR-0013 §3, ADR-0016 §4)" },
  { key: "buildingKey", resource: "Building", ddField: "BuildingKey", type: "string", why: "khoá mờ bld_… của danh bạ" },
  { key: "buildingName", resource: "Building", ddField: "BuildingName", type: "string", why: "tên toà, chọn theo thứ tự nguồn S09 → S08 → S16 → S03" },
  { key: "complexName", resource: "Building", ddField: "ComplexName", type: "string", why: "phân khu (ADR-0013 §2)" },
  { key: "subdivisionName", resource: "Building", ddField: "SubdivisionName", type: "string", why: "dự án (ADR-0013 §2)" },
  { key: "projectId", resource: "extension", type: "integer", why: "id nút dự án của kho — khoá để gọi ?project=" },
  { key: "city", resource: "Building", ddField: "City", type: "string", lookup: "City", localValue: "tên phường/xã (ADR-0013 §4: địa chỉ VN chỉ còn phường/xã + tỉnh)", why: "phường của toà khi nút toà nằm trong đúng một phường" },
  { key: "stateOrProvince", resource: "Building", ddField: "StateOrProvince", type: "string", lookup: "StateOrProvince", localValue: "mã ISO 3166-2:VN (DD chỉ có bang Mỹ, Canada)", why: "tỉnh theo ISO 3166-2 (ADR-0013 §4)" },
  { key: "country", resource: "Building", ddField: "Country", type: "string", lookup: "Country", why: "luôn VN" },
  { key: "catalogTier", resource: "extension", type: "string", why: "bậc danh mục của toà: xac_minh · suy_ra_manh · mot_loi_khai (ADR-0016)" },
  { key: "unitCount", resource: "extension", type: "integer", why: "số căn active của toà" },
  { key: "activeListingCount", resource: "extension", type: "integer", why: "số tin đang rao gắn toà (làm tươi 10 phút)" },
];

/** Phần tử căn — `GET /v1/properties/<UPI toà>/units/<unitKey>`: khoá toà + các khoá dưới. */
export const UNIT_KEYS: readonly KhoaHopDong[] = [
  { key: "unitKey", resource: "extension", type: "string", why: "khoá mờ unt_… của căn (ULID ngẫu nhiên, không suy được căn khác)" },
  { key: "unitFloorLocation", resource: "Property", ddField: "UnitFloorLocation", type: "string", why: "tầng của căn" },
  { key: "livingArea", resource: "Property", ddField: "LivingArea", type: "number", why: "diện tích sử dụng" },
  { key: "livingAreaUnits", resource: "Property", ddField: "LivingAreaUnits", type: "string", lookup: "AreaUnits", why: "Square Meters khi có diện tích" },
  { key: "bedroomsTotal", resource: "Property", ddField: "BedroomsTotal", type: "integer", why: "số phòng ngủ" },
  { key: "bathroomsTotalInteger", resource: "Property", ddField: "BathroomsTotalInteger", type: "integer", why: "số WC" },
  { key: "propertySubType", resource: "Property", ddField: "PropertySubType", type: "string", lookup: "PropertySubType", why: "loại căn theo bảng đổi của mappings.yaml" },
];

/** Thêm vào phần tử căn CHỈ ở `GET /v1/properties/lookup`: nhắc lại đúng chuỗi mã căn khách đã nhập. */
export const LOOKUP_EXTRA_KEYS: readonly KhoaHopDong[] = [
  { key: "unitNumber", resource: "Property", ddField: "UnitNumber", type: "string", why: "nhắc lại mã căn khách nhập — không bao giờ phát mã khách chưa biết" },
];

export const BUILDING_KEY_NAMES = BUILDING_KEYS.map((k) => k.key);
export const UNIT_KEY_NAMES = [...BUILDING_KEY_NAMES, ...UNIT_KEYS.map((k) => k.key)];
export const LOOKUP_KEY_NAMES = [...UNIT_KEY_NAMES, ...LOOKUP_EXTRA_KEYS.map((k) => k.key)];

/** Loại căn nội bộ → PropertySubType (StandardName DD 2.1). Bản sao của `pipeline/mappings.yaml` mục property_sub_type. */
export const PROPERTY_SUB_TYPE: Readonly<Record<string, string | null>> = {
  apartment: "Condominium",
  house: null, // Townhouse hay Single Family Residence chưa phân biệt được (khung §7, chờ Q7)
  commercial: null,
  land: "Unimproved Land",
  unknown: null,
  "": null,
};

/** Schema JSON (OpenAPI) của một nhóm khoá. */
export function schemaTu(keys: readonly KhoaHopDong[]) {
  return {
    type: "object",
    required: keys.map((k) => k.key),
    properties: Object.fromEntries(keys.map((k) => [k.key, { type: [k.type, "null"], description: k.why }])),
  };
}
