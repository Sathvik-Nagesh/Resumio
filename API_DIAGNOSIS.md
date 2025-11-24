# 🔍 API Diagnosis & Project Understanding

## 📋 Project Overview

**Resumio** is a Next.js 16 application that helps users create, parse, and optimize resumes using Google's Gemini AI API.

### Tech Stack:
- **Framework**: Next.js 16 (App Router)
- **AI**: Google Gemini 2.0 Flash (`@google/generative-ai`)
- **UI**: React 19, Tailwind CSS, Radix UI, Framer Motion
- **State**: Zustand
- **Deployment**: Vercel & Netlify

---

## 🏗️ How the Application Works

### 1. **Three Main Modes**:

#### **Upload Mode** (`/api/parse-resume`)
- User uploads PDF/DOCX resume
- Backend extracts text using `pdf-parse` and `mammoth`
- Gemini AI parses the text into structured JSON
- Returns resume data + ATS score

#### **Template Mode** (`/api/ai/improve`)
- User fills in resume details manually
- Can use AI to improve text with different tones (clarity/concise/impactful)
- Choose from 11 different resume templates

#### **AI Mode** (`/api/ai/full-resume`)
- User provides job description + basic info
- Gemini AI generates a complete resume from scratch

---

## 🔌 API Routes & How They Work

### **Route 1: `/api/parse-resume`** (POST)
**Location**: `app/api/parse-resume/route.ts`

**Request**:
```typescript
FormData {
  file: File (PDF/DOCX)
  jobDescription?: string (optional)
}
```

**Response**:
```json
{
  "resume": { /* ResumeData object */ },
  "atsScore": { /* ATS scoring */ }
}
```

**How it's called** (from `UploadModePanel.tsx`):
```typescript
const response = await fetch("/api/parse-resume", {
    method: "POST",
    body: formData, // Contains file + jobDescription
});
```

---

### **Route 2: `/api/ai/improve`** (POST)
**Location**: `app/api/ai/improve/route.ts`

**Request**:
```json
{
  "mode": "clarity" | "concise" | "impactful",
  "tone": string,
  "text": string,
  "context": string
}
```

**Response**:
```json
{
  "improvedText": "..."
}
```

**How it's called** (from `TemplateModePanel.tsx`):
```typescript
const response = await fetch("/api/ai/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, tone, text, context })
});
```

---

### **Route 3: `/api/ai/full-resume`** (POST)
**Location**: `app/api/ai/full-resume/route.ts`

**Request**:
```json
{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "role": string,
  "yearsExp": string,
  "skills": string,
  "industry": string,
  "goals": string,
  "action": string
}
```

**Response**:
```json
{
  "resume": { /* ResumeData object */ },
  "action": "generate"
}
```

**How it's called** (from `AIModePanel.tsx`):
```typescript
const response = await fetch("/api/ai/full-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, ... })
});
```

---

## 🐛 THE PROBLEM: API Not Found on Deployment

### **Root Cause Analysis**

You deployed to **Vercel** and **Netlify** and added `GEMINI_API_KEY` as an environment variable, but you're getting **"API not found"** errors.

### **Why This Happens**:

#### **Issue 1: Environment Variable Name Mismatch** ❌
The code expects: `GEMINI_API_KEY`

**Check your deployment platforms**:
- Vercel: Go to Project Settings → Environment Variables
- Netlify: Go to Site Settings → Environment Variables

**Common mistakes**:
- ❌ `GEMINI_API_KEY ` (extra space)
- ❌ `GEMINI_API_KEY=` (equals sign in the key name)
- ❌ `NEXT_PUBLIC_GEMINI_API_KEY` (wrong prefix - this is for client-side vars)

**Correct format**:
```
Key: GEMINI_API_KEY
Value: AIzaSy...your_actual_key_here
```

---

#### **Issue 2: Next.js Environment Variable Scoping** 🔒

**IMPORTANT**: In Next.js, environment variables are **server-side only** by default.

Your API routes (`/api/*`) run on the **server**, so they can access `process.env.GEMINI_API_KEY`.

**The code is correct** - it uses `process.env.GEMINI_API_KEY` in:
- `lib/gemini.ts` (line 6)
- `app/api/parse-resume/route.ts` (line 23)
- `app/api/ai/improve/route.ts` (line 8)
- `app/api/ai/full-resume/route.ts` (line 10)

---

#### **Issue 3: Deployment Platform Configuration** 🚀

##### **For Netlify**:

Your `netlify.toml` is configured correctly:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**BUT** - Netlify needs the environment variable set in **two places**:

1. **Build-time** (for `npm run build`)
2. **Runtime** (for API routes)

**Solution for Netlify**:
1. Go to **Site Settings** → **Environment Variables**
2. Add `GEMINI_API_KEY` with your API key
3. **Important**: Make sure it's available for **both Build and Deploy contexts**
4. **Redeploy** the site (trigger a new build)

##### **For Vercel**:

Vercel should work automatically once you add the environment variable.

**Solution for Vercel**:
1. Go to **Project Settings** → **Environment Variables**
2. Add `GEMINI_API_KEY` with your API key
3. Select **Production**, **Preview**, and **Development** environments
4. **Redeploy** (go to Deployments → click "..." → Redeploy)

---

## ✅ Step-by-Step Fix

### **1. Verify Your API Key**
Get your key from: https://aistudio.google.com/app/apikey

It should look like: `AIzaSy...` (39 characters)

---

### **2. For Netlify Deployment**:

```bash
# Step 1: Log in to Netlify
# Go to: https://app.netlify.com/

# Step 2: Select your site

# Step 3: Go to Site Settings → Environment Variables

# Step 4: Add variable
Key: GEMINI_API_KEY
Value: AIzaSy...your_actual_key_here
Scopes: ✅ All scopes (or at least "Builds" and "Functions")

# Step 5: Trigger a new deploy
# Go to Deploys → Trigger deploy → Deploy site
```

