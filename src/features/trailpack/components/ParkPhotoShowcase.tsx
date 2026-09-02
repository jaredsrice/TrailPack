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
  back: ParkPhoto | null;
  showFront: boolean;
  frontReady: boolean;
  backReady: boolean;
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
    back: null,
    showFront: true,
    frontReady: false,
    backReady: false,
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
      const visiblePhoto =
        current.showFront || !current.back ? current.front : current.back;
      if (visiblePhoto.id === desiredPhoto.id) {
        return current;
      }

      const nextPhoto = current.showFront ? current.back : current.front;
      const nextReady = current.showFront
        ? current.backReady
        : current.frontReady;
      if (nextPhoto?.id === desiredPhoto.id) {
        return nextReady
          ? { ...current, showFront: !current.showFront }
          : current;
      }

      // Keep the current photo and credit visible until its replacement loads.
      return current.showFront
        ? { ...current, back: desiredPhoto, backReady: false }
        : { ...current, front: desiredPhoto, frontReady: false };
    });
  }, [desiredPhoto, layers.backReady, layers.frontReady]);

  const markPhotoReady = (layer: "front" | "back", photoId: string) => {
    setLayers((current) => {
      if (current[layer]?.id !== photoId) {
        return current;
      }
      const readyKey = layer === "front" ? "frontReady" : "backReady";
      return current[readyKey] ? current : { ...current, [readyKey]: true };
    });
  };

  const visiblePhoto =
    layers.showFront || !layers.back ? layers.front : layers.back;
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
      aria-busy={visiblePhoto.id !== desiredPhoto.id}
    >
      {layers.back ? (
        <PhotoLayer
          photo={layers.back}
          isVisible={!layers.showFront}
          priority={!layers.showFront}
          onReady={(photoId) => markPhotoReady("back", photoId)}
        />
      ) : null}
      <PhotoLayer
        photo={layers.front}
        isVisible={layers.showFront}
        priority={layers.showFront}
        onReady={(photoId) => markPhotoReady("front", photoId)}
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
              aria-pressed={isPaused || prefersReducedMotion}
              disabled={prefersReducedMotion}
              aria-label={
                prefersReducedMotion
                  ? "Automatic park photo rotation is paused for reduced motion"
                  : isPaused
                  ? "Resume park photo rotation"
                  : "Pause park photo rotation"
              }
            >
              {isPaused && !prefersReducedMotion ? <PlayIcon /> : <PauseIcon />}
              <span>
                {prefersReducedMotion ? "Paused" : isPaused ? "Play" : "Pause"}
              </span>
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
              className={photo.id === visiblePhoto.id ? "is-active" : undefined}
              onClick={() => setRotationIndex(index)}
              aria-label={`Show ${photo.parkName}`}
              aria-current={photo.id === visiblePhoto.id ? "true" : undefined}
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
  onReady,
}: {
  photo: ParkPhoto;
  isVisible: boolean;
  priority: boolean;
  onReady: (photoId: string) => void;
}) {
  const focalPoint = photo.focalPoint?.desktop ?? "50% 50%";
  const mobileFocalPoint = photo.focalPoint?.mobile ?? focalPoint;

  return (
    <Image
      key={photo.id}
      src={photo.src}
      alt={isVisible ? photo.alt : ""}
      aria-hidden={!isVisible}
      fill
      priority={priority}
      onLoad={() => onReady(photo.id)}
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
