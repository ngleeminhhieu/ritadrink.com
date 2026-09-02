const WELCOME_STATE = {
  LOADING: "loading",
  REVEALING: "revealing",
  READY: "ready",
  LEAVING: "leaving",
  DISMISSED: "dismissed",
};

const delay = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

export default function PreloaderModule() {
  const welcome = document.querySelector(".preloaderJS");
  if (!welcome) return;

  const video = welcome.querySelector(".welcomeVideoJS");
  const videoSource = video?.querySelector("source");
  const media = welcome.querySelector(".welcome-screen__media");
  const brand = welcome.querySelector(".welcomeBrandJS");
  const content = welcome.querySelector(".welcomeContentJS");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollKeys = new Set(["ArrowDown", "PageDown", "End", " "]);
  const reverseScrollKeys = new Set(["ArrowUp", "PageUp", "Home"]);
  const inertTargets = [...document.body.children]
    .filter((element) => element !== welcome && element.tagName !== "SCRIPT")
    .map((element) => ({ element, wasInert: element.inert }));
  const previousScrollRestoration = "scrollRestoration" in window.history
    ? window.history.scrollRestoration
    : null;
  let state = WELCOME_STATE.LOADING;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;
  let revealFallbackTimer;
  let leaveFallbackTimer;

  const setState = (nextState) => {
    state = nextState;
    welcome.dataset.welcomeState = nextState;
  };

  const resetPageToTop = () => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousScrollBehavior;
  };

  const lockPage = () => {
    document.documentElement.classList.add("welcome-screen-active");
    document.body.classList.add("welcome-screen-active");
    inertTargets.forEach(({ element }) => {
      element.inert = true;
    });

    if (previousScrollRestoration !== null) {
      window.history.scrollRestoration = "manual";
    }

    resetPageToTop();
    window.addEventListener("load", resetPageToTop, { once: true });
    window.requestAnimationFrame(() => welcome.focus({ preventScroll: true }));
  };

  const unlockPage = () => {
    document.documentElement.classList.remove("welcome-screen-active");
    document.body.classList.remove("welcome-screen-active");
    inertTargets.forEach(({ element, wasInert }) => {
      element.inert = wasInert;
    });

    if (previousScrollRestoration !== null) {
      window.history.scrollRestoration = previousScrollRestoration;
    }
  };

  const preventScroll = (event) => {
    if (event.cancelable) event.preventDefault();
  };

  const isInputArmed = () => state === WELCOME_STATE.READY;

  const removeGestureListeners = () => {
    window.removeEventListener("wheel", handleWheel);
    window.removeEventListener("touchstart", handleTouchStart);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
    window.removeEventListener("touchcancel", handleTouchEnd);
    window.removeEventListener("keydown", handleKeydown);
  };

  const finishDismiss = ({ restoreFocus = false } = {}) => {
    if (state === WELCOME_STATE.DISMISSED) return;

    window.clearTimeout(leaveFallbackTimer);
    setState(WELCOME_STATE.DISMISSED);
    welcome.classList.add("is-done");
    welcome.hidden = true;
    welcome.inert = true;
    welcome.setAttribute("aria-hidden", "true");
    video?.pause();
    unlockPage();
    if (restoreFocus) {
      document.querySelector(".hd-logo .custom-logo-link")?.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent("welcome:dismissed"));
  };

  const dismissWelcome = ({ restoreFocus = false } = {}) => {
    if (state !== WELCOME_STATE.READY) return;

    setState(WELCOME_STATE.LEAVING);
    removeGestureListeners();
    brand?.setAttribute("inert", "");
    content?.setAttribute("inert", "");
    welcome.classList.add("is-leaving");

    const handleTransitionEnd = (event) => {
      if (event.target !== welcome || event.propertyName !== "transform") return;
      welcome.removeEventListener("transitionend", handleTransitionEnd);
      finishDismiss({ restoreFocus });
    };

    welcome.addEventListener("transitionend", handleTransitionEnd);
    leaveFallbackTimer = window.setTimeout(
      () => finishDismiss({ restoreFocus }),
      reduceMotion ? 50 : 1150,
    );
  };

  function handleWheel(event) {
    if (!event.isTrusted || event.ctrlKey || event.metaKey) return;

    preventScroll(event);
    if (!isInputArmed()) return;

    const deltaMultiplier = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? window.innerHeight
        : 1;
    const delta = event.deltaY * deltaMultiplier;

    if (delta > 0) dismissWelcome();
  }

  function handleTouchStart(event) {
    if (!event.isTrusted || event.touches.length !== 1) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchTracking = true;
  }

  function handleTouchMove(event) {
    preventScroll(event);
    if (!event.isTrusted || !touchTracking || !isInputArmed() || event.touches.length !== 1) return;

    const distanceX = event.touches[0].clientX - touchStartX;
    const distanceY = touchStartY - event.touches[0].clientY;

    if (distanceY >= 42 && distanceY > Math.abs(distanceX) * 1.15) {
      touchTracking = false;
      dismissWelcome();
    }
  }

  function handleTouchEnd() {
    touchTracking = false;
  }

  function handleKeydown(event) {
    if (!event.isTrusted || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;

    const isInteractiveTarget = event.target instanceof Element
      && Boolean(event.target.closest("a, button, input, select, textarea, [contenteditable='true']"));

    if (reverseScrollKeys.has(event.key)) {
      preventScroll(event);
      return;
    }

    if (!scrollKeys.has(event.key) || (event.key === " " && isInteractiveTarget)) return;

    preventScroll(event);
    if (isInputArmed()) dismissWelcome({ restoreFocus: true });
  }

  const addGestureListeners = () => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeydown);
  };

  const showWelcomeContent = () => {
    if (state === WELCOME_STATE.READY || state === WELCOME_STATE.DISMISSED) return;

    window.clearTimeout(revealFallbackTimer);
    setState(WELCOME_STATE.READY);
    welcome.classList.add("is-ready");
    welcome.setAttribute("aria-busy", "false");
    brand?.removeAttribute("inert");
    brand?.removeAttribute("aria-hidden");
    brand?.removeAttribute("tabindex");
    content?.removeAttribute("inert");
    content?.removeAttribute("aria-hidden");
    document.dispatchEvent(new CustomEvent("welcome:ready"));
  };

  const beginReveal = () => {
    if (state !== WELCOME_STATE.LOADING) return;

    if (reduceMotion) {
      welcome.classList.add("is-reduced-motion");
      showWelcomeContent();
      return;
    }

    setState(WELCOME_STATE.REVEALING);
    welcome.classList.add("is-revealing");

    const handleRevealEnd = (event) => {
      if (event.target !== media || event.animationName !== "welcomeMediaReveal") return;
      media.removeEventListener("animationend", handleRevealEnd);
      showWelcomeContent();
    };

    media?.addEventListener("animationend", handleRevealEnd);
    revealFallbackTimer = window.setTimeout(showWelcomeContent, 1700);
  };

  const waitForVideoFrame = () => new Promise((resolve) => {
    if (!video || reduceMotion) {
      resolve();
      return;
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("loadeddata", settle);
      video.removeEventListener("canplay", settle);
      video.removeEventListener("error", handleVideoError);
      videoSource?.removeEventListener("error", handleVideoError);
      resolve();
    };
    const handleVideoError = () => {
      welcome.classList.add("has-video-error");
      settle();
    };

    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      handleVideoError();
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      settle();
      return;
    }

    video.addEventListener("loadeddata", settle, { once: true });
    video.addEventListener("canplay", settle, { once: true });
    video.addEventListener("error", handleVideoError, { once: true });
    videoSource?.addEventListener("error", handleVideoError, { once: true });
    window.setTimeout(() => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        welcome.classList.add("has-video-error");
      }
      settle();
    }, 2400);
  });

  lockPage();
  addGestureListeners();
  setState(WELCOME_STATE.LOADING);

  if (reduceMotion) {
    video?.pause();
  } else if (video) {
    video.addEventListener("loadeddata", () => {
      welcome.classList.remove("has-video-error");
    }, { once: true });
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.play().catch(() => {
      // A decoded first frame still provides a useful fallback when autoplay is blocked.
    });
  }

  Promise.all([delay(reduceMotion ? 0 : 500), waitForVideoFrame()]).then(beginReveal);
}
