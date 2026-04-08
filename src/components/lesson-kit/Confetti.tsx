import { useEffect, useState } from "react";

export default function Confetti() {
  const [pieces] = useState(() => {
    const colors = ["#57B477", "#6EC48E", "#ff4b4b", "#ffc800", "#ce82ff", "#3d9e65"];
    return Array.from({ length: 60 }).map(() => ({
      left: Math.random() * 100,
      bg: colors[Math.floor(Math.random() * colors.length)],
      w: Math.random() * 8 + 6,
      dur: Math.random() * 2 + 1.5,
      delay: Math.random(),
    }));
  });
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 4000);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="confetti-container">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${p.left}%`,
            background: p.bg,
            width: `${p.w}px`,
            height: `${p.w}px`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
