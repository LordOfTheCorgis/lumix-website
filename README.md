# Lumix Website

## 1. Project Overview

This project is the Lumix marketing and information website built with Astro, including public pages for services, status, staff, legal content, and careers.

## 2. Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer
- Git
- Supported OS: Windows, macOS, or Linux

## 3. Installation

Run from the project root:

```sh
npm install
```

## 4. Running the Project (Development)

Start the local dev server:

```sh
npm run dev
```

What to expect:

- The server starts in watch mode
- Astro prints a local URL (typically http://localhost:4321)
- Changes in `src/` reload automatically in the browser

## 5. Building for Production

Create a production build:

```sh
npm run build
```

Build output is generated in `dist/`.

## 6. Preview Production Build

Preview the built site locally:

```sh
npm run preview
```

## 7. Environment Variables

No `.env` file is required for the current project setup.

If environment variables are added later, use this format:

```env
EXAMPLE_KEY=value
PUBLIC_EXAMPLE_KEY=value
```

## 8. Project Structure

Key folders:

- `public/`: Static assets served as-is (images, icons, etc.)
- `src/components/`: Reusable UI components
- `src/data/`: Shared site content/config data
- `src/layouts/`: Page layout wrappers
- `src/pages/`: Route-based pages
- `src/styles/`: Global styles

## 9. Common Issues / Troubleshooting

- Dependencies are broken:

```sh
# PowerShell (Windows)
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

```sh
# Bash (macOS/Linux)
rm -rf node_modules package-lock.json
npm install
```

- Port 4321 is already in use:

```sh
npm run dev -- --port 4322
```

- Build fails after branch changes:

```sh
npm install
npm run build
```
