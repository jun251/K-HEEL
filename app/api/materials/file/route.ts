import { getMaterial, isMaterialKey } from "../../../../db/material-storage";

export const dynamic = "force-dynamic";

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!isMaterialKey(key)) {
      return Response.json({ error: "자료를 확인해 주세요." }, { status: 400 });
    }
    const material = await getMaterial(key);
    if (!material) {
      return Response.json({ error: "자료를 찾을 수 없습니다." }, { status: 404 });
    }
    return new Response(material.data, {
      headers: {
        "Content-Type": material.contentType,
        "Content-Length": String(material.size),
        "Content-Disposition": contentDisposition(material.name),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to download material", error);
    return Response.json({ error: "자료를 내려받지 못했습니다." }, { status: 500 });
  }
}
