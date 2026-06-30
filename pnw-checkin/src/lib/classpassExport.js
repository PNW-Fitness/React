import { invoke } from "@tauri-apps/api/core";
import { getExportDir } from "./fileExport/fileExport.js";
import { generateClassPassPdf } from "./classpassPdfGenerator.js";

function uint8ArrayToBase64(bytes) {
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
  }
  return btoa(binary);
}

export async function exportClassPassFile({ cpSession, signatureDataUrl, checkinId, signedAt }) {
  const { guestName, contact, zipCode, idPhoto } = cpSession;

  const baseDir = await getExportDir();
  const dateStr = signedAt.split(" ")[0]; // YYYY-MM-DD
  const safeName = guestName
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const filename = `ClassPass_${safeName}_${checkinId}`;

  const pdfBytes = await generateClassPassPdf({
    guestName,
    contact,
    zipCode,
    signatureDataUrl,
    signedAt,
    checkinId,
    idPhoto,
  });

  const pdfPath = await invoke("write_guest_export", {
    baseDir,
    dateStr,
    subfolder: "ClassPass",
    filename,
    pdfB64: uint8ArrayToBase64(pdfBytes),
  });

  const exportDir = `${baseDir}\\${dateStr}\\ClassPass`;
  return { pdfPath, exportDir };
}
