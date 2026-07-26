import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Bottom sheet, not a centered dialog — the natural mobile pattern, and
// simpler than porting the admin dashboard's desktop Modal component.
//
// Portaled straight to document.body rather than rendering inline: on this
// project's target iOS Safari version, ANY ancestor with overflow other
// than visible (even overflow-x-hidden on <main>, added as a safety net
// against the date-input overflow bug) gets treated as the containing
// block for position:fixed descendants instead of the real viewport. A
// sheet nested inside <main> would inherit that same "floats above the
// true edge" bug the bottom nav bar hit. Portaling to body sidesteps it
// for good, regardless of what overflow rules exist further up the tree.
export default function Sheet({ isOpen, onClose, children }: SheetProps) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
