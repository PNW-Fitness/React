import { useState, useEffect } from "react";
import "./App.css";

import Landing from "./screens/Landing.jsx";
import AgeCheck from "./screens/guest/AgeCheck.jsx";
import MinorBlocked from "./screens/guest/MinorBlocked.jsx";
import ReturnVisitCheck from "./screens/guest/ReturnVisitCheck.jsx";
import PhoneLookup from "./screens/guest/PhoneLookup.jsx";
import GuestForm from "./screens/guest/GuestForm.jsx";
import WaiverView from "./screens/guest/WaiverView.jsx";
import GuestConfirmation from "./screens/guest/GuestConfirmation.jsx";
import Settings from "./screens/Settings.jsx";
import VendorForm from "./screens/vendor/VendorForm.jsx";
import VendorLog from "./screens/vendor/VendorLog.jsx";

import IdTypeCheck from "./components/IdCapture/IdTypeCheck.jsx";
import IdCapture from "./components/IdCapture/IdCapture.jsx";

import ClassPassBookingVerify from "./screens/classpass/ClassPassBookingVerify.jsx";
import ClassPassForm from "./screens/classpass/ClassPassForm.jsx";
import ClassPassWaiver from "./screens/classpass/ClassPassWaiver.jsx";
import ClassPassConfirmation from "./screens/classpass/ClassPassConfirmation.jsx";

import { saveGuest, saveWaiver, updateWaiverPaths, saveClassPassCheckin, updateClassPassPdfPath, localNow, queuePendingLead } from "./lib/db.js";
import { isQualifyingLead, buildLeadPayload, pushLeadToSupabase, retryPendingLeads } from "./lib/leadSync.js";
import { exportGuestFiles } from "./lib/fileExport/fileExport.js";
import { exportClassPassFile } from "./lib/classpassExport.js";

const EMPTY_GUEST_SESSION = {
  isMinor: false,
  supervisionRequired: false,
  dob: null,
  returnVisit: null,
  prefillData: null,
  existingGuestId: null,
  formData: {},
  idPhoto: null,
};

const EMPTY_CP_SESSION = { guestName: "", contact: "", zipCode: "", idPhoto: null };

