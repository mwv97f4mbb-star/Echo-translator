Echo - Real-Time AI Voice Translator 🎙️✨

An ultra-fast, real-time voice translation Progressive Web App (PWA) built to demonstrate an AI-first development approach. 

Powered by the latest **Google Gemini 2.5 Flash** model and **Vercel AI SDK**, Echo processes continuous speech and streams the translation with premium UI animations.

## 🚀 Features
- **Continuous Speech Recognition:** Uses native Web Speech API with a smart debounce algorithm for seamless talking.
- **True Real-Time Streaming:** Edge Runtime backend delivers translation chunks instantly without buffering.
- **Premium UI/UX:** Built with Tailwind CSS and Framer Motion for a smooth, typewriter-style text reveal.
- **PWA Ready:** Fully responsive and installable on iOS/Android as a standalone mobile application.

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **AI & Streaming:** Vercel AI SDK, Google Gemini API
- **Styling:** Tailwind CSS, Lucide React
- **Animations:** Framer Motion
- **Language:** TypeScript

## ⚙️ Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/mwv97f4mbb-star/echo-translator.git
Install dependencies:
Bash
npm install
Create a .env.local file in the root directory and add your Gemini API Key:

Env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
Start the development server:

Bash
npm run dev
Open http://localhost:3000 in your browser (Use Google Chrome for Web Speech API support).