
# React Meme Generator
Crée un meme à partir d'une image aleatoires.

<img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white "/>

## GUIDES

**Client:** React, TypeScript, TailwindCSS


## Préview de l'application

View the site from the [https://meme.altcore.fr/](https://meme.altcore.fr/) 


## Features

Afficher des modèles de meme depuis l'API Imgflip : Utilisez une requête HTTP pour récupérer les modèles de meme depuis l'API Imgflip et affichez-les dans une grille ou une liste. Vous pouvez utiliser une bibliothèque de gestion d'état comme Redux pour stocker les modèles de meme.

Rechercher des modèles : Ajoutez un champ de recherche qui permet aux utilisateurs de rechercher des modèles de meme en fonction de leur nom ou de leur tag.

Ajouter du texte aux images : Utilisez une bibliothèque JavaScript comme Fabric.js pour permettre aux utilisateurs d'ajouter du texte à l'image de meme. Vous pouvez utiliser des contrôles de formulaire pour permettre aux utilisateurs de modifier les attributs de texte tels que la police, la taille et la couleur.

Déplacer le texte sur l'image : Utilisez les fonctionnalités de Fabric.js pour permettre aux utilisateurs de faire glisser le texte sur l'image.

Ajouter plusieurs textes : Permettez aux utilisateurs d'ajouter plusieurs textes en cliquant sur un bouton "Ajouter du texte" ou en utilisant un menu contextuel.

Télécharger le meme finalisé : Utilisez la bibliothèque FileSaver.js pour permettre aux utilisateurs de télécharger le meme finalisé en tant que fichier image.

Créer un meme en téléchargeant des images de bureau ou en insérant une URL d'image : Utilisez l'élément input de type "file" pour permettre aux utilisateurs de télécharger des images de bureau. Pour les images provenant d'URL, utilisez une bibliothèque JavaScript comme Axios pour récupérer l'image à partir de l'URL.



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
npm start
```
**Step 5: Exporter le projet** 

```bash
npm run build
```

## API Reference

Imgflip API is used to fetch all the meme templates. It returns an array of 100 meme templates.

#### Get all meme templates

```http
GET https://api.imgflip.com/get_memes
```
