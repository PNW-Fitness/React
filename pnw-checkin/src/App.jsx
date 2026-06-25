import { useState } from "react";
import "./App.css";

import Landing from "./screens/Landing.jsx";
import AgeCheck from "./screens/guest/AgeCheck.jsx";
import MinorBlocked from "./screens/guest/MinorBlocked.jsx";
import ReturnVisitCheck from "./screens/guest/ReturnVisitCheck.jsx";
import PhoneLookup from "./screens/guest/PhoneLookup.jsx";
import GuestForm from "./screens/guest/GuestForm.jsx";
import WaiverView from "./screens/guest/WaiverView.jsx";
import GuestConfirmation from "./screens/guest/GuestConfirmation.jsx";
import VendorForm from "./screens/vendor/VendorForm.jsx";
import VendorLog from "./screens/vendor/VendorLog.jsx";

import { saveGuest, saveWaiver } from "./lib/db.js";

const EMPTY_GUEST_SESSION = {
  isMinor: false,
  supervisionRequired: false,
  dob: null,
  returnVisit: null,
  prefillData: null,
  existingGuestId: null,
  formData: {},
};

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [guestSession, setGuestSession] = useState(EMPTY_GUEST_SESSION);
  const [submitError, setSubmitError] = useState("");

  function navigate(targetScreen, updates = {}) {
    setGuestSession((prev) => ({ ...prev, ...updates }));
    setSubmitError("");
    setScreen(targetScreen);
  }

  function resetToLanding() {
    setGuestSession(EMPTY_GUEST_SESSION);
    setSubmitError("");
    setScreen("landing");
  }

  async function handleSubmitWaiver() {
    setSubmitError("");
    try {
      let guestId = guestSession.existingGuestId;
      if (!guestId) {
        guestId = await saveGuest({
          ...guestSession.formData,
          is_minor: guestSession.isMinor,
          supervision_required: guestSession.supervisionRequired,
        });
      }
      await saveWaiver(guestId, guestSession.isMinor);
      setScreen("guest_confirm");
    } catch (err) {
      console.error("Check-in save failed:", err);
      setSubmitError("Failed to save check-in — please try again or get staff assistance.");
    }
  }

  switch (screen) {
    case "landing":
      return (
        <Landing
          onGuest={() => setScreen("guest_age_check")}
          onVendor={() => setScreen("vendor_form")}
        />
      );

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

    case "guest_waiver":
      return (
        <WaiverView
          guestSession={guestSession}
          onSubmit={handleSubmitWaiver}
          onBack={() => setScreen("guest_form")}
          submitError={submitError}
        />
      );

    case "guest_confirm":
      return (
        <GuestConfirmation
          guestSession={guestSession}
          onDone={resetToLanding}
        />
      );

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
      return <Landing onGuest={() => setScreen("guest_age_check")} onVendor={() => setScreen("vendor_form")} />;
  }
}
