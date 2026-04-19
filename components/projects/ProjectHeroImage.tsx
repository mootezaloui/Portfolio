"use client";

import Image from "next/image";
import { RotatingImage } from "@/components/primitives/RotatingImage";

interface ProjectHeroImageProps {
  images: string[];
  title: string;
}

export function ProjectHeroImage({ images, title }: ProjectHeroImageProps) {
  const hasMultipleImages = images.length > 1;
  const heroImage = images[0] ?? "/file.svg";

  return (
    <div className="border-border relative h-72 w-full border-b">
      {hasMultipleImages ? (
        <RotatingImage
          images={images}
          alt={title}
          className="relative h-72 w-full"
          interval={4000}
        />
      ) : (
        <Image
          src={heroImage}
          alt={title}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
        />
      )}
    </div>
  );
}
