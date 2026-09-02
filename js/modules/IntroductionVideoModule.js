export default function IntroductionVideoModule() {
  const stages = [...document.querySelectorAll(".introductionVideoJS")];

  stages.forEach((stage) => {
    const media = stage.querySelector(".introductionMediaJS");
    const playButton = stage.querySelector(".introductionPlayJS");
    const youtubeLink = stage.querySelector(".introductionYoutubeJS");
    const status = stage.querySelector(".introductionStatusJS");

    if (!media || !playButton || !youtubeLink) return;

    let state = "idle";
    let playAttempt = 0;
    let keyboardStart = false;

    const setStatus = (message) => {
      if (status) status.textContent = message;
    };

    const reset = ({ announce = true } = {}) => {
      const shouldRestoreFocus = document.activeElement === youtubeLink;
      playAttempt += 1;
      state = "idle";
      media.pause();

      try {
        media.currentTime = 0;
      } catch {
        // The media timeline may not be ready after a source error.
      }

      stage.classList.remove("is-starting", "is-playing");
      stage.removeAttribute("aria-busy");
      playButton.disabled = false;
      youtubeLink.hidden = true;
      keyboardStart = false;

      if (announce) setStatus("انتهى الفيديو. يمكنك تشغيله مرة أخرى.");
      if (shouldRestoreFocus) {
        window.requestAnimationFrame(() => playButton.focus({ preventScroll: true }));
      }
    };

    const start = (event) => {
      event.stopPropagation();
      if (state !== "idle") return;

      const attempt = ++playAttempt;
      state = "starting";
      keyboardStart = event.detail === 0;
      playButton.disabled = true;
      stage.classList.add("is-starting");
      stage.setAttribute("aria-busy", "true");
      setStatus("جارٍ تشغيل الفيديو التعريفي.");

      try {
        media.currentTime = 0;
      } catch {
        // Playback can still start before metadata is available.
      }

      const playPromise = media.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (attempt !== playAttempt) return;
          setStatus("تعذر تشغيل الفيديو.");
          reset({ announce: false });
        });
      }
    };

    media.addEventListener("playing", () => {
      if (state !== "starting") return;

      state = "playing";
      youtubeLink.hidden = false;
      stage.classList.remove("is-starting");
      stage.classList.add("is-playing");
      stage.removeAttribute("aria-busy");
      setStatus("الفيديو قيد التشغيل. اضغط مرة أخرى لمشاهدته على YouTube.");

      if (keyboardStart && document.activeElement === playButton) {
        window.requestAnimationFrame(() => youtubeLink.focus({ preventScroll: true }));
      }
    });

    media.addEventListener("ended", () => reset());
    media.addEventListener("error", () => {
      if (state === "idle") return;
      setStatus("تعذر تشغيل الفيديو.");
      reset({ announce: false });
    });
    playButton.addEventListener("click", start);
  });
}
