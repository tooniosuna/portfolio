// ==========================================================================
// main.js
// Shared behavior for every page (index.html and credentials/index.html):
// the mobile nav toggle, the hero typewriter animation, and sizing the
// hero backdrop band. Language switching itself lives in i18n.js, loaded
// just before this file — main.js only reads from it (window.i18n) for
// the typewriter's role words.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle: shows/hides the nav menu on small screens and keeps
  // the hamburger icon + aria-expanded in sync with the open/closed state.
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close the menu automatically after tapping a link (mobile UX).
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Hero typewriter: types out each title, pauses, erases it, then moves to
  // the next one, looping forever. The target span is aria-hidden — a
  // static sr-only list right next to it covers screen readers instead.
  //
  // The role words themselves come from i18n.js's dictionary (hero.roles),
  // not a hardcoded array here, so switching language mid-visit restarts
  // the loop with the Spanish (or English) words instead.
  const typewriterEl = document.getElementById("typewriter");

  if (typewriterEl) {
    const TYPE_SPEED_MS = 80;
    const ERASE_SPEED_MS = 40;
    const PAUSE_AFTER_TYPE_MS = 1600;
    const PAUSE_AFTER_ERASE_MS = 300;
    const FALLBACK_ROLES = ["Product Owner", "Product Manager", "Business Analyst"];

    let roles = getRoles();
    let roleIndex = 0;
    let charIndex = 0;
    let pendingTimeoutId = null;

    function getRoles() {
      if (window.i18n && typeof window.i18n.t === "function") {
        const fromDict = window.i18n.t("hero.roles");
        if (Array.isArray(fromDict) && fromDict.length > 0) {
          return fromDict;
        }
      }
      return FALLBACK_ROLES;
    }

    function typeNextChar() {
      const currentRole = roles[roleIndex];
      charIndex++;
      typewriterEl.textContent = currentRole.slice(0, charIndex);

      if (charIndex < currentRole.length) {
        pendingTimeoutId = setTimeout(typeNextChar, TYPE_SPEED_MS);
      } else {
        pendingTimeoutId = setTimeout(eraseNextChar, PAUSE_AFTER_TYPE_MS);
      }
    }

    function eraseNextChar() {
      charIndex--;
      typewriterEl.textContent = roles[roleIndex].slice(0, charIndex);

      if (charIndex > 0) {
        pendingTimeoutId = setTimeout(eraseNextChar, ERASE_SPEED_MS);
      } else {
        roleIndex = (roleIndex + 1) % roles.length;
        pendingTimeoutId = setTimeout(typeNextChar, PAUSE_AFTER_ERASE_MS);
      }
    }

    // Cancels whatever's mid-flight and starts over with the current
    // language's role words. Used on first load, and again every time the
    // language toggle fires.
    function restartTypewriter() {
      if (pendingTimeoutId) {
        clearTimeout(pendingTimeoutId);
        pendingTimeoutId = null;
      }
      roles = getRoles();
      roleIndex = 0;
      charIndex = 0;
      typewriterEl.textContent = "";
      typeNextChar();
    }

    restartTypewriter();
    window.addEventListener("langchange", restartTypewriter);
  }

  // Hero backdrop sizing: the full-width backdrop band (.hero-backdrop) is
  // "position: absolute; top: 0" with no height set in CSS, because the
  // right height depends on where the photo ends — which shifts depending
  // on screen size (stacked on mobile, side-by-side on desktop). Instead
  // of guessing that in CSS, measure it: the band's height is the distance
  // from the top of .hero down to the bottom of .hero-image, so the band
  // always stops exactly at the bottom edge of the photo. Only present on
  // index.html, so this quietly does nothing on the Credentials page.
  function sizeHeroBackdrop() {
    const hero = document.querySelector(".hero");
    const heroImage = document.querySelector(".hero-image");
    const backdrop = document.querySelector(".hero-backdrop");

    if (!hero || !heroImage || !backdrop) return;

    const heroTop = hero.getBoundingClientRect().top;
    const imageBottom = heroImage.getBoundingClientRect().bottom;
    backdrop.style.height = Math.round(imageBottom - heroTop) + "px";
  }

  sizeHeroBackdrop();

  // Re-measure once everything (including the photo) has fully loaded, and
  // again whenever the window is resized or rotated.
  window.addEventListener("load", sizeHeroBackdrop);
  window.addEventListener("resize", sizeHeroBackdrop);
});
