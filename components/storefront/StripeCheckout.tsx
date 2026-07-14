"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// ─── Formulaire interne ───────────────────────────────────────────────────────

function StripeForm({
  commandeId,
  montant,
  devise,
  onSuccess,
  onError,
}: {
  commandeId: string;
  montant: number;
  devise: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErreur("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/paiement-confirme?commande=${commandeId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErreur(error.message ?? "Paiement refusé");
      onError(error.message ?? "Paiement refusé");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { address: { country: "never" } } },
        }}
      />
      {erreur && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {erreur}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#635BFF] hover:bg-[#5147e6] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Traitement...</>
        ) : (
          <>
            <Lock size={15} />
            Payer {montant.toLocaleString()} {devise} · Sécurisé par Stripe
          </>
        )}
      </button>
      <p className="text-center text-xs text-gray-400">
        Paiement chiffré SSL · Visa, Mastercard, American Express
      </p>
    </form>
  );
}

// ─── Wrapper principal ────────────────────────────────────────────────────────

export function StripeCheckout({
  commandeId,
  montant,
  devise,
  clientEmail,
  clientNom,
  codeAffiliation,
  affilieurId,
  onSuccess,
  onError,
}: {
  commandeId: string;
  montant: number;
  devise: string;
  clientEmail: string;
  clientNom: string;
  codeAffiliation?: string;
  affilieurId?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (msg: string) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/paiements/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commandeId,
        montant,
        devise,
        clientEmail,
        clientNom,
        codeAffiliation,
        affilieurId,
        description: `Commande Axso #${commandeId.slice(-6).toUpperCase()}`,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setErreur(d.error ?? "Erreur d'initialisation");
      })
      .catch(() => setErreur("Impossible de contacter Stripe"))
      .finally(() => setLoading(false));
  }, [commandeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> Initialisation du paiement...
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-green-500" />
        </div>
        <p className="font-bold text-gray-900">Paiement confirmé !</p>
        <p className="text-sm text-gray-500">Vos téléchargements sont prêts.</p>
      </div>
    );
  }

  if (erreur || !clientSecret) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
        <AlertCircle size={15} /> {erreur || "Erreur d'initialisation Stripe"}
      </div>
    );
  }

  const handleSuccess = (piId: string) => {
    setSuccess(true);
    onSuccess(piId);
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#635BFF", borderRadius: "12px" },
        },
        locale: "fr",
      }}
    >
      <StripeForm
        commandeId={commandeId}
        montant={montant}
        devise={devise}
        onSuccess={handleSuccess}
        onError={onError ?? (() => {})}
      />
    </Elements>
  );
}
