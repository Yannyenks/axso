"use client";
import { useState } from "react";
import { CreditCard, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";

interface Props {
  theme: { fond: string; accent: string; texte: string; surface: string };
  commandeId: string;
  total: number;
  devise: string;
  nomClient: string;
  email: string;
  telephone: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// ─── Détection du type de carte ──────────────────────────────────────────────
function detectType(num: string): "visa" | "mastercard" | "verve" | "amex" | "discover" | "unknown" {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n))                        return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n))                    return "amex";
  if (/^6011|^65/.test(n))                 return "discover";
  if (/^5061|^6500|^6220/.test(n))         return "verve";
  return "unknown";
}

function formatNum(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 16);
  return n.replace(/(.{4})/g, "$1 ").trim();
}

function formatExp(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 4);
  return n.length >= 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
}

function luhn(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0, even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (even) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    even = !even;
  }
  return sum % 10 === 0;
}

const CARD_LOGOS: Record<string, string> = {
  visa:       "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeT0iMTYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzFBMUY3MSI+VklTQTwvdGV4dD48L3N2Zz4=",
  mastercard: "",
  verve:      "",
  amex:       "",
};

type AuthMode = "idle" | "pin" | "otp" | "redirect" | "success" | "error";

export function CardForm({ theme, commandeId, total, devise, nomClient, email, telephone, onSuccess, onCancel }: Props) {
  const [num, setNum]     = useState("");
  const [exp, setExp]     = useState("");
  const [cvv, setCvv]     = useState("");
  const [showCvv, setShowCvv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("idle");
  const [otp, setOtp]     = useState("");
  const [pin, setPin]     = useState("");
  const [flwRef, setFlwRef] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [erreur, setErreur] = useState("");

  const cardType = detectType(num);
  const digits   = num.replace(/\D/g, "");
  const numValid = luhn(num) && digits.length === 16;
  const expValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp);
  const cvvValid = cvv.length >= 3;
  const canPay   = numValid && expValid && cvvValid && !loading;

  // ── Couleur de la carte selon le type ──────────────────────────────────────
  const cardGradients: Record<string, string> = {
    visa:       "linear-gradient(135deg, #1A1F71 0%, #2952CC 100%)",
    mastercard: "linear-gradient(135deg, #EB001B 0%, #F79E1B 100%)",
    verve:      "linear-gradient(135deg, #006E51 0%, #00A878 100%)",
    amex:       "linear-gradient(135deg, #007BC1 0%, #00A5E3 100%)",
    discover:   "linear-gradient(135deg, #F76F20 0%, #FFAD33 100%)",
    unknown:    `linear-gradient(135deg, #1B4FD8 0%, #7B9EFF 100%)`,
  };

  // ── Charger la carte ────────────────────────────────────────────────────────
  async function charger() {
    if (!canPay) return;
    setLoading(true);
    setErreur("");

    const [expMonth, expYear] = exp.split("/");

    try {
      const res = await fetch("/api/paiements/carte/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId,
          cardNumber: digits,
          cvv,
          expiryMonth: expMonth,
          expiryYear: "20" + expYear,
          email,
          telephone,
          nom: nomClient,
          devise,
          montant: total,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setErreur(data.error || "Erreur de paiement"); setLoading(false); return; }

      const mode = data.mode as AuthMode;
      setFlwRef(data.flwRef || "");

      if (mode === "redirect") {
        setRedirectUrl(data.redirectUrl);
        setAuthMode("redirect");
        // Redirect automatique
        window.location.href = data.redirectUrl;
      } else if (mode === "otp") {
        setAuthMode("otp");
      } else if (mode === "pin") {
        setAuthMode("pin");
      } else if (mode === "success") {
        setAuthMode("success");
        setTimeout(onSuccess, 1500);
      } else {
        setErreur(data.message || "Réponse inattendue");
      }
    } catch {
      setErreur("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ── Valider OTP/PIN ─────────────────────────────────────────────────────────
  async function valider() {
    const code = authMode === "otp" ? otp : pin;
    if (!code || !flwRef) return;
    setLoading(true);
    setErreur("");

    try {
      const res = await fetch("/api/paiements/carte/valider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flwRef, otp: code, type: "card" }),
      });

      const data = await res.json();
      if (data.success) {
        setAuthMode("success");
        setTimeout(onSuccess, 1500);
      } else {
        setErreur(data.error || "Code incorrect");
      }
    } catch {
      setErreur("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2";
  const inp = { backgroundColor: theme.surface, borderColor: `${theme.accent}30`, color: theme.texte, ["--tw-ring-color" as any]: `${theme.accent}40` };

  // ── Succès ──────────────────────────────────────────────────────────────────
  if (authMode === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#34d39915" }}>
          <CheckCircle2 size={32} className="text-green-500"/>
        </div>
        <div>
          <h3 className="text-lg font-bold">Paiement réussi !</h3>
          <p className="text-sm opacity-50 mt-1">Votre commande est confirmée.</p>
        </div>
      </div>
    );
  }

  // ── OTP ─────────────────────────────────────────────────────────────────────
  if (authMode === "otp" || authMode === "pin") {
    const isOTP = authMode === "otp";
    return (
      <div className="max-w-sm mx-auto py-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${theme.accent}15` }}>
            <Lock size={24} style={{ color: theme.accent }}/>
          </div>
          <h3 className="text-lg font-bold">{isOTP ? "Entrez le code OTP" : "Entrez votre code PIN"}</h3>
          <p className="text-sm opacity-50 mt-1">
            {isOTP ? "Un code a été envoyé par SMS sur votre téléphone" : "Entrez le PIN de votre carte bancaire"}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type={isOTP ? "text" : "password"}
            value={isOTP ? otp : pin}
            onChange={e => isOTP ? setOtp(e.target.value) : setPin(e.target.value)}
            placeholder={isOTP ? "123456" : "••••"}
            maxLength={isOTP ? 6 : 4}
            className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
            style={inp}
            onKeyDown={e => e.key === "Enter" && valider()}
          />
          {erreur && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={14}/>{erreur}
            </div>
          )}
          <button onClick={valider} disabled={loading || (isOTP ? otp.length < 4 : pin.length < 4)}
            className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accent, color: theme.fond }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
            Valider
          </button>
          <button onClick={() => { setAuthMode("idle"); setErreur(""); }}
            className="w-full flex items-center justify-center gap-1.5 text-sm opacity-50 hover:opacity-80">
            <ChevronLeft size={14}/> Retour
          </button>
        </div>
      </div>
    );
  }

  // ── Formulaire carte ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Prévisualisation carte 3D */}
      <div
        className="relative rounded-2xl p-6 text-white select-none overflow-hidden"
        style={{
          background: cardGradients[cardType] || cardGradients.unknown,
          minHeight: "160px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        {/* Motif déco */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(30%,-30%)" }}/>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-8" style={{ background: "radial-gradient(circle, white, transparent 70%)", transform: "translate(-30%,30%)" }}/>

        <div className="relative z-10">
          {/* Puce */}
          <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 mb-4 opacity-90"/>
          {/* Numéro */}
          <p className="font-mono text-lg tracking-[0.15em] mb-4 font-medium">
            {digits.slice(0,4) || "••••"} {digits.slice(4,8) || "••••"} {digits.slice(8,12) || "••••"} {digits.slice(12,16) || "••••"}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wider">Titulaire</p>
              <p className="text-sm font-semibold">{nomClient || "VOTRE NOM"}</p>
            </div>
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wider">Expire</p>
              <p className="text-sm font-semibold">{exp || "MM/AA"}</p>
            </div>
            <div className="text-right">
              {cardType === "visa" && <p className="text-xl font-black italic">VISA</p>}
              {cardType === "mastercard" && (
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-red-500 opacity-90"/>
                  <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-3"/>
                </div>
              )}
              {cardType === "verve" && <p className="text-sm font-black">VERVE</p>}
              {cardType === "amex" && <p className="text-sm font-black">AMEX</p>}
              {(cardType === "unknown" || cardType === "discover") && (
                <CreditCard size={24} className="opacity-60"/>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Champs carte */}
      <div className="space-y-3">
        {/* Numéro de carte */}
        <div>
          <label className="text-xs block mb-1.5" style={{ color: theme.texte, opacity: 0.6 }}>Numéro de carte</label>
          <div className="relative">
            <input
              type="text"
              value={num}
              onChange={e => setNum(formatNum(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={`${inputClass} pr-10 font-mono`}
              style={{ ...inp, borderColor: num.length > 0 && !numValid ? "#ef4444" : inp.borderColor }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {num.length >= 16 && (
                numValid
                  ? <CheckCircle2 size={16} className="text-green-500"/>
                  : <AlertCircle size={16} className="text-red-400"/>
              )}
            </div>
          </div>
          {num.length >= 16 && !numValid && (
            <p className="text-xs text-red-400 mt-1">Numéro de carte invalide</p>
          )}
        </div>

        {/* Expiration + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1.5" style={{ color: theme.texte, opacity: 0.6 }}>Date d'expiration</label>
            <input
              type="text"
              value={exp}
              onChange={e => setExp(formatExp(e.target.value))}
              placeholder="MM/AA"
              maxLength={5}
              className={inputClass}
              style={{ ...inp, borderColor: exp.length === 5 && !expValid ? "#ef4444" : inp.borderColor }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: theme.texte, opacity: 0.6 }}>
              CVV / CVC
              <span className="ml-1 opacity-40 font-normal">(3 chiffres au dos)</span>
            </label>
            <div className="relative">
              <input
                type={showCvv ? "text" : "password"}
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="•••"
                maxLength={4}
                className={`${inputClass} pr-10`}
                style={inp}
              />
              <button type="button" onClick={() => setShowCvv(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity">
                {showCvv ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <AlertCircle size={14} className="flex-shrink-0"/>
          {erreur}
        </div>
      )}

      {/* Cartes acceptées */}
      <div className="flex items-center gap-3">
        <span className="text-xs opacity-40">Accepté :</span>
        {["Visa", "Mastercard", "Verve", "Amex"].map(c => (
          <span key={c} className="text-xs px-2 py-1 rounded-lg border font-medium" style={{ borderColor: `${theme.accent}25`, opacity: 0.6 }}>{c}</span>
        ))}
      </div>

      {/* Bouton payer */}
      <button
        onClick={charger}
        disabled={!canPay}
        className="w-full py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
        style={{ backgroundColor: theme.accent, color: theme.fond, boxShadow: `0 4px 20px ${theme.accent}40` }}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin"/>Traitement…</>
        ) : (
          <><Lock size={15}/>Payer par carte · {new Intl.NumberFormat("fr-FR").format(total)} {devise}</>
        )}
      </button>

      <div className="flex items-center justify-between text-xs opacity-30">
        <span className="flex items-center gap-1"><Lock size={11}/>SSL 256-bit</span>
        <span>Flutterwave · PCI DSS</span>
        <button onClick={onCancel} className="hover:opacity-60 transition-opacity">Changer de méthode</button>
      </div>
    </div>
  );
}
