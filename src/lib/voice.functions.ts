import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  text: z.string().min(1).max(400),
  voice: z.string().optional(),
});

/**
 * Egyptian friendly TTS via Lovable AI Gateway (OpenAI-compatible /v1/audio/speech).
 * Returns base64 mp3 the client can play with a data URI.
 */
export const speakEgyptian = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice ?? "onyx",
        response_format: "mp3",
        instructions:
          "Speak in warm, friendly Egyptian Arabic (Cairene dialect). " +
          "Tone: light-hearted, comedic, reassuring — like a cheerful older brother cheering the captain on. " +
          "Pace: relaxed and clear. Add slight playful energy but never rush. Never sound robotic or formal (fus-ha).",
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`TTS ${res.status}: ${t.slice(0, 200)}`);
    }

    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { audio: base64, mime: "audio/mpeg" };
  });
