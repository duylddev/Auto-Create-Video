# Auto News Video

Tạo video tin tức ngắn 9:16 (~60s) tiếng Việt cho TikTok/YouTube Shorts/Reels từ URL bài báo hoặc file .txt.

## Yêu cầu

- Node.js ≥ 22
- ffmpeg + ffprobe trong PATH
- Chrome/Chromium (cho HyperFrames render qua Puppeteer)
- Tài khoản LucyLab.io (lấy `VIETNAMESE_API_KEY` + `VIETNAMESE_VOICEID`)
- Claude Code CLI (để chạy skill)

## Setup (1 lần)

```bash
npm install
cp .env.example .env.local
# Edit .env.local, paste your real API key + voice ID
```

Verify:
```bash
node --version    # ≥ 22
ffmpeg -version   # any modern version
ffprobe -version
npm test          # all tests pass (27)
```

## Sử dụng

Trong Claude Code:

```
/create-news-video https://vnexpress.net/iphone-17-200mp
```

Hoặc với file txt:
```
/create-news-video news/my-article.txt
```

Sau ~3-5 phút (chủ yếu chờ TTS render):

```
✓ Video:  output/iphone-17-200mp-20260429-1530/video.mp4
✓ Audio:  output/iphone-17-200mp-20260429-1530/voice.mp3
✓ Script: output/iphone-17-200mp-20260429-1530/script.txt
```

Mở `video.mp4` để xem. Để thêm caption + nhạc nền: import `video.mp4` vào CapCut Pro, dùng `voice.mp3` thay nếu cần fine-tune audio, paste `script.txt` vào CapCut auto-caption.

## Re-run pipeline (debug)

Nếu render fail giữa chừng (giả sử do hyperframes lỗi), `script.json` đã có sẵn — chạy lại pipeline mà không cần Claude gen lại script:

```bash
npm run pipeline -- output/<slug>-<timestamp>/script.json
```

## Cấu trúc output

```
output/<slug>-<timestamp>/
├── script.json           # Input cho CLI (Claude generated)
├── script.txt            # Plain text cho CapCut auto-caption
├── images/bg.jpg         # og:image đã download (nếu có)
├── voice/scene-*.mp3     # TTS từng scene
├── voice.mp3             # Concat voice (cho CapCut)
├── index.html            # HyperFrames composition
├── styles.css            # Render styles (copied)
├── animations.js         # Render JS (copied)
├── hyperframes.json      # HyperFrames project config
├── meta.json             # HyperFrames project metadata
└── video.mp4             # Output cuối
```

## Testing

```bash
npm test                 # unit tests (27 tổng)
npm run test:watch       # watch mode
```

## Troubleshooting

- **"VIETNAMESE_API_KEY missing"**: Check `.env.local` exists và có giá trị
- **"hyperframes render failed"**: Run `npx hyperframes render --help` to verify CLI flags. Check Chrome/Chromium installed.
- **TTS timeout**: Increase `LUCYLAB_POLL_TIMEOUT_MS` in `.env.local` (default 120000ms = 2min)
- **Tổng duration ngoài [48s, 72s]**: Re-trigger skill, hoặc chỉnh script.json thủ công rồi chạy lại pipeline
- **Tests fail with "module not found"**: Check `package.json` has `"type": "module"` and tsx is installed

## Roadmap (post-MVP)

- Caption burned-in (forced alignment with whisper)
- Background music auto-selection (mood-based)
- Multi-news compilation mode
- AI-generated images (Flux/Stable Diffusion fallback when no og:image)
- Auto-upload TikTok/YouTube Shorts/Reels
- Logo overlay
- Multi-language support (English, Chinese)
