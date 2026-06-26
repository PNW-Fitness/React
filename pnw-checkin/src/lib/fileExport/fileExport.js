import { invoke } from "@tauri-apps/api/core";
import { generateWaiverPdf } from "../pdfGenerator/pdfGenerator.js";

function uint8ArrayToBase64(bytes) {
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
  }
  return btoa(binary);
}

export async function getExportDir() {
  return invoke("get_export_dir");
}

export async function exportGuestFiles({ guestSession, signatureDataUrl, guestId, signedAt }) {
  const { formData, isMinor, idPhoto } = guestSession;

  const baseDir = await getExportDir();
  const dateStr = signedAt.split(" ")[0]; // YYYY-MM-DD
  const safeName = `${formData.first_name}-${formData.last_name}`.replace(/[^a-zA-Z0-9-]/g, "_");
  const filename = `${safeName}_${guestId}`;

  const pdfBytes = await generateWaiverPdf({
    formData,
    isMinor,
    signatureDataUrl,
    signedAt,
    guestId,
    idPhoto,
  });

  const pdfPath = await invoke("write_guest_export", {
    baseDir,
    dateStr,
    filename,
    pdfB64: uint8ArrayToBase64(pdfBytes),
  });

  const exportDir = `${baseDir}\\${dateStr}`;
  return { pdfPath, exportDir };
}
