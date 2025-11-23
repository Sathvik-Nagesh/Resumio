# 🔑 Setting Up Your Gemini API Key

## Quick Setup

1. **Get your API key** from Google AI Studio:
   👉 https://aistudio.google.com/app/apikey

2. **Open the `.env.local` file** in the project root:
   ```
   d:\Projects v2\sathvik-resume-studio\.env.local
   ```

3. **Replace the placeholder** with your actual key:
   ```bash
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

4. **Restart the dev server** (if it's running):
   - Press `Ctrl+C` in the terminal
   - Run `npm run dev` again

## Why You Need This

The Gemini API key enables:
- ✨ **AI Resume Parsing** - Upload PDF/DOCX and get structured data
- 🎯 **Smart Improvements** - "Make it more clarity/concise/impactful" buttons
- 🤖 **Full Resume Generation** - Create complete resumes from job descriptions

**Model Used**: `gemini-2.0-flash` (latest stable model - 2x faster than 1.5!)

## Error Messages

If you see these errors, you need to add your API key:

- ❌ "Gemini API key not configured"
- ❌ "GEMINI_API_KEY is not set"
- ❌ "Failed to parse resume: [API error]"

## Free Tier

Google's Gemini API has a generous free tier:
- **15 requests per minute**
- **1,500 requests per day**
- **1 million tokens per day**

Perfect for development and personal use!

## Security Note

⚠️ **Never commit your API key to Git!**

The `.env.local` file is already in `.gitignore`, so it won't be committed.
Keep your API key private and don't share it publicly.

---

**Need help?** Check the [Gemini API docs](https://ai.google.dev/gemini-api/docs)
