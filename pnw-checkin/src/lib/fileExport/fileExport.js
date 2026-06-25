import { invoke } from "@tauri-apps/api/core";
import { generateWaiverPdf } from "../pdfGenerator/pdfGenerator.js";

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(",")[1];
}

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

export async function exportGuestFiles({ guestSession, signatureDataUrl, guestId, waiverId, signedAt }) {
  const { formData, isMinor, supervisionRequired, idPhoto } = guestSession;

  const baseDir = await getExportDir();
  const dateStr = signedAt.split(" ")[0]; // YYYY-MM-DD
  const safeName = `${formData.first_name}-${formData.last_name}`.replace(/[^a-zA-Z0-9-]/g, "_");
  const guestFolder = `${safeName}_${guestId}`;

  const pdfBytes = await generateWaiverPdf({
    formData,
    isMinor,
    signatureDataUrl,
    signedAt,
    guestId,
  });

  const metadata = {
    guest_id: guestId,
    waiver_id: waiverId,
    first_name: formData.first_name,
    last_name: formData.last_name,
    zip_code: formData.zip_code,
    phone: formData.phone,
    email: formData.email,
    visit_reason: formData.visit_reason,
    how_heard: formData.how_heard || null,
    how_heard_specify: formData.how_heard_specify || null,
    interests: formData.interests || [],
    is_minor: isMinor,
    supervision_required: supervisionRequired,
    guardian_name: formData.guardian_name || null,
    guardian_phone: formData.guardian_phone || null,
    signed_at: signedAt,
  };

  const [idPhotoPath, pdfPath] = await invoke("write_guest_export", {
    baseDir,
    dateStr,
    guestFolder,
    idPhotoB64: dataUrlToBase64(idPhoto),
    pdfB64: uint8ArrayToBase64(pdfBytes),
    metadataJson: JSON.stringify(metadata, null, 2),
  });

  const exportDir = `${baseDir}\\${dateStr}\\${guestFolder}`;
  return { idPhotoPath, pdfPath, exportDir };
}
