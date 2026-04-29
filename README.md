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
3. **Tổng hợp giọng đọc** tiếng Việt qua **LucyLab** hoặc **ElevenLabs**
4. **Render video MP4** với HyperFrames (Puppeteer + GSAP + FFmpeg) — phong cách **studio shell** + animation hiện đại
5. **Xuất kèm script.txt và voice.mp3** để bạn import vào CapCut Pro thêm caption / nhạc nền

### 🎯 Tại sao project này?

- ✅ **Phong cách HeyGen-quality**: persistent brand shell (icon, channel, handle), grain texture, gradient navy + cyan + purple
- ✅ **6 loại scene template** tự pick theo nội dung — không rập khuôn
- ✅ **Đa nhà cung cấp TTS**: LucyLab (giọng Việt tự nhiên + SRT free) hoặc ElevenLabs (đa ngôn ngữ, nhiều voice library)
- ✅ **Tích hợp Claude Code skill** — chỉ cần `/create-news-video <url>` là xong
- ✅ **Mở rộng được**: schema rõ ràng, code modular, có test suite

### 🛠️ Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| **Runtime** | Node.js ≥ 22, TypeScript 5+, ESM |
| **Render engine** | [HyperFrames](https://hyperframes.heygen.com) (Puppeteer + GSAP + FFmpeg) |
| **TTS providers** | [LucyLab.io](https://lucylab.io) (JSON-RPC, Vietnamese cloning) hoặc [ElevenLabs](https://elevenlabs.io) (REST, multilingual) |
| **Validation** | [Zod](https://zod.dev) (discriminated union schema) |
| **HTTP** | axios + nock (mocking) |
| **Testing** | Vitest |
| **Audio** | FFmpeg + ffprobe (mix, concat với silence) |
| **AI/Skill** | [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) skill (`/create-news-video`) |
| **Visual blocks** | HyperFrames registry: `grain-overlay`, `shimmer-sweep`, `tiktok-follow` |
| **Fonts** | Inter + Anton (Google Fonts) |

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
# → mở .env.local, chọn TTS provider (lucylab hoặc elevenlabs) và điền key

# 4. Verify cài đặt
node --version       # ≥ 22
ffmpeg -version      # in version OK
ffprobe -version
npm test             # all tests pass (35 tests)
```

### 🔑 Cấu hình API key

Mở `.env.local` và chọn **một trong hai provider**:

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
| `Missing VIETNAMESE_API_KEY` / `Missing ELEVENLABS_API_KEY` | Kiểm tra `.env.local` đã có và đúng `TTS_PROVIDER` |
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
- ✅ **Multi-provider TTS**: LucyLab (natural Vietnamese + free SRT) or ElevenLabs (multilingual, large voice library)
- ✅ **Claude Code skill integration** — just type `/create-news-video <url>` and you're done
- ✅ **Extensible**: clean schema, modular code, full test suite

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js ≥ 22, TypeScript 5+, ESM |
| **Render engine** | [HyperFrames](https://hyperframes.heygen.com) (Puppeteer + GSAP + FFmpeg) |
| **TTS providers** | [LucyLab.io](https://lucylab.io) (JSON-RPC, Vietnamese cloning) or [ElevenLabs](https://elevenlabs.io) (REST, multilingual) |
| **Validation** | [Zod](https://zod.dev) (discriminated union schema) |
| **HTTP** | axios + nock (mocking) |
| **Testing** | Vitest |
| **Audio** | FFmpeg + ffprobe (mix, concat with silence) |
| **AI/Skill** | [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) skill (`/create-news-video`) |
| **Visual blocks** | HyperFrames registry: `grain-overlay`, `shimmer-sweep`, `tiktok-follow` |
| **Fonts** | Inter + Anton (Google Fonts) |

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
# → open .env.local, choose TTS provider (lucylab or elevenlabs) and fill key

# 4. Verify installation
node --version       # ≥ 22
ffmpeg -version      # any version OK
ffprobe -version
npm test             # all 35 tests should pass
```

### 🔑 API Key Configuration

Open `.env.local` and pick **one of two providers**:

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
| `Missing VIETNAMESE_API_KEY` / `Missing ELEVENLABS_API_KEY` | Check `.env.local` exists and `TTS_PROVIDER` matches |
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
