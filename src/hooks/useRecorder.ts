import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "stopped" | "error";

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [format, setFormat] = useState<string>("webm");
  const [fehler, setFehler] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const start = useCallback(async () => {
    setFehler(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setFormat(type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm");
        setAudioUrl(URL.createObjectURL(blob));
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = String(reader.result);
          setAudioBase64(result.slice(result.indexOf(",") + 1));
        };
        reader.readAsDataURL(blob);
        setStatus("stopped");
      };
      rec.start();
      recorderRef.current = rec;
      setAudioUrl(null);
      setAudioBase64(null);
      setStatus("recording");
      return true;
    } catch {
      setFehler("Kein Zugriff auf das Mikrofon. Bitte erlaube die Mikrofon-Nutzung im Browser.");
      setStatus("error");
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setStatus("idle");
    setAudioUrl(null);
    setAudioBase64(null);
    setFehler(null);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { status, start, stop, reset, audioUrl, audioBase64, format, fehler };
}