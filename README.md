# Resumio

Resumio is an AI‑powered resume builder that helps you craft ATS‑friendly, beautifully designed resumes in seconds. It offers three creation modes: upload an existing resume, start from a template, or generate a draft with Gemini AI. The UI features auto‑resizing textareas, markdown rendering, and a modern glassmorphism design.

## Features

- **AI‑generated resumes** with personal details (name, email, phone, location)
- **Three creation modes**: Upload, Template, AI
- **Auto‑resizing textareas** (no scrollbars)
- **Markdown support** (bold, etc.) in preview
- **ATS scoring & suggestions**
- **Export** to PDF, DOCX, TXT
- **Responsive design** with vibrant colors and micro‑animations
- **Ready for Netlify** deployment (see `netlify.toml`)

## Getting Started

1. Clone the repo:

```bash
git clone https://github.com/Sathvik-Nagesh/Resumio.git
cd Resumio
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

The project includes a `netlify.toml` file for easy deployment on Netlify.

1. Push your code to GitHub (already done).
2. In Netlify, create a new site from the GitHub repository.
3. Add the environment variable `GEMINI_API_KEY` in Site Settings → Build & Deploy → Environment.
4. Deploy – Netlify will run `npm run build` and serve the site.

## Contributing

Feel free to open issues or submit pull requests. Ensure code passes `npm run lint` and the app builds successfully.

## License

MIT

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
