import { requireAdminApi } from "../../access";
import {
  deleteMaterial,
  isMaterialKey,
  listMaterials,
  parseGradeBand,
  saveMaterial,
} from "../../../db/material-storage";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx",
  "hwp", "hwpx", "txt", "csv", "jpg", "jpeg", "png", "webp",
]);

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const gradeBand = parseGradeBand(new URL(request.url).searchParams.get("gradeBand"));
    if (!gradeBand) return errorResponse("학년군을 확인해 주세요.", 400);
    const [materials, admin] = await Promise.all([
      listMaterials(gradeBand),
      requireAdminApi(request),
    ]);
    return Response.json({ materials, canManage: Boolean(admin) });
  } catch (error) {
    console.error("Failed to list materials", error);
    return errorResponse("자료 목록을 불러오지 못했습니다.", 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdminApi(request))) {
      return errorResponse("관리자 로그인이 필요합니다.", 401);
    }

    const form = await request.formData();
    const gradeBand = parseGradeBand(String(form.get("gradeBand") ?? ""));
    const file = form.get("file");
    if (!gradeBand) return errorResponse("학년군을 선택해 주세요.", 400);
    if (!(file instanceof File) || !file.name || file.size === 0) {
      return errorResponse("올릴 파일을 선택해 주세요.", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("파일은 20MB 이하만 올릴 수 있습니다.", 413);
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return errorResponse("PDF, 문서, 프레젠테이션, 표, 이미지 파일만 올릴 수 있습니다.", 415);
    }

    return Response.json({ material: await saveMaterial(file, gradeBand) }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload material", error);
    return errorResponse("파일을 올리지 못했습니다.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await requireAdminApi(request))) {
      return errorResponse("관리자 로그인이 필요합니다.", 401);
    }
    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!isMaterialKey(key)) return errorResponse("삭제할 자료를 확인해 주세요.", 400);
    await deleteMaterial(key);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete material", error);
    return errorResponse("자료를 삭제하지 못했습니다.", 500);
  }
}
