import { z } from "zod";

const KenBurns = z.enum([
  "zoom-in",
  "zoom-out",
  "pan-left-slow",
  "pan-right-slow",
  "pan-up-slow",
  "pan-down-slow",
]);

const GradientPreset = z.enum([
  "outro-purple",
  "outro-blue",
  "news-red",
  "news-dark",
]);

const TextPosition = z.enum(["center", "top", "bottom"]);
const TextStyle = z.enum(["hook-large", "body-medium", "body-small", "outro-card"]);
const Emphasis = z.enum(["primary", "accent", "channel", "muted"]);
const Animation = z.enum([
  "scale-pop",
  "slide-up",
  "slide-up-bounce",
  "slide-down",
  "slide-left",
  "slide-right",
  "fade-in",
  "fade-in-late",
  "typewriter",
]);
const Effect = z.enum([
  "flash-white-3f",
  "particle-burst",
  "screen-shake-light",
  "color-flash-accent",
]);

const BackgroundImage = z.object({
  type: z.literal("image"),
  src: z.string(),
  kenBurns: KenBurns,
});

const BackgroundGradient = z.object({
  type: z.literal("gradient"),
  preset: GradientPreset,
});

const Background = z.discriminatedUnion("type", [BackgroundImage, BackgroundGradient]);

const Line = z.object({
  content: z.string().min(1).max(25, "line.content must be ≤ 25 chars"),
  emphasis: Emphasis,
  animation: Animation,
});

const Visual = z.object({
  background: Background,
  overlay: z.object({ darkness: z.number().min(0).max(1) }).optional(),
  text: z.object({
    position: TextPosition,
    style: TextStyle,
    lines: z.array(Line).min(1).max(3),
  }),
  effects: z.array(Effect).default([]),
});

const Scene = z.object({
  id: z.string().min(1),
  type: z.enum(["hook", "body", "outro"]),
  voiceText: z.string().min(1),
  visual: Visual,
});

export const ScriptSchema = z.object({
  version: z.literal("1.0"),
  metadata: z.object({
    title: z.string().min(1),
    source: z.object({
      url: z.string(),
      domain: z.string(),
      image: z.string().url().nullable(),
    }),
    channel: z.string().min(1),
  }),
  voice: z.object({
    provider: z.literal("lucylab"),
    voiceId: z.string().min(1),
    speed: z.number().min(0.5).max(2.0),
  }),
  scenes: z
    .array(Scene)
    .min(5)
    .max(8, "scenes must have at most 8 items")
    .refine(
      (s) => s[0]?.type === "hook",
      { message: "scenes[0] must be type=hook" }
    )
    .refine(
      (s) => s[s.length - 1]?.type === "outro",
      { message: "last scene must be type=outro" }
    ),
});

export type Script = z.infer<typeof ScriptSchema>;
