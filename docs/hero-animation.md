# Animated GoLocal hero

Two variants are available at `/hero-preview`: a living neighborhood and a personal-agent message. The homepage uses the message version.

The motion is an illustrative brand scene, not a live service status or a real booking. Original artwork: `apps/web/public/brand/local-services.png`. Higgsfield Kling 3.0 generated two 8-second 4K source clips from the same start and end image, with audio disabled. The website serves optimized, silent H.264 MP4s (`hero-scene.mp4` and `hero-message.mp4`). Message bubbles are accessible HTML so typography stays clear at every screen size.

Playback respects reduced-motion settings, pauses offscreen and in hidden tabs, includes an explicit pause/play button, and falls back to the original image if a video cannot load. The message sequence follows video time so pausing also pauses the story. The comparison route is excluded from indexing.

To replace a clip, preserve the composition and empty left side, export H.264/yuv420p with faststart and no audio, and inspect desktop/mobile cropping and the end-to-start transition. Keep each web clip small enough for a landing page. The original source files and generation prompts are kept in the Homebase project's output directory.


## Option A animation review · October 13, 2026

The warm and spacious homepage retains the original 8-second hero-message.mp4 worker animation in a separate right-hand panel. A compact lower-corner personal-agent message replaces the static caption: request, delivered/typing, then the agent reply. It follows video currentTime, so pausing pauses the story and every loop restarts it. Reduced-motion and video-error views show the complete conversation as static text. No new video generation or credits were used.
