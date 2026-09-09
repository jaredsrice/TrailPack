import { describeRouteDistance, formatRouteGain, formatRouteMiles, type TrailGroup } from "../lib/trail-groups";

export function AccessRouteChooser({ group, selectedRouteId, onChange }: {
  group: TrailGroup;
  selectedRouteId: string | null;
  onChange: (routeId: string) => void;
}) {
  return (
    <section className="access-route-section" aria-labelledby="access-route-heading">
      <p className="section-kicker">Choose your approach</p>
      <h2 id="access-route-heading" className="section-title">{group.name}</h2>
      <p id="access-route-help" className="section-subtitle">
        Your packing list uses the itinerary you choose. Check the route type and return plan below.
      </p>
      <label className="access-route-label" htmlFor="access-route-select">Access route</label>
      <select id="access-route-select" value={selectedRouteId ?? ""}
        aria-describedby="access-route-help" onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>Choose an access route…</option>
        {group.routes.map((route) => (
          <option key={route.id} value={route.id}>
            {route.accessRoute?.label ?? route.name} — {formatRouteMiles(route)}
          </option>
        ))}
      </select>
      {!selectedRouteId ? (
        <ul className="access-route-options">
          {group.routes.map((route) => (
            <li key={route.id}>
              <strong>{route.accessRoute?.label ?? route.name}</strong>
              <span>{describeRouteDistance(route)} · {formatRouteGain(route)}</span>
              <span>{route.accessRoute?.returnPlan}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
