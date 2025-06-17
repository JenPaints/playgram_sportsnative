import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = "Avatar", size = 40, className = "" }) => {
  return src ? (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover border-2 border-indigo-400 shadow-md ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold border-2 border-indigo-400 shadow-md ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      <span>{alt?.charAt(0) || "U"}</span>
    </div>
  );
}; 