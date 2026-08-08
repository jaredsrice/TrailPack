"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  selectedParkName,
  selectedParkState,
  selectedTrailId,
}: {
  selectedParkId: string | null;
  selectedParkName: string | null;
  selectedParkState: string | null;
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
  }, [isPaused, lockedPhoto, prefersReducedMotion, rotationIndex]);

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
  const isParkSelection = Boolean(selectedParkId && !selectedTrailId);
  const captionTitle = isParkSelection
    ? selectedParkName ?? visiblePhoto.parkName
    : visiblePhoto.locationName;
  const captionSubtitle = isParkSelection
    ? selectedParkState ?? visiblePhoto.parkName
    : visiblePhoto.parkName;
  const showPreviousPhoto = () => {
    setRotationIndex(
      (current) =>
        (current - 1 + PARK_PHOTO_ROTATION.length) %
        PARK_PHOTO_ROTATION.length,
    );
  };
  const showNextPhoto = () => {
    setRotationIndex((current) => (current + 1) % PARK_PHOTO_ROTATION.length);
  };

  return (
    <figure
      className="park-photo-showcase"
      aria-label={`${captionTitle}, ${captionSubtitle}`}
    >
      <PhotoLayer
        photo={layers.back}
        isVisible={!layers.showFront}
        priority={!layers.showFront}
      />
      <PhotoLayer
        photo={layers.front}
        isVisible={layers.showFront}
        priority={layers.showFront}
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
          <div className="park-photo-controls">
            <button
              type="button"
              className="park-photo-control is-icon-only"
              onClick={showPreviousPhoto}
              aria-label="Show previous park photo"
            >
              <PreviousIcon />
            </button>
            <button
              type="button"
              className="park-photo-control"
              onClick={() => setIsPaused((current) => !current)}
              aria-pressed={isPaused}
              aria-label={
                isPaused
                  ? "Resume park photo rotation"
                  : "Pause park photo rotation"
              }
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
              <span>{isPaused ? "Play" : "Pause"}</span>
            </button>
            <button
              type="button"
              className="park-photo-control is-icon-only"
              onClick={showNextPhoto}
              aria-label="Show next park photo"
            >
              <NextIcon />
            </button>
          </div>
        ) : null}
      </div>

      <figcaption className="park-photo-caption">
        <div>
          <p className="park-photo-location">{captionTitle}</p>
          <p className="park-photo-park">{captionSubtitle}</p>
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
        <div className="park-photo-dots" aria-label="Choose a featured park photo">
          {PARK_PHOTO_ROTATION.map((photo, index) => (
            <button
              type="button"
              key={photo.id}
              className={index === rotationIndex ? "is-active" : undefined}
              onClick={() => setRotationIndex(index)}
              aria-label={`Show ${photo.parkName}`}
              aria-current={index === rotationIndex ? "true" : undefined}
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
  const focalPoint = photo.focalPoint?.desktop ?? "50% 50%";
  const mobileFocalPoint = photo.focalPoint?.mobile ?? focalPoint;

  return (
    <Image
      key={photo.id}
      src={photo.src}
      alt={photo.alt}
      fill
      priority={priority}
      quality={90}
      sizes="(max-width: 1199px) 100vw, 1120px"
      className={`park-photo-layer ${isVisible ? "is-visible" : ""}`}
      style={
        {
          "--park-photo-position": focalPoint,
          "--park-photo-position-mobile": mobileFocalPoint,
        } as CSSProperties
      }
    />
  );
}

function PreviousIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="park-photo-control-icon">
      <path d="m12.5 4.5-5 5.5 5 5.5" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="park-photo-control-icon">
      <path d="m7.5 4.5 5 5.5-5 5.5" />
    </svg>
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
