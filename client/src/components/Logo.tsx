import React from 'react'

interface LogoProps {
  className?: string
  size?: number | string
  alt?: string
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size,
  alt = 'Sneha Bazar',
}) => {
  const style = size ? { width: size, height: size } : undefined

  return (
    <img
      src="/sneha-bazar-logo.png"
      alt={alt}
      style={style}
      className={`object-contain ${className}`}
      loading="eager"
    />
  )
}
