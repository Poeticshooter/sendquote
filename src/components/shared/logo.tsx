"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  variant?: "default" | "icon" | "white";
  href?: string;
  className?: string;
  priority?: boolean;
}

const logoMap = {
  default: "/logo.svg",
  icon: "/logo-icon.svg",
  white: "/logo-white.svg",
};

export function Logo({ size = 36, variant = "default", href, className, priority }: LogoProps) {
  const logoSrc = logoMap[variant];
  const img = (
    <Image
      src={logoSrc}
      alt={variant === "icon" ? "SendQuote arrow logo" : "SendQuote logo"}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {img}
      </Link>
    );
  }

  return img;
}

export default Logo;