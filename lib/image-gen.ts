// Génération d'images produits — fal.ai FLUX.1-dev (ultra HD) ou Pollinations flux-pro (gratuit)
// SDK : @fal-ai/client (installé) | Fallback : Pollinations (aucune clé requise)

import { fal } from "@fal-ai/client";

export interface ImageGenOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}

// fal.ai FLUX.1-dev — qualité maximale, ~5-10s par image
async function generateViaFal(prompt: string): Promise<string | null> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) return null;

  try {
    fal.config({ credentials: falKey });

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "square_hd",      // 1024×1024
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
      },
    });

    const url = (result.data as any)?.images?.[0]?.url;
    return url ?? null;
  } catch (err) {
    console.error("[image-gen/fal]", err);
    return null;
  }
}

// Pollinations flux-pro — gratuit, URL construite (image chargée par le navigateur)
export function pollinationsUrl(prompt: string, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux-pro&enhance=true&seed=${s}`;
}

// Génère une image — FLUX.1-dev via fal.ai si FAL_KEY disponible, sinon Pollinations
export async function generateProductImage(opts: ImageGenOptions): Promise<string> {
  const falUrl = await generateViaFal(opts.prompt);
  if (falUrl) return falUrl;
  return pollinationsUrl(opts.prompt, opts.seed);
}

// Version instantanée (URL uniquement, pas d'appel API) — pour imports en masse
export function generateProductImageUrl(prompt: string, seed?: number): string {
  return pollinationsUrl(prompt, seed);
}

// Construit le prompt d'image optimisé pour FLUX.1-dev
export function buildProductImagePrompt(nom: string, categorie: string, style = "product_white"): string {
  const styleMap: Record<string, string> = {
    product_white: "professional product photography, pure white background, studio lighting, e-commerce, sharp details, 8K quality",
    product_lifestyle: "lifestyle product photography, African context, natural lighting, warm atmosphere, premium quality",
    social_media: "Instagram post visual, vibrant colors, African aesthetic, eye-catching, high quality",
    banner: "wide marketing banner, professional design, African colors, premium brand look",
  };
  return `${nom}, ${categorie}, ${styleMap[style] ?? styleMap.product_white}`;
}
