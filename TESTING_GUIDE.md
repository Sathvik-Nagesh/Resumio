# Quick API Test Guide

## Test Your API Locally

### 1. Create `.env.local` file:

```bash
# In the project root: d:\resumio\Resumio\.env.local
GEMINI_API_KEY=your_actual_api_key_here
```

### 2. Start the dev server:

```bash
npm run dev
```

### 3. Open your browser to:
```
http://localhost:3000/studio
```

### 4. Test each mode:

#### ✅ Upload Mode Test:
1. Click "Upload" tab
2. Upload a PDF/DOCX resume
3. Click "Parse & score"
4. **Expected**: Resume data appears

#### ✅ Template Mode Test:
1. Click "Template" tab
2. Fill in the "Professional Summary" field
3. Click "Make it more impactful"
4. **Expected**: Improved text appears

#### ✅ AI Mode Test:
1. Click "AI" tab
2. Fill in the form (name, role, skills)
3. Click "Generate Resume"
4. **Expected**: Complete resume is generated

---

## Test API Endpoints Directly (Advanced)

### Test `/api/parse-resume`:

```bash
# Using curl (PowerShell)
$file = "path\to\your\resume.pdf"
curl -X POST http://localhost:3000/api/parse-resume `
  -F "file=@$file" `
  -F "jobDescription=Software Engineer position"
```

### Test `/api/ai/improve`:

```bash
# Using curl (PowerShell)
curl -X POST http://localhost:3000/api/ai/improve `
  -H "Content-Type: application/json" `
  -d '{\"mode\":\"impactful\",\"text\":\"I worked on projects\",\"tone\":\"professional\",\"context\":\"resume summary\"}'
```

### Test `/api/ai/full-resume`:

```bash
# Using curl (PowerShell)
curl -X POST http://localhost:3000/api/ai/full-resume `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"role\":\"Software Engineer\",\"skills\":\"JavaScript, React, Node.js\",\"yearsExp\":\"5\"}'
```

---

## Check if Environment Variable is Loaded

Add this temporary test endpoint:

**File**: `app/api/test-env/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 8) || "NOT_SET",
    // Never return the full key!
  });
}
```

Then visit: `http://localhost:3000/api/test-env`

**Expected response**:
```json
{
  "hasApiKey": true,
  "keyLength": 39,
  "keyPrefix": "AIzaSy..."
}
```

**If you see**:
```json
{
  "hasApiKey": false,
  "keyLength": 0,
  "keyPrefix": "NOT_SET"
}
```

Then your `.env.local` file is not being loaded. Make sure:
1. File is named exactly `.env.local` (not `.env.local.txt`)
2. File is in the project root (`d:\resumio\Resumio\.env.local`)
3. You restarted the dev server after creating the file

---

## Deployment Verification

### For Netlify:

1. Go to your deployed site
2. Add `/api/test-env` to the URL
3. Check if `hasApiKey` is `true`

### For Vercel:

1. Go to your deployed site
2. Add `/api/test-env` to the URL
3. Check if `hasApiKey` is `true`

**If `hasApiKey` is `false`**:
- Environment variable is not set correctly
- Follow the steps in `API_DIAGNOSIS.md` to add it

**If `hasApiKey` is `true`**:
- Environment variable is set correctly ✅
- The issue might be with the Gemini API itself
- Check your API quota and key validity

---

## Common Issues

### Issue: "Cannot find module '@/lib/gemini'"
**Solution**: Make sure you're in the correct directory:
```bash
cd d:\resumio\Resumio
npm run dev
```

### Issue: "Port 3000 is already in use"
**Solution**: Kill the existing process or use a different port:
```bash
# Kill existing process
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Issue: ".env.local not being read"
**Solution**: 
1. Verify file location: `d:\resumio\Resumio\.env.local`
2. Restart dev server (Ctrl+C, then `npm run dev`)
3. Check file encoding (should be UTF-8)
4. No spaces in variable name: `GEMINI_API_KEY=value` (not `GEMINI_API_KEY = value`)

---

## Success Indicators

✅ **Local dev working**: All three modes work in `/studio`
✅ **API key loaded**: `/api/test-env` shows `hasApiKey: true`
✅ **No console errors**: Browser console is clean
✅ **Deployment working**: Same behavior on Vercel/Netlify as local

---

**Once local testing works, deployment should work too!** 🎉
