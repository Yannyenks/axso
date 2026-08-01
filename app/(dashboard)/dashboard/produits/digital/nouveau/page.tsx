"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, X, Loader2, BookOpen, Monitor, FileText, Music,
  Video, Package, Upload, Image as ImageIcon, Globe, Tag, Shield,
  Zap, Clock, Infinity, MessageSquare, ChevronDown, Check,
  Info, Download, Eye, Search, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

// ─── Types & Constants ───────────────────────────────────────────────────────

type TypeDigital = "ebook" | "cours" | "logiciel" | "template" | "audio" | "video" | "autre";
type TypeLicence = "personnel" | "commercial" | "commercial_etendu" | "abonnement";
type TypeLien = "instant" | "compte";
type ExpirationAcces = 7 | 30 | 90 | 365 | null;

const TYPES_DIGITAL: { id: TypeDigital; label: string; icon: any; desc: string; color: string; acceptedFiles: string }[] = [
  { id: "ebook",    label: "Ebook / PDF",  icon: BookOpen,  desc: "Livres numériques, guides PDF",         color: "#7c3aed", acceptedFiles: ".pdf,.epub,.mobi" },
  { id: "cours",    label: "Cours",        icon: Video,     desc: "Formations vidéo, cours en ligne",      color: "#0ea5e9", acceptedFiles: ".mp4,.mkv,.zip,.pdf" },
  { id: "logiciel", label: "Logiciel",     icon: Monitor,   desc: "Apps, scripts, outils digitaux",        color: "#16a34a", acceptedFiles: ".zip,.exe,.dmg,.pkg" },
  { id: "template", label: "Template",     icon: FileText,  desc: "Modèles, maquettes, fichiers design",   color: "#d97706", acceptedFiles: ".zip,.fig,.psd,.xd,.sketch" },
  { id: "audio",    label: "Audio",        icon: Music,     desc: "Musique, podcasts, sons, samples",      color: "#db2777", acceptedFiles: ".mp3,.wav,.ogg,.flac,.aac" },
  { id: "video",    label: "Vidéo",        icon: Video,     desc: "Films, masterclasses, tutoriels",       color: "#dc2626", acceptedFiles: ".mp4,.mov,.avi,.mkv,.zip" },
  { id: "autre",    label: "Autre",        icon: Package,   desc: "Tout autre contenu digital",            color: "#6b7280", acceptedFiles: "*" },
];

const TYPES_LICENCE: { id: TypeLicence; label: string; desc: string }[] = [
  { id: "personnel",         label: "Usage personnel",          desc: "Pour l'acheteur uniquement, non commercial" },
  { id: "commercial",        label: "Licence commerciale",      desc: "Utilisation commerciale autorisée" },
  { id: "commercial_etendu", label: "Commerciale étendue",      desc: "Revente et redistribution incluses" },
  { id: "abonnement",        label: "Abonnement",               desc: "Accès récurrent, renouvellement requis" },
];

const EXPIRATIONS: { value: ExpirationAcces; label: string }[] = [
  { value: null, label: "Jamais — accès permanent" },
  { value: 7,    label: "7 jours après l'achat" },
  { value: 30,   label: "30 jours après l'achat" },
  { value: 90,   label: "90 jours après l'achat" },
  { value: 365,  label: "1 an après l'achat" },
];

const CATEGORIES_DIGITAL = [
  "Business & Marketing", "Développement web", "Design graphique",
  "Développement personnel", "Finance & Investissement", "Santé & Bien-être",
  "Photographie & Vidéo", "Musique & Audio", "Langues & Communication",
  "Cuisine & Gastronomie", "Mode & Beauté", "Éducation & Formation", "Autre",
];

function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
}

// ─── Form State ──────────────────────────────────────────────────────────────

type FormState = {
  // Infos de base
  nom: string;
  slug: string;
  description: string;
  prix: string;
  prixCompare: string;
  categorie: string;
  tags: string[];
  images: string[];
  actif: boolean;
  metaTitle: string;
  metaDesc: string;
  // Fichiers
  fichierUrl: string;
  fichierNom: string;
  fichierTaille: number;
  previewUrl: string;
  // Paramètres digitaux
  typeDigital: TypeDigital;
  limiteTelechargement: string; // "" = illimité
  expirationAcces: ExpirationAcces;
  typeLienTelechargement: TypeLien;
  typeLicence: TypeLicence;
  filigrane: boolean;
  liensUniques: boolean;
  // Après achat
  produitUpsellId: string;
  messagePostAchat: string;
  instructions: string;
};

