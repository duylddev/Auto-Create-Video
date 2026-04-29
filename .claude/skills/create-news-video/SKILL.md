---
name: create-news-video
description: Tạo video tin tức ngắn 9:16 (~60s) từ URL bài báo hoặc file .txt tiếng Việt. Trigger khi user yêu cầu tạo video tin tức, làm short news, làm bản tin video, render tin thành video, làm TikTok tin tức. Output: video.mp4 + voice.mp3 + script.txt cho CapCut.
---

# Create News Video Skill

Generate a Vietnamese 9:16 motion-graphic news video from a URL or .txt file.

## Input

Single argument: a news article URL (starts with `http://` or `https://`) OR a path to a `.txt` file.

## Workflow (MUST follow these steps in order)

### Step 1: Detect input type

- Starts with `http://` or `https://` → URL mode
- Otherwise → file mode

### Step 2: Fetch content

**URL mode:**
- Use `WebFetch` with prompt:
  ```
  Trích xuất từ trang này:
  - title (string): tiêu đề bài báo
  - content (string): nội dung chính, ~500-1500 từ
  - ogImage (string|null): URL ảnh og:image (meta og:image hoặc ảnh đầu bài)
  - domain (string): domain của URL (vd "vnexpress.net")
  Trả về JSON với 4 field trên.
  ```
- If WebFetch fails (paywall, JS-rendered, 4xx) → tell user to save content to a .txt file and pass that instead. Stop.

**File mode:**
- Use `Read` to read the .txt file
- Title = first non-empty line (strip whitespace, max 80 chars)
- Content = remaining lines joined
- ogImage = `null`
- domain = `"local"`

### Step 3: Create slug + output directory

- slug = lowercase ASCII (strip Vietnamese diacritics, đ→d), replace non-alphanumeric with `-`, trim dashes, max 40 chars
- timestamp = current local time as `YYYYMMDD-HHmm`
- outputDir = `output/<slug>-<timestamp>/`
- Use Bash: `mkdir -p <outputDir>`

### Step 4: Generate script.json

Following the schema in `docs/superpowers/specs/2026-04-29-auto-news-video-design.md` Section 4. Key rules:

**Script content (Vietnamese):**
- Total voiceText: ~150–200 words → ~55–65s spoken at speed 1.0
- Number of scenes: **5–8** (1 hook + 3–6 body + 1 outro)
- Each scene voiceText is 1-3 short sentences, văn nói (spoken style, not formal)
- Read numbers as words: "hai trăm megapixel" not "200MP", "năm nghìn" not "5000"
- No emoji, no markdown in voiceText

**Hook (most important — gets first 3 seconds of viewer attention):**
- Must contain a claim, statistic, or curious question
- NEVER generic ("Hôm nay chúng ta sẽ nói về..." is wrong)
- ALWAYS include at least 1 effect: `flash-white-3f` or `particle-burst`

