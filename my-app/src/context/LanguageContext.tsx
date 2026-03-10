import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "fr" | "en" | "de" | "it" | "ja";

type TranslationParams = Record<string, string | number>;

const translations: Record<Language, Record<string, string>> = {
  fr: {
    "brand.name": "Altcore Meme Studio",
    "brand.tagline": "Crée, personnalise et télécharge en un clic",
    "navbar.trending": "100+ memes tendance",
    "navbar.drag": "Texte glisser-déposer",
    "navbar.home": "Accueil",
    "navbar.creator": "Créateur de memes",
    "navbar.templates": "Galerie templates",
    "navbar.editor": "Éditeur d’images",
    "navbar.profile": "Profil",
    "navbar.language": "Langue",
    "navbar.theme": "Thème",
    "theme.light": "Clair",
    "theme.dark": "Sombre",
    "landing.kicker": "Bienvenue",
    "landing.title": "Choisis ton espace de création",
    "landing.subtitle":
      "Sélectionne le module qui correspond à ton besoin : création de meme ou édition d’image.",
    "landing.creator.title": "Créateur de memes",
    "landing.creator.description":
      "Génère un meme tendance, ajoute du texte, des stickers et télécharge le résultat.",
    "landing.creator.cta": "Ouvrir le créateur",
    "landing.editor.title": "Éditeur d’images",
    "landing.editor.description":
      "Prépare tes visuels avec des réglages et des formats prêts pour les réseaux.",
    "landing.editor.cta": "Ouvrir l’éditeur",
    "footer.copyright": "© 2026 Altcore Meme Studio",
    "footer.credit": "Conçu par Neku",
    "footer.follow": "Suivez-nous",
    "social.instagram": "Instagram",
    "social.tiktok": "TikTok",
    "social.x": "X",
    "social.youtube": "YouTube",
    "imageEditor.kicker": "Éditeur d'images",
    "imageEditor.title": "Prépare ton visuel dans Altcore Meme Studio",
    "imageEditor.description":
      "Ajuste les réglages, pivote ou retourne l'image puis exporte en PNG.",
    "imageEditor.reset": "Réinitialiser",
    "imageEditor.export": "Exporter",
    "imageEditor.upload": "Dépose une image ou clique pour importer",
    "imageEditor.formats": "PNG, JPG, WEBP",
    "imageEditor.useLink": "Utiliser un lien d’image",
    "imageEditor.use": "Utiliser",
    "imageEditor.changeImage": "Changer d’image",
    "imageEditor.quickSettings": "Réglages rapides",
    "imageEditor.brightness": "Luminosité",
    "imageEditor.contrast": "Contraste",
    "imageEditor.saturation": "Saturation",
    "imageEditor.rotation": "Rotation",
    "imageEditor.zoom": "Zoom",
    "imageEditor.offsetX": "Décalage horizontal",
    "imageEditor.offsetY": "Décalage vertical",
    "imageEditor.flipX": "Retourner horizontal",
    "imageEditor.flipY": "Retourner vertical",
    "imageEditor.preview": "Aperçu",
    "imageEditor.empty": "Ajoute une image pour commencer à éditer.",
    "imageEditor.exportNote":
      "L’export est en PNG. Les images distantes peuvent nécessiter un lien direct avec autorisation CORS.",
    "imageEditor.project": "Projet",
    "imageEditor.exportProject": "Exporter JSON",
    "imageEditor.importProject": "Importer JSON",
    "imageEditor.share": "Partager",
    "imageEditor.copyLink": "Copier le lien",
    "imageEditor.shareUnavailable": "Le partage nécessite un lien d’image.",
    "imageEditor.moreOptions": "Plus d’options",
    "imageEditor.lessOptions": "Moins d’options",
    "imageEditor.qrNote": "Scanne pour ouvrir l’éditeur sur mobile.",
    "imageEditor.downloadQr": "Télécharger le QR",
    "imageEditor.drafts": "Brouillons",
    "imageEditor.saveDraft": "Enregistrer un brouillon",
    "imageEditor.emptyDrafts": "Aucun brouillon sauvegardé.",
    "imageEditor.load": "Charger",
    "imageEditor.delete": "Supprimer",
    "imageEditor.templates": "Templates réseaux",
    "imageEditor.templateSize": "Format",
    "template.story": "Story",
    "template.square": "Post carré",
    "template.landscape": "Paysage",
    "template.banner": "Bannière",
    "ownMeme.kicker": "Ton image",
    "ownMeme.title": "Crée un meme à partir de tes propres images",
    "ownMeme.description":
      "Importe un fichier ou colle un lien direct, puis ajoute ton texte.",
    "ownMeme.reset": "Réinitialiser",
    "ownMeme.drop": "Dépose une image ou clique pour choisir un fichier",
    "ownMeme.fileTypes": "PNG, JPG, GIF",
    "ownMeme.useLink": "Utiliser un lien d’image",
    "ownMeme.use": "Utiliser",
    "ownMeme.tips": "Conseils rapides",
    "ownMeme.tip1": "Privilégie des images en haute résolution.",
    "ownMeme.tip2": "Glisse les textes directement sur l’image.",
    "ownMeme.tip3": "Ajoute plusieurs zones pour plus d’impact.",
    "ownMeme.empty": "Ajoute une image pour commencer à personnaliser ton meme.",
    "meme.kicker": "Memes tendance",
    "meme.title": "Pioche un meme aléatoire et personnalise-le",
    "meme.description":
      "Sélection aléatoire du top 100. Ajoute tes textes, bouge-les et télécharge le résultat.",
    "meme.fallback": "Meme par défaut",
    "meme.generate": "Générer un meme",
    "meme.loading": "Chargement...",
    "meme.error": "Impossible de récupérer la liste des memes.",
    "meme.searchLabel": "Recherche de template",
    "meme.searchPlaceholder": "Ex: drake, doge, success kid...",
    "meme.searchCount": "{count} sur {total} templates",
    "meme.noResults": "Aucun template ne correspond a ta recherche.",
    "meme.galleryTitle": "Galerie templates",
    "meme.pickTemplate": "Navigue plus vite dans la bibliotheque sans recharger toute la liste d'un coup.",
    "meme.prevPage": "Prec",
    "meme.nextPage": "Suiv",
    "meme.page": "Page {current}/{total}",
    "meme.favorite": "Ajouter aux favoris",
    "meme.unfavorite": "Retirer des favoris",
    "meme.tagAll": "Tous les tags",
    "meme.sortPopular": "Trier: popularite",
    "meme.sortName": "Trier: nom",
    "meme.favoritesOnly": "Favoris uniquement",
    "recent.title": "Historique des memes récents",
    "recent.clear": "Effacer",
    "recent.empty": "Aucun meme récent pour le moment.",
    "recent.source.trending": "tendance",
    "recent.source.custom": "perso",
    "generator.addText": "Ajouter un texte",
    "generator.download": "Télécharger",
    "generator.undo": "Annuler",
    "generator.redo": "Refaire",
    "generator.removeText": "Retirer le texte",
    "generator.socialExports": "Exports reseaux",
    "generator.socialExportsHint": "1 clic par format",
    "generator.share": "Partager",
    "generator.sharing": "Partage...",
    "generator.shareDone": "Partage ouvert sur votre appareil.",
    "generator.shareCopied": "Image copiee dans le presse-papiers.",
    "generator.shareFallbackDownload": "Partage indisponible, image telechargee.",
    "generator.shareUnavailable": "Le partage n'est pas disponible sur cet appareil.",
    "generator.sharePanel": "Lien de partage",
    "generator.copyLink": "Copier le lien",
    "generator.linkCopied": "Lien de partage copie.",
    "generator.shareTooLarge": "Le projet est trop lourd pour un lien. Sauvegarde-le dans ton profil pour un partage propre.",
    "generator.qrNote": "Scanne ce QR pour ouvrir le meme sur mobile.",
    "generator.downloadQr": "Telecharger le QR",
    "generator.saveProfile": "Sauvegarder profil",
    "generator.savingProfile": "Sauvegarde...",
    "generator.saveNeedLogin": "Connecte-toi sur Profil pour sauvegarder tes memes.",
    "generator.savedProfile": "Meme sauvegarde dans ton profil.",
    "generator.stickers": "Stickers & emojis",
    "generator.clearStickers": "Tout retirer",
    "generator.removeSticker": "Retirer {emoji}",
    "generator.customSticker": "Sticker perso",
    "generator.uploadSticker": "Importer un sticker",
    "generator.more": "Plus d’options",
    "generator.less": "Moins d’options",
    "generator.section.stickers": "Stickers",
    "generator.section.layers": "Calques",
    "generator.section.grid": "Grille",
    "grid.title": "Alignement",
    "grid.snap": "Snap à la grille",
    "grid.size": "Taille de grille",
    "layers.title": "Calques",
    "layers.subtitle": "Ordre & verrouillage",
    "layers.empty": "Ajoute du texte ou des stickers pour gérer les calques.",
    "layers.text": "Texte {index}",
    "layers.sticker": "Sticker",
    "layers.lock": "Verrouiller",
    "layers.unlock": "Déverrouiller",
    "layers.moveUp": "Monter",
    "layers.moveDown": "Descendre",
    "caption.presets": "Presets",
    "caption.effect": "Effet",
    "caption.effect.none": "Aucun",
    "caption.effect.arc": "Arc",
    "caption.effect.shake": "Shake",
    "caption.effect.outline": "Contour épais",
    "caption.effect.gradient": "Dégradé",
    "palette.title": "Palette",
    "palette.fill": "Texte",
    "palette.outline": "Contour",
    "palette.save": "Sauver",
    "text.placeholder": "Texte {index}",
    "font.family": "Famille de police",
    "font.size": "Taille de police",
    "image.alt": "Aperçu du meme",
    "error.generic":
      "Essaie de rafraîchir la page ou de vérifier ta connexion internet",
    "ad.label": "Espace sponsorisé",
    "ad.placeholder": "Votre annonce ici — discrète et non intrusive.",
    "onboarding.creator.title": "Flow rapide",
    "onboarding.creator.step1.title": "Etape 1: Choisir un template",
    "onboarding.creator.step1.description":
      "Passe par Templates pour partir d'un format viral, ou importe ton image si tu as deja ton visuel.",
    "onboarding.creator.step2.title": "Etape 2: Ecrire le texte",
    "onboarding.creator.step2.description":
      "Ajoute ton caption, ajuste la taille, puis place-le directement sur l'image.",
    "onboarding.creator.step3.title": "Etape 3: Exporter",
    "onboarding.creator.step3.description":
      "Exporte en PNG ou en format social des que le rendu est bon. Garde le flow court.",
    "onboarding.skip": "Passer",
    "onboarding.next": "Suivant",
    "onboarding.done": "Terminer",
  },
  en: {
    "brand.name": "Altcore Meme Studio",
    "brand.tagline": "Create, customize, and download in one click",
    "navbar.trending": "100+ trending memes",
    "navbar.drag": "Drag & drop text",
    "navbar.home": "Home",
    "navbar.creator": "Altcore Meme Studio",
    "navbar.templates": "Template gallery",
    "navbar.editor": "Image Editor",
    "navbar.profile": "Profile",
    "navbar.language": "Language",
    "navbar.theme": "Theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "landing.kicker": "Welcome",
    "landing.title": "Choose your creation space",
    "landing.subtitle":
      "Pick the module that fits your needs: meme creation or image editing.",
    "landing.creator.title": "Altcore Meme Studio",
    "landing.creator.description":
      "Generate a trending meme, add text, stickers, and download the result.",
    "landing.creator.cta": "Open creator",
    "landing.editor.title": "Image editor",
    "landing.editor.description":
      "Prepare visuals with adjustments and social-ready formats.",
    "landing.editor.cta": "Open editor",
    "footer.copyright": "© 2026 Altcore Meme Studio",
    "footer.credit": "Designed by Neku",
    "footer.follow": "Follow us",
    "social.instagram": "Instagram",
    "social.tiktok": "TikTok",
    "social.x": "X",
    "social.youtube": "YouTube",
    "imageEditor.kicker": "Image editor",
    "imageEditor.title": "Prepare your visual with Altcore Meme Studio",
    "imageEditor.description":
      "Fine-tune adjustments, rotate or flip the image, then export as PNG.",
    "imageEditor.reset": "Reset",
    "imageEditor.export": "Export",
    "imageEditor.upload": "Drop an image or click to upload",
    "imageEditor.formats": "PNG, JPG, WEBP",
    "imageEditor.useLink": "Use an image link",
    "imageEditor.use": "Use",
    "imageEditor.changeImage": "Change image",
    "imageEditor.quickSettings": "Quick settings",
    "imageEditor.brightness": "Brightness",
    "imageEditor.contrast": "Contrast",
    "imageEditor.saturation": "Saturation",
    "imageEditor.rotation": "Rotation",
    "imageEditor.zoom": "Zoom",
    "imageEditor.offsetX": "Horizontal offset",
    "imageEditor.offsetY": "Vertical offset",
    "imageEditor.flipX": "Flip horizontally",
    "imageEditor.flipY": "Flip vertically",
    "imageEditor.preview": "Preview",
    "imageEditor.empty": "Add an image to start editing.",
    "imageEditor.exportNote":
      "Export is PNG. Remote images may require a direct link with CORS permissions.",
    "imageEditor.project": "Project",
    "imageEditor.exportProject": "Export JSON",
    "imageEditor.importProject": "Import JSON",
    "imageEditor.share": "Share",
    "imageEditor.copyLink": "Copy link",
    "imageEditor.shareUnavailable": "Sharing requires an image link.",
    "imageEditor.moreOptions": "More options",
    "imageEditor.lessOptions": "Less options",
    "imageEditor.qrNote": "Scan to open the editor on mobile.",
    "imageEditor.downloadQr": "Download QR",
    "imageEditor.drafts": "Drafts",
    "imageEditor.saveDraft": "Save draft",
    "imageEditor.emptyDrafts": "No saved drafts yet.",
    "imageEditor.load": "Load",
    "imageEditor.delete": "Delete",
    "imageEditor.templates": "Social templates",
    "imageEditor.templateSize": "Size",
    "template.story": "Story",
    "template.square": "Square post",
    "template.landscape": "Landscape",
    "template.banner": "Banner",
    "ownMeme.kicker": "Your image",
    "ownMeme.title": "Create a meme from your own images",
    "ownMeme.description":
      "Upload a file or paste a direct link, then add your text.",
    "ownMeme.reset": "Reset",
    "ownMeme.drop": "Drop an image or click to choose a file",
    "ownMeme.fileTypes": "PNG, JPG, GIF",
    "ownMeme.useLink": "Use an image link",
    "ownMeme.use": "Use",
    "ownMeme.tips": "Quick tips",
    "ownMeme.tip1": "Prefer high-resolution images.",
    "ownMeme.tip2": "Drag texts directly on the image.",
    "ownMeme.tip3": "Add multiple zones for impact.",
    "ownMeme.empty": "Add an image to start customizing your meme.",
    "meme.kicker": "Trending memes",
    "meme.title": "Pick a random meme and customize it",
    "meme.description":
      "Random selection from the top 100. Add text, move it, and download the result.",
    "meme.fallback": "Default meme",
    "meme.generate": "Generate a meme",
    "meme.loading": "Loading...",
    "meme.error": "Unable to fetch the meme list.",
    "meme.searchLabel": "Template search",
    "meme.searchPlaceholder": "Example: drake, doge, success kid...",
    "meme.searchCount": "{count} of {total} templates",
    "meme.noResults": "No templates match your search.",
    "meme.galleryTitle": "Template gallery",
    "meme.pickTemplate": "Browse the library faster without dumping the whole list at once.",
    "meme.prevPage": "Prev",
    "meme.nextPage": "Next",
    "meme.page": "Page {current}/{total}",
    "meme.favorite": "Add to favorites",
    "meme.unfavorite": "Remove favorite",
    "meme.tagAll": "All tags",
    "meme.sortPopular": "Sort: popularity",
    "meme.sortName": "Sort: name",
    "meme.favoritesOnly": "Favorites only",
    "recent.title": "Recent meme history",
    "recent.clear": "Clear",
    "recent.empty": "No recent memes yet.",
    "recent.source.trending": "trending",
    "recent.source.custom": "custom",
    "generator.addText": "Add text",
    "generator.download": "Download",
    "generator.undo": "Undo",
    "generator.redo": "Redo",
    "generator.removeText": "Remove text",
    "generator.socialExports": "Social exports",
    "generator.socialExportsHint": "One click per format",
    "generator.share": "Share",
    "generator.sharing": "Sharing...",
    "generator.shareDone": "Share panel opened on your device.",
    "generator.shareCopied": "Image copied to clipboard.",
    "generator.shareFallbackDownload": "Sharing unavailable, image downloaded.",
    "generator.shareUnavailable": "Sharing is not available on this device.",
    "generator.sharePanel": "Share link",
    "generator.copyLink": "Copy link",
    "generator.linkCopied": "Share link copied.",
    "generator.shareTooLarge": "This project is too large for a clean link. Save it to your profile for reliable sharing.",
    "generator.qrNote": "Scan this QR code to open the meme on mobile.",
    "generator.downloadQr": "Download QR",
    "generator.saveProfile": "Save to profile",
    "generator.savingProfile": "Saving...",
    "generator.saveNeedLogin": "Sign in on Profile to save your memes.",
    "generator.savedProfile": "Meme saved to your profile.",
    "generator.stickers": "Stickers & emojis",
    "generator.clearStickers": "Clear all",
    "generator.removeSticker": "Remove {emoji}",
    "generator.customSticker": "Custom sticker",
    "generator.uploadSticker": "Upload sticker",
    "generator.more": "More options",
    "generator.less": "Less options",
    "generator.section.stickers": "Stickers",
    "generator.section.layers": "Layers",
    "generator.section.grid": "Grid",
    "grid.title": "Alignment",
    "grid.snap": "Snap to grid",
    "grid.size": "Grid size",
    "layers.title": "Layers",
    "layers.subtitle": "Order & lock",
    "layers.empty": "Add text or stickers to manage layers.",
    "layers.text": "Text {index}",
    "layers.sticker": "Sticker",
    "layers.lock": "Lock",
    "layers.unlock": "Unlock",
    "layers.moveUp": "Move up",
    "layers.moveDown": "Move down",
    "caption.presets": "Presets",
    "caption.effect": "Effect",
    "caption.effect.none": "None",
    "caption.effect.arc": "Arc",
    "caption.effect.shake": "Shake",
    "caption.effect.outline": "Thick outline",
    "caption.effect.gradient": "Gradient",
    "palette.title": "Palette",
    "palette.fill": "Text",
    "palette.outline": "Outline",
    "palette.save": "Save",
    "text.placeholder": "Text {index}",
    "font.family": "Font Family",
    "font.size": "Font Size",
    "image.alt": "Meme preview",
    "error.generic":
      "Try refreshing the page or checking your internet connection",
    "ad.label": "Sponsored",
    "ad.placeholder": "Your ad here — subtle and non-intrusive.",
    "onboarding.creator.title": "Quick flow",
    "onboarding.creator.step1.title": "Step 1: Pick a template",
    "onboarding.creator.step1.description":
      "Start in Templates for a viral format, or upload your own image if you already have the visual.",
    "onboarding.creator.step2.title": "Step 2: Write the text",
    "onboarding.creator.step2.description":
      "Add your caption, adjust size, then place it directly on the image.",
    "onboarding.creator.step3.title": "Step 3: Export",
    "onboarding.creator.step3.description":
      "Export to PNG or a social format as soon as the render is right. Keep the flow short.",
    "onboarding.skip": "Skip",
    "onboarding.next": "Next",
    "onboarding.done": "Done",
  },
  de: {
    "navbar.home": "Start",
    "navbar.creator": "Meme-Creator",
    "navbar.templates": "Template-Galerie",
    "navbar.editor": "Bildeditor",
    "navbar.profile": "Profil",
    "navbar.language": "Sprache",
    "navbar.theme": "Thema",
    "theme.light": "Hell",
    "theme.dark": "Dunkel",
    "landing.kicker": "Willkommen",
    "landing.title": "Wahle deinen Kreativbereich",
    "landing.subtitle":
      "Erstelle Memes, bearbeite Bilder und teile in sozialen Formaten.",
    "landing.creator.cta": "Creator offnen",
    "landing.editor.cta": "Editor offnen",
    "meme.generate": "Meme generieren",
    "generator.download": "Download",
    "generator.share": "Teilen",
    "generator.saveProfile": "Im Profil speichern",
  },
  it: {
    "navbar.home": "Home",
    "navbar.creator": "Creatore meme",
    "navbar.templates": "Galleria template",
    "navbar.editor": "Editor immagini",
    "navbar.profile": "Profilo",
    "navbar.language": "Lingua",
    "navbar.theme": "Tema",
    "theme.light": "Chiaro",
    "theme.dark": "Scuro",
    "landing.kicker": "Benvenuto",
    "landing.title": "Scegli il tuo spazio creativo",
    "landing.subtitle":
      "Crea meme, modifica immagini e condividi nei formati social.",
    "landing.creator.cta": "Apri creatore",
    "landing.editor.cta": "Apri editor",
    "meme.generate": "Genera meme",
    "generator.download": "Scarica",
    "generator.share": "Condividi",
    "generator.saveProfile": "Salva nel profilo",
  },
  ja: {
    "navbar.home": "ホーム",
    "navbar.creator": "ミーム作成",
    "navbar.templates": "テンプレートギャラリー",
    "navbar.editor": "画像編集",
    "navbar.profile": "プロフィール",
    "navbar.language": "言語",
    "navbar.theme": "テーマ",
    "theme.light": "ライト",
    "theme.dark": "ダーク",
    "landing.kicker": "ようこそ",
    "landing.title": "作成モードを選択",
    "landing.subtitle":
      "ミーム作成、画像編集、SNS向け書き出しを1つの場所で。",
    "landing.creator.cta": "作成を開く",
    "landing.editor.cta": "編集を開く",
    "meme.generate": "ミーム生成",
    "generator.download": "ダウンロード",
    "generator.share": "共有",
    "generator.saveProfile": "プロフィール保存",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const interpolate = (text: string, params?: TranslationParams) => {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
};

const isSupportedLanguage = (value: string): value is Language =>
  value === "fr" || value === "en" || value === "de" || value === "it" || value === "ja";

const detectBrowserLanguage = (): Language => {
  if (typeof navigator === "undefined") return "fr";
  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((item) => item.toLowerCase());

  for (const candidate of candidates) {
    const short = candidate.slice(0, 2);
    if (isSupportedLanguage(short)) {
      return short;
    }
  }
  return "en";
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("meme-creator-language");
    if (saved && isSupportedLanguage(saved)) {
      setLanguage(saved);
      return;
    }
    setLanguage(detectBrowserLanguage());
  }, []);

  useEffect(() => {
    localStorage.setItem("meme-creator-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) =>
        interpolate(translations[language][key] ?? translations.en[key] ?? key, params),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
