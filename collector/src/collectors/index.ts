import type { Collector } from "../core/types.js";
import { exampleCollector } from "./example-noop.js";
import { airbnbDiscovery } from "./airbnb-discovery.js";
import { airbnbListing } from "./airbnb-listing.js";
import { osmBoundaries } from "./osm-boundaries.js";
import { zaloMock } from "./zalo-mock.js";
import { airdnaResearch } from "./airdna-research.js";

/** Registry plugin — thêm nguồn mới: tạo file + import ở đây, không sửa core. */
export const COLLECTORS: Map<string, Collector> = new Map([
  [exampleCollector.id, exampleCollector],
  [airbnbDiscovery.id, airbnbDiscovery],
  [airbnbListing.id, airbnbListing],
  [osmBoundaries.id, osmBoundaries],
  [zaloMock.id, zaloMock],
  [airdnaResearch.id, airdnaResearch],
]);
