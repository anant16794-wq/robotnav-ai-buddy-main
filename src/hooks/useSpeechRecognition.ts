import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

interface SpeechRecognitionResultLike {
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorLike {
  error?: string;
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const w = window as SpeechRecognitionWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: SpeechRecognitionEventLike) => {
      const text = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join(" ");
      setTranscript(text);
    };
    r.onerror = (e: SpeechRecognitionErrorLike) => {
      setError(e.error || "speech-error");
      setListening(false);
    };
    r.onend = () => setListening(false);
    recogRef.current = r;
    return () => {
      try {
        r.stop();
      } catch {
        setListening(false);
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!recogRef.current) return;
    setError(null);
    setTranscript("");
    try {
      recogRef.current.start();
      setListening(true);
    } catch {
      setListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (!recogRef.current) return;
    try {
      recogRef.current.stop();
    } catch {
      setListening(false);
    }
    setListening(false);
  }, []);

  return { supported, listening, transcript, error, start, stop, setTranscript };
}
