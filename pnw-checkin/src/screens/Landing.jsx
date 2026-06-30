export default function Landing({ onGuest, onClassPass, onVendor, onSettings }) {
  return (
    <div className="screen landing">
      <button className="landing-settings-btn" onClick={onSettings} title="Settings">
        ⚙
      </button>
      <div className="landing-header">
        <h1 className="gym-name">Pacific Northwest Fitness</h1>
        <p className="landing-tagline">Welcome — please select your visit type</p>
      </div>
      <div className="landing-buttons">
        <button className="btn-landing btn-primary" onClick={onGuest}>
          <span className="btn-landing-icon">🏋️</span>
          <span className="btn-landing-label">Guest</span>
        </button>
        <button className="btn-landing btn-classpass" onClick={onClassPass}>
          <span className="btn-landing-icon">📱</span>
          <span className="btn-landing-label">ClassPass</span>
        </button>
        <button className="btn-landing btn-secondary" onClick={onVendor}>
          <span className="btn-landing-icon">🏢</span>
          <span className="btn-landing-label">Vendor</span>
        </button>
      </div>
    </div>
  );
}
