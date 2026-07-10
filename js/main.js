// ==========================================================================
// main.js
// Shared behavior for every page (index.html and credentials/index.html).
// Real interactive features (typewriter, collapsible timeline cards) get
// added slice by slice — this file currently only handles the mobile nav
// toggle, plus the Slice 0 pipeline check.
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
  const typewriterEl = document.getElementById("typewriter");

  if (typewriterEl) {
    const roles = ["Product Owner", "Product Manager", "Business Analyst"];
    const TYPE_SPEED_MS = 80;
    const ERASE_SPEED_MS = 40;
    const PAUSE_AFTER_TYPE_MS = 1600;
    const PAUSE_AFTER_ERASE_MS = 300;

    let roleIndex = 0;
    let charIndex = 0;

    function typeNextChar() {
      const currentRole = roles[roleIndex];
      charIndex++;
      typewriterEl.textContent = currentRole.slice(0, charIndex);

      if (charIndex < currentRole.length) {
        setTimeout(typeNextChar, TYPE_SPEED_MS);
      } else {
        setTimeout(eraseNextChar, PAUSE_AFTER_TYPE_MS);
      }
    }

    function eraseNextChar() {
      charIndex--;
      typewriterEl.textContent = roles[roleIndex].slice(0, charIndex);

      if (charIndex > 0) {
        setTimeout(eraseNextChar, ERASE_SPEED_MS);
      } else {
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(typeNextChar, PAUSE_AFTER_ERASE_MS);
      }
    }

    typeNextChar();
  }
});
