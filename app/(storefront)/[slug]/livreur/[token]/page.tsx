"use client";
import { useEffect, useState, useRef } from "react";

export default function LivreurPage({ params }: { params: { token: string } }) {
  const [commande, setCommande] = useState<any>(null);
  const [status, setStatus] = useState<"idle"|"tracking"|"error"|"done">("idle");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [lastPos, setLastPos] = useState<{lat:number;lng:number}|null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const watchRef = useRef<number|null>(null);
  const intervalRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    fetch(`/api/tracking/${params.token}`)
      .then(r => r.json())
      .then(d => { if (d.commande) setCommande(d.commande); });
    return () => {
      if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function sendPos(lat: number, lng: number) {
    await fetch(`/api/tracking/${params.token}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, nom: nom || undefined, telephone: telephone || undefined }),
    });
    setLastPos({ lat, lng });
    setUpdateCount(c => c + 1);
  }

  function startTracking() {
    if (!navigator.geolocation) { setStatus("error"); return; }
    setStatus("tracking");

    navigator.geolocation.getCurrentPosition(
      pos => sendPos(pos.coords.latitude, pos.coords.longitude),
      () => setStatus("error"),
      { enableHighAccuracy: true }
    );

    watchRef.current = navigator.geolocation.watchPosition(
      pos => sendPos(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    // Backup interval au cas où watchPosition ne se déclenche pas souvent
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => sendPos(pos.coords.latitude, pos.coords.longitude), () => {}, { enableHighAccuracy: true });
    }, 30000);
  }

  function stopTracking() {
    if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("done");
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", fontFamily:"system-ui,sans-serif", color:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Logo / boutique */}
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:40, marginBottom:8 }}>🚴</div>
        <div style={{ fontSize:13, color:"#F5A623", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>
          {commande?.tenant?.nomBoutique ?? "Livraison"}
        </div>
        <div style={{ fontSize:20, fontWeight:700 }}>Mode livreur</div>
        {commande && <div style={{ fontSize:12, color:"#555", marginTop:4 }}>Commande #{commande.numero} · {commande.clientNom}</div>}
      </div>

      {/* Formulaire nom si pas encore tracking */}
      {status === "idle" && (
        <div style={{ width:"100%", maxWidth:360, space:"12px" }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:"#666", display:"block", marginBottom:6 }}>Votre nom (optionnel)</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Moussa"
              style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, color:"#666", display:"block", marginBottom:6 }}>Téléphone (optionnel)</label>
            <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+237 6XX XX XX XX" type="tel"
              style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"white", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>

          {/* Adresse client */}
          {commande && (
            <div style={{ background:"rgba(245,166,35,0.08)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:16, padding:14, marginBottom:20 }}>
              <div style={{ fontSize:10, color:"#F5A623", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Adresse de livraison</div>
              <div style={{ fontSize:14, color:"#DDD" }}>{commande.adresseExacte || commande.adresseLivraison || "À préciser"}</div>
              {commande.ville && <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{commande.ville}</div>}
              {commande.mapsLienClient && (
                <a href={commande.mapsLienClient} target="_blank" rel="noopener noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:10, color:"#F5A623", fontSize:12, textDecoration:"none", fontWeight:600 }}>
                  📍 Ouvrir dans Google Maps
                </a>
              )}
              {commande.latitudeClient && commande.longitudeClient && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${commande.latitudeClient},${commande.longitudeClient}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, color:"#22c55e", fontSize:12, textDecoration:"none", fontWeight:600 }}>
                  🧭 Itinéraire GPS
                </a>
              )}
            </div>
          )}

          <button onClick={startTracking}
            style={{ width:"100%", padding:"16px", borderRadius:16, background:"linear-gradient(135deg,#F5A623,#e09520)", color:"black", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            📡 Démarrer le partage de position
          </button>
        </div>
      )}

      {/* Tracking actif */}
      {status === "tracking" && (
        <div style={{ textAlign:"center", maxWidth:360, width:"100%" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", background:"rgba(34,197,94,0.1)", border:"3px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", animation:"pulse 1.5s ease-in-out infinite" }}>
            <span style={{ fontSize:40 }}>📡</span>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:"#22c55e", marginBottom:8 }}>Position partagée</div>
          <div style={{ fontSize:13, color:"#555", marginBottom:20 }}>Votre position est envoyée automatiquement</div>

          {lastPos && (
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:14, marginBottom:20, fontSize:12 }}>
              <div style={{ color:"#888", marginBottom:4 }}>Dernière position</div>
              <div style={{ color:"#DDD", fontFamily:"monospace" }}>{lastPos.lat.toFixed(5)}, {lastPos.lng.toFixed(5)}</div>
              <div style={{ color:"#555", marginTop:4 }}>{updateCount} mise(s) à jour envoyée(s)</div>
            </div>
          )}

          {commande?.latitudeClient && commande?.longitudeClient && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${commande.latitudeClient},${commande.longitudeClient}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 20px", borderRadius:14, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)", color:"#22c55e", fontSize:13, fontWeight:600, textDecoration:"none", marginBottom:16 }}>
              🧭 Itinéraire vers le client
            </a>
          )}

          <button onClick={stopTracking}
            style={{ width:"100%", padding:"13px", borderRadius:14, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            ⏹ Arrêter le partage
          </button>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>❌</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8, color:"#ef4444" }}>Géolocalisation refusée</div>
          <p style={{ fontSize:13, color:"#666" }}>Autorisez l'accès à votre position dans les paramètres de votre navigateur puis rechargez la page.</p>
        </div>
      )}

      {status === "done" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#22c55e" }}>Partage terminé</div>
          <p style={{ fontSize:13, color:"#666", marginTop:8 }}>{updateCount} position(s) envoyée(s)</p>
        </div>
      )}
    </div>
  );
}
