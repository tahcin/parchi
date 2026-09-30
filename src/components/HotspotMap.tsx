"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, GeoJSON, CircleMarker, Tooltip, Pane } from "react-leaflet";
import type { FeatureCollection } from "geojson";

export interface Spot {
  key: string;
  label: string;
  lat: number;
  lon: number;
  total: number;
  danger: number;
  top: string | null;
  // Optional overrides for layers that are not dealer chits (e.g. the KCC calls layer).
  radius?: number;
  fill?: string;
  tip?: string[];
}

// No tile server: state outlines drawn in ink on the page's paper, from datameet's open
// boundaries (which follow the Survey of India's official border). Nothing to rate-limit or
// need a key, and it matches the rest of the app.
export default function HotspotMap({ spots }: { spots: Spot[] }) {
  const [states, setStates] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/india-states.json")
      .then((r) => r.json())
      .then(setStates)
      .catch(() => setStates(null));
  }, []);

  return (
    <MapContainer
      bounds={[[6.5, 68], [37.2, 97.4]]}
      zoomSnap={0.1}
      minZoom={4}
      maxZoom={8}
      scrollWheelZoom={false}
      attributionControl={false}
      className="h-[420px] w-full rounded-2xl border-2 border-ink"
      style={{ background: "#fbf6ea" }}
    >
      {/* States sit in their own pane below the circles, so the outlines never cover the data. */}
      <Pane name="states" style={{ zIndex: 350 }} />
      {states && (
        <GeoJSON
          pane="states"
          data={states}
          style={{ color: "#1f2a44", weight: 0.9, opacity: 0.55, fillColor: "#efe4cc", fillOpacity: 0.9 }}
          onEachFeature={(f, layer) => layer.bindTooltip(String(f.properties?.ST_NM ?? ""), { sticky: true, opacity: 0.8 })}
        />
      )}
      {spots.map((s) => {
        const share = s.total ? s.danger / s.total : 0;
        const color = s.fill ?? (share > 0.5 ? "#c8302b" : share > 0.25 ? "#c98a0c" : "#2f7d3a");
        return (
          <CircleMarker
            key={s.key}
            center={[s.lat, s.lon]}
            radius={s.radius ?? 6 + Math.sqrt(s.total) * 3}
            pathOptions={{ color: "#1f2a44", weight: 1.5, fillColor: color, fillOpacity: 0.8 }}
          >
            <Tooltip>
              <strong>{s.label}</strong>
              {s.tip ? (
                s.tip.map((t) => (
                  <span key={t}>
                    <br />
                    {t}
                  </span>
                ))
              ) : (
                <>
                  <br />
                  {s.total} chits checked, {s.danger} with a banned or stopped product
                </>
              )}
              {s.top && !s.tip && (
                <>
                  <br />
                  Most flagged: {s.top}
                </>
              )}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
