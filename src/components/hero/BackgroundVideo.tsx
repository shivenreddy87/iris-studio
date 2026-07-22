import { useEffect, useRef } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

const FADE = 0.5; // seconds

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    let cancelled = false;

    video.style.opacity = "0";

    const loop = () => {
      if (cancelled || !video.duration || Number.isNaN(video.duration)) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const t = video.currentTime;
      const d = video.duration;
      let o = 1;
      if (t < FADE) o = t / FADE;
      else if (t > d - FADE) o = Math.max(0, (d - t) / FADE);
      video.style.opacity = String(Math.max(0, Math.min(1, o)));
      raf = requestAnimationFrame(loop);
    };

    const onEnded = () => {
      video.style.opacity = "0";
      window.setTimeout(() => {
        if (cancelled) return;
        try {
          video.currentTime = 0;
          void video.play();
        } catch {
          /* noop */
        }
      }, 100);
    };

    video.addEventListener("ended", onEnded);
    void video.play().catch(() => {});
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity: 0, transition: "none" }}
      src={VIDEO_URL}
      muted
      playsInline
      autoPlay
      preload="auto"
    />
  );
}
