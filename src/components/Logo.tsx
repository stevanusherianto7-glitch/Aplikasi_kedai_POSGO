import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 100, className = "" }) => {
  // Mapping common sizes to tailwind classes to avoid inline styles warning entirely
  // Standardizing on a fixed set of sizes for better design consistency
  const sizeMap: Record<number, string> = {
    32: "w-8 h-8",
    40: "w-10 h-10",
    48: "w-12 h-12",
    56: "w-14 h-14",
    64: "w-16 h-16",
    80: "w-20 h-20",
    100: "w-[100px] h-[100px]",
    128: "w-32 h-32"
  };

  const containerClass = sizeMap[size] || sizeMap[100];

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden rounded-full ${containerClass} ${className}`}
    >
      <img 
        src="/logo-transparent.png" 
        alt="ENGINE STATION" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