---

### **3. For Vercel Deployment**:

```bash
# Step 1: Log in to Vercel
# Go to: https://vercel.com/

# Step 2: Select your project

# Step 3: Go to Settings → Environment Variables

# Step 4: Add variable
Name: GEMINI_API_KEY
Value: AIzaSy...your_actual_key_here
Environment: ✅ Production ✅ Preview ✅ Development

# Step 5: Redeploy
# Go to Deployments → Select latest → ... → Redeploy
```

---

### **4. Verify the Fix**:

After redeploying, test each API endpoint:

#### **Test 1: Upload Mode**
1. Go to your deployed site
2. Navigate to `/studio`
3. Upload a PDF/DOCX resume
4. Click "Parse & score"
5. **Expected**: Resume data appears + ATS score

#### **Test 2: AI Improve**
1. Go to Template Mode
2. Fill in some text in the summary field
3. Click "Make it more impactful"
4. **Expected**: Improved text appears

#### **Test 3: Full Resume Generation**
1. Go to AI Mode
2. Fill in the form (name, role, skills, etc.)
3. Click "Generate Resume"
4. **Expected**: Complete resume is generated

---

## 🔍 Debugging Tips

### **Check Browser Console**:
```javascript
// Open DevTools (F12) → Console
// Look for errors like:
"Failed to parse resume: GEMINI_API_KEY is not set"
"Missing Gemini API key"
"Gemini API key is missing or invalid"
```

### **Check Network Tab**:
```
1. Open DevTools (F12) → Network tab
2. Try uploading a resume
3. Look for the request to `/api/parse-resume`
4. Check the response:
   - Status 200 = Success ✅
   - Status 401 = Missing API key ❌
   - Status 500 = Server error ❌
```

### **Check Deployment Logs**:

**Netlify**:
```
1. Go to Deploys → Select latest deploy
2. Click "Deploy log"
3. Look for build errors or warnings
```

**Vercel**:
```
1. Go to Deployments → Select latest
2. Click "View Function Logs"
3. Look for runtime errors
```

---

## 🎯 Common Errors & Solutions

### **Error 1**: "API not found" or 404
**Cause**: API routes not deployed correctly
**Solution**: 
- Ensure `app/api/` folder exists in deployment
- Check build logs for errors
- Verify Next.js version compatibility (you're using 16.0.3 ✅)

### **Error 2**: "GEMINI_API_KEY is not set"
**Cause**: Environment variable not configured
**Solution**: Follow steps above to add env var and redeploy

### **Error 3**: "Gemini API key is missing or invalid"
**Cause**: API key is placeholder or incorrect
**Solution**: 
- Verify your API key from Google AI Studio
- Ensure no extra spaces or characters
- Check it starts with `AIzaSy`

### **Error 4**: "Failed to parse resume"
**Cause**: Gemini API quota exceeded or network error
**Solution**:
- Check your Gemini API quota: https://aistudio.google.com/app/apikey
- Free tier: 15 requests/min, 1,500 requests/day
- Wait a few minutes and try again

---

## 📝 Local Development Setup

For local testing, create `.env.local` in the project root:

```bash
# d:\resumio\Resumio\.env.local
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

Then run:
```bash
npm run dev
```

**Note**: `.env.local` is gitignored (line 34 in `.gitignore`), so it won't be committed.

---

## 🔐 Security Notes

1. **Never commit API keys** to Git ✅ (already in `.gitignore`)
2. **Use environment variables** for all secrets ✅ (already implemented)
3. **Server-side only**: API key is only used in API routes (server-side) ✅
4. **No client exposure**: API key is never sent to the browser ✅

---

## 📊 Project Structure Summary

```
d:\resumio\Resumio\
├── app/
│   ├── api/                    # API Routes (Server-side)
│   │   ├── parse-resume/
│   │   │   └── route.ts       # POST /api/parse-resume
│   │   └── ai/
│   │       ├── improve/
│   │       │   └── route.ts   # POST /api/ai/improve
│   │       └── full-resume/
│   │           └── route.ts   # POST /api/ai/full-resume
│   ├── studio/
│   │   └── page.tsx           # Main studio page
│   └── page.tsx               # Landing page
├── components/
│   └── studio/
│       └── modes/
│           ├── UploadModePanel.tsx    # Calls /api/parse-resume
│           ├── TemplateModePanel.tsx  # Calls /api/ai/improve
│           └── AIModePanel.tsx        # Calls /api/ai/full-resume
├── lib/
│   ├── gemini.ts              # Gemini client & helpers
│   ├── prompts.ts             # AI prompts
│   ├── parseResume.ts         # PDF/DOCX parsing
│   ├── ats.ts                 # ATS scoring logic
│   └── resume.ts              # Resume normalization
├── .env.local                 # ⚠️ CREATE THIS (not in repo)
├── netlify.toml               # Netlify config
└── package.json               # Dependencies
```

---

## ✨ Next Steps

1. ✅ **Add `GEMINI_API_KEY`** to Vercel/Netlify environment variables
2. ✅ **Redeploy** your application
3. ✅ **Test** all three modes (Upload, Template, AI)
4. ✅ **Check logs** if issues persist
5. ✅ **Verify API quota** if you get rate limit errors

---

## 🆘 Still Having Issues?

If the API is still not working after following these steps:

1. **Check the exact error message** in browser console
2. **Check deployment logs** for build/runtime errors
3. **Verify the environment variable** is set correctly (no typos, no spaces)
4. **Try a fresh deployment** (delete and redeploy)
5. **Test locally first** with `.env.local` to ensure the code works

---

**Good luck! 🚀**
