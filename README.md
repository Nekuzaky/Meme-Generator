
# Meme Creator
Projet réalisé pour mon examen de fin d’année (2e année) à l’IFAPME en développeur web.

Crée un meme à partir d’images tendance ou de tes propres visuels, puis partage-le.

<img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white "/>

## Stack

**Client :** React, TypeScript, TailwindCSS, Vite


## Préview de l'application

Voir le site : [https://meme.altcore.fr/](https://meme.altcore.fr/)


## Fonctionnalités

- Génération de memes tendance via l’API Imgflip.
- Création de memes depuis une image locale ou un lien direct.
- Éditeur d’images avec réglages (luminosité, contraste, rotation, zoom, etc.).
- Templates réseaux (story, post carré, paysage, bannière) + export auto.
- Texte glisser‑déposer, stickers, effets, presets et palette sauvegardée.
- Calques (ordre + verrouillage) et grille d’alignement.
- Upload de stickers personnalisés.
- Import/Export de projets en JSON + autosave & brouillons.
- Partage par lien + QR code (généré localement).
- Thème clair/sombre et interface FR/EN.



## Lancer le projet


**Step 1: Cloner ou installer le projet**


**Step 2: Ouvrir le dossier**

```bash
cd my-app
```

**Step 3: Installer les packages**

```bash
npm install
```

**Step 4: Lancer le projet** 

```bash
npm run dev
```
**Step 5: Exporter le projet** 

```bash
npm run build
```

## API Reference

L’API Imgflip est utilisée pour récupérer les templates de memes (100 templates).

#### Get all meme templates

```http
GET https://api.imgflip.com/get_memes
```
