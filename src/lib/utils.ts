import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApiResponse } from "./type";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.code !== 0) {
    throw new Error(res.msg || "An unexpected error occurred");
  }
  return res.data as T;
}

export function getDropDownValues<T extends Record<string, unknown>>(
  data: T[],
  selector: string,
) {
  const toStr = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const unique = new Set<string>(
    data.map((item) => toStr((item as Record<string, unknown>)[selector])),
  );

  return Array.from(unique)
    .filter((s) => s !== "")
    .sort()
    .map((s) => ({ value: s, label: s }));
}

export async function exportToExcel<T extends Record<string, unknown>>(
  jsonData: T[],
  fileName: string = "data",
): Promise<void> {
  if (!jsonData || jsonData.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  const headers = Object.keys(jsonData[0]);
  worksheet.addRow(headers);

  jsonData.forEach((row) => worksheet.addRow(Object.values(row)));
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  const date = new Date();
  const formattedDate = `${date.getFullYear()}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const formattedTime = `${String(date.getHours()).padStart(2, "0")}${String(
    date.getMinutes(),
  ).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
  const formattedFileName = `${formattedDate}-${formattedTime}-${fileName}.xlsx`;

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, formattedFileName);
}

export function timeAgo(iso: string | number | Date): string {
  const ts = typeof iso === "string" ? Date.parse(iso) : +iso;
  const diff = Date.now() - ts;
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);

  // base64url
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
