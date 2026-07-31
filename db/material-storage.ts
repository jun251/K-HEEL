import { getDeployStore, getStore } from "@netlify/blobs";
import { isNetlifyRuntime } from "./platform";

export const GRADE_BANDS = ["1-2", "3-4", "5-6"] as const;
export type GradeBand = (typeof GRADE_BANDS)[number];

export interface MaterialFile {
  key: string;
  name: string;
  contentType: string;
  size: number;
  gradeBand: GradeBand;
  uploadedAt: string;
}

interface StoredMaterial extends MaterialFile {
  data: ArrayBuffer;
}

interface R2Object {
  key: string;
  customMetadata?: Record<string, string>;
  httpMetadata?: { contentType?: string };
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer,
    options: {
      httpMetadata: { contentType: string };
      customMetadata: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  list(options: {
    prefix: string;
    include: Array<"customMetadata" | "httpMetadata">;
  }): Promise<{ objects: R2Object[] }>;
  delete(key: string): Promise<void>;
}

function isGradeBand(value: string): value is GradeBand {
  return GRADE_BANDS.includes(value as GradeBand);
}

function metadataToMaterial(
  key: string,
  metadata: Record<string, unknown> | undefined,
  contentType?: string,
): MaterialFile | null {
  const gradeBand = String(metadata?.gradeBand ?? "");
  if (!isGradeBand(gradeBand)) return null;
  return {
    key,
    name: String(metadata?.name ?? "교육자료"),
    contentType: String(metadata?.contentType ?? contentType ?? "application/octet-stream"),
    size: Number(metadata?.size ?? 0),
    gradeBand,
    uploadedAt: String(metadata?.uploadedAt ?? ""),
  };
}

async function getR2Bucket() {
  const moduleName = "cloudflare:workers";
  const { env } = (await import(moduleName)) as {
    env: Record<string, unknown>;
  };
  const bucket = env.MATERIALS;
  if (!bucket || typeof bucket !== "object" || !("put" in bucket)) {
    throw new Error("교육자료 저장 공간이 연결되지 않았습니다.");
  }
  return bucket as R2Bucket;
}

async function getNetlifyStore() {
  const options = { consistency: "strong" as const };
  return process.env.CONTEXT === "production"
    ? getStore("education-materials", options)
    : getDeployStore("education-materials", options);
}

export async function listMaterials(gradeBand: GradeBand) {
  const prefix = `materials/${gradeBand}/`;
  let materials: MaterialFile[];

  if (isNetlifyRuntime()) {
    const store = await getNetlifyStore();
    const result = await store.list({ prefix });
    materials = (
      await Promise.all(
        result.blobs.map(async ({ key }) => {
          const stored = await store.getMetadata(key);
          return metadataToMaterial(key, stored?.metadata as Record<string, unknown> | undefined);
        }),
      )
    ).filter((item): item is MaterialFile => Boolean(item));
  } else {
    const bucket = await getR2Bucket();
    const result = await bucket.list({
      prefix,
      include: ["customMetadata", "httpMetadata"],
    });
    materials = result.objects
      .map((object) =>
        metadataToMaterial(object.key, object.customMetadata, object.httpMetadata?.contentType),
      )
      .filter((item): item is MaterialFile => Boolean(item));
  }

  return materials.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function saveMaterial(file: File, gradeBand: GradeBand) {
  const safeName = file.name
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}._ -]+/gu, "_")
    .slice(0, 120) || "교육자료";
  const key = `materials/${gradeBand}/${crypto.randomUUID()}-${safeName}`;
  const uploadedAt = new Date().toISOString();
  const metadata = {
    name: file.name,
    contentType: file.type || "application/octet-stream",
    size: String(file.size),
    gradeBand,
    uploadedAt,
  };
  const data = await file.arrayBuffer();

  if (isNetlifyRuntime()) {
    const store = await getNetlifyStore();
    await store.set(key, data, { metadata });
  } else {
    const bucket = await getR2Bucket();
    await bucket.put(key, data, {
      httpMetadata: { contentType: metadata.contentType },
      customMetadata: metadata,
    });
  }

  return metadataToMaterial(key, metadata)!;
}

export async function getMaterial(key: string): Promise<StoredMaterial | null> {
  if (isNetlifyRuntime()) {
    const store = await getNetlifyStore();
    const stored = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!stored?.data) return null;
    const material = metadataToMaterial(key, stored.metadata as Record<string, unknown>);
    return material ? { ...material, data: stored.data as ArrayBuffer } : null;
  }

  const bucket = await getR2Bucket();
  const stored = await bucket.get(key);
  if (!stored) return null;
  const material = metadataToMaterial(key, stored.customMetadata, stored.httpMetadata?.contentType);
  return material ? { ...material, data: await stored.arrayBuffer() } : null;
}

export async function deleteMaterial(key: string) {
  if (isNetlifyRuntime()) {
    const store = await getNetlifyStore();
    await store.delete(key);
    return;
  }
  const bucket = await getR2Bucket();
  await bucket.delete(key);
}

export function parseGradeBand(value: string | null): GradeBand | null {
  return value && isGradeBand(value) ? value : null;
}

export function isMaterialKey(key: string) {
  return GRADE_BANDS.some((gradeBand) => key.startsWith(`materials/${gradeBand}/`));
}
