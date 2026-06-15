"use server";

/** Read-only loaders exposed to client components for lazy detail panels. */

import { getAssetVersions, getAssetAnnotations } from "@/lib/queries/assets";
import type { AssetAnnotation, AssetVersion } from "@/types";

export async function loadAssetReviewDetail(assetId: string): Promise<{
  versions: AssetVersion[];
  annotations: AssetAnnotation[];
}> {
  const [versions, annotations] = await Promise.all([
    getAssetVersions(assetId),
    getAssetAnnotations(assetId),
  ]);
  return { versions, annotations };
}
