# 🚨 CRITICAL: Environment Variable Not Loading - Troubleshooting Guide

## Problem
`hasApiKey` returns `false` no matter how you add the `GEMINI_API_KEY` environment variable.

---

## ✅ Changes Made

I've updated your configuration to fix this issue:

1. **`next.config.ts`** - Added explicit env variable exposure
2. **`netlify.toml`** - Added environment configuration
3. **`app/api/test-env/route.ts`** - Enhanced debugging endpoint

---

## 🔍 Step-by-Step Debugging

### Step 1: Test Locally First

This will confirm if the issue is with your deployment or the code itself.

#### Create `.env.local` file:

**Location**: `d:\resumio\Resumio\.env.local`

**Content** (replace with your actual key):
```
GEMINI_API_KEY=AIzaSyABC123...your_actual_key_here
```

#### Run locally:
```bash
cd d:\resumio\Resumio
npm run dev
```

#### Test the endpoint:
Visit: `http://localhost:3000/api/test-env`

**Expected response**:
```json
{
  "hasApiKey": true,
  "keyLength": 39,
  "keyPrefix": "AIzaSy...",
  "availableEnvKeys": ["GEMINI_API_KEY", ...]
}
```

**If `hasApiKey` is `false` locally**:
- The `.env.local` file is not in the right location
- The file is named incorrectly (check for `.env.local.txt`)
- You didn't restart the dev server after creating the file

---

### Step 2: Verify Environment Variable Name

The variable name MUST be **exactly**: `GEMINI_API_KEY`

**Common mistakes**:
- ❌ `GEMINI_API_KEY ` (extra space at the end)
- ❌ `GEMINI_API_KEY=` (equals sign in the variable name)
- ❌ `NEXT_PUBLIC_GEMINI_API_KEY` (wrong prefix)
- ❌ `gemini_api_key` (lowercase)
- ❌ `GEMINI-API-KEY` (hyphens instead of underscores)

**Correct**:
- ✅ `GEMINI_API_KEY`

---

### Step 3: Platform-Specific Configuration

#### For Netlify:

**Option A: Using Netlify UI**

1. Go to: https://app.netlify.com/
2. Select your site
3. Go to: **Site configuration** → **Environment variables**
4. Click **"Add a variable"**
5. **Key**: `GEMINI_API_KEY` (copy this exactly)
6. **Value**: Your API key (e.g., `AIzaSyABC123...`)
7. **Scopes**: Select **ALL** (All scopes, All deploys)
8. Click **"Create variable"**
9. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

**Option B: Using netlify.toml** (Recommended for team projects)

Add this to your `netlify.toml`:
```toml
[context.production.environment]
  GEMINI_API_KEY = "your_key_here"

[context.deploy-preview.environment]
  GEMINI_API_KEY = "your_key_here"
```

**⚠️ WARNING**: This will commit your API key to Git. Only use this for testing!

---

#### For Vercel:

1. Go to: https://vercel.com/
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Click **"Add New"**
5. **Name**: `GEMINI_API_KEY` (copy this exactly)
6. **Value**: Your API key
7. **Environment**: Check **ALL THREE** boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
8. Click **"Save"**
9. Go to **Deployments** → Select latest → **...** → **Redeploy**
10. **Important**: Check **"Use existing Build Cache"** = OFF

---

### Step 4: Check the Enhanced Debug Endpoint

After redeploying, visit: `https://your-site.com/api/test-env`

The enhanced endpoint will show you:

```json
{
  "hasApiKey": false,
  "availableEnvKeys": ["NODE_ENV", "VERCEL", ...],
  "platform": "Netlify",
  "totalEnvVars": 45,
  "debug": {
    "hasProcessEnv": true,
    "geminiKeyType": "undefined"
  }
}
```

**What to look for**:

1. **`availableEnvKeys`** - Does it include `GEMINI_API_KEY`?
   - ✅ YES → The variable is set, but might be empty
   - ❌ NO → The variable is not set at all

2. **`platform`** - Is it detecting the right platform?
   - Should show "Netlify" or "Vercel"

