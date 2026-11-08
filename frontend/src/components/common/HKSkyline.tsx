import React from "react";

export function HKSkyline({ className = "w-full h-16 text-blue-900/40" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      {/* Hong Kong iconic skyline silhouette: IFC, Bank of China tower, ICC, Central Plaza */}
      <rect x="10" y="85" width="22" height="35" rx="1" />
      <rect x="36" y="70" width="28" height="50" rx="1" />
      {/* Hopewell / Round tower */}
      <rect x="68" y="75" width="20" height="45" rx="3" />
      {/* Bank of China Tower with triangular facets */}
      <polygon points="105,15 118,35 92,35" />
      <polygon points="90,35 120,35 125,75 85,75" />
      <rect x="85" y="75" width="40" height="45" />
      <line x1="105" y1="5" x2="105" y2="15" stroke="currentColor" strokeWidth="2" />
      {/* Cheung Kong Center */}
      <rect x="132" y="45" width="32" height="75" rx="1" />
      {/* Two IFC (International Finance Centre) - tall signature building */}
      <polygon points="182,10 188,10 186,0 184,0" />
      <rect x="172" y="10" width="26" height="110" rx="2" />
      <rect x="175" y="15" width="20" height="10" fill="currentColor" fillOpacity="0.2" />
      <line x1="185" y1="0" x2="185" y2="10" stroke="currentColor" strokeWidth="2" />
      {/* Exchange Square (Phillip Securities HQ!) */}
      <rect x="204" y="55" width="34" height="65" rx="2" />
      <rect x="242" y="60" width="30" height="60" rx="2" />
      {/* Central Plaza spire */}
      <polygon points="290,20 286,40 294,40" />
      <rect x="280" y="40" width="20" height="80" rx="1" />
      <line x1="290" y1="8" x2="290" y2="20" stroke="currentColor" strokeWidth="1.5" />
      {/* Kowloon side ICC across the harbor */}
      <rect x="325" y="65" width="28" height="55" rx="1" />
      <rect x="360" y="12" width="26" height="108" rx="2" />
      <line x1="373" y1="2" x2="373" y2="12" stroke="currentColor" strokeWidth="2" />
      <rect x="392" y="70" width="24" height="50" rx="1" />
      <rect x="420" y="80" width="30" height="40" rx="1" />
      <rect x="455" y="75" width="35" height="45" rx="1" />
      {/* Base water line */}
      <rect x="0" y="116" width="500" height="4" fill="currentColor" />
    </svg>
  );
}

