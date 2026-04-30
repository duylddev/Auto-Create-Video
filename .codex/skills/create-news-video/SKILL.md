---
name: create-news-video
description: Tạo video tin tức ngắn 9:16 tiếng Việt từ URL bài báo hoặc file `.txt`. Dùng khi user muốn làm short news, render bài báo thành video, tạo TikTok/Shorts/Reels tin tức. Kết quả là `output/<slug>-<timestamp>/video.mp4`, `voice.mp3`, `script.txt`.
---

# Create News Video

Use this skill when the user wants to turn a Vietnamese news article URL or a local `.txt` file into a vertical short video using this repository.

## Goal

Produce a complete output folder containing:
- `video.mp4`
- `voice.mp3`
- `script.txt`
- `script.json` used by the pipeline

## Input

Accept exactly one source input:
- a news URL starting with `http://` or `https://`, or
- a local `.txt` file path

If the user gives both, prefer the URL unless they explicitly ask to use the file.

## Important repo references

Read these files before generating `script.json`:
- `README.md` for setup and expected outputs
- `docs/superpowers/specs/2026-04-29-auto-news-video-design.md` for content and scene rules
- `src/render/script-schema.ts` for the exact JSON shape accepted by the pipeline
- `src/utils/slug.ts` for slug behavior if you need to mirror repo logic

## Codex workflow

Follow these steps in order.

### 1. Verify the environment

Check the prerequisites that matter for execution:
- `.env.local` exists
- one TTS provider is configured
- `node --version` is at least 22
- `ffmpeg` and `ffprobe` are available

If any required dependency or API credential is missing, stop and tell the user exactly what is missing.

### 2. Detect input type

- `http://` or `https://` → URL mode
- anything else → local file mode

### 3. Read source content

#### URL mode
Use the built-in web capabilities to extract:
- article title
- main article text
- `og:image` URL if present
- source domain

If the page is blocked, JS-only, paywalled, or extraction is unreliable, tell the user to save the article as a `.txt` file and retry with that file.

#### File mode
Read the `.txt` file from disk.
- title = first non-empty line
- content = the rest of the file joined together
- `ogImage = null`
- `domain = "local"`

If the file is empty, stop and tell the user.

### 4. Create the output directory

Create:
- `slug` from the title using the repo slug rules
- `timestamp` in local time as `YYYYMMDD-HHmm`
- `outputDir = output/<slug>-<timestamp>`

Then create the directory.

### 5. Generate `script.json`

Write `output/<slug>-<timestamp>/script.json` that conforms to `src/render/script-schema.ts`.

Core requirements:
- `version` must be `"1.0"`
- `metadata.source.image` must be a valid URL or `null`
- `scenes.length` must be between 5 and 8
- first scene must be `type: "hook"`
- last scene must be `type: "outro"`
- `voice.provider` should match the active provider in `.env.local`: `lucylab`, `elevenlabs`, or `vieneu`
- `voice.voiceId` can use provider placeholders like `"${VIETNAMESE_VOICEID}"`, `"${ELEVENLABS_VOICE_ID}"`, `"${VIENEU_VOICE_ID}"`, or the generic `"${VOICE_ID}"`
- `voice.speed` should normally be `1.0`

### 6. Script-writing rules

Use Vietnamese spoken style.

Required editorial rules:
- total spoken length around 150–200 Vietnamese words
- 5–8 scenes total: 1 hook, 3–6 body scenes, 1 outro
- each `voiceText` should be 1–3 short spoken sentences
- no markdown, no emoji, no URLs inside `voiceText`
- make the hook sharp and curiosity-driven within the first few seconds
- keep on-screen copy concise to satisfy schema field lengths

### 7. Vietnamese TTS rules

Numbers and symbols in `voiceText` must be written in Vietnamese words when natural, especially for decimals and specs.

Examples:
- write `GPT năm chấm năm`, not `GPT 5.5`
- write `hai trăm megapixel`, not `200MP`
- write `ba mươi phần trăm`, not `30%`
- write `năm đô la`, not `$5`

Avoid these in `voiceText` when possible:
- `%`, `$`, `&`, `#`, `+`, `=`
- raw URLs
- emoji

End sentences with `.` or `?` for better TTS pacing.

### 8. Template selection guidance

Use the existing template types from the schema:
- `hook`
- `comparison`
- `stat-hero`
- `feature-list`
- `callout`
- `outro`

Choose templates based on the article shape:
- big surprising claim or question → `hook`
- two sides or before/after → `comparison`
- one dominant number/stat → `stat-hero`
- multiple highlights/specs/features → `feature-list`
- one key takeaway, warning, or quote → `callout`
- final CTA → `outro`

Always include an `outro` scene that promotes following the channel.

### 9. Run the pipeline

After writing `script.json`, run:

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

The pipeline should create:
- `video.mp4`
- `voice.mp3`
- `script.txt`

### 10. Validate result

Confirm these files exist in the output directory:
- `script.json`
- `script.txt`
- `voice.mp3`
- `video.mp4`

If rendering fails but `voice/` files already exist, suggest rerendering with:

```bash
npm run rerender -- output/<slug>-<timestamp>
```

## Output style when using this skill

When responding to the user during execution:
- briefly state whether you are in URL mode or file mode
- mention the output directory once it is created
- report the final paths for `video.mp4`, `voice.mp3`, and `script.txt`
- if blocked, name the exact missing dependency, file, or credential

## Notes

- Prefer minimal manual creativity outside the schema and spec.
- Do not invent extra fields not accepted by `src/render/script-schema.ts`.
- If the article is too long, compress it into the most newsworthy 3–6 points.
- Keep changes surgical: the main deliverable is the generated output, not repo refactors.
