// ==========================================================================
// medtrainer.js — page-only behavior for the hidden MedTrainer page.
// Sibling of kohler/kohler.js, same mechanics: smooth scroll to Questions,
// the JD accordion, and the notes fields (auto-grow, localStorage
// persistence). Uses a distinct storage prefix so notes never collide with
// the Kohler page's.
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------
  // Smooth scroll to Questions
  // ------------------------------------------------------------------
  var questionsBtn = document.getElementById("questionsNavBtn");
  var questionsSection = document.getElementById("questions-for-you");

  if (questionsBtn && questionsSection) {
    questionsBtn.addEventListener("click", function (event) {
      event.preventDefault();
      questionsSection.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  // ------------------------------------------------------------------
  // JD accordion
  // ------------------------------------------------------------------
  var triggers = document.querySelectorAll(".mt-acc-trigger");

  function openPanel(trigger) {
    var panel = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!panel) return;
    var item = trigger.closest(".mt-acc-item");

    panel.hidden = false;
    // Force layout so the browser registers the starting height (0) before
    // animating to the measured height.
    /* eslint-disable no-unused-expressions */
    panel.offsetHeight;
    /* eslint-enable no-unused-expressions */
    panel.style.maxHeight = panel.scrollHeight + "px";

    trigger.setAttribute("aria-expanded", "true");
    if (item) item.classList.add("is-open");
  }

  function closePanel(trigger) {
    var panel = document.getElementById(trigger.getAttribute("aria-controls"));
    if (!panel) return;
    var item = trigger.closest(".mt-acc-item");

    panel.style.maxHeight = panel.scrollHeight + "px";
    panel.offsetHeight;
    panel.style.maxHeight = "0px";

    trigger.setAttribute("aria-expanded", "false");
    if (item) item.classList.remove("is-open");

    var handleEnd = function () {
      panel.hidden = true;
      panel.removeEventListener("transitionend", handleEnd);
    };

    if (prefersReducedMotion) {
      panel.hidden = true;
    } else {
      panel.addEventListener("transitionend", handleEnd);
    }
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var isOpen = trigger.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closePanel(trigger);
      } else {
        openPanel(trigger);
      }
    });
  });

  // ------------------------------------------------------------------
  // Notes: auto-grow + localStorage persistence (debounced) + saved-state
  // markers.
  // ------------------------------------------------------------------
  var STORAGE_PREFIX = "medtrainerNotes:";
  var MAX_NOTE_HEIGHT = 220;
  var SAVE_DEBOUNCE_MS = 400;
  var saveTimers = {};

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* ignore — storage may be unavailable (private browsing, quota, etc.) */
    }
  }

  function collapseTextarea(textarea) {
    textarea.style.overflowY = "hidden";
    textarea.style.height = "";
  }

  function expandTextarea(textarea) {
    textarea.style.overflowY = "auto";
    textarea.style.height = "auto";
    var newHeight = Math.min(textarea.scrollHeight, MAX_NOTE_HEIGHT);
    textarea.style.height = newHeight + "px";
  }

  function updateHasNotesMarker(qid, value) {
    var card = document.querySelector('.mt-q-card[data-card="' + qid + '"]');
    if (!card) return;
    if (value && value.trim().length > 0) {
      card.classList.add("has-notes");
    } else {
      card.classList.remove("has-notes");
    }
  }

  function showSavedIndicator(qid) {
    var card = document.querySelector('.mt-q-card[data-card="' + qid + '"]');
    if (!card) return;
    var indicator = card.querySelector(".mt-note-saved");
    if (!indicator) return;
    indicator.textContent = "Saved";
    indicator.classList.add("is-visible");
    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(function () {
      indicator.classList.remove("is-visible");
    }, 1500);
  }

  function debounceSave(qid, value) {
    if (saveTimers[qid]) {
      clearTimeout(saveTimers[qid]);
    }
    saveTimers[qid] = setTimeout(function () {
      storageSet(STORAGE_PREFIX + qid, value);
      showSavedIndicator(qid);
    }, SAVE_DEBOUNCE_MS);
  }

  var noteInputs = document.querySelectorAll(".mt-note-input");

  noteInputs.forEach(function (textarea) {
    var qid = textarea.dataset.qid;
    var saved = storageGet(STORAGE_PREFIX + qid);

    if (saved !== null) {
      textarea.value = saved;
      updateHasNotesMarker(qid, saved);
    }

    collapseTextarea(textarea);

    textarea.addEventListener("focus", function () {
      expandTextarea(textarea);
    });

    textarea.addEventListener("input", function () {
      expandTextarea(textarea);
      updateHasNotesMarker(qid, textarea.value);
      debounceSave(qid, textarea.value);
    });

    textarea.addEventListener("blur", function () {
      collapseTextarea(textarea);
    });
  });
});