3. **`totalEnvVars`** - Should be > 0
   - If it's 0, something is very wrong

---

### Step 5: Common Platform Issues

#### Netlify-Specific Issues:

**Issue**: Environment variables not available in API routes

**Solution**: Netlify requires the `@netlify/plugin-nextjs` plugin (already added).

**Verify**:
1. Check your `netlify.toml` has:
   ```toml
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```
2. Check build logs for plugin installation
3. Make sure you're using Next.js 13+ (you're on 16.0.3 ✅)

**Issue**: Variables only available at build time, not runtime

**Solution**: Set variables in **both** places:
- Site configuration → Environment variables (for runtime)
- Build & deploy → Environment (for build time)

---

#### Vercel-Specific Issues:

**Issue**: Variables not available after adding them

**Solution**: 
1. **Redeploy** (don't just rebuild)
2. **Clear build cache** when redeploying
3. Make sure you selected **all environments**

**Issue**: Variables work in preview but not production

**Solution**:
1. Check you selected **Production** environment
2. Redeploy the production branch specifically
3. Check the production deployment logs

---

### Step 6: Alternative Approach - Use Vercel CLI

If the UI isn't working, try using the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Add environment variable
vercel env add GEMINI_API_KEY

# When prompted:
# - Enter your API key
# - Select: Production, Preview, Development (all)

# Redeploy
vercel --prod
```

---

### Step 7: Nuclear Option - Recreate the Project

If nothing works:

1. **Export your environment variables** (write them down)
2. **Delete the project** from Netlify/Vercel
3. **Reconnect** your GitHub repo
4. **Add environment variables** BEFORE the first deploy
5. **Deploy**

Sometimes deployment platforms cache configurations incorrectly.

---

## 🔬 Advanced Debugging

### Check Build Logs

**Netlify**:
1. Go to **Deploys** → Select latest
2. Click **"Deploy log"**
3. Search for "GEMINI" in the logs
4. Look for any warnings about environment variables

**Vercel**:
1. Go to **Deployments** → Select latest
2. Click **"Building"** tab
3. Search for "GEMINI" or "environment"

### Check Function Logs (Runtime)

**Netlify**:
1. Go to **Functions** tab
2. Select any function
3. Check logs for environment variable errors

**Vercel**:
1. Go to **Deployments** → Select latest
2. Click **"Functions"** tab
3. Click on any API route
4. Check **"Logs"** for errors

---

## 📋 Checklist

Before asking for more help, verify:

- [ ] I created `.env.local` locally and it works (`hasApiKey: true`)
- [ ] The variable name is exactly `GEMINI_API_KEY` (no typos, no spaces)
- [ ] I added the variable in the platform UI (Netlify/Vercel)
- [ ] I selected ALL environments/scopes
- [ ] I triggered a **new deploy** (not just rebuild)
- [ ] I cleared the build cache when redeploying
- [ ] I checked `/api/test-env` shows the variable in `availableEnvKeys`
- [ ] I checked the build logs for errors
- [ ] I'm using the latest code (with updated `next.config.ts`)

---

## 🆘 If Still Not Working

### Share This Information:

1. **Platform**: Netlify or Vercel?
2. **Local test result**: Does it work locally? (yes/no)
3. **Debug endpoint response**: Full JSON from `/api/test-env`
4. **Build logs**: Any errors or warnings?
5. **Screenshot**: Of your environment variable settings in the platform UI

### Possible Root Causes:

1. **Platform caching issue** → Try recreating the project
2. **Next.js version incompatibility** → Try downgrading to Next.js 14
3. **Plugin issue** → Try removing and re-adding the Netlify plugin
4. **Account permissions** → Make sure you have admin access to the project

---

## 🎯 Quick Test Commands

```bash
# Test locally
cd d:\resumio\Resumio
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
# Visit: http://localhost:3000/api/test-env

# Commit and push changes
git add .
git commit -m "Fix environment variable configuration"
git push origin main

# Trigger redeploy on Netlify/Vercel
# (Use the platform UI)
```

---

**The updated configuration should fix this issue. Commit, push, and redeploy!** 🚀
