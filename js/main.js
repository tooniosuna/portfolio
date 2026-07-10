// ==========================================================================
// Slice 0 — placeholder script.
// Real behavior (typewriter animation, collapsible timeline cards, etc.)
// gets built slice by slice starting in Slice 2.
// This file only proves that js/main.js loads correctly on GitHub Pages
// using a relative path.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("js-check");
  if (el) {
    el.textContent = "JavaScript loaded correctly ✅";
  }
});
