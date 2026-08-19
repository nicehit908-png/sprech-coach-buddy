import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  audioBase64: z.string().min(100),
  format: z.string().min(2).max(10),
  thema: z.string().min(1).max(120),
  musterloesung: z.string().min(1).max(12000),
});

export const analysiereAufnahme = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { analyseAudio } = await import("./ai.server");
    return analyseAudio(data);
  });