"use client";

import { useState } from "react";

export default function MercurioLogo({ className = "h-14 md:h-20 w-auto" }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="flex flex-col items-center select-none">
        <span className="text-3xl md:text-4xl font-black italic tracking-tighter text-white leading-none">
          MERCURIO
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-mercurio-yellow mt-1">
          Pinturerías
        </span>
      </div>
    );
  }

  return (
    <img
      src="/logoMercurioBlanco.png"
      alt="Mercurio Pinturerías"
      onError={() => setImgError(true)}
      className={`object-contain transition-transform duration-300 ${className}`}
    />
  );
}
