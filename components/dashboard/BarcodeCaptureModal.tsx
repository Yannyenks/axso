"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2, Camera } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Appelé une seule fois avec la valeur décodée — le modal se ferme immédiatement après (contrairement au scanner de caisse qui reste ouvert pour un scan continu). */
  onDetect: (code: string) => void;
}

// Formats retail les plus courants (EAN/UPC pour la grande distribution,
// Code128/Code39 pour les étiquettes internes, QR au cas où).
const FORMATS_BARCODE_DETECTOR = [
  "ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code",
];

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
    setTimeout(() => { osc.stop(); ctx.close(); }, 120);
  } catch { /* Web Audio indisponible — pas de bip plutôt que planter le scan */ }
}

/**
 * Capture caméra en un seul coup — utilisé pour remplir un champ (ex: le
 * code-barres d'une fiche produit) plutôt que pour ajouter au panier. Même
 * moteur de décodage que components/dashboard/logistique/BarcodeScanner.tsx
 * (BarcodeDetector natif avec repli @zxing/browser), mais se referme dès la
 * première détection au lieu de rester ouvert en boucle.
 */
export function BarcodeCaptureModal({ open, onClose, onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detecte = useRef(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!open) return;
    let annule = false;
    detecte.current = false;

    async function demarrer() {
      setErreur(null);
      setPret(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (annule) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setPret(true);

        if ("BarcodeDetector" in window) {
          const BarcodeDetectorCtor = (window as any).BarcodeDetector;
          const detector = new BarcodeDetectorCtor({ formats: FORMATS_BARCODE_DETECTOR });
          intervalRef.current = setInterval(async () => {
            if (annule || !videoRef.current || detecte.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes?.length) traiterCode(barcodes[0].rawValue);
            } catch { /* frame non décodable — on retente à la prochaine capture */ }
          }, 300);
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          if (annule || !videoRef.current) return;
          const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result && !detecte.current) traiterCode(result.getText());
          });
          zxingControlsRef.current = controls;
        }
      } catch (e: any) {
        setErreur(
          e?.name === "NotAllowedError"
            ? "Accès à la caméra refusé — autorisez la caméra dans les réglages du navigateur."
            : "Impossible d'accéder à la caméra."
        );
      }
    }

    function traiterCode(code: string) {
      const propre = code?.trim();
      if (!propre || detecte.current) return;
      detecte.current = true;
      navigator.vibrate?.(60);
      jouerBip();
      onDetect(propre);
      onClose();
    }

    demarrer();

    return () => {
      annule = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-white font-bold text-[14px]">Scanner le code-barres</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10">
            <X size={14} className="text-white/60" />
          </button>
        </div>

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
              <div className="w-[78%] h-[38%] rounded-2xl" style={{ border: "2px solid #F5A623", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }} />
            </div>
          )}
        </div>

        <p className="text-center text-white/40 text-[11.5px] px-6 pt-3 pb-5 leading-relaxed">
          Placez le code-barres du produit dans le cadre — le champ se remplit automatiquement dès qu'il est reconnu.
        </p>
      </div>
    </div>
  );
}
