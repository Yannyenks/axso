"use client";
import { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  hint?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "banner";
}

export function ImageUpload({ value, onChange, onRemove, label, hint, className = "", aspectRatio = "square" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const aspectClass = {
    square: "aspect-square",
    wide: "aspect-video",
    banner: "aspect-[3/1]",
  }[aspectRatio];

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 MB)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.status === 503 && data.error === "blob_not_configured") {
        // Fallback : convertir en base64 data URL (stockée en DB)
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => { onChange(reader.result as string); resolve(); };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return;
      }
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
    } catch (err: any) {
      toast.error(err.message || "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(files: FileList | null) {
    if (files?.[0]) upload(files[0]);
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-gray-400 text-xs block">{label}</label>}
      <div
        className={`relative ${aspectClass} rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragging ? "border-[#1B4FD8] bg-[#1B4FD8]/5" : "border-[#222] bg-[#0d0d0d] hover:border-[#1B4FD8]/40"
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files); }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {onRemove && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onRemove(); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <X size={12} className="text-white" />
              </button>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-lg">Changer</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {uploading ? (
              <Loader2 size={24} className="text-[#1B4FD8] animate-spin" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 flex items-center justify-center">
                  <Upload size={18} className="text-[#1B4FD8]" />
                </div>
                <p className="text-gray-400 text-xs text-center">Cliquer ou glisser une image</p>
                <p className="text-gray-600 text-[10px]">JPEG, PNG, WebP — max 5 MB</p>
              </>
            )}
          </div>
        )}
        {uploading && value && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={24} className="text-[#1B4FD8] animate-spin" />
          </div>
        )}
      </div>
      {hint && <p className="text-gray-600 text-[10px]">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => handleFile(e.target.files)}
      />
    </div>
  );
}
