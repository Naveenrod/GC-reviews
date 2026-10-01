"use client";

import { useState } from "react";
import { PLACEHOLDER_IMAGE, photoSrc } from "@/lib/photos";

// <img> for a stored venue photo: routes Google photos through /api/photo and
// falls back to the placeholder if the image fails to load.
export function VenueImage({
  src,
  alt,
  className,
  width,
  eager = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = (!failed && photoSrc(src, width)) || PLACEHOLDER_IMAGE;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}
