"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  getContextParkPhoto,
  PARK_PHOTO_ROTATION,
  type ParkPhoto,
} from "@/features/trailpack/data/park-images";

const ROTATION_INTERVAL_MS = 9000;

interface PhotoLayers {
  front: ParkPhoto;
  back: ParkPhoto;
  showFront: boolean;
}

export function ParkPhotoShowcase({
  selectedParkId,
  selectedTrailId,
}: {
  selectedParkId: string | null;
  selectedTrailId: string | null;
}) {
  const lockedPhoto = useMemo(
    () => getContextParkPhoto({ selectedParkId, selectedTrailId }),
    [selectedParkId, selectedTrailId],
  );
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const desiredPhoto = lockedPhoto ?? PARK_PHOTO_ROTATION[rotationIndex];
  const [layers, setLayers] = useState<PhotoLayers>({
    front: PARK_PHOTO_ROTATION[0],
    back: PARK_PHOTO_ROTATION[0],
    showFront: true,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (lockedPhoto || isPaused || prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setRotationIndex((current) => (current + 1) % PARK_PHOTO_ROTATION.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isPaused, lockedPhoto, prefersReducedMotion]);

  useEffect(() => {
    setLayers((current) => {
      const visiblePhoto = current.showFront ? current.front : current.back;
      if (visiblePhoto.id === desiredPhoto.id) {
        return current;
      }

      return current.showFront
        ? { ...current, back: desiredPhoto, showFront: false }
        : { ...current, front: desiredPhoto, showFront: true };
    });
  }, [desiredPhoto]);

  const visiblePhoto = layers.showFront ? layers.front : layers.back;
  const rotationStopped = Boolean(lockedPhoto);

  return (
    <figure
      className="park-photo-showcase"
      aria-label={`${visiblePhoto.locationName}, ${visiblePhoto.parkName}`}
    >
      <PhotoLayer
        photo={layers.back}
        isVisible={!layers.showFront}
        priority={false}
      />
      <PhotoLayer
        photo={layers.front}
        isVisible={layers.showFront}
        priority
      />

      <div className="park-photo-scrim" aria-hidden="true" />

      <div className="park-photo-topline">
        <span className="park-photo-context">
          {selectedTrailId
            ? "Selected trail"
            : selectedParkId
              ? "Selected park"
              : "Featured park"}
        </span>
        {!rotationStopped ? (
          <button
            type="button"
            className="park-photo-control"
            onClick={() => setIsPaused((current) => !current)}
            aria-pressed={isPaused}
            aria-label={isPaused ? "Resume park photo rotation" : "Pause park photo rotation"}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
            <span>{isPaused ? "Play" : "Pause"}</span>
          </button>
        ) : null}
      </div>

      <figcaption className="park-photo-caption">
        <div>
          <p className="park-photo-location">{visiblePhoto.locationName}</p>
          <p className="park-photo-park">{visiblePhoto.parkName}</p>
        </div>
        <a
          href={visiblePhoto.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="park-photo-credit"
        >
          {visiblePhoto.credit}
          <span className="sr-only"> — open source page</span>
        </a>
      </figcaption>

      {!rotationStopped ? (
        <div className="park-photo-dots" aria-hidden="true">
          {PARK_PHOTO_ROTATION.map((photo, index) => (
            <span
              key={photo.id}
              className={index === rotationIndex ? "is-active" : undefined}
            />
          ))}
        </div>
      ) : null}
    </figure>
  );
}

function PhotoLayer({
  photo,
  isVisible,
  priority,
}: {
  photo: ParkPhoto;
  isVisible: boolean;
  priority: boolean;
}) {
  return (
    <Image
      key={photo.id}
      src={photo.src}
      alt={photo.alt}
      fill
      priority={priority}
      sizes="(max-width: 767px) 100vw, (max-width: 1199px) 52vw, 620px"
      className={`park-photo-layer ${isVisible ? "is-visible" : ""}`}
    />
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="park-photo-control-icon">
      <path d="M6 4.5v11M14 4.5v11" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="park-photo-control-icon">
      <path d="m7 4.5 8 5.5-8 5.5z" />
    </svg>
  );
}
