# Auditt — Compliance Binder Generator

A lightweight web app that helps small regulated businesses turn messy internal notes and documents into clean, structured policies/SOPs, daily/weekly checklists, incident/report forms, and a single downloadable Binder PDF.

## Supported Niches

- 🍽️ **Restaurant / Food Business** — Food safety SOPs, cleaning checklists, allergen policies, temperature logs, staff hygiene
- 🧒 **Daycare / Childcare Centre** — Child safety SOPs, cleaning checklists, incident reports, pickup authorization forms, emergency drills
- 🏥 **Clinic / Dental / Physio** — Infection control SOPs, consent forms, equipment logs, waste disposal protocols

## Key Features

- **No prompting** — Users upload files and click "Generate Pack"
- **AI-powered** — Uses NVIDIA NIM (moonshotai/kimi-k2-thinking) to extract facts, detect gaps, and generate documents
- **Gap detection** — Up to 7 tap-based questions if information is missing
- **Binder PDF export** — Branded, versioned, audit-ready PDF
- **Draft warnings** — Uncertain items clearly marked as "Needs Review"
- **Rate limiting** — Built-in abuse protection
- **Optional Cloud Save** — User-controlled; off = instant/no persistence, on = save generation data in Supabase
- **Language support** — Choose any target language by name; optional bilingual mode (selected language + English)

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your NIM API key:
   ```
   NIM_API_KEY=nvapi-your-key-here
   ```

   Optional for cloud save:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Security

- The NIM API key is **server-side only** — never exposed to the browser
- Supabase service role key is **server-side only** — never exposed to the browser
- Rate limiting: 10 requests per IP per hour
- All AI processing happens via secure API routes

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS**
- **NVIDIA NIM API** (OpenAI-compatible, `moonshotai/kimi-k2-thinking`)
- **react-dropzone** for file uploads

## Disclaimer

This tool helps generate documentation and checklists. It is not legal advice. Always review and adapt to your local regulations before use.
