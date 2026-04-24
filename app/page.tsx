'use client';

import { useState, useRef, useEffect } from "react";
import { Settings, Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const langConfig: Record<string, { name: string, code: string }> = {
  'RU': { name: 'Russian', code: 'ru-RU' },
  'EN': { name: 'English', code: 'en-US' },
  'PL': { name: 'Polish', code: 'pl-PL' }
};

export default function VoiceTranslator() {
  const [alwaysOn, setAlwaysOn] = useState(false);
  const [languagePair, setLanguagePair] = useState("RU - EN");
  
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [srcKey, tgtKey] = languagePair.split(' - ');
  const targetLang = langConfig[tgtKey]?.name || 'English';
  const sourceLangCode = langConfig[srcKey]?.code || 'ru-RU';

  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!originalText.trim()) return;

    const timeoutId = setTimeout(() => {
      streamTranslation(originalText);
    }, 275);

    return () => clearTimeout(timeoutId);
  }, [originalText, languagePair]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const streamTranslation = async (text: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, targetLang }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullTranslation = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        fullTranslation += decoder.decode(value, { stream: true });
        setTranslatedText(fullTranslation);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      streamTranslation(originalText);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      return;
    }

    // Безопасная проверка для iOS Safari
    const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
    
    if (!SpeechRecognition) {
      alert("К сожалению, Apple блокирует Web Speech API в вашем браузере. Используйте десктопный Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = sourceLangCode;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setOriginalText("");
      setTranslatedText("");
    };

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setOriginalText(fullTranscript);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current && !alwaysOn) {
          recognitionRef.current.stop();
          setIsListening(false);
        }
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error('Ошибка микрофона:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setIsListening(false);
        alert("Пожалуйста, разрешите доступ к микрофону в настройках Safari.");
      }
    };

    recognition.onend = () => {
      if (alwaysOn) {
        recognition.start();
      } else {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-100 cursor-pointer touch-manipulation">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAlwaysOn(!alwaysOn);
                if (!alwaysOn && silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer touch-manipulation ${alwaysOn ? 'bg-purple-500' : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alwaysOn ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${alwaysOn ? "text-purple-400" : "text-zinc-500"}`}>
              Always on
            </span>
          </div>
        </div>

        <select 
          value={languagePair} 
          onChange={(e) => setLanguagePair(e.target.value)}
          disabled={isLoading || isListening}
          className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md px-4 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none cursor-pointer touch-manipulation"
        >
          <option value="RU - EN">RU - EN</option>
          <option value="RU - PL">RU - PL</option>
          <option value="EN - RU">EN - RU</option>
          <option value="EN - PL">EN - PL</option>
          <option value="PL - RU">PL - RU</option>
          <option value="PL - EN">PL - EN</option>
        </select>
      </header>

      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-h-0">
          
          <div className="flex flex-col gap-2 min-h-[200px] md:min-h-0">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex justify-between">
              <span>Original text</span>
              {isListening && <span className="text-red-400 animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Listening...
              </span>}
            </label>
            <div className="flex-1 relative">
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Speak into the microphone or type..."
                className={`w-full h-full min-h-[180px] md:min-h-full resize-none bg-zinc-900 border rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all ${isListening ? 'border-red-500/50' : 'border-zinc-800 focus:border-zinc-700'}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 min-h-[200px] md:min-h-0">
            <label className="text-xs font-medium text-purple-400/80 uppercase tracking-wider flex justify-between">
              <span>Translation</span>
              {isLoading && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
            </label>
            <div className="flex-1 relative w-full h-full min-h-[180px] md:min-h-full bg-zinc-900 border border-purple-500/30 rounded-xl p-4 text-zinc-100 overflow-y-auto shadow-[0_0_15px_rgba(168,85,247,0.08)]">
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-4 text-sm font-mono break-words">
                  Error: {error}
                </div>
              )}

              {!translatedText && !isLoading && !error && (
                <span className="text-zinc-600">Translation will appear here...</span>
              )}

              <div className="text-lg leading-relaxed inline break-words">
                <AnimatePresence>
                  {translatedText.split('').map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="p-6 sm:p-8 flex justify-center">
        <button
          onClick={toggleListening}
          className={`group relative p-6 rounded-full transition-all duration-300 cursor-pointer touch-manipulation ${
            isListening
              ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              : "bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          }`}
        >
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-20" />
              <MicOff className="w-8 h-8 text-white relative z-10 transition-transform scale-110" />
            </>
          )}
          {!isListening && (
            <Mic className="w-8 h-8 text-white relative z-10 transition-transform group-hover:scale-110" />
          )}
        </button>
      </footer>
    </div>
  );
}