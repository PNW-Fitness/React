import { invoke } from "@tauri-apps/api/core";
import { getExportDir } from "./fileExport/fileExport.js";
import { generateTanningPdf } from "./tanningPdfGenerator.js";

function uint8ArrayToBase64(bytes) {
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
  }
  return btoa(binary);
}

export async function exportTanningFile({ tanningSession, signatureDataUrl, checkinId, signedAt }) {
  const { fullName, contact, zipCode } = tanningSession;

  const baseDir = await getExportDir();
  const dateStr = signedAt.split(" ")[0];
  const safeName = fullName
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const filename = `Tanning_${safeName}_${checkinId}`;

  const pdfBytes = await generateTanningPdf({
    fullName,
    contact,
    zipCode,
    signatureDataUrl,
    signedAt,
    checkinId,
  });

  const pdfPath = await invoke("write_guest_export", {
    baseDir,
    dateStr,
    subfolder: "Tanning",
    filename,
    pdfB64: uint8ArrayToBase64(pdfBytes),
  });

  const exportDir = `${baseDir}\\${dateStr}\\Tanning`;
  return { pdfPath, exportDir };
}
