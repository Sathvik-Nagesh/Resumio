# Deployment Guide for Resumio

## 1. Prerequisites
- A GitHub account.
- A Netlify account.
- Your Gemini API Key.

## 2. Push to GitHub
1. Initialize a git repository if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   ```
2. Create a new repository on GitHub.
3. Push your code:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## 3. Deploy to Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** > **"Import from existing project"**.
3. Select **GitHub** and authorize if needed.
4. Choose your `sathvik-resume-studio` repository.
5. **Build Settings** (should be auto-detected thanks to `netlify.toml`):
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. **Environment Variables** (Crucial!):
   - Click **"Add environment variable"**.
   - Key: `GEMINI_API_KEY`
   - Value: (Paste your actual API key from `.env.local`)
7. Click **"Deploy"**.

## 4. Verify
- Netlify will build your site.
- Once done, you'll get a URL (e.g., `https://resumio-sathvik.netlify.app`).
- Test the AI features to ensure the API key is working.
