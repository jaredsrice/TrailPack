import type { TrailProfile } from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";
import {
  TrailPackIcon,
  type TrailPackIconName,
} from "./TrailPackIcon";

function formatConfidence(status: TrailProfile["sourceConfidence"]["status"]): string {
  return status.replaceAll("_", " ");
}

export function TrailProfileSummary({ trail }: { trail: TrailProfile }) {
  return (
    <section
      id="trail-profile"
      className="trail-profile-section"
      aria-labelledby="trail-profile-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Selected trail</p>
          <h2 id="trail-profile-heading" className="section-title">
            <span className="sr-only">Trail profile for </span>
            {trail.name}
          </h2>
          <p className="section-subtitle">
            {trail.park} · {trail.state}
          </p>
        </div>
        <SourceBadge label="supported-profile" />
      </div>

      <div className="profile-stat-grid">
        <StatCard
          icon="distance"
          label="Distance"
          value={`${trail.distanceMiles.value} mi`}
          officialNote="Official (NPS)"
          sourceLabel={trail.distanceMiles.label}
          computed={
            trail.distanceMiles.computedValue
              ? `USGS computed estimate: ~${trail.distanceMiles.computedValue} mi`
              : undefined
          }
          computedNote={trail.distanceMiles.computedNote}
        />
        <StatCard
          icon="elevation"
          label="Elevation gain"
          value={`${trail.elevationGainFeet.value.toLocaleString()} ft`}
          officialNote="Official (NPS)"
          sourceLabel={trail.elevationGainFeet.label}
          computed={
            trail.elevationGainFeet.computedValue
              ? `USGS computed estimate: ~${trail.elevationGainFeet.computedValue} ft`
              : undefined
          }
          computedNote={trail.elevationGainFeet.computedNote}
          conflict={trail.sourceConfidence.gainMatch === "conflict"}
        />
        <StatCard
          icon="clock"
          label="Time"
          value={trail.estimatedDuration.value}
          sourceLabel={trail.estimatedDuration.label}
        />
        <StatCard
          icon="difficulty"
          label="Difficulty"
          value={trail.difficulty.value}
          sourceLabel={trail.difficulty.label}
        />
      </div>

      {trail.accessibility ? (
        <aside
          className="trail-accessibility-note"
          aria-labelledby="trail-accessibility-heading"
        >
          <TrailPackIcon name="info" className="trail-accessibility-icon" />
          <div>
            <p className="trail-accessibility-kicker">Official NPS information</p>
            <h3 id="trail-accessibility-heading">Accessibility and terrain</h3>
            <p>{trail.accessibility.value}</p>
            <p className="trail-accessibility-caveat">
              This describes reported terrain and obstacles; it is not a claim
              that the trail meets a particular accessibility standard.
            </p>
            {trail.accessibility.sourceUrl ? (
              <a
                href={trail.accessibility.sourceUrl}
                className="source-link"
                target="_blank"
                rel="noreferrer"
              >
                Read the official NPS trail page
              </a>
            ) : null}
          </div>
        </aside>
      ) : null}

      <details className="source-confidence-details group">
        <summary>
          <span className="source-confidence-title">
            <TrailPackIcon name="source" className="h-5 w-5" />
            <strong>Sources &amp; Confidence</strong>
            <span>See provenance, update cadence, and conflict handling.</span>
          </span>
          <TrailPackIcon
            name="chevron"
            className="h-5 w-5 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="source-confidence-content">
          <p>
            <strong>Confidence:</strong>{" "}
            {formatConfidence(trail.sourceConfidence.status)}
          </p>
          <p>{trail.sourceConfidence.summary}</p>
          <p>
            <strong>Retrieval:</strong>{" "}
            {trail.retrievalStatus.replaceAll("-", " ")} on {trail.retrievedAt}
          </p>
          <p>
            <strong>Last checked:</strong>{" "}
            {trail.sourceConfidence.lastChecked}
          </p>
          <div>
            <p><strong>Source records:</strong></p>
            <ul className="source-record-list">
              {trail.sourceRecords.map((record) => (
                <li key={`${record.source}-${record.role}-${record.sourceUrl}`}>
                  <a
                    href={record.sourceUrl}
                    className="source-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {record.source}
                  </a>{" "}
                  · {record.role.replaceAll("-", " ")} · retrieved {record.retrievedAt}
                  {record.sourceRecordIds?.length ? (
                    <span> · source feature IDs {record.sourceRecordIds.join(", ")}</span>
                  ) : null}
                  {record.note ? <span className="source-record-note">{record.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <p>
            <strong>Missing planning fields:</strong>{" "}
            {trail.missingFields.length > 0 ? trail.missingFields.join(", ") : "None"}
          </p>
          {trail.elevationMinFeet && trail.elevationMaxFeet ? (
            <p>
              <strong>USGS elevation range:</strong>{" "}
              {trail.elevationMinFeet.toLocaleString()}–{trail.elevationMaxFeet.toLocaleString()} ft
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  sourceLabel,
  computed,
  computedNote,
  officialNote,
  conflict = false,
}: {
  icon: TrailPackIconName;
  label: string;
  value: string;
  sourceLabel: TrailProfile["distanceMiles"]["label"];
  computed?: string;
  computedNote?: string;
  officialNote?: string;
  conflict?: boolean;
}) {
  return (
    <div className="profile-stat">
      <TrailPackIcon name={icon} className="profile-stat-icon" />
      <div>
        <p className="profile-stat-label">{label}</p>
        <p className="profile-stat-value">{value}</p>
        <div className="profile-stat-source">
          <SourceBadge label={sourceLabel} />
          {officialNote ? <span>{officialNote}</span> : null}
        </div>
        {computed ? (
          <p className="profile-stat-computed">
            {computed}
            {conflict ? (
              <span className="profile-stat-conflict">
                <TrailPackIcon name="alert" className="h-3.5 w-3.5" />
                Conflicts with NPS
              </span>
            ) : null}
          </p>
        ) : null}
        {computedNote ? (
          <p className="profile-stat-note">{computedNote}</p>
        ) : null}
      </div>
    </div>
  );
}
