# Precision Storyboard AI

AI-powered YouTube storyboard and metadata generator.

## What it does

- Paste a YouTube script
- Generate visual storyboard ideas
- Generate searchable GIF queries
- Generate YouTube titles, descriptions, tags, and chapters
- Configure audience, pacing, and visual style

## Tech

- React
- Vite
- Tailwind-style UI
- Lucide React
- Gemini API
- GIPHY API

## API keys

For local development, create a `.env` file from `.env.example`.

**Do not upload real API keys to GitHub.** GitHub recommends using `.gitignore` for files that should not be committed and warns against committing secrets such as API keys.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Project structure

```text
precision-storyboard-ai/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Note

This repository is the source code for the project. Before using it as a public production service, review the API provider terms, quotas, attribution requirements, and deployment/security configuration.

