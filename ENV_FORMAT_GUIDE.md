# Environment Variable Format Checker

## ✅ Correct Format

Copy this EXACTLY (replace the value with your actual key):

```
GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
```

**Rules**:
1. ✅ Variable name: `GEMINI_API_KEY` (all caps, underscores)
2. ✅ No spaces before or after the `=`
3. ✅ No quotes around the value
4. ✅ No trailing spaces
5. ✅ Key should start with `AIzaSy`
6. ✅ Key should be exactly 39 characters

---

## ❌ Common Mistakes

### Mistake 1: Extra spaces
```
GEMINI_API_KEY = AIzaSy...     ← WRONG (spaces around =)
GEMINI_API_KEY=AIzaSy...       ← CORRECT
```

### Mistake 2: Quotes
```
GEMINI_API_KEY="AIzaSy..."     ← WRONG (quotes)
GEMINI_API_KEY=AIzaSy...       ← CORRECT
```

### Mistake 3: Wrong variable name
```
NEXT_PUBLIC_GEMINI_API_KEY=... ← WRONG (wrong prefix)
gemini_api_key=...             ← WRONG (lowercase)
GEMINI-API-KEY=...             ← WRONG (hyphens)
GEMINI_API_KEY=...             ← CORRECT
```

### Mistake 4: Trailing space
```
GEMINI_API_KEY=AIzaSy... ← WRONG (space at end)
GEMINI_API_KEY=AIzaSy...← CORRECT
```

---

## 🧪 Test Your API Key

### Step 1: Verify key format

Your API key should look like this:
```
AIzaSyABC123def456GHI789jkl012MNO345pqr
```

- Starts with: `AIzaSy`
- Length: 39 characters
- Contains: Letters (A-Z, a-z) and numbers (0-9)
- No special characters (except the key itself)

### Step 2: Test the key directly

Visit this URL in your browser (replace with your key):
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY_HERE
```

**Expected**: You should see a JSON response (even if it's an error about missing request body)

**If you get**: "API key not valid" → Your key is wrong or expired

---

## 📋 Platform-Specific Formats

### For .env.local (Local Development)

**File location**: `d:\resumio\Resumio\.env.local`

**Content**:
```
GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
```

**No quotes, no spaces, no comments on the same line**

---

### For Netlify UI

**Navigate to**: Site configuration → Environment variables

**Add variable**:
- **Key**: `GEMINI_API_KEY` (copy exactly)
- **Value**: `AIzaSyABC123def456GHI789jkl012MNO345pqr` (your actual key)
- **Scopes**: Select **All scopes**

**Screenshot example**:
```
┌─────────────────────────────────────────────┐
│ Key:   GEMINI_API_KEY                       │
│ Value: AIzaSy...                            │
│ Scopes: ☑ All scopes                        │
│         ☑ All deploys                       │
└─────────────────────────────────────────────┘
```

---

### For Vercel UI

**Navigate to**: Settings → Environment Variables

**Add New**:
- **Name**: `GEMINI_API_KEY` (copy exactly)
- **Value**: `AIzaSyABC123def456GHI789jkl012MNO345pqr` (your actual key)
- **Environment**: 
  - ☑ Production
  - ☑ Preview
  - ☑ Development

**Screenshot example**:
```
┌─────────────────────────────────────────────┐
│ Name:  GEMINI_API_KEY                       │
│ Value: AIzaSy...                            │
│ Environment:                                │
│   ☑ Production                              │
│   ☑ Preview                                 │
│   ☑ Development                             │
└─────────────────────────────────────────────┘
```

---

## 🔍 Verification Checklist

Before deploying, verify:

- [ ] Variable name is exactly: `GEMINI_API_KEY`
- [ ] No spaces in the variable name
- [ ] No spaces around the `=` sign
- [ ] No quotes around the value
- [ ] API key starts with `AIzaSy`
- [ ] API key is 39 characters long
- [ ] No trailing spaces or newlines
- [ ] Selected all scopes/environments
- [ ] Triggered a new deploy (not just save)
- [ ] Cleared build cache when redeploying

---

## 🧪 Quick Test

After deploying, run this test:

```bash
# Visit your deployed site
https://your-site.com/api/test-env

# Expected response:
{
  "hasApiKey": true,
  "keyLength": 39,
  "keyPrefix": "AIzaSy...",
  "availableEnvKeys": ["GEMINI_API_KEY", ...]
}
```

**If `hasApiKey` is `false`**:
1. Check `availableEnvKeys` array
2. If `GEMINI_API_KEY` is NOT in the array → Variable not set
3. If `GEMINI_API_KEY` IS in the array → Variable is empty or wrong format

---

## 🆘 Still Having Issues?

### Debug Step 1: Check the exact variable name

In Netlify/Vercel UI, the variable name should show **exactly**:
```
GEMINI_API_KEY
```

Not:
- `GEMINI_API_KEY ` (with space)
- `GEMINI_API_KEY=` (with equals)
- `"GEMINI_API_KEY"` (with quotes)

### Debug Step 2: Check the value

The value should be **just the key**, nothing else:
```
AIzaSyABC123def456GHI789jkl012MNO345pqr
```

Not:
- `"AIzaSy..."` (with quotes)
- `AIzaSy... ` (with trailing space)
- `GEMINI_API_KEY=AIzaSy...` (with variable name)

### Debug Step 3: Regenerate your API key

Sometimes API keys get corrupted. Generate a fresh one:

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API key"**
3. Copy the new key
4. Update in Netlify/Vercel
5. Redeploy

---

## 📸 Screenshot Template

If you need help, take a screenshot showing:

1. **The environment variable settings** (blur the actual key value)
2. **The response from `/api/test-env`**
3. **The build logs** (any errors or warnings)

---

**Copy the format exactly, no modifications!** ✅
