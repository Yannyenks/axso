"use client";
import { useRouter } from "next/navigation";
import { FileDown, BookOpen, Key, Package, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const TYPES = [
  {
    id: "fichier",
    icon: FileDown,
    label: "Fichier(s) digital",
    desc: "PDF, ZIP, MP3, vidéo — livraison automatique après paiement",
    color: "#1B2A4A",
    bg: "#1B2A4A15",
    dispo: true,
  },
  {
    id: "formation",
    icon: BookOpen,
    label: "Formation",
    desc: "Cours en chapitres et leçons avec suivi de progression",
    color: "#0ea5e9",
    bg: "#0ea5e915",
    dispo: false,
  },
  {
    id: "licence",
    icon: Key,
    label: "Clé de licence",
    desc: "Licences logiciel — génération auto ou stock importé",
    color: "#16a34a",
    bg: "#16a34a15",
    dispo: false,
  },
  {
    id: "bundle",
    icon: Package,
    label: "Bundle",
    desc: "Regroupez plusieurs produits existants à prix réduit",
    color: "#F5A623",
    bg: "#F5A62315",
    dispo: false,
  },
];

export default function CreerProduitPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/dashboard/produits" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft size={14} /> Retour aux produits
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-poppins">Quel type de produit ?</h1>
        <p className="text-gray-500 text-sm mt-1">Choisissez le type pour accéder au wizard adapté.</p>
      </div>

      <div className="space-y-3">
        {TYPES.map((t) => {
          const Icone = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => t.dispo && router.push(`/dashboard/produits/creer/${t.id}`)}
              disabled={!t.dispo}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all
                ${t.dispo
                  ? "border-gray-200 hover:border-current hover:shadow-md cursor-pointer"
                  : "border-gray-100 opacity-50 cursor-not-allowed"
                }`}
              style={t.dispo ? { borderColor: undefined } : undefined}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: t.bg }}>
                <Icone size={22} style={{ color: t.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{t.label}</span>
                  {!t.dispo && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Bientôt
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
              </div>
              {t.dispo && <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
