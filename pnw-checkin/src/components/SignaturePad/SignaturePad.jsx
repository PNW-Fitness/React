import { useEffect, useRef, useState } from "react";

export default function SignaturePad({ enabled, onChange, onClear }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e) {
    if (!enabled) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!enabled || !isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e) {
    if (!enabled || !isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    setHasStrokes(true);
    onChange?.(canvasRef.current.toDataURL("image/png"));
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasStrokes(false);
    onClear?.();
  }

  return (
    <div className="sig-pad-wrap">
      <canvas
        ref={canvasRef}
        className={`sig-pad-canvas ${enabled ? "sig-pad-active" : "sig-pad-locked"}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="sig-pad-footer">
        {!enabled && (
          <p className="sig-pad-hint">Please read and agree to the waiver to enable signing</p>
        )}
        {enabled && !hasStrokes && (
          <p className="sig-pad-hint">Draw your signature above</p>
        )}
        {enabled && hasStrokes && (
          <button type="button" className="btn-text sig-pad-clear" onClick={handleClear}>
            Clear signature
          </button>
        )}
      </div>
    </div>
  );
}
