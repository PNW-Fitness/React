import type { ReactNode } from "react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Bottom sheet, not a centered dialog — the natural mobile pattern, and
// simpler than porting the admin dashboard's desktop Modal component.
export default function Sheet({ isOpen, onClose, children }: SheetProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />
        {children}
      </div>
    </div>
  );
}