**Visual rules:**
- For image scenes: `background.src = "$source.image"` (literal — CLI substitutes)
- Vary `kenBurns` across scenes (don't use `zoom-in` for every scene)
- Vary text `animation` (don't use `slide-up` for every line)
- Each line ≤ 25 characters
- Each scene 1-3 lines

**Outro (always fixed format):**
```json
{
  "id": "outro",
  "type": "outro",
  "voiceText": "Theo dõi Công nghệ 24h để xem bản tin mới mỗi ngày.",
  "visual": {
    "background": { "type": "gradient", "preset": "outro-purple" },
    "text": {
      "position": "center",
      "style": "outro-card",
      "lines": [
        { "content": "Xem bản tin mới mỗi ngày", "emphasis": "primary", "animation": "fade-in" },
        { "content": "Công nghệ 24h",            "emphasis": "channel", "animation": "scale-pop" },
        { "content": "Nguồn: <DOMAIN>",          "emphasis": "muted",   "animation": "fade-in-late" }
      ]
    }
  }
}
```
Replace `<DOMAIN>` with the actual domain string. Note: outro line 1 is shortened to fit 25-char schema rule (full CTA "Theo dõi để xem bản tin mới mỗi ngày" is 36 chars).

### Step 5: Self-validate before writing

Check:
- Total word count ~150-200
- Every line.content ≤ 25 chars
- 5-8 scenes total
- scenes[0].type === "hook"
- last scene type === "outro"
- All enum values valid (see spec Section 4.2)

If invalid, fix yourself silently. Up to 2 self-correction passes. After that, write anyway — the CLI's Zod validation will produce a precise error message that the user can act on.

### Step 6: Write script.json

Use the Write tool (not Bash) to write the validated JSON to `<outputDir>/script.json`.

### Step 7: Run the pipeline

Use Bash, **foreground** (not background), stream output:

```bash
npm run pipeline -- <outputDir>/script.json
```

If exit code != 0:
- Report the error message clearly
- Tell user the output dir path so they can inspect intermediate files

### Step 8: Report success

If successful, report to user with markdown links:

```markdown
✓ Video:  [video.mp4](output/<slug>-<timestamp>/video.mp4)
✓ Audio:  [voice.mp3](output/<slug>-<timestamp>/voice.mp3) — for CapCut
✓ Script: [script.txt](output/<slug>-<timestamp>/script.txt) — for CapCut auto-caption
Tổng thời lượng: XX.Xs
```

## Examples

### Example 1: URL with image (vnexpress)

User: `/create-news-video https://vnexpress.net/iphone-17-200mp`

Generated `script.json` (excerpt):
```json
{
  "version": "1.0",
  "metadata": {
    "title": "Apple ra mắt iPhone 17 với camera 200MP",
    "source": {
      "url": "https://vnexpress.net/iphone-17-200mp",
      "domain": "vnexpress.net",
      "image": "https://i1-vnexpress.vnecdn.net/iphone17.jpg"
    },
    "channel": "Công nghệ 24h"
  },
  "voice": { "provider": "lucylab", "voiceId": "${VIETNAMESE_VOICEID}", "speed": 1.0 },
  "scenes": [
    {
      "id": "hook", "type": "hook",
      "voiceText": "Apple vừa ra mắt iPhone 17 với camera hai trăm megapixel.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "zoom-in" },
        "overlay":    { "darkness": 0.4 },
        "text": {
          "position": "center", "style": "hook-large",
          "lines": [
            { "content": "iPhone 17",     "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Camera 200MP!", "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f", "particle-burst"]
      }
    }
    /* ... 3 body scenes + outro ... */
  ]
}
```

### Example 2: .txt file with no image (local)

User: `/create-news-video news/agi-update.txt`

Generated `script.json` (excerpt):
```json
{
  "metadata": {
    "title": "OpenAI công bố mô hình mới với khả năng lập luận",
    "source": { "url": "local", "domain": "local", "image": null },
    "channel": "Công nghệ 24h"
  },
  "scenes": [
    {
      "id": "hook", "type": "hook",
      "voiceText": "OpenAI vừa công bố mô hình mới có khả năng lập luận như con người.",
      "visual": {
        "background": { "type": "gradient", "preset": "news-dark" },
        "text": {
          "position": "center", "style": "hook-large",
          "lines": [
            { "content": "Mô hình mới", "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Lập luận!",  "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f"]
      }
    }
    /* ... outro line 3 = "Nguồn: local" ... */
  ]
}
```
Note: when source has no image, every scene uses `background.type = "gradient"` (no image fallback at composer level needed).

## Sound Effects (SFX)

The pipeline auto-mixes a sound effect at each scene start based on the template type:

| Template | Default SFX | Sound character |
|---|---|---|
| `hook` | `transition/whoosh-soft` | Dramatic entrance |
| `comparison` | `transition/swoosh` | Side-by-side reveal |
| `stat-hero` | `emphasis/ding` | Number reveal |
| `feature-list` | `transition/pop` | Bullet appearance |
| `callout` | `alert/notification` | Important info |
| `outro` | `outro/tada` | Ending signature |

**You usually do NOT need to add a `sfx` field** — defaults work for 95% of cases.

**ONLY add an explicit `sfx` override when content STRONGLY suggests a different mood:**

| Content cue (in voiceText) | Override |
|---|---|
| "cảnh báo", "rủi ro", "đáng lo", "nguy hiểm" | `{ "name": "alert/notification", "volume": 0.4 }` |
| "vượt", "kỷ lục", "xuất sắc", "tăng mạnh" (positive stat) | `{ "name": "emphasis/chime", "volume": 0.35 }` |
| Want to disable SFX for this scene | `{ "name": "none" }` |

Place `sfx` at the same level as `voiceText` and `templateData`:

```json
{
  "id": "body-3",
  "type": "body",
  "voiceText": "Cảnh báo: AI tự chủ có thể đặt ra rủi ro về an ninh mạng.",
  "templateData": { "template": "callout", ... },
  "sfx": { "name": "alert/notification", "volume": 0.4 }
}
```

Available SFX categories (any `<name>` subfolder in `assets/sfx/<category>/<name>.mp3`):
- `transition/` — whoosh, swoosh, swish, pop, punch, page-flip, slide, riser
- `emphasis/` — ding, tick, chime, ping, bong, pop, punch
- `alert/` — notification, alert, alarm, warning
- `success/` — applepay, achievement, win, xbox, steam, jet-set
- `fail/` — wrong-answer-buzzer, incorrect, error, dank-meme
- `outro/` — tada, win31, noooo
- `reveal/` — magic-fairy, anime-girl, hey-female-voice
- `drumroll/` — snare, drum-roll, boom
- `countdown/` — beep, timer
- `cinematic/` — rise, impact

Browse `assets/sfx/<category>/` to see exact filenames. Reference WITHOUT the `.mp3` extension. Example:
```json
{ "sfx": { "name": "success/xbox-360-achievement-sound", "volume": 0.4 } }
```

## Edge cases

| Situation | Action |
|---|---|
| URL paywall / JS-rendered → WebFetch returns no content | Tell user: "Không đọc được URL (có thể do paywall hoặc JS). Hãy lưu nội dung vào file .txt rồi gọi lại." Stop. |
| URL content < 200 words | Warn "Tin gốc ngắn, video có thể không đủ chất liệu", continue anyway |
| URL content > 2000 words | Summarize to key points, fit ~150-200 words script |
| File mode + file empty/missing | Error message, don't create output dir |
| Pipeline fails | Report error message + output dir path; user can re-try `npm run pipeline -- <path>` after fixing |
