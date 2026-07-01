export default function QueueDeclineId({ onOptionA, onOptionB, onDone, working, done }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onDone} disabled={working}>
          {done ? "← Queue" : "← Back"}
        </button>
        <div className="step-indicator">Guest declined ID</div>
      </div>

      <div className="screen-body centered">
        {done ? (
          <div className="decline-done">
            <p className="decline-done-msg">{done.message}</p>
            <button className="btn-primary btn-large" onClick={onDone}>
              Back to Queue
            </button>
          </div>
        ) : (
          <div className="decline-prompt">
            <h2 className="decline-prompt-title">Guest declined to provide ID</h2>
            <p className="decline-prompt-sub">What would you like to do?</p>

            <div className="decline-options">
              <div className="decline-option">
                <button
                  className="btn-outline btn-large decline-option-btn"
                  onClick={onOptionA}
                  disabled={working}
                >
                  {working ? "Saving…" : "Keep record (ID declined)"}
                </button>
                <p className="decline-option-desc">
                  Saves a PDF with the waiver and signature but no ID photo.
                  Marks the check-in as declined.
                </p>
              </div>

              <div className="decline-option">
                <button
                  className="btn-outline decline-option-btn decline-option-clear"
                  onClick={onOptionB}
                  disabled={working}
                >
                  Clear from queue (no record)
                </button>
                <p className="decline-option-desc">
                  Removes the entry from the queue. No file is saved.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
