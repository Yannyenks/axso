"use client";
import { useEffect, useRef } from "react";

interface Props {
  livreurLat?: number | null;
  livreurLng?: number | null;
  clientLat?: number | null;
  clientLng?: number | null;
  livreurNom?: string | null;
}

export function MapTracking({ livreurLat, livreurLng, clientLat, clientLng, livreurNom }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapInstance   = useRef<any>(null);
  const livreurMarker = useRef<any>(null);
  const clientMarker  = useRef<any>(null);
  const trailLine     = useRef<any>(null);  // green solid: path history
  const destLine      = useRef<any>(null);  // orange dashed: remaining distance
  const trailPoints   = useRef<[number, number][]>([]);
  const animFrame     = useRef<number | null>(null);

  function animateTo(marker: any, from: [number, number], to: [number, number], ms = 1800) {
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    const start = performance.now();
    function step(now: number) {
      const raw  = Math.min((now - start) / ms, 1);
      const ease = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
      marker.setLatLng([
        from[0] + (to[0] - from[0]) * ease,
        from[1] + (to[1] - from[1]) * ease,
      ]);
      if (raw < 1) animFrame.current = requestAnimationFrame(step);
    }
    animFrame.current = requestAnimationFrame(step);
  }

  function livreurIcon(L: any) {
    return L.divIcon({
      className: "",
      html: `<div style="position:relative;width:40px;height:40px">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,0.25);animation:pingMap 1.8s cubic-bezier(0,0,0.2,1) infinite"></div>
        <div style="position:absolute;inset:4px;background:#22c55e;border-radius:50%;border:2.5px solid white;box-shadow:0 3px 14px rgba(34,197,94,0.6);display:flex;align-items:center;justify-content:center;font-size:16px">🚴</div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    const cLat = livreurLat ?? clientLat ?? 14.7167;
    const cLng = livreurLng ?? clientLng ?? -17.4677;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapInstance.current) return;

      (L.Icon.Default.prototype as any)._getIconUrl = undefined;

      const map = L.map(containerRef.current, {
        center: [cLat, cLng],
        zoom: 15,
        zoomControl: true,
        dragging: !L.Browser.mobile,
        scrollWheelZoom: false,
      });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      // Client/destination marker
      if (clientLat && clientLng) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#F5A623;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.5)"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        clientMarker.current = L.marker([clientLat, clientLng], { icon })
          .addTo(map)
          .bindPopup("📍 Adresse de livraison");
      }

      // Livreur marker + trail seed
      if (livreurLat && livreurLng) {
        const pos: [number, number] = [livreurLat, livreurLng];
        trailPoints.current = [pos];

        livreurMarker.current = L.marker(pos, { icon: livreurIcon(L) })
          .addTo(map)
          .bindPopup(livreurNom ? `🚴 ${livreurNom}` : "🚴 Livreur en route");

        // Trail: grows as livreur moves
        trailLine.current = L.polyline([pos], {
          color: "#22c55e", weight: 4, opacity: 0.85,
        }).addTo(map);
      }

      // Dashed line livreur → client
      if (livreurLat && livreurLng && clientLat && clientLng) {
        destLine.current = L.polyline(
          [[livreurLat, livreurLng], [clientLat, clientLng]],
          { color: "#F5A623", weight: 2, opacity: 0.55, dashArray: "7 7" }
        ).addTo(map);
        map.fitBounds([[livreurLat, livreurLng], [clientLat, clientLng]], { padding: [50, 50] });
      } else if (clientLat && clientLng) {
        map.setView([clientLat, clientLng], 14);
      }
    });

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        livreurMarker.current = null;
        clientMarker.current  = null;
        trailLine.current     = null;
        destLine.current      = null;
        trailPoints.current   = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live update: smooth animation + extend trail
  useEffect(() => {
    if (!mapInstance.current || !livreurLat || !livreurLng) return;

    import("leaflet").then((L) => {
      if (!mapInstance.current) return;
      const newPos: [number, number] = [livreurLat, livreurLng];

      if (livreurMarker.current) {
        const old = livreurMarker.current.getLatLng();
        const from: [number, number] = [old.lat, old.lng];
        // Only animate if there's actual movement (avoid jitter on same position)
        const dist = Math.abs(old.lat - newPos[0]) + Math.abs(old.lng - newPos[1]);
        if (dist > 0.00001) {
          animateTo(livreurMarker.current, from, newPos);
        }
      } else {
        livreurMarker.current = L.marker(newPos, { icon: livreurIcon(L) })
          .addTo(mapInstance.current)
          .bindPopup(livreurNom ? `🚴 ${livreurNom}` : "🚴 Livreur en route");
      }

      // Extend trail with new position
      const last = trailPoints.current[trailPoints.current.length - 1];
      const moved = !last || Math.abs(last[0] - newPos[0]) + Math.abs(last[1] - newPos[1]) > 0.00001;
      if (moved) {
        trailPoints.current = [...trailPoints.current, newPos];
        if (trailLine.current) {
          trailLine.current.setLatLngs(trailPoints.current);
        } else {
          trailLine.current = L.polyline(trailPoints.current, {
            color: "#22c55e", weight: 4, opacity: 0.85,
          }).addTo(mapInstance.current);
        }
      }

      // Update dashed remaining-distance line
      if (clientLat && clientLng) {
        if (destLine.current) {
          destLine.current.setLatLngs([newPos, [clientLat, clientLng]]);
        } else {
          destLine.current = L.polyline([newPos, [clientLat, clientLng]], {
            color: "#F5A623", weight: 2, opacity: 0.55, dashArray: "7 7",
          }).addTo(mapInstance.current);
        }
      }

      mapInstance.current.panTo(newPos, { animate: true, duration: 1.5 });
    });
  }, [livreurLat, livreurLng, livreurNom, clientLat, clientLng]);

  return (
    <>
      <style>{`@keyframes pingMap{75%,100%{transform:scale(2);opacity:0}}`}</style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: "100%", height: 280, background: "#1a1a1a" }} />
    </>
  );
}
