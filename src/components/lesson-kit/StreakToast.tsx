import { useEffect } from "react";

export default function StreakToast({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="streak-popup">
      <div className="streak-icon">
        <img src="/boba.svg" alt="boba" style={{ width: 48, height: 48 }} />
      </div>
      <div className="streak-text">5x Streak!</div>
      <div className="streak-bonus">+10 boba bonus</div>
    </div>
  );
}
