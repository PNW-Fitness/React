import { useState, useEffect, useRef, useCallback } from "react";

// JPEG quality used for the captured still frame
const JPEG_QUALITY = 0.88;

function formatDob(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function IdCapture({ guestSession, onConfirm, onBack }) {
  const { isMinor, dob, formData } = guestSession;

  // 'requesting' | 'live' | 'captured' | 'denied' | 'error'
  const [camState, setCamState] = useState("requesting");
  const [facingMode, setFacingMode] = useState("environment");
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStream();
    };
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  const startCamera = useCallback(async (mode) => {
    stopStream();
    if (!mountedRef.current) return;
    setCamState("requesting");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // play() returns a promise; swallow the abort error that fires when
        // the stream is replaced before play completes
        videoRef.current.play().catch(() => {});
      }
      setCamState("live");
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCamState("denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCamState("error");
        setErrorMessage("No camera found. Please connect a camera and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCamState("error");
        setErrorMessage("Camera is in use by another application. Close other apps that may be using the camera, then retry.");
      } else {
        setCamState("error");
        setErrorMessage(`Camera error: ${err.message || err.name}`);
      }
    }
  }, []);

  // Start the camera on mount with the default facing mode
  useEffect(() => {
    startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSwitchCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    stopStream();
    setCapturedUrl(dataUrl);
    setCamState("captured");
  }

  function handleRetake() {
    setCapturedUrl(null);
    startCamera(facingMode);
  }

  function handleUsePhoto() {
    onConfirm(capturedUrl);
  }

  const guestName = formData
    ? `${formData.first_name || ""} ${formData.last_name || ""}`.trim()
    : "";

  return (
    <div className="screen">
      <div className="screen-header">
        <button
          className="btn-back"
          onClick={() => {
            stopStream();
            onBack();
          }}
        >
          ← Back
        </button>
        <div className="step-indicator">Step 3 of 4 — ID photo</div>
      </div>

      <div className="screen-body id-capture-body">
        {/* ── Requesting ── */}
        {camState === "requesting" && (
          <div className="cam-status-card">
            <div className="cam-spinner" aria-label="Starting camera" />
            <p>Starting camera…</p>
          </div>
        )}

        {/* ── Permission denied ── */}
        {camState === "denied" && (
          <div className="cam-status-card cam-denied">
            <div className="cam-status-icon">🚫</div>
            <h3>Camera access denied</h3>
            <p>
              To allow camera access, open{" "}
              <strong>Windows Settings → Privacy &amp; security → Camera</strong>{" "}
              and make sure "Let desktop apps access your camera" is turned on,
              then click Retry below.
            </p>
            <button
              className="btn-primary"
              onClick={() => startCamera(facingMode)}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Generic error ── */}
        {camState === "error" && (
          <div className="cam-status-card cam-error">
            <div className="cam-status-icon">⚠️</div>
            <h3>Camera unavailable</h3>
            <p>{errorMessage}</p>
            <button
              className="btn-primary"
              onClick={() => startCamera(facingMode)}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Live preview ── */}
        <div className={`cam-preview-wrap ${camState === "live" ? "" : "cam-hidden"}`}>
          <div className="cam-viewport">
            <video
              ref={videoRef}
              className="cam-video"
              autoPlay
              playsInline
              muted
            />
            <div className="cam-overlay-hint">Position ID card to fill the frame</div>
          </div>
          <div className="cam-controls">
            <button className="btn-outline cam-switch" onClick={handleSwitchCamera} title="Switch camera">
              🔄 Switch camera
            </button>
            <button className="btn-primary btn-capture" onClick={handleCapture}>
              📷 Capture
            </button>
          </div>
        </div>

        {/* ── Captured preview ── */}
        {camState === "captured" && capturedUrl && (
          <div className="cam-captured-wrap">
            <div className="cam-viewport">
              <img
                src={capturedUrl}
                alt="Captured ID"
                className="cam-captured-img"
              />
            </div>

            {/* Minor DOB cross-check reminder */}
            {isMinor && dob && (
              <div className="cam-minor-reminder">
                <strong>Staff check:</strong> confirm the date of birth on the ID
                matches the date entered —{" "}
                <span className="cam-dob-highlight">{formatDob(dob)}</span>
                {guestName && ` — for guest ${guestName}`}
              </div>
            )}

            <div className="cam-captured-actions">
              <button className="btn-outline" onClick={handleRetake}>
                ↩ Retake
              </button>
              <button className="btn-primary btn-large" onClick={handleUsePhoto}>
                Use this photo →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
