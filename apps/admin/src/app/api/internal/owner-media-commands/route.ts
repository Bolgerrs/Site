import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { createUpdatedStateResponse, parseCommandJson } from "@/lib/admin-bff/commands.ts";
import {
  executeOwnerMediaCommand,
  type OwnerMediaCommandInput,
} from "@/lib/admin-bff/media-commands.ts";
import { adminRuntime } from "@/lib/runtime.ts";

async function persistUploadFile(file: File) {
  await mkdir(adminRuntime.tempDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "upload.bin";
  const filePath = path.resolve(adminRuntime.tempDir, `${Date.now()}-${randomUUID()}-${safeName}`);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return filePath;
}

function getText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(form: FormData, key: string) {
  const value = getText(form.get(key));
  return value || undefined;
}

async function parseMultipartCommand(request: Request): Promise<OwnerMediaCommandInput> {
  const form = await request.formData();
  const action = getText(form.get("action")) as OwnerMediaCommandInput["action"];
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const singleFile = form.get("file");
  const file = singleFile instanceof File && singleFile.size > 0 ? singleFile : files[0];

  if (action === "media.batch-upload") {
    return {
      action,
      payload: {
        assetRole: getOptionalText(form, "assetRole"),
        assetType: getOptionalText(form, "assetType"),
        files: await Promise.all(
          files.map(async (entry) => ({
            fileName: entry.name,
            filePath: await persistUploadFile(entry),
          })),
        ),
        primaryLocale: getOptionalText(form, "primaryLocale"),
      },
    };
  }

  if (!file) {
    throw new Error("invalid-input");
  }

  if (action === "document.upload" || action === "document.replace") {
    return {
      action,
      payload: {
        documentId: getOptionalText(form, "documentId"),
        documentTitle: getOptionalText(form, "documentTitle") || file.name,
        documentType: getOptionalText(form, "documentType"),
        fileName: file.name,
        filePath: await persistUploadFile(file),
        primaryLocale: getOptionalText(form, "primaryLocale"),
        productKey: getOptionalText(form, "productKey"),
        productLabel: getOptionalText(form, "productLabel"),
        publicLabel: getOptionalText(form, "publicLabel"),
        replaceDocumentId: getOptionalText(form, "replaceDocumentId"),
        versionLabel: getOptionalText(form, "versionLabel"),
      },
    };
  }

  return {
    action: action || "media.upload",
    payload: {
      altText: getOptionalText(form, "altText"),
      assetId: getOptionalText(form, "assetId"),
      assetRole: getOptionalText(form, "assetRole"),
      assetTitle: getOptionalText(form, "assetTitle") || file.name,
      assetType: getOptionalText(form, "assetType"),
      caption: getOptionalText(form, "caption"),
      changeReason: getOptionalText(form, "changeReason"),
      fileName: file.name,
      filePath: await persistUploadFile(file),
      primaryLocale: getOptionalText(form, "primaryLocale"),
    },
  };
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("multipart/form-data")
      ? await parseMultipartCommand(request)
      : await parseCommandJson<OwnerMediaCommandInput>(request);
    const result = await executeOwnerMediaCommand(req.payload, req, body);
    return createUpdatedStateResponse(req, result);
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Не удалось выполнить действие с медиа.",
      forbidden: "Недостаточно прав.",
      invalidInput: "Проверьте поля действия.",
      noOp: "Нет изменений для сохранения.",
      unauthorized: "Нужно войти в админку.",
    });
  }
}

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const url = new URL(request.url);
    const result = await executeOwnerMediaCommand(req.payload, req, {
      action: "media.where-used",
      payload: {
        assetId: url.searchParams.get("assetId") ?? url.searchParams.get("selected"),
      },
    });

    return withAdminAuthHeaders(
      NextResponse.json(result, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Не удалось загрузить связи медиа.",
      forbidden: "Недостаточно прав.",
      invalidInput: "Проверьте выбранный файл.",
      unauthorized: "Нужно войти в админку.",
    });
  }
}
