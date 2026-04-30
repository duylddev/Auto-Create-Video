# 🎬 Auto News Video

> Tự động tạo video tin tức ngắn 9:16 (~60s) tiếng Việt cho TikTok / YouTube Shorts / Instagram Reels từ URL bài báo hoặc file `.txt`.
>
> *Auto-generate Vietnamese 9:16 short news videos (~60s) for TikTok / YouTube Shorts / Instagram Reels from a news URL or `.txt` file.*

[![Tests](https://img.shields.io/badge/tests-35%20passing-brightgreen)]() [![Node](https://img.shields.io/badge/node-22%2B-blue)]() [![License](https://img.shields.io/badge/license-MIT-green)]()

---

# 🇻🇳 Tiếng Việt

## Giới thiệu

**Auto News Video** là một dự án mã nguồn mở giúp bạn **biến bất kỳ bài báo công nghệ tiếng Việt nào** thành một video ngắn motion-graphic chuyên nghiệp chỉ với 1 lệnh duy nhất trong [Claude Code](https://docs.claude.com/en/docs/claude-code/overview).

Pipeline tự động làm các bước:
1. **Đọc URL bài báo** (hoặc file `.txt`) và phân tích nội dung
2. **Sinh kịch bản JSON** với 6 loại template visual khác nhau (hook, comparison, stat-hero, feature-list, callout, outro) — chọn theo nội dung bài viết
3. **Tổng hợp giọng đọc** tiếng Việt qua **LucyLab**, **ElevenLabs** hoặc **VieNeu-TTS (remote mode)**
4. **Render video MP4** với HyperFrames (Puppeteer + GSAP + FFmpeg) — phong cách **studio shell** + animation hiện đại
5. **Xuất kèm script.txt và voice.mp3** để bạn import vào CapCut Pro thêm caption / nhạc nền

### 🎯 Tại sao project này?

- ✅ **Phong cách HeyGen-quality**: persistent brand shell (icon, channel, handle), grain texture, gradient navy + cyan + purple
- ✅ **6 loại scene template** tự pick theo nội dung — không rập khuôn
- ✅ **Đa nhà cung cấp TTS**: LucyLab (giọng Việt tự nhiên + SRT free), ElevenLabs (đa ngôn ngữ) hoặc VieNeu-TTS remote mode (tự host server)
- ✅ **Tích hợp Claude Code skill** — chỉ cần `/create-news-video <url>` là xong
- ✅ **Mở rộng được**: schema rõ ràng, code modular, có test suite

### 🛠️ Công nghệ & thư viện sử dụng

| Lớp | Công nghệ |
|---|---|
| **Runtime** | Node.js ≥ 22, TypeScript 5+, ESM |
| **Render engine** | [HyperFrames](https://hyperframes.heygen.com) (Puppeteer + GSAP + FFmpeg) |
| **TTS providers** | [LucyLab.io](https://lucylab.io) (JSON-RPC, Vietnamese cloning), [ElevenLabs](https://elevenlabs.io) (REST, multilingual) hoặc VieNeu-TTS remote mode (self-hosted) |
| **Validation** | [Zod](https://zod.dev) (discriminated union schema) |
| **HTTP** | axios + nock (mocking) |
| **Testing** | Vitest |
| **Audio** | FFmpeg + ffprobe (mix, concat với silence) |
| **AI/Skill** | [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) skill (`/create-news-video`) |
| **Visual blocks** | HyperFrames registry: `grain-overlay`, `shimmer-sweep`, `tiktok-follow` |
| **Fonts** | Inter + Anton (Google Fonts) |

### 🔬 Giải thích chi tiết các công nghệ chính

#### 🎞️ HyperFrames — trái tim của render engine
[HyperFrames](https://hyperframes.heygen.com) là framework HTML-to-video do **HeyGen** phát triển và mã nguồn mở. Khác với cách dùng After Effects hay Premiere thủ công, HyperFrames cho phép bạn **viết video bằng HTML/CSS/JS** rồi render thành MP4 chất lượng cao một cách **deterministic** (cùng input → cùng output frame-by-frame).

**Cách nó hoạt động trong dự án:**
1. Pipeline sinh ra một file `index.html` chứa toàn bộ scenes + GSAP timeline
2. HyperFrames spawn headless Chrome (Puppeteer) để load file đó
3. Capture từng frame ở đúng timestamp (30fps × 60s = 1800 frames)
4. Encode tất cả frames + audio thành MP4 dùng FFmpeg

**Tại sao chọn HyperFrames?**
- ✅ **Có sẵn 50+ pre-built blocks** trong registry (transitions, social cards, data viz, kinetic typography...) — dùng `npx hyperframes add <name>`
- ✅ **GSAP timeline** đã được tích hợp sẵn cho animations mượt mà
- ✅ **Skill-friendly cho AI agent** — Claude/GPT có thể tự sinh composition HTML
- ✅ **Lint built-in** (`npx hyperframes lint`) phát hiện lỗi composition trước khi render
- ✅ **Aspect ratio 9:16 native** — sinh ra cho short-form video

**Các blocks/components dùng trong dự án:**
- `grain-overlay` — film grain texture xuyên video (cảm giác "analog warmth")
- `shimmer-sweep` — light pass animation cho text headline
- `tiktok-follow` — outro CTA card (đã sẵn 1080×1920)

#### 🎤 LucyLab vs ElevenLabs — chọn cái nào?

| Tiêu chí | LucyLab | ElevenLabs |
|---|---|---|
| **Giọng tiếng Việt** | ⭐⭐⭐⭐⭐ Tự nhiên (voice cloning) | ⭐⭐⭐⭐ Tốt (multilingual) |
| **Chi phí** | Rẻ (~25k VND / 1M ký tự) | Đắt hơn (~$5 / 30k ký tự) |
| **Voice library** | Tự clone giọng | 1000+ voices có sẵn |
| **API style** | JSON-RPC async (poll) | REST sync (instant) |
| **SRT subtitle** | ✅ Free, kèm theo response | ❌ Không có |
| **Concurrency** | 1 export/account | Parallel OK |
| **Languages khác** | ❌ Chỉ tiếng Việt | ✅ 30+ ngôn ngữ |

**Khuyến nghị:**
- 🇻🇳 **Chỉ làm video tiếng Việt** → chọn **LucyLab** (rẻ + giọng tự nhiên + có SRT)
- 🌍 **Làm đa ngôn ngữ hoặc cần voice library lớn** → chọn **ElevenLabs**
- 🔄 **Không chắc** → bắt đầu với LucyLab; khi muốn tự host thì chuyển sang VieNeu hoặc dùng ElevenLabs khi cần voice cloud

#### 🛡️ Zod — schema validation an toàn

[Zod](https://zod.dev) là TypeScript-first schema library. Trong project này, Zod đảm bảo `script.json` (do Claude sinh) **luôn đúng cấu trúc** trước khi pipeline chạy.

```ts
// Discriminated union: 6 loại template, mỗi loại có data shape khác nhau
const TemplateData = z.discriminatedUnion("template", [
  HookData, ComparisonData, StatHeroData, FeatureListData, CalloutData, OutroData
]);
```

Lợi ích:
- Phát hiện ngay nếu Claude sinh script sai (vd: `template: "stat"` không tồn tại) — fail Step 1 với error message rõ ràng
- TypeScript types được suy ra tự động từ Zod schema → composer không cần khai báo type lại
- Schema = source of truth cho cả validation runtime + type compile-time

#### ⚙️ Claude Code Skill — interface với AI

Project tích hợp với [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) qua **skill markdown** đặt tại `.claude/skills/create-news-video/SKILL.md`. Skill này hướng dẫn Claude:
1. WebFetch URL bài báo
2. Phân tích nội dung tiếng Việt
3. Pick template phù hợp cho từng scene (comparison nếu có "vs", stat-hero nếu có số liệu...)
4. Sinh `script.json` đúng schema
5. Run pipeline qua Bash

Ưu điểm: bạn chỉ cần gõ `/create-news-video <url>` — Claude tự làm hết phần "creative" (viết kịch bản tiếng Việt, chọn template, viết câu hook hấp dẫn). Phần "deterministic" (gọi API, render) do Node CLI lo.

#### 🧪 Vitest — testing framework hiện đại

[Vitest](https://vitest.dev) (ESM-native, replacement cho Jest) cho 35 unit tests:
- **Schema validation tests** với fixtures (valid + invalid scripts)
- **TTS client tests** với `nock` mock HTTP (không gọi API thật, không tốn quota)
- **Audio tools tests** với fixture mp3 files (440Hz/2s, 880Hz/3s sine waves)
- **HTML composer snapshot test** — đảm bảo output HTML không bị break khi refactor

Chạy `npm test` để verify mọi thứ work trước khi push.

#### 🎬 FFmpeg — backbone audio/video

FFmpeg + ffprobe được dùng để:
- **`ffprobe`**: đo duration của mp3 từng scene (để compute timing trong composition)
- **`ffmpeg`**: concat các scene mp3 với 0.3s silence gap → `voice.mp3` cuối
- **`ffmpeg`** (qua HyperFrames): encode 1800 frame PNG + audio thành MP4

Phải có trong PATH (`ffmpeg -version`). Trên Windows: `winget install Gyan.FFmpeg`.

### 📋 Yêu cầu hệ thống

| Mục | Phiên bản | Ghi chú |
|---|---|---|
| **Node.js** | ≥ 22 | `node --version` |
| **FFmpeg + ffprobe** | bất kỳ phiên bản hiện đại nào | trong PATH (`ffmpeg -version`) |
| **Chrome / Chromium** | bất kỳ | HyperFrames Puppeteer cần — sẽ auto-download lần đầu chạy |
| **Claude Code CLI** | latest | [cài tại đây](https://docs.claude.com/en/docs/claude-code/overview) |
| **Tài khoản TTS** | một trong hai | LucyLab.io HOẶC ElevenLabs |

### 🚀 Cài đặt (1 lần)

```bash
# 1. Clone repo
git clone <repo-url> auto_create_video
cd auto_create_video

# 2. Cài dependencies
npm install

# 3. Tạo file env và điền API key
cp .env.example .env.local
# → mở .env.local, chọn TTS provider (lucylab, elevenlabs hoặc vieneu) và điền key

# 4. Verify cài đặt
node --version       # ≥ 22
ffmpeg -version      # in version OK
ffprobe -version
npm test             # all tests pass (35 tests)
```

### 🔑 Cấu hình API key

Mở `.env.local` và chọn **một trong ba provider**:

#### Option 1: LucyLab.io (khuyến nghị cho tiếng Việt)
- Đăng ký tại https://lucylab.io
- Lấy API key + voice ID (UUID 22 ký tự)
- Đặt `TTS_PROVIDER=lucylab`
- ✅ Ưu điểm: giọng Việt tự nhiên (voice cloning), trả kèm file SRT subtitle miễn phí
- ⚠️ Hạn chế: chỉ 1 export/account đồng thời (pipeline tự xử lý)

```env
TTS_PROVIDER=lucylab
VIETNAMESE_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
VIETNAMESE_VOICEID=22charvoiceiduuidhere
```

#### Option 2: ElevenLabs
- Đăng ký tại https://elevenlabs.io
- Lấy API key tại https://elevenlabs.io/app/settings/api-keys
- Chọn voice tại https://elevenlabs.io/app/voice-library (lấy voice ID)
- Đặt `TTS_PROVIDER=elevenlabs`
- ✅ Ưu điểm: đa ngôn ngữ, thư viện voice phong phú, chất lượng cao
- ⚠️ Hạn chế: đắt hơn LucyLab, không có SRT đi kèm

```env
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

### Option C — VieNeu-TTS (remote mode, self-hosted)

- Install `vieneu` on the pipeline machine: `pip install vieneu`
- Run a separate VieNeu server and point `.env.local` at its base URL
- Set `TTS_PROVIDER=vieneu`
- Optionally set `VIENEU_VOICE_ID` to pin a preset voice; leave blank to use the model/server default voice

```env
TTS_PROVIDER=vieneu
VIENEU_API_BASE=http://your-server-ip:23333/v1
VIENEU_MODEL_ID=pnnbao-ump/VieNeu-TTS
VIENEU_VOICE_ID=
```

### Option C — VieNeu-TTS (remote mode, self-hosted)

- Cài `vieneu` trên máy chạy pipeline: `pip install vieneu`
- Chạy VieNeu server riêng, rồi set base URL của server vào `.env.local`
- Đặt `TTS_PROVIDER=vieneu`
- Có thể set `VIENEU_VOICE_ID` nếu muốn cố định preset voice; nếu bỏ trống sẽ dùng giọng mặc định của server/model

```env
TTS_PROVIDER=vieneu
VIENEU_API_BASE=http://your-server-ip:23333/v1
VIENEU_MODEL_ID=pnnbao-ump/VieNeu-TTS
VIENEU_VOICE_ID=
```

### 🎵 Cấu hình TikTok follow card (outro)

Mỗi video tự động kết thúc với một **TikTok follow card** (slide từ dưới lên + animation click follow) — chuẩn HyperFrames style. Tất cả là tùy chọn — defaults work out of the box:

```env
TIKTOK_DISPLAY_NAME=Công nghệ 24h
TIKTOK_HANDLE=@congnghe24h
TIKTOK_FOLLOWERS=1.2M followers

# Tùy chọn: URL ảnh avatar TikTok thật của bạn (jpg/png, vuông, ≥256x256)
# Nếu không set → dùng default `assets/avatar.jpg` đã bundled
TIKTOK_AVATAR_URL=https://example.com/your-avatar.jpg
```

**Cách thay avatar:**
- **Cách 1 (đơn giản)**: thay file `assets/avatar.jpg` bằng ảnh của bạn (square, ~256x256+)
- **Cách 2 (URL)**: set `TIKTOK_AVATAR_URL` trong `.env.local` → pipeline tự download mỗi lần render

Card xuất hiện ở giây thứ ~1.6 trong scene outro với chuỗi animation:
1. Card slide từ bottom lên (0.5s)
2. Hold ~0.9s để người xem đọc
3. Button "Follow" press-in + chuyển sang "Following ✓" với màu chuyển từ đỏ → xám đen
4. Card stay visible đến hết video

### 🔊 Sound Effects (SFX) — tự động mix theo template

Mỗi video tự có sound effect mix layer vào voice (volume thấp, không lấn voice). **Không phải random** — pipeline pick theo loại template:

| Template | Default SFX | Khi nào nghe |
|---|---|---|
| `hook` | `transition/whoosh-soft` | Đầu video, entrance dramatic |
| `comparison` | `transition/swoosh` | Khi 2 cards xuất hiện |
| `stat-hero` | `emphasis/ding` | Lúc số/% xuất hiện |
| `feature-list` | `transition/pop` | Mỗi bullet appear |
| `callout` | `alert/notification` | Statement quan trọng |
| `outro` | `outro/tada` | Ending signature |

**Library sounds đã sẵn trong `assets/sfx/`** (download từ [myinstants.com](https://www.myinstants.com/en/index/us/), royalty-free use):

```
assets/sfx/
├── transition/  (whoosh-soft, swoosh, pop)
├── emphasis/    (ding, tick, chime)
├── alert/       (notification)
└── outro/       (tada)
```

**Tự thêm SFX của bạn:**
1. Download mp3 từ [myinstants.com](https://www.myinstants.com) hoặc [pixabay sound effects](https://pixabay.com/sound-effects/)
2. Đặt vào folder phù hợp `assets/sfx/<category>/<name>.mp3`
3. Reference trong script.json: `"sfx": { "name": "transition/your-sound", "volume": 0.4 }`

**Smart override theo nội dung** (Claude tự pick khi sinh script):
- "cảnh báo", "rủi ro" → `alert/notification`
- "vượt", "kỷ lục", "xuất sắc" → `emphasis/chime`
- Disable cho scene đó → `"sfx": { "name": "none" }`

### 🎬 Sử dụng

#### Cách 1: Trong Claude Code (khuyến nghị)

Mở Claude Code trong thư mục project và gõ:

```
/create-news-video https://vnexpress.net/iphone-17-200mp
```

Hoặc với file `.txt`:
```
/create-news-video news/my-article.txt
```

Sau ~3-5 phút (TTS + render):

```
✓ Video:  output/<slug>-<timestamp>/video.mp4    ← video cuối
✓ Audio:  output/<slug>-<timestamp>/voice.mp3    ← để import CapCut
✓ Script: output/<slug>-<timestamp>/script.txt   ← cho CapCut auto-caption
```

#### Cách 2: Chạy pipeline trực tiếp (advanced)

Nếu đã có sẵn `script.json` (vd để debug hoặc tự viết kịch bản):

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

#### Cách 3: Re-render lại video không cần TTS (tiết kiệm quota)

Nếu đã có voice files trong `voice/` và muốn render lại visual:

```bash
npm run rerender -- output/<slug>-<timestamp>
```

### 📁 Cấu trúc output

```
output/<slug>-<timestamp>/
├── script.json           # Input JSON (Claude sinh hoặc bạn viết tay)
├── script.txt            # Plain text cho CapCut auto-caption
├── images/bg.jpg         # og:image đã tải (nếu có)
├── voice/
│   ├── scene-hook.mp3    # TTS từng scene
│   ├── scene-hook.srt    # SRT subtitle (chỉ LucyLab)
│   └── scene-body-1.mp3
├── voice.mp3             # Voice đã concat (cho CapCut)
├── index.html            # HyperFrames composition
├── styles.css            # CSS (copied từ template)
├── animations.js         # GSAP timeline (copied)
├── hyperframes.json      # HyperFrames project config
├── meta.json             # HyperFrames metadata
└── video.mp4             # 🎉 Output cuối — 1080×1920 MP4
```

### 🎨 Visual System v2

Mỗi video gồm:
- **Persistent shell** xuyên suốt (header brand `>_` icon + tên channel + tag, footer handle TikTok, grain texture, gradient navy)
- **5–8 scene** với template được Claude pick theo nội dung:

| Template | Khi nào dùng | Ví dụ |
|---|---|---|
| `hook` | Scene đầu tiên (3-5s) | "GPT 5.5" + "AI mạnh nhất!" trên ảnh og:image với shimmer |
| `comparison` | Khi có "X vs Y" / "vượt xa" / "so với" | 2 cards: "GPT 5.4 75.1%" cyan vs "GPT 5.5 82.7%" purple (winner) |
| `stat-hero` | Khi có số/% nổi bật | "1M" giant gradient + "Tokens / cửa sổ ngữ cảnh" |
| `feature-list` | Liệt kê tính năng | Card có 4 bullets dot cyan glow |
| `callout` | Statement / cảnh báo / quote | Glow purple card với "Cảnh báo: AI tự chủ cần cân nhắc" |
| `outro` | Scene cuối (3-5s) | "Theo dõi ngay" pill + "Công nghệ 24h" giant + underline gradient |

### 🧪 Testing

```bash
npm test                 # chạy 35 unit tests
npm run test:watch       # watch mode
npx tsc --noEmit         # type-check không build
```

### 🐛 Troubleshooting

| Lỗi | Cách khắc phục |
|---|---|
| `Missing VIETNAMESE_API_KEY` / `Missing ELEVENLABS_API_KEY` / `Missing VIENEU_API_BASE` | Kiểm tra `.env.local` đã có và đúng `TTS_PROVIDER` |
| `hyperframes render failed` | Chạy `npx hyperframes render --help` verify CLI; Chrome cài chưa? |
| `LucyLab polling timeout` | Tăng `LUCYLAB_POLL_TIMEOUT_MS` trong `.env.local` (default 120000ms) |
| `ElevenLabs 401 Invalid API key` | Verify key trên dashboard ElevenLabs, paste lại vào `.env.local` |
| `Tổng duration ngoài [48s, 72s]` | Re-trigger skill, hoặc chỉnh `script.json` viết dài/ngắn hơn |
| `ffprobe: command not found` | Cài FFmpeg: Windows `winget install Gyan.FFmpeg`, Mac `brew install ffmpeg` |

### 🗺️ Roadmap

- [ ] Caption burned-in (forced alignment với Whisper)
- [ ] Auto-select background music theo mood
- [ ] Multi-news compilation mode (`digest`)
- [ ] AI-generated images (Flux/Stable Diffusion khi không có og:image)
- [ ] Auto-upload TikTok / YouTube Shorts / Reels qua API
- [ ] Logo overlay tùy chỉnh
- [ ] Multi-language (English, Chinese)
- [ ] Web UI standalone (không cần Claude Code)

### 📜 License

MIT — sử dụng tự do, fork tự do, đóng góp PR tự do.

---

# 🇬🇧 English

## Introduction

**Auto News Video** is an open-source project that **transforms any Vietnamese tech news article** into a professional motion-graphic short video with a single command in [Claude Code](https://docs.claude.com/en/docs/claude-code/overview).

The pipeline automates the following steps:
1. **Reads the article URL** (or `.txt` file) and analyzes the content
2. **Generates a JSON script** picking from 6 visual template types (hook, comparison, stat-hero, feature-list, callout, outro) based on content nature
3. **Synthesizes Vietnamese voice** via **LucyLab** or **ElevenLabs**
4. **Renders MP4 video** using HyperFrames (Puppeteer + GSAP + FFmpeg) with **studio shell** style and modern animation
5. **Exports script.txt and voice.mp3** alongside, ready to import into CapCut Pro for captions / BGM

### 🎯 Why this project?

- ✅ **HeyGen-quality look**: persistent brand shell (icon, channel name, handle), grain texture, navy gradient with cyan + purple accents
- ✅ **6 scene template types** auto-picked by content — never monotonous
- ✅ **Multi-provider TTS**: LucyLab (natural Vietnamese + free SRT), ElevenLabs (multilingual), or VieNeu-TTS remote mode (self-hosted)
- ✅ **Claude Code skill integration** — just type `/create-news-video <url>` and you're done
- ✅ **Extensible**: clean schema, modular code, full test suite

### 🛠️ Tech Stack & Libraries

| Layer | Technology |
|---|---|
| **Runtime** | Node.js ≥ 22, TypeScript 5+, ESM |
| **Render engine** | [HyperFrames](https://hyperframes.heygen.com) (Puppeteer + GSAP + FFmpeg) |
| **TTS providers** | [LucyLab.io](https://lucylab.io) (JSON-RPC, Vietnamese cloning), [ElevenLabs](https://elevenlabs.io) (REST, multilingual), or VieNeu-TTS remote mode (self-hosted) |
| **Validation** | [Zod](https://zod.dev) (discriminated union schema) |
| **HTTP** | axios + nock (mocking) |
| **Testing** | Vitest |
| **Audio** | FFmpeg + ffprobe (mix, concat with silence) |
| **AI/Skill** | [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) skill (`/create-news-video`) |
| **Visual blocks** | HyperFrames registry: `grain-overlay`, `shimmer-sweep`, `tiktok-follow` |
| **Fonts** | Inter + Anton (Google Fonts) |

### 🔬 Deep-dive on key technologies

#### 🎞️ HyperFrames — heart of the render engine
[HyperFrames](https://hyperframes.heygen.com) is an open-source HTML-to-video framework by **HeyGen**. Unlike traditional editors (After Effects, Premiere), HyperFrames lets you **author videos with HTML/CSS/JS** then render to high-quality MP4 **deterministically** (same input → identical output frame-by-frame).

**How it works in this project:**
1. Pipeline generates an `index.html` containing all scenes + GSAP timeline
2. HyperFrames spawns headless Chrome (Puppeteer) to load it
3. Captures each frame at the precise timestamp (30fps × 60s = 1800 frames)
4. Encodes all frames + audio into MP4 via FFmpeg

**Why HyperFrames?**
- ✅ **50+ pre-built blocks** in registry (transitions, social cards, data viz, kinetic typography...) — installable via `npx hyperframes add <name>`
- ✅ **GSAP timeline** built-in for smooth animations
- ✅ **AI-agent friendly** — Claude/GPT can author compositions in HTML
- ✅ **Built-in lint** (`npx hyperframes lint`) catches composition errors before render
- ✅ **9:16 native** — designed for short-form video

**Blocks/components used in this project:**
- `grain-overlay` — film grain texture throughout video (analog warmth feel)
- `shimmer-sweep` — light pass animation for headline text
- `tiktok-follow` — outro CTA card (already 1080×1920)

#### 🎤 LucyLab vs ElevenLabs — which to choose?

| Criteria | LucyLab | ElevenLabs |
|---|---|---|
| **Vietnamese voice** | ⭐⭐⭐⭐⭐ Natural (voice cloning) | ⭐⭐⭐⭐ Good (multilingual) |
| **Cost** | Cheap (~$1 / 1M chars) | Pricier (~$5 / 30k chars) |
| **Voice library** | Self-clone voices | 1000+ voices ready |
| **API style** | JSON-RPC async (poll) | REST sync (instant) |
| **SRT subtitle** | ✅ Free, included in response | ❌ Not provided |
| **Concurrency** | 1 export/account | Parallel OK |
| **Other languages** | ❌ Vietnamese only | ✅ 30+ languages |

**Recommendation:**
- 🇻🇳 **Vietnamese-only videos** → use **LucyLab** (cheap + natural + with SRT)
- 🌍 **Multilingual or need large voice library** → use **ElevenLabs**
- 🔄 **Not sure** → start with LucyLab; switch to VieNeu for self-hosted remote TTS or ElevenLabs for cloud voices

#### 🛡️ Zod — type-safe schema validation

[Zod](https://zod.dev) is a TypeScript-first schema library. In this project, Zod ensures `script.json` (generated by Claude) **always has correct structure** before pipeline runs.

```ts
// Discriminated union: 6 template types, each with different data shape
const TemplateData = z.discriminatedUnion("template", [
  HookData, ComparisonData, StatHeroData, FeatureListData, CalloutData, OutroData
]);
```

Benefits:
- Detects immediately if Claude generates wrong script (e.g. `template: "stat"` doesn't exist) — fails Step 1 with clear error
- TypeScript types are inferred from Zod schema → composer doesn't need to redeclare types
- Schema = single source of truth for both runtime validation + compile-time types

#### ⚙️ Claude Code Skill — AI interface

The project integrates with [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) via a **skill markdown** at `.claude/skills/create-news-video/SKILL.md`. This skill instructs Claude to:
1. WebFetch the article URL
2. Analyze Vietnamese content
3. Pick the right template per scene (comparison if "vs", stat-hero if numbers...)
4. Generate `script.json` matching schema
5. Run pipeline via Bash

Benefit: just type `/create-news-video <url>` — Claude handles all "creative" work (writing Vietnamese script, picking templates, crafting catchy hooks). The "deterministic" parts (API calls, rendering) are handled by Node CLI.

#### 🧪 Vitest — modern testing framework

[Vitest](https://vitest.dev) (ESM-native Jest replacement) provides 35 unit tests:
- **Schema validation tests** with fixtures (valid + invalid scripts)
- **TTS client tests** with `nock` HTTP mocking (no real API calls, no quota wasted)
- **Audio tools tests** with fixture mp3 files (440Hz/2s, 880Hz/3s sine waves)
- **HTML composer snapshot test** — ensures output HTML doesn't break on refactor

Run `npm test` to verify everything works before pushing.

#### 🎬 FFmpeg — audio/video backbone

FFmpeg + ffprobe is used to:
- **`ffprobe`**: measure mp3 duration per scene (to compute timing in composition)
- **`ffmpeg`**: concat scene mp3s with 0.3s silence gap → final `voice.mp3`
- **`ffmpeg`** (via HyperFrames): encode 1800 PNG frames + audio into MP4

Must be in PATH (`ffmpeg -version`). On Windows: `winget install Gyan.FFmpeg`.

### 📋 Prerequisites

| Item | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 22 | `node --version` |
| **FFmpeg + ffprobe** | any modern version | in PATH (`ffmpeg -version`) |
| **Chrome / Chromium** | any | required by HyperFrames Puppeteer — auto-downloaded on first render |
| **Claude Code CLI** | latest | [install here](https://docs.claude.com/en/docs/claude-code/overview) |
| **TTS account** | one of two | LucyLab.io OR ElevenLabs |

### 🚀 Setup (one-time)

```bash
# 1. Clone the repo
git clone <repo-url> auto_create_video
cd auto_create_video

# 2. Install dependencies
npm install

# 3. Create env file and fill in API keys
cp .env.example .env.local
# → open .env.local, choose TTS provider (lucylab, elevenlabs, or vieneu) and fill key

# 4. Verify installation
node --version       # ≥ 22
ffmpeg -version      # any version OK
ffprobe -version
npm test             # all 35 tests should pass
```

### 🔑 API Key Configuration

Open `.env.local` and pick **one of three providers**:

#### Option 1: LucyLab.io (recommended for Vietnamese)
- Sign up at https://lucylab.io
- Get API key + voice ID (22-char UUID)
- Set `TTS_PROVIDER=lucylab`
- ✅ Pros: natural Vietnamese voice (cloning), free SRT subtitle file included
- ⚠️ Cons: only 1 concurrent export per account (pipeline handles this)

```env
TTS_PROVIDER=lucylab
VIETNAMESE_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
VIETNAMESE_VOICEID=22charvoiceiduuidhere
```

#### Option 2: ElevenLabs
- Sign up at https://elevenlabs.io
- Get API key at https://elevenlabs.io/app/settings/api-keys
- Browse voices at https://elevenlabs.io/app/voice-library (copy the voice ID)
- Set `TTS_PROVIDER=elevenlabs`
- ✅ Pros: multilingual, rich voice library, high quality
- ⚠️ Cons: pricier than LucyLab, no SRT included

```env
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

### 🎵 TikTok follow card configuration (outro)

Every video automatically ends with a **TikTok follow card** (slides up from bottom + follow-button click animation) — built from the official HyperFrames `tiktok-follow` block. All fields optional — defaults work out of the box:

```env
TIKTOK_DISPLAY_NAME=Công nghệ 24h
TIKTOK_HANDLE=@congnghe24h
TIKTOK_FOLLOWERS=1.2M followers

# Optional: URL to your real TikTok avatar (jpg/png, square, ≥256x256)
# If not set → uses bundled default `assets/avatar.jpg`
TIKTOK_AVATAR_URL=https://example.com/your-avatar.jpg
```

**To change the avatar:**
- **Option 1 (simple)**: replace `assets/avatar.jpg` with your image (square, ~256x256+)
- **Option 2 (URL)**: set `TIKTOK_AVATAR_URL` in `.env.local` → pipeline auto-downloads on every render

Card appears at ~1.6s into the outro scene with this animation sequence:
1. Card slides up from bottom (0.5s)
2. Hold ~0.9s for viewer to read
3. "Follow" button press-in + transitions to "Following ✓" with red→dark-gray color shift
4. Card stays visible until end of video

### 🔊 Sound Effects (SFX) — auto-mixed by template

Every video automatically gets a sound effect layer mixed into the voice (low volume, doesn't overpower speech). **Not random** — the pipeline picks based on template type:

| Template | Default SFX | When you hear it |
|---|---|---|
| `hook` | `transition/whoosh-soft` | Start of video, dramatic entrance |
| `comparison` | `transition/swoosh` | When 2 cards appear |
| `stat-hero` | `emphasis/ding` | When number/% reveals |
| `feature-list` | `transition/pop` | Each bullet appears |
| `callout` | `alert/notification` | Important statement |
| `outro` | `outro/tada` | Ending signature |

**Bundled sounds in `assets/sfx/`** (downloaded from [myinstants.com](https://www.myinstants.com/en/index/us/)):

```
assets/sfx/
├── transition/  (whoosh-soft, swoosh, pop)
├── emphasis/    (ding, tick, chime)
├── alert/       (notification)
└── outro/       (tada)
```

**Add your own SFX:**
1. Download mp3 from [myinstants.com](https://www.myinstants.com) or [pixabay sound effects](https://pixabay.com/sound-effects/)
2. Drop into `assets/sfx/<category>/<name>.mp3`
3. Reference in script.json: `"sfx": { "name": "transition/your-sound", "volume": 0.4 }`

**Smart override by content** (Claude auto-picks when generating script):
- "warning", "risk" → `alert/notification`
- "exceed", "record", "outstanding" → `emphasis/chime`
- Disable for this scene → `"sfx": { "name": "none" }`

### 🎬 Usage

#### Method 1: Inside Claude Code (recommended)

Open Claude Code in the project directory and type:

```
/create-news-video https://vnexpress.net/iphone-17-200mp
```

Or with a `.txt` file:
```
/create-news-video news/my-article.txt
```

After ~3-5 minutes (TTS + render):

```
✓ Video:  output/<slug>-<timestamp>/video.mp4    ← final video
✓ Audio:  output/<slug>-<timestamp>/voice.mp3    ← for CapCut
✓ Script: output/<slug>-<timestamp>/script.txt   ← for CapCut auto-caption
```

#### Method 2: Run pipeline directly (advanced)

If you already have a `script.json` (e.g. for debugging or hand-written script):

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

#### Method 3: Re-render video without re-running TTS (saves quota)

If voice files already exist in `voice/` and you only want to re-render visuals:

```bash
npm run rerender -- output/<slug>-<timestamp>
```

### 📁 Output Structure

```
output/<slug>-<timestamp>/
├── script.json           # Input JSON (Claude-generated or hand-written)
├── script.txt            # Plain text for CapCut auto-caption
├── images/bg.jpg         # og:image downloaded (if available)
├── voice/
│   ├── scene-hook.mp3    # TTS per scene
│   ├── scene-hook.srt    # SRT subtitles (LucyLab only)
│   └── scene-body-1.mp3
├── voice.mp3             # Concatenated voice (for CapCut)
├── index.html            # HyperFrames composition
├── styles.css            # CSS (copied from template)
├── animations.js         # GSAP timeline (copied)
├── hyperframes.json      # HyperFrames project config
├── meta.json             # HyperFrames metadata
└── video.mp4             # 🎉 Final output — 1080×1920 MP4
```

### 🎨 Visual System v2

Each video consists of:
- **Persistent shell** throughout (header brand `>_` icon + channel name + tag, footer TikTok handle, grain texture, navy gradient)
- **5–8 scenes** with templates picked by Claude based on content:

| Template | When to use | Example |
|---|---|---|
| `hook` | First scene (3-5s) | "GPT 5.5" + "AI mạnh nhất!" over og:image with shimmer |
| `comparison` | When content has "X vs Y" / "exceeds" / "compared to" | 2 cards: "GPT 5.4 75.1%" cyan vs "GPT 5.5 82.7%" purple (winner) |
| `stat-hero` | When there's a key number/% | "1M" giant gradient + "Tokens / context window" |
| `feature-list` | When listing features | Card with 4 bullets, cyan glow dots |
| `callout` | Statement / warning / quote | Purple glow card with "Warning: agentic AI needs caution" |
| `outro` | Last scene (3-5s) | "Follow now" pill + "Công nghệ 24h" giant + gradient underline |

### 🧪 Testing

```bash
npm test                 # run 35 unit tests
npm run test:watch       # watch mode
npx tsc --noEmit         # type-check without build
```

### 🐛 Troubleshooting

| Error | Fix |
|---|---|
| `Missing VIETNAMESE_API_KEY` / `Missing ELEVENLABS_API_KEY` / `Missing VIENEU_API_BASE` | Check `.env.local` exists and `TTS_PROVIDER` matches |
| `hyperframes render failed` | Run `npx hyperframes render --help` to verify CLI; is Chrome installed? |
| `LucyLab polling timeout` | Increase `LUCYLAB_POLL_TIMEOUT_MS` in `.env.local` (default 120000ms) |
| `ElevenLabs 401 Invalid API key` | Verify key on ElevenLabs dashboard, re-paste into `.env.local` |
| `Total duration outside [48s, 72s]` | Re-trigger skill, or edit `script.json` to make text longer/shorter |
| `ffprobe: command not found` | Install FFmpeg: Windows `winget install Gyan.FFmpeg`, Mac `brew install ffmpeg` |

### 🗺️ Roadmap

- [ ] Burned-in captions (forced alignment with Whisper)
- [ ] Auto-select background music by mood
- [ ] Multi-news compilation mode (`digest`)
- [ ] AI-generated images (Flux/Stable Diffusion when og:image unavailable)
- [ ] Auto-upload TikTok / YouTube Shorts / Reels via API
- [ ] Custom logo overlay
- [ ] Multi-language (English, Chinese)
- [ ] Standalone Web UI (no Claude Code required)

### 📜 License

MIT — use freely, fork freely, PRs welcome.

---

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first to discuss what you'd like to change.

```bash
# Fork → clone → branch
git checkout -b feature/my-improvement

# Make changes, ensure tests pass
npm test

# Commit (Conventional Commits style)
git commit -m "feat: add Google TTS provider support"

# Push and open PR
git push origin feature/my-improvement
```

## 🙏 Acknowledgements

- [HyperFrames by HeyGen](https://hyperframes.heygen.com) — the HTML-to-video framework that makes this possible
- [LucyLab.io](https://lucylab.io) — Vietnamese voice cloning API
- [ElevenLabs](https://elevenlabs.io) — multilingual TTS
- [Anthropic Claude](https://www.anthropic.com/claude) — the LLM that generates scripts via Claude Code skill
