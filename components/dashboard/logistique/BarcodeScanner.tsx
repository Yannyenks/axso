"use client";
import { useEffect, useRef, useState } from "react";
import { X, ScanLine, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

// ─── Types partagés avec POSPanel ────────────────────────────────────────
interface Produit {
  id: string;
  nom: string;
  prix: number;
  stock: number;
  sku: string | null;
  images: string[];
  categorie: string | null;
  variantes: { id: string; nom: string; valeur: string; prix: number | null; stock: number }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Appelé avec le produit résolu — brancher directement sur ajouterAuCart(p) du POSPanel. */
  onProduitScanne: (p: Produit) => void;
}

const DELAI_ANTI_REBOND_MS = 1500;

/** Bip court ~880Hz via Web Audio API — pas de fichier audio nécessaire. */
function jouerBip() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 120);
  } catch {
    /* Web Audio indisponible — pas de bip plutôt que planter le scan */
  }
}

export function BarcodeScanner({ open, onClose, onProduitScanne }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const dernierCode = useRef<{ code: string; ts: number } | null>(null);
  const enTraitement = useRef(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!open) return;
    let annule = false;

    async function demarrer() {
      setErreur(null);
      setPret(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (annule) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setPret(true);

        // Décodage toujours via @zxing/browser (JS pur, déterministe) plutôt
        // que le BarcodeDetector natif : sur Android Chrome, cette API
        // dépend d'un modèle ML Kit téléchargé en arrière-plan par Google
        // Play Services — tant qu'il n'est pas prêt (ou absent), detect()
        // renvoie silencieusement un tableau vide indéfiniment : la caméra
        // s'ouvre normalement mais rien ne se passe jamais au scan. zxing
        // décode lui-même chaque frame, sans dépendance native ni modèle à
        // télécharger — un peu plus lourd en CPU, mais fiable partout.
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        if (annule || !videoRef.current) return;
        const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) traiterCode(result.getText());
        });
        zxingControlsRef.current = controls;
      } catch (e: any) {
        setErreur(
          e?.name === "NotAllowedError"
            ? "Accès à la caméra refusé — autorisez la caméra dans les réglages du navigateur."
            : "Impossible d'accéder à la caméra."
        );
      }
    }

    async function traiterCode(code: string) {
      const propre = code?.trim();
      if (!propre) return;
      const maintenant = Date.now();
      if (
        dernierCode.current &&
        dernierCode.current.code === propre &&
        maintenant - dernierCode.current.ts < DELAI_ANTI_REBOND_MS
      ) {
        return; // même code encore visible — on évite le doublon
      }
      dernierCode.current = { code: propre, ts: maintenant };
      if (enTraitement.current) return;
      enTraitement.current = true;
      try {
        const res = await fetch(`/api/pos/scan?code=${encodeURIComponent(propre)}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Aucun produit pour ce code");
          return;
        }
        navigator.vibrate?.(60);
        jouerBip();
        toast.success(`✓ ${data.produit.nom} ajouté`);
        onProduitScanne(data.produit);
      } catch {
        toast.error("Erreur réseau — nouvelle tentative possible");
      } finally {
        enTraitement.current = false;
      }
    }

    demarrer();

    return () => {
      annule = true;
      zxingControlsRef.current?.stop();
      zxingControlsRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(6,10,20,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#131d33 0%,#1B2A4A 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(245,166,35,0.08)",
          fontFamily: "'Poppins','Century Gothic',system-ui,sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <ScanLine size={16} style={{ color: "#F5A623" }} />
            <span className="text-white font-bold text-[14px]">Scanner un code-barres</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          >
            <X size={14} className="text-white/60" />
          </button>
        </div>

        {/* Zone caméra */}
        <div className="relative mx-5 rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "3/4" }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />

          {!pret && !erreur && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 size={26} className="animate-spin" style={{ color: "#F5A623" }} />
              <p className="text-white/50 text-[12px]">Ouverture de la caméra…</p>
            </div>
          )}

          {erreur && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <Camera size={26} className="text-white/30" />
              <p className="text-white/60 text-[12px]">{erreur}</p>
            </div>
          )}

          {pret && !erreur && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[78%] h-[38%] rounded-2xl"
                style={{
                  border: "2px solid #F5A623",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          )}
        </div>

        <p className="text-center text-white/40 text-[11.5px] px-6 pt-3 pb-5 leading-relaxed">
          Placez le code-barres du produit dans le cadre. Le scan est continu —
          chaque produit reconnu est ajouté automatiquement au panier.
        </p>
      </div>
    </div>
  );
}
