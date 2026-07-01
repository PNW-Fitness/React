import { useEffect, useRef } from "react";

// Kicks off the parent's finalize (PDF export + lead sync + mark completed)
// once on mount, then shows a spinner or a retry-on-error state. A dedicated
// screen because that async work only starts once IdCapture's photo is
// confirmed, with nowhere else in the queue flow to show its progress.
export default function QueueFinalizing({ submitting, submitError, onRetry, onBack }) {
  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    onRetryRef.current();
  }, []);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack} disabled={submitting}>← Back</button>
        <div className="step-indicator">Finishing check-in…</div>
      </div>
      <div className="screen-body centered">
        {submitting && (
          <>
            <div className="cam-spinner" aria-label="Saving" />
            <p>Saving check-in…</p>
          </>
        )}
        {!submitting && submitError && (
          <>
            <p className="field-error submit-error">{submitError}</p>
            <button className="btn-primary" onClick={onRetry}>Retry</button>
          </>
        )}
      </div>
    </div>
  );
}
