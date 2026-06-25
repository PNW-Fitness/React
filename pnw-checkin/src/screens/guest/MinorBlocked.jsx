export default function MinorBlocked({ onBack }) {
  return (
    <div className="screen">
      <div className="screen-body centered">
        <div className="blocked-card">
          <div className="blocked-icon">⛔</div>
          <h2>Not Permitted</h2>
          <p className="blocked-message">
            Guests under 14 cannot use the facility.
          </p>
          <button className="btn-primary" onClick={onBack}>
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
