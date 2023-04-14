
# React Meme Generator

Create memes from templates, desktop images or image URL

<img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white "/> &nbsp; &nbsp; <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" />

## Tech

**Client:** React, TypeScript, TailwindCSS

Deployed on Firebase

## Demo

View the site from the [link](https://meme.altcore.fr//) given.


## Features

Afficher des modèles de meme depuis l'API Imgflip : Utilisez une requête HTTP pour récupérer les modèles de meme depuis l'API Imgflip et affichez-les dans une grille ou une liste. Vous pouvez utiliser une bibliothèque de gestion d'état comme Redux pour stocker les modèles de meme.

Rechercher des modèles : Ajoutez un champ de recherche qui permet aux utilisateurs de rechercher des modèles de meme en fonction de leur nom ou de leur tag.

Ajouter du texte aux images : Utilisez une bibliothèque JavaScript comme Fabric.js pour permettre aux utilisateurs d'ajouter du texte à l'image de meme. Vous pouvez utiliser des contrôles de formulaire pour permettre aux utilisateurs de modifier les attributs de texte tels que la police, la taille et la couleur.

Déplacer le texte sur l'image : Utilisez les fonctionnalités de Fabric.js pour permettre aux utilisateurs de faire glisser le texte sur l'image.

Ajouter plusieurs textes : Permettez aux utilisateurs d'ajouter plusieurs textes en cliquant sur un bouton "Ajouter du texte" ou en utilisant un menu contextuel.

Télécharger le meme finalisé : Utilisez la bibliothèque FileSaver.js pour permettre aux utilisateurs de télécharger le meme finalisé en tant que fichier image.

Créer un meme en téléchargeant des images de bureau ou en insérant une URL d'image : Utilisez l'élément input de type "file" pour permettre aux utilisateurs de télécharger des images de bureau. Pour les images provenant d'URL, utilisez une bibliothèque JavaScript comme Axios pour récupérer l'image à partir de l'URL.

Déployer l'application sur Firebase : Utilisez Firebase Hosting pour déployer l'application. Vous pouvez également utiliser Firebase Functions pour implémenter des fonctionnalités telles que l'envoi de notifications ou le traitement de données.


## Run Locally


**Step 1: Clone the project**


**Step 2: Go to the project directory**

```bash
cd my-app
```

**Step 3: Install dependencies**

```bash
npm install
```

**Step 4: Start the server** 

```bash
npm start
```

## API Reference

Imgflip API is used to fetch all the meme templates. It returns an array of 100 meme templates.

#### Get all meme templates

```http
GET https://api.imgflip.com/get_memes
```