export default function App() {
  const [screen, setScreen] = useState("landing");

  // ── Guest flow state ──────────────────────────────────────────────────────
  const [guestSession, setGuestSession] = useState(EMPTY_GUEST_SESSION);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exportDir, setExportDir] = useState(null);

  // ── ClassPass flow state ──────────────────────────────────────────────────
  const [cpSession, setCpSession] = useState(EMPTY_CP_SESSION);
  const [cpSubmitError, setCpSubmitError] = useState("");
  const [cpSubmitting, setCpSubmitting] = useState(false);
  const [cpExportDir, setCpExportDir] = useState(null);

  // ── Lead sync: retry on startup and every 5 minutes ──────────────────────
  useEffect(() => {
    retryPendingLeads();
    const interval = setInterval(retryPendingLeads, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Guest helpers ─────────────────────────────────────────────────────────
  function navigate(targetScreen, updates = {}) {
    setGuestSession((prev) => ({ ...prev, ...updates }));
    setSubmitError("");
    setScreen(targetScreen);
  }

  function resetToLanding() {
    setGuestSession(EMPTY_GUEST_SESSION);
    setSubmitError("");
    setSubmitting(false);
    setExportDir(null);
    setScreen("landing");
  }

  async function handleSubmitWaiver(signatureDataUrl) {
    setSubmitError("");
    setSubmitting(true);
    try {
      const signedAt = localNow();

      let guestId = guestSession.existingGuestId;
      if (!guestId) {
        guestId = await saveGuest({
          ...guestSession.formData,
          is_minor: guestSession.isMinor,
          supervision_required: guestSession.supervisionRequired,
        });
      }

      const { id: waiverId } = await saveWaiver(guestId, guestSession.isMinor, signedAt);

      const { pdfPath, exportDir: dir } = await exportGuestFiles({
        guestSession,
        signatureDataUrl,
        guestId,
        signedAt,
      });

      await updateWaiverPaths(waiverId, pdfPath);

      // Push qualifying leads to Supabase; queue for retry on failure.
      if (isQualifyingLead(guestSession)) {
        const payload = buildLeadPayload(guestSession, signedAt);
        const { success, error: syncError } = await pushLeadToSupabase(payload);
        if (!success) {
          console.warn("Lead sync failed, queuing for retry:", syncError);
          await queuePendingLead(guestId, payload);
        }
      }

      setExportDir(dir);
      setScreen("guest_confirm");
    } catch (err) {
      console.error("Check-in failed:", err);
      setSubmitError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to complete check-in — please try again or get staff assistance."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── ClassPass helpers ─────────────────────────────────────────────────────
  function navigateCp(targetScreen, updates = {}) {
    setCpSession((prev) => ({ ...prev, ...updates }));
    setCpSubmitError("");
    setScreen(targetScreen);
  }

  function resetCpToLanding() {
    setCpSession(EMPTY_CP_SESSION);
    setCpSubmitError("");
    setCpSubmitting(false);
    setCpExportDir(null);
    setScreen("landing");
  }

  async function handleSubmitClassPass(signatureDataUrl) {
    setCpSubmitError("");
    setCpSubmitting(true);
    try {
      const signedAt = localNow();

      const checkinId = await saveClassPassCheckin({
        guestName: cpSession.guestName,
        contact: cpSession.contact,
        zipCode: cpSession.zipCode,
        signedAt,
      });

      const { pdfPath, exportDir: dir } = await exportClassPassFile({
        cpSession,
        signatureDataUrl,
        checkinId,
        signedAt,
      });

      await updateClassPassPdfPath(checkinId, pdfPath);

      setCpExportDir(dir);
      setScreen("classpass_confirm");
    } catch (err) {
      console.error("ClassPass check-in failed:", err);
      setCpSubmitError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to complete check-in — please try again or get staff assistance."
      );
    } finally {
      setCpSubmitting(false);
    }
  }

  // ── Router ────────────────────────────────────────────────────────────────
  switch (screen) {
    case "landing":
      return (
        <Landing
          onGuest={() => setScreen("guest_age_check")}
          onClassPass={() => setScreen("classpass_verify")}
          onVendor={() => setScreen("vendor_form")}
          onSettings={() => setScreen("settings")}
        />
      );

    case "settings":
      return <Settings onBack={() => setScreen("landing")} />;

    // ── Guest flow ──────────────────────────────────────────────────────────
    case "guest_age_check":
      return (
        <AgeCheck
          navigate={navigate}
          onBack={resetToLanding}
        />
      );

    case "guest_minor_blocked":
      return <MinorBlocked onBack={resetToLanding} />;

    case "guest_return_visit":
      return (
        <ReturnVisitCheck
          guestSession={guestSession}
          navigate={navigate}
          onBack={() => setScreen("guest_age_check")}
        />
      );

    case "guest_phone_lookup":
      return (
        <PhoneLookup
          navigate={navigate}
          onBack={() => setScreen("guest_return_visit")}
        />
      );

    case "guest_form":
      return (
        <GuestForm
          guestSession={guestSession}
          navigate={navigate}
          onBack={() =>
            setScreen(
              guestSession.returnVisit ? "guest_phone_lookup" : "guest_return_visit"
            )
          }
        />
      );

    case "guest_id_type_check":
      return (
        <IdTypeCheck
          onConfirm={() => setScreen("guest_id_capture")}
          onBack={() => setScreen("guest_form")}
        />
      );

    case "guest_id_capture":
      return (
        <IdCapture
          guestSession={guestSession}
          onConfirm={(idPhoto) => navigate("guest_waiver", { idPhoto })}
          onBack={() => setScreen("guest_id_type_check")}
        />
      );

    case "guest_waiver":
      return (
        <WaiverView
          guestSession={guestSession}
          onSubmit={handleSubmitWaiver}
          onBack={() => setScreen("guest_id_capture")}
          submitError={submitError}
          submitting={submitting}
        />
      );

    case "guest_confirm":
      return (
        <GuestConfirmation
          guestSession={guestSession}
          exportDir={exportDir}
          onDone={resetToLanding}
        />
      );

    // ── ClassPass flow ──────────────────────────────────────────────────────
    case "classpass_verify":
      return (
        <ClassPassBookingVerify
          onConfirm={() => setScreen("classpass_form")}
          onBack={resetCpToLanding}
        />
      );

    case "classpass_form":
      return (
        <ClassPassForm
          onSubmit={(data) => navigateCp("classpass_id_type_check", data)}
          onBack={() => setScreen("classpass_verify")}
        />
      );

    case "classpass_id_type_check":
      return (
        <IdTypeCheck
          onConfirm={() => setScreen("classpass_id_capture")}
          onBack={() => setScreen("classpass_form")}
        />
      );

    case "classpass_id_capture":
      return (
        <IdCapture
          guestSession={{
            formData: { first_name: cpSession.guestName, last_name: "" },
            isMinor: false,
            dob: null,
          }}
          onConfirm={(idPhoto) => navigateCp("classpass_waiver", { idPhoto })}
          onBack={() => setScreen("classpass_id_type_check")}
        />
      );

    case "classpass_waiver":
      return (
        <ClassPassWaiver
          cpSession={cpSession}
          onSubmit={handleSubmitClassPass}
          onBack={() => setScreen("classpass_id_capture")}
          submitError={cpSubmitError}
          submitting={cpSubmitting}
        />
      );

    case "classpass_confirm":
      return (
        <ClassPassConfirmation
          cpSession={cpSession}
          exportDir={cpExportDir}
          onDone={resetCpToLanding}
        />
      );

    // ── Vendor flow ─────────────────────────────────────────────────────────
    case "vendor_form":
      return (
        <VendorForm
          onDone={() => setScreen("vendor_log")}
          onBack={resetToLanding}
        />
      );

    case "vendor_log":
      return <VendorLog onDone={resetToLanding} />;

    default:
      return (
        <Landing
          onGuest={() => setScreen("guest_age_check")}
          onClassPass={() => setScreen("classpass_verify")}
          onVendor={() => setScreen("vendor_form")}
          onSettings={() => setScreen("settings")}
        />
      );
  }
}
