import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export default function Logo({
  className = '',
  size,
  alt = 'Sneha Bazar',
}: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/sneha-bazar-logo.png"
      alt={alt}
      style={style}
      className={`object-contain ${className}`}
      loading="eager"
    />
  );
}
