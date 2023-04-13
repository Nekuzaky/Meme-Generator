
# React Meme Generator

Create memes from templates, desktop images or image URL

<img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> &nbsp; &nbsp; <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white "/> &nbsp; &nbsp; <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" />

## Tech

**Client:** React, TypeScript, TailwindCSS

Deployed on Firebase

## Demo

View the site from the [link](https://react-meme-generator-12c45.web.app/) given.


## Features

- View meme templates from Imgflip API
- Search templates
- Edit meme image by adding text
- Change text attributes (font-family, font-size, font-color)
- Move text around the image
- Add multiple texts
- Download finalized meme
- Create meme by uploading desktop images or inserting image URL
- Deployed on Firebase

### To-do features
- Other users add their own meme templates
- Share your memes on social media
- Save your memes in your account
- Add image filters
- Add stickers and other images into the meme image

## Run Locally


**Step 1: Clone the project**

```bash
git clone https://github.com/ankitk26/React-Meme-Generator-SPP-Project.git
```

**Step 2: Go to the project directory**

```bash
cd my-project
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
