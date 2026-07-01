"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Loader2, Zap, Calendar, Send,
  ChevronRight, RefreshCw, AlertCircle, LogOut, Globe, Eye, EyeOff
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface Connecteur {
  type: string; nom: string; description: string; icone: string; couleur: string;
  statut: "actif" | "inactif"; configure: boolean; pageId?: string; igUserId?: string;
  nbOutils: number; oauthUrl?: string;
}

interface MetaPage {
  id: string; name: string; access_token: string; category: string;
  ig_account?: { id: string; username?: string; profile_picture_url?: string } | null;
}

interface MetaState {
  connected: boolean; user_name?: string; user_picture?: string;
  pages: MetaPage[]; waba_accounts: any[];
  selected_page_id?: string; selected_ig_id?: string;
}

interface Publication {
  id: string; plateforme: string; contenu: string; imageUrl?: string;
  planifieLe: string; publieLe?: string; statut: string; erreur?: string;
}

const ICONES_PLAT: Record<string, string> = {
  facebook: "📘", instagram: "📸", whatsapp: "📱", tiktok: "🎵", twitter: "🐦"
};

// ── Sélecteur de page Meta (modal) ──────────────────────────────────────────

function MetaPageSelector({ metaState, onSelect, onClose }: {
  metaState: MetaState;
  onSelect: () => void;
  onClose: () => void;
}) {
  const [selectedPageId, setSelectedPageId] = useState(metaState.selected_page_id ?? "");
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [saving, setSaving] = useState(false);

  const allPhones = metaState.waba_accounts.flatMap((w: any) =>
    w.whatsapp_business_accounts?.data?.flatMap((wba: any) => wba.phone_numbers?.data ?? []) ?? []
  );

  const confirmer = async () => {
    const page = metaState.pages.find(p => p.id === selectedPageId);
    if (!page) return;
    setSaving(true);

    await fetch("/api/mcp/oauth/meta/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_id: page.id,
        page_access_token: page.access_token,
        ig_user_id: page.ig_account?.id,
      }),
    });

    if (selectedPhoneId) {
      const phone = allPhones.find((p: any) => p.id === selectedPhoneId);
      if (phone) {
        await fetch("/api/mcp/oauth/meta/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number_id: phone.id, display_phone: phone.display_phone_number }),
        });
      }
    }

    setSaving(false);
    onSelect();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#1877F2] px-6 py-5 text-white">
          <h2 className="font-bold text-lg">Choisissez votre page Facebook</h2>
          <p className="text-blue-100 text-sm mt-0.5">Connecté en tant que {metaState.user_name}</p>
        </div>
        <div className="p-6 space-y-4">

          {/* Sélection de la page */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Page Facebook / Instagram
            </label>
            {metaState.pages.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Aucune page trouvée — assurez-vous d'être administrateur d'une page Facebook.
              </div>
            ) : (
              <div className="space-y-2">
                {metaState.pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 transition-all"
                    style={{ borderColor: selectedPageId === page.id ? "#1877F2" : "#e5e7eb", background: selectedPageId === page.id ? "#eff6ff" : "white" }}>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
                      📘
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{page.name}</p>
                      <p className="text-[11px] text-gray-400">{page.category}</p>
                      {page.ig_account?.username && (
                        <p className="text-[11px] text-[#E1306C] font-medium mt-0.5">
                          📸 @{page.ig_account.username}
                        </p>
                      )}
                    </div>
                    {selectedPageId === page.id && (
                      <CheckCircle2 size={18} className="text-[#1877F2] flex-shrink-0"/>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sélection WhatsApp (optionnel) */}
          {allPhones.length > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                Numéro WhatsApp Business (optionnel)
              </label>
              <div className="space-y-2">
                {allPhones.map((phone: any) => (
                  <button
                    key={phone.id}
                    onClick={() => setSelectedPhoneId(phone.id === selectedPhoneId ? "" : phone.id)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 transition-all"
                    style={{ borderColor: selectedPhoneId === phone.id ? "#25D366" : "#e5e7eb", background: selectedPhoneId === phone.id ? "#f0fdf4" : "white" }}>
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg flex-shrink-0">📱</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{phone.verified_name ?? "WhatsApp Business"}</p>
                      <p className="text-[11px] text-gray-400">{phone.display_phone_number}</p>
                    </div>
                    {selectedPhoneId === phone.id && <CheckCircle2 size={18} className="text-[#25D366] flex-shrink-0 ml-auto"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={confirmer}
              disabled={saving || !selectedPageId}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "#1877F2" }}>
              {saving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte connecteur ────────────────────────────────────────────────────────

function ConnecteurCard({
  conn, metaState, onRefresh
}: {
  conn: Connecteur;
  metaState: MetaState | null;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const deconnecter = async () => {
    if (!confirm(`Déconnecter ${conn.nom} ?`)) return;
    setLoading(true);
    await fetch("/api/mcp/connecteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: conn.type, statut: "inactif" }),
    });
    setLoading(false);
    onRefresh();
  };

  // ── État connecté ────────────────────────────────────────────────────────
  const ConnectedBadge = () => (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
      Connecté
    </span>
  );

  const InactiveBadge = () => (
    <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
      Non connecté
    </span>
  );

  // ── Meta (Facebook + Instagram) ──────────────────────────────────────────
  if (conn.type === "meta") {
    const isConnected = conn.statut === "actif" && !!conn.pageId;
    const page = metaState?.pages.find(p => p.id === conn.pageId);
    const hasIG = !!conn.igUserId;

    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-blue-50 border border-blue-100">📘</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Facebook & Instagram</h3>
                <div className="mt-0.5">{isConnected ? <ConnectedBadge/> : <InactiveBadge/>}</div>
              </div>
            </div>
            {isConnected && (
              <button onClick={deconnecter} disabled={loading} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
                <LogOut size={10}/> Déconnecter
              </button>
            )}
          </div>

          {/* Compte connecté */}
          {isConnected && metaState && (
            <div className="mb-3 space-y-2">
              {/* Page FB */}
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl">
                <span className="text-base">📘</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{page?.name ?? conn.pageId}</p>
                  <p className="text-[10px] text-gray-400">Page Facebook</p>
                </div>
                <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0"/>
              </div>
              {/* Instagram */}
              {hasIG && (
                <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-xl">
                  <span className="text-base">📸</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {page?.ig_account?.username ? `@${page.ig_account.username}` : "Instagram connecté"}
                    </p>
                    <p className="text-[10px] text-gray-400">Compte Instagram Business</p>
                  </div>
                  <CheckCircle2 size={14} className="text-[#E1306C] flex-shrink-0"/>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 mb-4">{conn.description}</p>

          {!isConnected ? (
            <a href="/api/mcp/oauth/meta"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#1877F2" }}>
              <span className="text-base">f</span>
              Se connecter avec Facebook
            </a>
          ) : (
            <a href="/api/mcp/oauth/meta"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-sm font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all">
              <RefreshCw size={13}/> Reconnecter / Changer de page
            </a>
          )}
        </div>
        <div className="px-5 pb-4 flex items-center gap-1.5 text-[10px] text-gray-400">
          <Zap size={10}/> {conn.nbOutils} actions disponibles
        </div>
      </div>
    );
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  if (conn.type === "whatsapp") {
    const isConnected = conn.statut === "actif";
    const waConfig = null; // géré via Meta OAuth

    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-green-50 border border-green-100">📱</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">WhatsApp Business</h3>
                <div className="mt-0.5">{isConnected ? <ConnectedBadge/> : <InactiveBadge/>}</div>
              </div>
            </div>
            {isConnected && (
              <button onClick={deconnecter} disabled={loading} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
                <LogOut size={10}/> Déconnecter
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-4">{conn.description}</p>

          {!isConnected ? (
            <div className="space-y-2">
              <a href="/api/mcp/oauth/meta"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "#25D366" }}>
                <span className="text-base">📱</span>
                Connecter WhatsApp Business
              </a>
              <p className="text-[10px] text-gray-400 text-center">
                Nécessite un compte WhatsApp Business lié à votre Facebook
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl">
              <span className="text-base">📱</span>
              <p className="text-xs text-green-700 font-medium">WhatsApp Business connecté via Meta</p>
              <CheckCircle2 size={14} className="text-green-500 ml-auto flex-shrink-0"/>
            </div>
          )}
        </div>
        <div className="px-5 pb-4 flex items-center gap-1.5 text-[10px] text-gray-400">
          <Zap size={10}/> {conn.nbOutils} actions disponibles
        </div>
      </div>
    );
  }

  // ── Gmail ─────────────────────────────────────────────────────────────────
  if (conn.type === "gmail") {
    const isConnected = conn.statut === "actif";
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-red-50 border border-red-100">📧</div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Gmail</h3>
                <div className="mt-0.5">{isConnected ? <ConnectedBadge/> : <InactiveBadge/>}</div>
              </div>
            </div>
            {isConnected && (
              <button onClick={deconnecter} disabled={loading} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
                <LogOut size={10}/> Déconnecter
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">{conn.description}</p>
          {!isConnected ? (
            <a href="/api/mcp/oauth/google"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-gray-700 text-sm font-bold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Se connecter avec Google
            </a>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <p className="text-xs text-green-700 font-medium">Gmail connecté</p>
              <CheckCircle2 size={14} className="text-green-500 ml-auto flex-shrink-0"/>
            </div>
          )}
        </div>
        <div className="px-5 pb-4 flex items-center gap-1.5 text-[10px] text-gray-400">
          <Zap size={10}/> {conn.nbOutils} actions disponibles
        </div>
      </div>
    );
  }

  // ── Higgsfield AI ────────────────────────────────────────────────────────
  if (conn.type === "higgsfield") {
    const isConnected = conn.statut === "actif";
    const [apiKey, setApiKey] = useState("");
    const [testLoading, setTestLoading] = useState(false);
    const [outils, setOutils] = useState<any[]>([]);
    const [showOutils, setShowOutils] = useState(false);

    const sauvegarder = async () => {
      if (!apiKey.trim()) return;
      setLoading(true);
      await fetch("/api/mcp/connecteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "higgsfield", accessToken: apiKey, statut: "actif" }),
      });
      setLoading(false);
      onRefresh();
    };

    const testerConnexion = async () => {
      setTestLoading(true);
      try {
        const res = await fetch("/api/mcp/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "higgsfield_lister_outils", args: {} }),
        });
        const data = await res.json();
        if (data.succes && data.donnees) {
          setOutils(data.donnees);
          setShowOutils(true);
        }
      } catch {}
      setTestLoading(false);
    };

    return (
      <div className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm" style={{ background: "linear-gradient(145deg, #fafaff, white)" }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                🎬
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">Higgsfield AI</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">MCP</span>
                </div>
                <div className="mt-0.5">{isConnected ? <ConnectedBadge/> : <InactiveBadge/>}</div>
              </div>
            </div>
            {isConnected && (
              <button onClick={deconnecter} disabled={loading} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
                <LogOut size={10}/> Déconnecter
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-4">{conn.description}</p>

          {/* Modèles disponibles */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["Kling 3.0", "Veo 3.1", "Sora 2", "Cinema 3.5", "GPT Image", "Recraft 4.1"].map(m => (
              <span key={m} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{m}</span>
            ))}
          </div>

          {!isConnected ? (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Clé API Higgsfield</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 font-mono"
              />
              <p className="text-[10px] text-gray-400">Trouvez votre clé sur <strong>higgsfield.ai/settings/api</strong></p>
              <button onClick={sauvegarder} disabled={loading || !apiKey.trim()}
                className="w-full py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {loading ? <Loader2 size={14} className="animate-spin"/> : "🎬"}
                Connecter Higgsfield AI
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, #6366f110, #8b5cf610)" }}>
                <span className="text-base">🎬</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-indigo-700">Higgsfield MCP connecté</p>
                  <p className="text-[10px] text-indigo-400">Génération vidéo + image disponible</p>
                </div>
                <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0"/>
              </div>
              <button onClick={testerConnexion} disabled={testLoading}
                className="w-full py-2 rounded-xl text-indigo-600 text-xs font-semibold border border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-1.5">
                {testLoading ? <Loader2 size={11} className="animate-spin"/> : "✨"}
                Voir les {conn.nbOutils} outils disponibles
              </button>
              {showOutils && outils.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                  {outils.map((o: any) => (
                    <div key={o.nom ?? o.name} className="text-[10px] text-gray-600">
                      <span className="font-semibold text-indigo-600">{o.nom ?? o.name}</span>
                      {o.description && <span className="text-gray-400"> — {o.description.slice(0, 60)}{o.description.length > 60 ? "…" : ""}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-5 pb-4 flex items-center gap-1.5 text-[10px] text-indigo-400">
          <Zap size={10}/> {conn.nbOutils} outils Axso · 40+ outils Higgsfield disponibles
        </div>
      </div>
    );
  }

  // ── Claude (Anthropic) ───────────────────────────────────────────────────────
  if (conn.type === "claude") {
    const isConnected = conn.statut === "actif";
    const [apiKey, setApiKey] = useState("");

    const sauvegarder = async () => {
      if (!apiKey.trim()) return;
      setLoading(true);
      await fetch("/api/mcp/connecteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "claude", config: { apiKey }, statut: "actif" }),
      });
      setLoading(false);
      onRefresh();
    };

    return (
      <div className="bg-white border border-violet-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">Claude (Anthropic)</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">MCP</span>
                </div>
                <div className="mt-0.5">{isConnected ? <ConnectedBadge/> : <InactiveBadge/>}</div>
              </div>
            </div>
            {isConnected && (
              <button onClick={deconnecter} disabled={loading} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
                <LogOut size={10}/> Déconnecter
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">{conn.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["Texte IA", "Emails HTML", "Descriptions", "Posts sociaux", "Traduction", "Vision"].map(f => (
              <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">{f}</span>
            ))}
          </div>
          {!isConnected ? (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Clé API Anthropic</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 font-mono"/>
              <p className="text-[10px] text-gray-400">Obtenez votre clé sur <strong>console.anthropic.com</strong></p>
              <button onClick={sauvegarder} disabled={loading || !apiKey.trim()}
                className="w-full py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                {loading ? <Loader2 size={14} className="animate-spin"/> : "🤖"}
                Connecter Claude
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed10, #a855f710)" }}>
              <span className="text-base">🤖</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-violet-700">Claude connecté</p>
                <p className="text-[10px] text-violet-400">Toutes les fonctionnalités IA débloquées</p>
              </div>
              <CheckCircle2 size={14} className="text-violet-500 flex-shrink-0"/>
            </div>
          )}
        </div>
        <div className="px-5 pb-4 flex items-center gap-1.5 text-[10px] text-violet-400">
          <Zap size={10}/> {conn.nbOutils} outils disponibles
        </div>
      </div>
    );
  }

  // ── SMS / Google Ads / TikTok — config manuelle ───────────────────────────
  const isConnected = conn.statut === "actif";
  const DETAILS: Record<string, { btn: string; note: string; color: string }> = {
    sms: { btn: "Activer SMS Africa's Talking", note: "Utilise AFRICASTALKING_USERNAME + AFRICASTALKING_KEY", color: "#FF6B35" },
    google_ads: { btn: "Activer Google Ads", note: "Utilise GOOGLE_ADS_* dans .env.local", color: "#4285F4" },
    tiktok: { btn: "Activer TikTok (bêta)", note: "TikTok for Business API — prochainement", color: "#010101" },
  };
  const d = DETAILS[conn.type] ?? { btn: "Activer", note: "", color: "#F5A623" };

  const activer = async () => {
    setLoading(true);
    await fetch("/api/mcp/connecteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: conn.type, statut: isConnected ? "inactif" : "actif" }),
    });
    setLoading(false);
    onRefresh();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: d.color + "18", border: `1px solid ${d.color}30` }}>
              {conn.icone}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{conn.nom}</h3>
              <div className="mt-0.5">{isConnected ? <ConnectedBadge/> : <InactiveBadge/>}</div>
            </div>
          </div>
          {isConnected && (
            <button onClick={activer} className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <LogOut size={10}/> Désactiver
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">{conn.description}</p>
        <p className="text-[10px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 mb-3 font-mono">{d.note}</p>
        {!isConnected && (
          <button onClick={activer} disabled={loading}
            className="w-full py-2.5 rounded-2xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: d.color }}>
            {loading ? <Loader2 size={13} className="animate-spin"/> : <Zap size={13}/>}
            {d.btn}
          </button>
        )}
      </div>
      <div className="px-5 pb-4 flex items-center gap-1.5 text-[10px] text-gray-400">
        <Zap size={10}/> {conn.nbOutils} actions disponibles
      </div>
    </div>
  );
}

// ── Carte config manuelle (paiements / email) ────────────────────────────────

interface ChampAPI { key: string; label: string; placeholder: string; secret?: boolean; aide?: string }

function CarteAPIManuelle({ type, emoji, label, description, couleur, champs, onSaved }: {
  type: string; emoji: string; label: string; description: string;
  couleur: string; champs: ChampAPI[]; onSaved?: () => void;
}) {
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<"inactif" | "actif" | null>(null);
  const [secrets, setSecrets] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/connecteurs")
      .then(r => r.json())
      .then(d => {
        const found = (d.connecteurs ?? []).find((c: any) => c.type === type);
        if (found) setStatut(found.statut);
      }).catch(() => {});
  }, [type]);

  const sauvegarder = async () => {
    setSaving(true);
    await fetch("/api/connecteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, config: valeurs }),
    });
    setSaving(false);
    setStatut("actif");
    setOpen(false);
    onSaved?.();
  };

  const deconnecter = async () => {
    await fetch(`/api/connecteurs?type=${type}`, { method: "DELETE" });
    setStatut("inactif");
    setValeurs({});
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${statut === "actif" ? "border-green-200" : "border-gray-100"}`}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: couleur + "18", border: `1px solid ${couleur}30` }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm">{label}</h3>
            {statut === "actif"
              ? <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/> Connecté</span>
              : <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">Non connecté</span>
            }
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statut === "actif" && (
            <button onClick={deconnecter} className="p-2 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all" title="Déconnecter">
              <LogOut size={13}/>
            </button>
          )}
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
            {open ? "Fermer" : statut === "actif" ? "Modifier" : "Configurer"}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
          {champs.map(c => (
            <div key={c.key}>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{c.label}</label>
              <div className="relative">
                <input
                  type={c.secret && !secrets[c.key] ? "password" : "text"}
                  value={valeurs[c.key] ?? ""}
                  onChange={e => setValeurs(v => ({ ...v, [c.key]: e.target.value }))}
                  placeholder={c.placeholder}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none pr-9 font-mono"
                />
                {c.secret && (
                  <button type="button" onClick={() => setSecrets(s => ({ ...s, [c.key]: !s[c.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    {secrets[c.key] ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                )}
              </div>
              {c.aide && <p className="text-[10px] text-gray-400 mt-1">{c.aide}</p>}
            </div>
          ))}
          <button onClick={sauvegarder} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${couleur}, ${couleur}cc)` }}>
            {saving ? <><Loader2 size={13} className="animate-spin"/> Sauvegarde…</> : <><CheckCircle2 size={13}/> Connecter</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Calendrier publications ──────────────────────────────────────────────────

function CalendrierPublications() {
  const [posts, setPosts] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPost, setNewPost] = useState({ plateforme: "instagram", contenu: "", imageUrl: "", planifieLe: "" });

  const charger = useCallback(() => {
    setLoading(true);
    fetch("/api/mcp/publications?statut=planifie")
      .then(r => r.json())
      .then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const planifier = async () => {
    if (!newPost.contenu || !newPost.planifieLe) return;
    setSaving(true);
    await fetch("/api/mcp/publications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPost, hashtags: [] }),
    });
    setSaving(false);
    setForm(false);
    setNewPost({ plateforme: "instagram", contenu: "", imageUrl: "", planifieLe: "" });
    charger();
  };

  const annuler = async (id: string) => {
    await fetch(`/api/mcp/publications?id=${id}`, { method: "DELETE" });
    charger();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#7c3aed]"/>
          <h3 className="font-bold text-gray-900">Calendrier éditorial</h3>
          <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{posts.length}</span>
        </div>
        <button onClick={() => setForm(!form)}
          className="text-xs text-[#7c3aed] font-semibold bg-purple-50 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-1">
          <Send size={11}/> Planifier
        </button>
      </div>

      {form && (
        <div className="border border-purple-200 bg-purple-50/40 rounded-2xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Plateforme</label>
              <select value={newPost.plateforme} onChange={e => setNewPost({ ...newPost, plateforme: e.target.value })}
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                {["facebook", "instagram", "whatsapp", "tiktok"].map(p => (
                  <option key={p} value={p}>{ICONES_PLAT[p]} {p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Date & heure</label>
              <input type="datetime-local" value={newPost.planifieLe} onChange={e => setNewPost({ ...newPost, planifieLe: e.target.value })}
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"/>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Contenu</label>
            <textarea value={newPost.contenu} onChange={e => setNewPost({ ...newPost, contenu: e.target.value })}
              rows={3} placeholder="Texte du post…"
              className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none resize-none"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">URL Image (optionnel)</label>
            <input value={newPost.imageUrl} onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })}
              placeholder="https://…"
              className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"/>
          </div>
          <button onClick={planifier} disabled={saving || !newPost.contenu || !newPost.planifieLe}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #F5A623)" }}>
            {saving ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
            Planifier
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-300"/></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-2xl">
          Aucune publication planifiée
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
              <span className="text-lg flex-shrink-0 mt-0.5">{ICONES_PLAT[post.plateforme] ?? "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 line-clamp-2">{post.contenu}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(post.planifieLe).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${post.statut === "publie" ? "bg-green-100 text-green-600" : post.statut === "echec" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {post.statut}
                </span>
                {post.statut === "planifie" && (
                  <button onClick={() => annuler(post.id)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function ConnecteursPage() {
  const [connecteurs, setConnecteurs] = useState<Connecteur[]>([]);
  const [metaState, setMetaState] = useState<MetaState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showMetaSelector, setShowMetaSelector] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    const [connsRes, metaRes] = await Promise.all([
      fetch("/api/mcp/connecteurs").then(r => r.json()).catch(() => []),
      fetch("/api/mcp/oauth/meta/pages").then(r => r.json()).catch(() => null),
    ]);
    setConnecteurs(Array.isArray(connsRes) ? connsRes : []);
    setMetaState(metaRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    charger();
    // Détecter le retour OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "meta") {
      setNotification({ type: "success", msg: "Facebook & Instagram connectés avec succès !" });
    } else if (params.get("success") === "gmail") {
      setNotification({ type: "success", msg: "Gmail connecté avec succès !" });
    } else if (params.get("selector") === "meta") {
      setShowMetaSelector(true);
    } else if (params.get("error")) {
      setNotification({ type: "error", msg: decodeURIComponent(params.get("error")!) });
    }
    // Nettoyer l'URL
    if (params.toString()) window.history.replaceState({}, "", window.location.pathname);
  }, [charger]);

  const actifs = connecteurs.filter(c => c.statut === "actif").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={20} className="text-[#7c3aed]"/>
            <h1 className="text-2xl font-bold text-gray-900">Connecteurs</h1>
          </div>
          <p className="text-sm text-gray-500">
            Connectez vos comptes — vos agents IA pourront publier, envoyer et gérer vos campagnes directement.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#7c3aed]">{actifs}</div>
          <div className="text-xs text-gray-400">actif{actifs !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 ${notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {notification.msg}
          </div>
          <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {connecteurs.map(conn => (
            <ConnecteurCard key={conn.type} conn={conn} metaState={metaState} onRefresh={charger}/>
          ))}
        </div>
      )}

      {/* ── Section Paiements & Email ── */}
      <div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Paiements & Email</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CarteAPIManuelle
            type="campay" emoji="📱" couleur="#FF6B35"
            label="Campay" description="Mobile Money Cameroun — MTN MoMo & Orange Money"
            champs={[
              { key: "username", label: "Username Campay", placeholder: "votre_username", aide: "Votre identifiant sur campay.net" },
              { key: "password", label: "Mot de passe", placeholder: "••••••••", secret: true },
              { key: "appHash",  label: "App Hash (Webhooks)", placeholder: "abc123…", secret: true, aide: "Hash fourni par Campay pour vérifier les webhooks" },
            ]}
          />
          <CarteAPIManuelle
            type="cinetpay" emoji="💳" couleur="#0066FF"
            label="CinetPay" description="Wave, Orange, MTN — Afrique de l'Ouest francophone"
            champs={[
              { key: "apiKey", label: "Clé API CinetPay", placeholder: "votre_api_key", secret: true, aide: "dashboard.cinetpay.com → Mon compte → API" },
              { key: "siteId", label: "Site ID", placeholder: "123456", aide: "Identifiant de votre site sur CinetPay" },
            ]}
          />
          <CarteAPIManuelle
            type="flutterwave" emoji="🦋" couleur="#F5A623"
            label="Flutterwave" description="Cartes bancaires & Mobile Money international"
            champs={[
              { key: "publicKey", label: "Clé publique", placeholder: "FLWPUBK-…", aide: "dashboard.flutterwave.com → Settings → API" },
              { key: "secretKey", label: "Clé secrète", placeholder: "FLWSECK-…", secret: true },
            ]}
          />
          <CarteAPIManuelle
            type="resend" emoji="✉️" couleur="#000000"
            label="Resend" description="Envoi d'emails transactionnels — alternative à Gmail"
            champs={[
              { key: "apiKey",    label: "Clé API Resend", placeholder: "re_…", secret: true, aide: "resend.com → API Keys → Create API Key" },
              { key: "emailFrom", label: "Email expéditeur", placeholder: "contact@votre-boutique.com", aide: "Domaine vérifié sur Resend" },
            ]}
          />
        </div>
      </div>

      {/* Calendrier */}
      <CalendrierPublications/>

      {/* Sélecteur de page Meta (modal) */}
      {showMetaSelector && metaState?.connected && (
        <MetaPageSelector
          metaState={metaState}
          onSelect={() => {
            setShowMetaSelector(false);
            setNotification({ type: "success", msg: "Page sélectionnée — Facebook & Instagram connectés !" });
            charger();
          }}
          onClose={() => setShowMetaSelector(false)}
        />
      )}

      {/* Explication */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-[#7c3aed]"/>
          <h3 className="font-bold text-gray-800 text-sm">Comment ça marche</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Une fois connectés, vos agents IA peuvent directement <strong>publier sur votre page Facebook</strong>,
          <strong> poster sur Instagram</strong>, <strong>envoyer des messages WhatsApp</strong> à vos clients,
          et <strong>lancer des campagnes Meta Ads</strong> — depuis AXIA ou n'importe quel agent.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {['📘 "Poste ce produit sur Facebook"', '📸 "Crée un post Instagram avec photo IA"', '📱 "Envoie un WhatsApp à mes VIPs"', '🎯 "Lance une campagne Meta Ads 5000 XAF/jour"'].map(ex => (
            <span key={ex} className="bg-white rounded-xl px-3 py-1.5 text-xs text-gray-600 shadow-sm border border-gray-100">{ex}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