const INITIAL: FormState = {
  nom: "", slug: "", description: "", prix: "", prixCompare: "",
  categorie: "", tags: [], images: [], actif: true,
  metaTitle: "", metaDesc: "",
  fichierUrl: "", fichierNom: "", fichierTaille: 0,
  previewUrl: "",
  typeDigital: "ebook",
  limiteTelechargement: "",
  expirationAcces: null,
  typeLienTelechargement: "instant",
  typeLicence: "personnel",
  filigrane: false,
  liensUniques: true,
  produitUpsellId: "",
  messagePostAchat: "",
  instructions: "",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? "w-9" : "w-11";
  const h = size === "sm" ? "h-5" : "h-6";
  const dot = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const on = size === "sm" ? "left-4" : "left-5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${w} ${h} rounded-full transition-all relative flex-shrink-0 ${
        checked ? "bg-[#111111]" : "bg-[#E8E8E8]"
      }`}
    >
      <div
        className={`absolute top-0.5 ${dot} bg-white rounded-full shadow transition-all ${
          checked ? on : "left-0.5"
        }`}
      />
    </button>
  );
}

function SectionCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: any;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconColor + "15" }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="font-semibold text-[#111111] text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-[#AAAAAA] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NouveauProduitDigitalPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [upsellSearch, setUpsellSearch] = useState("");
  const [upsellOptions, setUpsellOptions] = useState<{ id: string; nom: string }[]>([]);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nom") next.slug = slugify(value as string);
      return next;
    });
  }

  // Load upsell products
  useEffect(() => {
    fetch("/api/produits?limit=50")
      .then((r) => r.json())
      .then((d) => setUpsellOptions(d.produits?.map((p: any) => ({ id: p.id, nom: p.nom })) ?? []))
      .catch(() => {});
  }, []);

  const filteredUpsell = upsellOptions.filter(
    (p) =>
      p.nom.toLowerCase().includes(upsellSearch.toLowerCase()) &&
      p.id !== form.produitUpsellId
  );

  // ─── Upload handlers ─────────────────────────────────────────────────────

  async function uploadFile(
    file: File,
    type: "fichier" | "thumb" | "preview"
  ) {
    const setLoading =
      type === "fichier" ? setUploadingFile
      : type === "thumb" ? setUploadingThumb
      : setUploadingPreview;

    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur upload");

      if (type === "fichier") {
        set("fichierUrl", data.url);
        set("fichierNom", file.name);
        set("fichierTaille", file.size);
        toast.success("Fichier uploadé avec succès");
      } else if (type === "thumb") {
        set("images", [...form.images, data.url]);
        toast.success("Miniature uploadée");
      } else {
        set("previewUrl", data.url);
        toast.success("Aperçu uploadé");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, "fichier");
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function sauvegarder() {
    if (!form.nom.trim()) { toast.error("Le nom du produit est obligatoire"); return; }
    if (!form.prix || isNaN(parseFloat(form.prix))) { toast.error("Le prix est obligatoire"); return; }
    if (!form.fichierUrl) { toast.error("Uploadez le fichier digital avant de créer le produit"); return; }

    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        slug: form.slug || slugify(form.nom),
        description: form.description || undefined,
        prix: parseFloat(form.prix),
        prixCompare: form.prixCompare ? parseFloat(form.prixCompare) : undefined,
        categorie: form.categorie || undefined,
        tags: form.tags,
        images: form.images,
        actif: form.actif,
        metaTitle: form.metaTitle || undefined,
        metaDesc: form.metaDesc || undefined,
        fichierUrl: form.fichierUrl,
        fichierNom: form.fichierNom,
        fichierTaille: form.fichierTaille || undefined,
        // Digital metadata
        typeDigital: form.typeDigital,
        limiteTelechargement: form.limiteTelechargement
          ? parseInt(form.limiteTelechargement)
          : null,
        expirationAcces: form.expirationAcces,
        typeLienTelechargement: form.typeLienTelechargement,
        typeLicence: form.typeLicence,
        filigrane: form.filigrane,
        liensUniques: form.liensUniques,
        produitUpsellId: form.produitUpsellId || null,
        messagePostAchat: form.messagePostAchat,
        instructions: form.instructions,
        previewUrl: form.previewUrl || null,
      };

      const res = await fetch("/api/produits-digitaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de création");

      toast.success("Produit digital créé !");
      router.push("/dashboard/produits/digital");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const typeInfo = TYPES_DIGITAL.find((t) => t.id === form.typeDigital)!;
  const TypeIcon = typeInfo.icon;
  const selectedLicence = TYPES_LICENCE.find((l) => l.id === form.typeLicence)!;
  const selectedExpiration = EXPIRATIONS.find((e) => e.value === form.expirationAcces)!;

  const inputClass =
    "w-full bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#111111] text-sm focus:outline-none focus:border-[#AAAAAA] placeholder:text-[#AAAAAA] transition-colors";

  return (
    <div className="max-w-5xl space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/produits/digital"
            className="w-9 h-9 rounded-xl bg-white border border-[#E8E8E8] flex items-center justify-center text-[#AAAAAA] hover:text-[#111111] hover:border-[#D0D0D0] transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#111111] font-poppins">
              Nouveau produit digital
            </h1>
            <p className="text-[#AAAAAA] text-xs">
              Ebook, cours, logiciel, template, audio, vidéo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set("actif", !form.actif)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              form.actif
                ? "bg-[#ECFDF5] border-[#BBF7D0] text-[#16A34A]"
                : "bg-white border-[#E8E8E8] text-[#AAAAAA]"
            }`}
          >
            {form.actif ? "Actif" : "Brouillon"}
          </button>
          <button
            type="button"
            onClick={sauvegarder}
            disabled={saving}
            className="flex items-center gap-2 bg-[#111111] text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#333333] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer le produit
          </button>
        </div>
      </div>

      {/* ── Type selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {TYPES_DIGITAL.map((t) => {
          const Icon = t.icon;
          const active = form.typeDigital === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => set("typeDigital", t.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all"
              style={{
                borderColor: active ? t.color + "60" : "#E8E8E8",
                background: active ? t.color + "08" : "white",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: t.color + "15" }}
              >
                <Icon size={16} style={{ color: t.color }} />
              </div>
              <span
                className="text-xs font-semibold leading-tight"
                style={{ color: active ? t.color : "#666666" }}
              >
                {t.label}
              </span>
              {active && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: t.color }}
                >
                  <Check size={9} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Infos générales */}
          <SectionCard icon={Package} iconColor="#F5A623" title="Informations du produit">
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">
                Nom du produit <span className="text-[#DC2626]">*</span>
              </label>
              <input
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                placeholder={`Ex: Guide Complet du Marketing Digital Africain`}
                maxLength={120}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">Slug URL</label>
              <div className="flex items-center bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-4 py-3">
                <span className="text-[#AAAAAA] text-xs shrink-0">/produits/</span>
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className="bg-transparent text-sm text-[#666666] outline-none flex-1 min-w-0"
                />
              </div>
            </div>
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Décrivez votre produit digital — ce que le client va apprendre ou obtenir..."
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#AAAAAA] text-xs block mb-1.5">
                  Prix de vente <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  value={form.prix}
                  onChange={(e) => set("prix", e.target.value)}
                  placeholder="5000"
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[#AAAAAA] text-xs block mb-1.5">Prix barré (optionnel)</label>
                <input
                  type="number"
                  value={form.prixCompare}
                  onChange={(e) => set("prixCompare", e.target.value)}
                  placeholder="10000"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
            {form.prix && form.prixCompare && parseFloat(form.prixCompare) > parseFloat(form.prix) && (
              <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#BBF7D0] rounded-xl px-4 py-2.5 text-[#16A34A] text-xs">
                <Check size={13} />
                Remise de{" "}
                {Math.round(
                  (1 - parseFloat(form.prix) / parseFloat(form.prixCompare)) * 100
                )}
                % affichée sur la boutique
              </div>
            )}
          </SectionCard>

          {/* Fichier principal */}
          <SectionCard
            icon={Download}
            iconColor={typeInfo.color}
            title="Fichier digital"
            subtitle={`Format accepté : ${typeInfo.acceptedFiles}`}
          >
            {!form.fichierUrl ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-[#7c3aed] bg-[#f5f3ff]"
                    : "border-[#E8E8E8] hover:border-[#D0D0D0] hover:bg-[#F5F5F5]"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {uploadingFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
                    <p className="text-sm text-[#666666]">Upload en cours…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: typeInfo.color + "15" }}
                    >
                      <Upload size={24} style={{ color: typeInfo.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111111]">
                        Glissez votre fichier ici ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-[#AAAAAA] mt-1">
                        {typeInfo.acceptedFiles} — max 200 Mo
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept={typeInfo.acceptedFiles}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "fichier")}
                />
              </div>
            ) : (
              <div
                className="flex items-center gap-3 rounded-xl p-4 border"
                style={{ background: typeInfo.color + "08", borderColor: typeInfo.color + "30" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: typeInfo.color + "20" }}
                >
                  <TypeIcon size={18} style={{ color: typeInfo.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] truncate">{form.fichierNom}</p>
                  <p className="text-xs text-[#AAAAAA]">
                    {formatTaille(form.fichierTaille)} · Prêt à la livraison
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { set("fichierUrl", ""); set("fichierNom", ""); set("fichierTaille", 0); }}
                  className="text-[#AAAAAA] hover:text-[#DC2626] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Instructions de téléchargement */}
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">
                Instructions pour le client (optionnel)
              </label>
              <textarea
                value={form.instructions}
                onChange={(e) => set("instructions", e.target.value)}
                rows={3}
                placeholder="Ex: Ouvrez le fichier avec Adobe Acrobat Reader. Mot de passe : AXSO2025"
                className={`${inputClass} resize-none`}
              />
            </div>
          </SectionCard>

          {/* Miniature & Aperçu */}
          <SectionCard
            icon={ImageIcon}
            iconColor="#F5A623"
            title="Miniature & Aperçu"
            subtitle="Visuels qui s'affichent sur votre boutique"
          >
            {/* Miniature */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#666666] text-xs font-medium">
                  Image de couverture (miniature)
                </label>
                <button
                  type="button"
                  onClick={() => thumbRef.current?.click()}
                  disabled={uploadingThumb}
                  className="flex items-center gap-1.5 text-xs bg-[#F5F5F5] border border-[#E8E8E8] text-[#666666] px-3 py-1.5 rounded-lg hover:border-[#D0D0D0] transition-all disabled:opacity-50"
                >
                  {uploadingThumb ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                  Upload
                </button>
                <input
                  ref={thumbRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "thumb")}
                />
              </div>
              {form.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-[#F5F5F5] border border-[#E8E8E8]">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 bg-[#F5A623] text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                          Principale
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-[#DC2626] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={9} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => thumbRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#E8E8E8] flex items-center justify-center text-[#AAAAAA] hover:border-[#D0D0D0] transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-[#E8E8E8] rounded-xl p-6 text-center cursor-pointer hover:border-[#D0D0D0] transition-colors"
                  onClick={() => thumbRef.current?.click()}
                >
                  <ImageIcon size={24} className="text-[#AAAAAA] mx-auto mb-2" />
                  <p className="text-xs text-[#AAAAAA]">Cliquez pour ajouter une miniature</p>
                </div>
              )}
            </div>

            {/* Aperçu gratuit */}
            <div className="pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-[#666666] text-xs font-medium">Fichier aperçu / extrait</label>
                  <p className="text-[10px] text-[#AAAAAA] mt-0.5">
                    Sample gratuit visible avant l'achat (optionnel)
                  </p>
                </div>
                {!form.previewUrl ? (
                  <button
                    type="button"
                    onClick={() => previewRef.current?.click()}
                    disabled={uploadingPreview}
                    className="flex items-center gap-1.5 text-xs bg-[#F5F5F5] border border-[#E8E8E8] text-[#666666] px-3 py-1.5 rounded-lg hover:border-[#D0D0D0] transition-all disabled:opacity-50"
                  >
                    {uploadingPreview ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
                    Upload aperçu
                  </button>
                ) : null}
                <input
                  ref={previewRef}
                  type="file"
                  className="hidden"
                  accept={typeInfo.acceptedFiles}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "preview")}
                />
              </div>
              {form.previewUrl && (
                <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-xl p-3">
                  <Eye size={14} className="text-[#AAAAAA]" />
                  <p className="text-xs text-[#666666] flex-1 truncate">Aperçu uploadé</p>
                  <button
                    type="button"
                    onClick={() => set("previewUrl", "")}
                    className="text-[#AAAAAA] hover:text-[#DC2626]"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Paramètres de livraison */}
          <SectionCard
            icon={Zap}
            iconColor="#0ea5e9"
            title="Paramètres de livraison"
            subtitle="Comment et combien de fois le client peut accéder au fichier"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Limite de téléchargements */}
              <div>
                <label className="text-[#AAAAAA] text-xs block mb-1.5">
                  Limite de téléchargements
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.limiteTelechargement}
                    onChange={(e) => set("limiteTelechargement", e.target.value)}
                    placeholder="Illimité"
                    min="1"
                    max="100"
                    className={inputClass}
                  />
                  {!form.limiteTelechargement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Infinity size={14} className="text-[#AAAAAA]" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#AAAAAA] mt-1">
                  Laissez vide pour illimité
                </p>
              </div>

              {/* Type de lien */}
              <div>
                <label className="text-[#AAAAAA] text-xs block mb-1.5">
                  Type de lien de téléchargement
                </label>
                <div className="relative">
                  <select
                    value={form.typeLienTelechargement}
                    onChange={(e) => set("typeLienTelechargement", e.target.value as TypeLien)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="instant">Instantané (sans compte)</option>
                    <option value="compte">Nécessite un compte client</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expiration de l'accès */}
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-2">Expiration de l'accès</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPIRATIONS.map((e) => (
                  <button
                    key={String(e.value)}
                    type="button"
                    onClick={() => set("expirationAcces", e.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      form.expirationAcces === e.value
                        ? "border-[#111111] bg-[#111111]/5 text-[#111111]"
                        : "border-[#E8E8E8] bg-white text-[#666666] hover:border-[#D0D0D0]"
                    }`}
                  >
                    {e.value === null ? (
                      <Infinity size={12} className="flex-shrink-0" />
                    ) : (
                      <Clock size={12} className="flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium leading-tight">{e.label}</span>
                    {form.expirationAcces === e.value && (
                      <Check size={11} className="ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-4 py-3 text-[#0369a1] text-xs">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                Le lien de téléchargement est envoyé automatiquement par email dès que le paiement est confirmé.
              </span>
            </div>
          </SectionCard>

          {/* Licence */}
          <SectionCard
            icon={Shield}
            iconColor="#16a34a"
            title="Type de licence"
            subtitle="Droits accordés à l'acheteur"
          >
            <div className="grid grid-cols-2 gap-3">
              {TYPES_LICENCE.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => set("typeLicence", l.id)}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                    form.typeLicence === l.id
                      ? "border-[#16a34a]/40 bg-[#f0fdf4]"
                      : "border-[#E8E8E8] bg-white hover:border-[#D0D0D0]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-[#111111]">{l.label}</span>
                    {form.typeLicence === l.id && (
                      <Check size={12} className="text-[#16a34a]" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#AAAAAA] leading-tight">{l.desc}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Protection */}
          <SectionCard
            icon={Shield}
            iconColor="#d97706"
            title="Protection anti-piratage"
            subtitle="Mesures pour protéger votre contenu"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111111]">Liens uniques par client</p>
                  <p className="text-xs text-[#AAAAAA] mt-0.5">
                    Chaque acheteur reçoit un lien personnel non partageable
                  </p>
                </div>
                <Toggle checked={form.liensUniques} onChange={(v) => set("liensUniques", v)} />
              </div>
              <div className="h-px bg-[#F0F0F0]" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111111]">Filigrane PDF</p>
                  <p className="text-xs text-[#AAAAAA] mt-0.5">
                    Ajouter l'email du client en filigrane sur les PDFs
                  </p>
                </div>
                <Toggle checked={form.filigrane} onChange={(v) => set("filigrane", v)} />
              </div>
            </div>
          </SectionCard>

          {/* Post-achat */}
          <SectionCard
            icon={MessageSquare}
            iconColor="#7c3aed"
            title="Après l'achat"
            subtitle="Message et offre complémentaire envoyés avec le lien de téléchargement"
          >
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">Message de remerciement</label>
              <textarea
                value={form.messagePostAchat}
                onChange={(e) => set("messagePostAchat", e.target.value)}
                rows={3}
                placeholder="Ex: Merci pour votre achat ! Rejoignez notre communauté WhatsApp pour des bonus exclusifs : wa.me/..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Upsell product */}
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">
                Produit à proposer en upsell (optionnel)
              </label>
              <div className="relative">
                <div
                  className={`flex items-center gap-2 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-4 py-3 cursor-pointer hover:border-[#D0D0D0] transition-colors`}
                  onClick={() => setUpsellOpen((v) => !v)}
                >
                  <ShoppingBag size={14} className="text-[#AAAAAA] flex-shrink-0" />
                  <span className="text-sm flex-1 min-w-0 truncate text-[#666666]">
                    {form.produitUpsellId
                      ? upsellOptions.find((p) => p.id === form.produitUpsellId)?.nom ?? "Produit sélectionné"
                      : "Sélectionner un produit..."}
                  </span>
                  {form.produitUpsellId ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set("produitUpsellId", ""); }}
                      className="text-[#AAAAAA] hover:text-[#666666]"
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <ChevronDown size={13} className="text-[#AAAAAA]" />
                  )}
                </div>

                {upsellOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUpsellOpen(false)}
                    />
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#E8E8E8] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
                      <div className="px-3 py-2 border-b border-[#F0F0F0]">
                        <div className="flex items-center gap-2">
                          <Search size={12} className="text-[#AAAAAA]" />
                          <input
                            autoFocus
                            value={upsellSearch}
                            onChange={(e) => setUpsellSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="text-xs flex-1 outline-none text-[#111111] placeholder:text-[#AAAAAA]"
                          />
                        </div>
                      </div>
                      {filteredUpsell.length === 0 ? (
                        <p className="text-xs text-[#AAAAAA] text-center py-4">Aucun produit trouvé</p>
                      ) : (
                        filteredUpsell.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              set("produitUpsellId", p.id);
                              setUpsellOpen(false);
                              setUpsellSearch("");
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#666666] hover:bg-[#F5F5F5] hover:text-[#111111] text-left transition-colors"
                          >
                            <ShoppingBag size={12} className="flex-shrink-0" />
                            {p.nom}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] text-[#AAAAAA] mt-1">
                Ce produit sera suggéré à l'acheteur dans l'email de confirmation
              </p>
            </div>
          </SectionCard>

          {/* SEO */}
          <SectionCard
            icon={Globe}
            iconColor="#0ea5e9"
            title="SEO"
            subtitle="Optimisez votre référencement sur Google"
          >
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">
                Titre méta
                <span className="ml-2 text-[#AAAAAA]">
                  ({form.metaTitle.length}/60)
                </span>
              </label>
              <input
                value={form.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
                placeholder="Titre affiché sur Google..."
                maxLength={60}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">
                Description méta
                <span className="ml-2 text-[#AAAAAA]">
                  ({form.metaDesc.length}/155)
                </span>
              </label>
              <textarea
                value={form.metaDesc}
                onChange={(e) => set("metaDesc", e.target.value)}
                rows={2}
                placeholder="Description courte pour les moteurs de recherche..."
                maxLength={155}
                className={`${inputClass} resize-none`}
              />
            </div>
          </SectionCard>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">
          {/* Catégorie */}
          <SectionCard icon={Tag} iconColor="#F5A623" title="Catégorie & Tags">
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">Catégorie</label>
              <div className="relative">
                <select
                  value={form.categorie}
                  onChange={(e) => set("categorie", e.target.value)}
                  className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="">Sélectionner...</option>
                  {CATEGORIES_DIGITAL.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[#AAAAAA] text-xs block mb-1.5">Tags</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = tagInput.trim().toLowerCase();
                      if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
                      setTagInput("");
                    }
                  }}
                  placeholder="Ajouter un tag..."
                  className="flex-1 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl px-3 py-2.5 text-[#111111] text-xs focus:outline-none focus:border-[#AAAAAA] placeholder:text-[#AAAAAA]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = tagInput.trim().toLowerCase();
                    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
                    setTagInput("");
                  }}
                  className="px-3 py-2.5 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-[#AAAAAA] hover:text-[#666666] text-xs"
                >
                  +
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 bg-[#F5F5F5] border border-[#E8E8E8] text-[#666666] text-[10px] px-2 py-0.5 rounded-lg"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Statut */}
          <SectionCard icon={Check} iconColor="#16a34a" title="Statut">
            <div className="space-y-3">
              {[
                {
                  key: "actif" as const,
                  label: "Produit actif",
                  desc: "Visible et achetable sur la boutique",
                },
              ].map((opt) => (
                <div key={opt.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#111111]">{opt.label}</p>
                    <p className="text-xs text-[#AAAAAA] mt-0.5">{opt.desc}</p>
                  </div>
                  <Toggle
                    checked={form[opt.key] as boolean}
                    onChange={(v) => set(opt.key, v)}
                  />
                </div>
              ))}
              {!form.actif && (
                <div className="flex items-start gap-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-3 py-2.5 text-[#D97706] text-xs">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  Ce produit sera sauvegardé en brouillon et ne sera pas visible.
                </div>
              )}
            </div>
          </SectionCard>

          {/* Aperçu carte */}
          {(form.nom || form.images[0]) && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
              <p className="text-[#AAAAAA] text-xs px-4 pt-3 pb-2 flex items-center gap-1.5">
                <Eye size={11} /> Aperçu boutique
              </p>
              <div
                className="aspect-video overflow-hidden flex items-center justify-center"
                style={{ background: typeInfo.color + "10" }}
              >
                {form.images[0] ? (
                  <img
                    src={form.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TypeIcon size={40} style={{ color: typeInfo.color }} />
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-[#111111] text-sm line-clamp-2">
                  {form.nom || "Nom du produit"}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {form.prix && (
                    <span className="text-[#F5A623] font-bold text-sm">{form.prix} FCFA</span>
                  )}
                  {form.prixCompare && (
                    <span className="text-[#AAAAAA] text-xs line-through">{form.prixCompare}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: typeInfo.color, background: typeInfo.color + "15" }}
                  >
                    <TypeIcon size={9} /> {typeInfo.label}
                  </span>
                  {form.typeLicence && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#666666]">
                      <Shield size={8} className="inline mr-0.5" />
                      {TYPES_LICENCE.find((l) => l.id === form.typeLicence)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[#666666]">Récapitulatif de livraison</p>
            <div className="space-y-2 text-xs">
              {[
                {
                  label: "Type",
                  value: typeInfo.label,
                  icon: <TypeIcon size={11} style={{ color: typeInfo.color }} />,
                },
                {
                  label: "Limite DL",
                  value: form.limiteTelechargement ? `${form.limiteTelechargement}x` : "Illimité",
                  icon: <Download size={11} className="text-[#AAAAAA]" />,
                },
                {
                  label: "Expiration",
                  value: selectedExpiration.value
                    ? `${selectedExpiration.value}j`
                    : "Jamais",
                  icon: <Clock size={11} className="text-[#AAAAAA]" />,
                },
                {
                  label: "Licence",
                  value: selectedLicence.label,
                  icon: <Shield size={11} className="text-[#AAAAAA]" />,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[#AAAAAA]">
                    {row.icon}
                    {row.label}
                  </div>
                  <span className="text-[#111111] font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Create CTA sticky */}
          <button
            type="button"
            onClick={sauvegarder}
            disabled={saving || !form.nom || !form.prix || !form.fichierUrl}
            className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-semibold px-5 py-3 rounded-xl text-sm hover:bg-[#333333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            {saving ? "Création en cours…" : "Créer le produit digital"}
          </button>

          {(!form.nom || !form.prix || !form.fichierUrl) && (
            <p className="text-[10px] text-[#AAAAAA] text-center -mt-2">
              {!form.nom
                ? "Entrez un nom"
                : !form.prix
                ? "Entrez un prix"
                : "Uploadez le fichier digital"}
              {" "}pour continuer
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
