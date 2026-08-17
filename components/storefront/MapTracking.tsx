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
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapInstance    = useRef<any>(null);
  const livreurMarker  = useRef<any>(null);
  const clientMarker   = useRef<any>(null);
  const polylineRef    = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    const cLat = livreurLat ?? clientLat ?? 14.7167;
    const cLng = livreurLng ?? clientLng ?? -17.4677;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapInstance.current) return;

      // SSR icon fix
      (L.Icon.Default.prototype as any)._getIconUrl = undefined;

      const map = L.map(containerRef.current, {
        center: [cLat, cLng],
        zoom: 14,
        zoomControl: true,
        dragging: !L.Browser.mobile,
        scrollWheelZoom: false,
      });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
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

      // Livreur marker
      if (livreurLat && livreurLng) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 3px 14px rgba(34,197,94,0.7);display:flex;align-items:center;justify-content:center;font-size:18px">🚴</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
        livreurMarker.current = L.marker([livreurLat, livreurLng], { icon })
          .addTo(map)
          .bindPopup(livreurNom ? `🚴 ${livreurNom}` : "🚴 Livreur en route");
      }

      // Polyline + fit bounds when both positions known
      if (livreurLat && livreurLng && clientLat && clientLng) {
        polylineRef.current = L.polyline(
          [[livreurLat, livreurLng], [clientLat, clientLng]],
          { color: "#22c55e", weight: 3, opacity: 0.65, dashArray: "8 8" }
        ).addTo(map);
        map.fitBounds([[livreurLat, livreurLng], [clientLat, clientLng]], { padding: [45, 45] });
      } else if (clientLat && clientLng) {
        map.setView([clientLat, clientLng], 14);
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        livreurMarker.current = null;
        clientMarker.current = null;
        polylineRef.current = null;
      }
    };
    // intentionally run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-update livreur marker when position changes
  useEffect(() => {
    if (!mapInstance.current) return;
    if (!livreurLat || !livreurLng) return;

    import("leaflet").then((L) => {
      if (!mapInstance.current) return;
      const latlng: [number, number] = [livreurLat, livreurLng];

      if (livreurMarker.current) {
        livreurMarker.current.setLatLng(latlng);
      } else {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#22c55e;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 3px 14px rgba(34,197,94,0.7);display:flex;align-items:center;justify-content:center;font-size:18px">🚴</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
        livreurMarker.current = L.marker(latlng, { icon })
          .addTo(mapInstance.current)
          .bindPopup(livreurNom ? `🚴 ${livreurNom}` : "🚴 Livreur en route");
      }

      // Update dashed polyline to client
      if (clientLat && clientLng) {
        const latLngs: [number, number][] = [latlng, [clientLat, clientLng]];
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(latLngs);
        } else {
          polylineRef.current = L.polyline(latLngs, {
            color: "#22c55e", weight: 3, opacity: 0.65, dashArray: "8 8",
          }).addTo(mapInstance.current);
        }
      }

      mapInstance.current.panTo(latlng, { animate: true, duration: 1 });
    });
  }, [livreurLat, livreurLng, livreurNom, clientLat, clientLng]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: "100%", height: 280, background: "#1a1a1a" }} />
    </>
  );
}
