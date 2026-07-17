// ==========================================================================
// event-wizard.js
// Resort Event Wizard — a linear, single-page flow: name, event type,
// guests, date, main venue, [reception venue, mood — weddings only],
// quote, [package — weddings only], terms, checkout/payment, confirmation.
// The persistent progress bar only shows the 3 big phases (Details /
// Selection / Deposit); each screen's own sub-label names the specific
// step within that phase.
//
// All state lives in the WIZ object below. It's mirrored to
// sessionStorage on every step change (not a real backend — just enough
// so an accidental refresh doesn't wipe an in-progress session), and a
// "cheat" query param (?cheat=1), or the in-page "Skip to checkout"
// shortcut in the hero, can fast-forward straight to checkout with
// plausible sample answers, for quickly demoing the later screens.
// ==========================================================================

(function () {
  "use strict";

  var Data = window.EventWizardData;

  // Small i18n helper — every dynamically-rendered string in this file
  // (venue cards, event type cards, mood cards, package cards, quote and
  // order summary rows, calendar labels, countdown labels, modal copy)
  // goes through this instead of a hardcoded English string, with the
  // English literal kept as the fallback if i18n.js hasn't loaded.
  function t(key, fallback) {
    if (window.i18n && typeof window.i18n.t === "function") {
      var value = window.i18n.t(key);
      if (typeof value === "string") return value;
    }
    return fallback;
  }

  // Date/time figures (calendar month, selected-date sentence, order
  // summary date, schedule-call slot labels) read in the active language's
  // locale; currency stays fixed en-US formatting always (see
  // Data.formatCurrency) — same convention just established for the
  // Inventory demo (see reception.js/sales.js's currentLocale()).
  function currentLocale() {
    return window.i18n && window.i18n.getLang() === "es" ? "es-MX" : "en-US";
  }

  // ------------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------------
  var WIZ = {
    firstName: "",
    lastName: "",
    eventType: null,
    totalGuests: 120,
    is1000Plus: false,
    overnightGuests: 70,
    eventDate: null,
    mainSpaceId: null,
    receptionSpaceId: null,
    moodId: null,
    packageId: null,
    quote: null,
    packageCost: null,
    finalTotal: null,
    termsAccepted: false,
    savedProgress: false,
    saveEmail: "",
    savePhone: "",
    depositPaid: false,
    holdUntil: null,
    scheduledSlot: null
  };

  var currentStepId = null;
  var calendarViewMonth = null;
  var countdownIntervalId = null;
  var pendingScheduleSelection = null;

  // ------------------------------------------------------------------------
  // DOM REFS
  // ------------------------------------------------------------------------
  var wizPhases = document.getElementById("wizPhases");
  var wizPhaseSubLabel = document.getElementById("wizPhaseSubLabel");
  var saveProgressToggleBtn = document.getElementById("saveProgressToggleBtn");
  var resetWizardBtn = document.getElementById("resetWizardBtn");

  var firstNameInput = document.getElementById("firstNameInput");
  var lastNameInput = document.getElementById("lastNameInput");
  var nameError = document.getElementById("nameError");
  var nameNextBtn = document.getElementById("nameNextBtn");

  var eventTypeList = document.getElementById("eventTypeList");
  var eventTypeError = document.getElementById("eventTypeError");
  var eventTypeBackBtn = document.getElementById("eventTypeBackBtn");
  var eventTypeNextBtn = document.getElementById("eventTypeNextBtn");

  var totalGuestsValue = document.getElementById("totalGuestsValue");
  var totalGuestsSlider = document.getElementById("totalGuestsSlider");
  var guestsMinusBtn = document.getElementById("guestsMinusBtn");
  var guestsPlusBtn = document.getElementById("guestsPlusBtn");
  var guests1000PlusToggle = document.getElementById("guests1000PlusToggle");
  var overnightGuestsBlock = document.getElementById("overnightGuestsBlock");
  var overnightGuestsValue = document.getElementById("overnightGuestsValue");
  var overnightGuestsSlider = document.getElementById("overnightGuestsSlider");
  var overnightMinusBtn = document.getElementById("overnightMinusBtn");
  var overnightPlusBtn = document.getElementById("overnightPlusBtn");
  var guestsError = document.getElementById("guestsError");
  var guestsBackBtn = document.getElementById("guestsBackBtn");
  var guestsNextBtn = document.getElementById("guestsNextBtn");

  var calendarPrevBtn = document.getElementById("calendarPrevBtn");
  var calendarNextBtn = document.getElementById("calendarNextBtn");
  var calendarMonthLabel = document.getElementById("calendarMonthLabel");
  var calendarJumpPanel = document.getElementById("calendarJumpPanel");
  var calendarJumpMonthSelect = document.getElementById("calendarJumpMonth");
  var calendarJumpYearSelect = document.getElementById("calendarJumpYear");
  var calendarGrid = document.getElementById("calendarGrid");
  var selectedDateDisplay = document.getElementById("selectedDateDisplay");
  var dateError = document.getElementById("dateError");
  var dateBackBtn = document.getElementById("dateBackBtn");
  var dateNextBtn = document.getElementById("dateNextBtn");

  var contactBranchBackBtn = document.getElementById("contactBranchBackBtn");
  var contactBranchScheduleBtn = document.getElementById("contactBranchScheduleBtn");
  var contactBranchScheduleNote = document.getElementById("contactBranchScheduleNote");

  var mainVenueHeading = document.getElementById("mainVenueHeading");
  var mainVenueSub = document.getElementById("mainVenueSub");
  var mainVenueList = document.getElementById("mainVenueList");
  var mainVenueError = document.getElementById("mainVenueError");
  var mainVenueBackBtn = document.getElementById("mainVenueBackBtn");
  var mainVenueNextBtn = document.getElementById("mainVenueNextBtn");

  var receptionVenueList = document.getElementById("receptionVenueList");
  var receptionVenueError = document.getElementById("receptionVenueError");
  var receptionBackBtn = document.getElementById("receptionBackBtn");
  var receptionNextBtn = document.getElementById("receptionNextBtn");

  var moodList = document.getElementById("moodList");
  var moodError = document.getElementById("moodError");
  var moodBackBtn = document.getElementById("moodBackBtn");
  var moodNextBtn = document.getElementById("moodNextBtn");

  var quoteStepSub = document.getElementById("quoteStepSub");
  var quoteBreakdown = document.getElementById("quoteBreakdown");
  var quoteBackBtn = document.getElementById("quoteBackBtn");
  var quoteNextBtn = document.getElementById("quoteNextBtn");

  var packageList = document.getElementById("packageList");
  var finalTotalCard = document.getElementById("finalTotalCard");
  var packageError = document.getElementById("packageError");
  var packageBackBtn = document.getElementById("packageBackBtn");
  var packageNextBtn = document.getElementById("packageNextBtn");

  var termsAcceptCheckbox = document.getElementById("termsAcceptCheckbox");
  var termsError = document.getElementById("termsError");
  var termsBackBtn = document.getElementById("termsBackBtn");
  var termsNextBtn = document.getElementById("termsNextBtn");

  var orderSummaryTotalPreview = document.getElementById("orderSummaryTotalPreview");
  var orderSummary = document.getElementById("orderSummary");
  var saveRequiredNote = document.getElementById("saveRequiredNote");
  var cardNameInput = document.getElementById("cardNameInput");
  var cardNameFieldError = document.getElementById("cardNameFieldError");
  var cardNumberInput = document.getElementById("cardNumberInput");
  var cardNumberFieldError = document.getElementById("cardNumberFieldError");
  var cardExpiryMonthSelect = document.getElementById("cardExpiryMonthSelect");
  var cardExpiryYearSelect = document.getElementById("cardExpiryYearSelect");
  var cardExpiryFieldError = document.getElementById("cardExpiryFieldError");
  var cardCvvInput = document.getElementById("cardCvvInput");
  var cardCvvFieldError = document.getElementById("cardCvvFieldError");
  var payDepositBtn = document.getElementById("payDepositBtn");
  var checkoutBackBtn = document.getElementById("checkoutBackBtn");

  var confirmationHeading = document.getElementById("confirmationHeading");
  var balanceDueValue = document.getElementById("balanceDueValue");
  var countdownDays = document.getElementById("countdownDays");
  var countdownHours = document.getElementById("countdownHours");
  var countdownMinutes = document.getElementById("countdownMinutes");
  var countdownSeconds = document.getElementById("countdownSeconds");
  var scheduleCallBtn = document.getElementById("scheduleCallBtn");
  var scheduleConfirmationNote = document.getElementById("scheduleConfirmationNote");

  var saveBackdrop = document.getElementById("saveBackdrop");
  var saveFlyout = document.getElementById("saveFlyout");
  var saveFlyoutCloseBtn = document.getElementById("saveFlyoutCloseBtn");
  var saveEmailInput = document.getElementById("saveEmailInput");
  var saveCountryCodeInput = document.getElementById("saveCountryCodeInput");
  var savePhoneInput = document.getElementById("savePhoneInput");
  var savePrivacyCheckbox = document.getElementById("savePrivacyCheckbox");
  var saveFlyoutRequiredNote = document.getElementById("saveFlyoutRequiredNote");
  var privacyPolicyLinkBtn = document.getElementById("privacyPolicyLinkBtn");
  var saveContactMissingError = document.getElementById("saveContactMissingError");
  var saveEmailFormatError = document.getElementById("saveEmailFormatError");
  var saveCountryCodeError = document.getElementById("saveCountryCodeError");
  var savePhoneFormatError = document.getElementById("savePhoneFormatError");
  var savePrivacyError = document.getElementById("savePrivacyError");
  var saveConfirmBtn = document.getElementById("saveConfirmBtn");
  var saveConfirmationNote = document.getElementById("saveConfirmationNote");

  var privacyBackdrop = document.getElementById("privacyBackdrop");
  var privacyModal = document.getElementById("privacyModal");
  var privacyModalCloseBtn = document.getElementById("privacyModalCloseBtn");

  var scheduleBackdrop = document.getElementById("scheduleBackdrop");
  var scheduleModal = document.getElementById("scheduleModal");
  var scheduleModalCloseBtn = document.getElementById("scheduleModalCloseBtn");
  var scheduleSlotList = document.getElementById("scheduleSlotList");
  var scheduleError = document.getElementById("scheduleError");
  var scheduleCancelBtn = document.getElementById("scheduleCancelBtn");
  var scheduleConfirmBtn = document.getElementById("scheduleConfirmBtn");

  var resetBackdrop = document.getElementById("resetBackdrop");
  var resetModal = document.getElementById("resetModal");
  var resetModalCloseBtn = document.getElementById("resetModalCloseBtn");
  var resetCancelBtn = document.getElementById("resetCancelBtn");
  var resetConfirmBtn = document.getElementById("resetConfirmBtn");

  // ------------------------------------------------------------------------
  // STEP NAVIGATION
  // ------------------------------------------------------------------------
  var PHASE_ORDER = ["details", "selection", "deposit"];
  var PHASE_SUBLABEL_KEYS = {
    "name": ["eventWizard.sublabel.name", "Let's start with you"],
    "event-type": ["eventWizard.sublabel.eventType", "What are you planning?"],
    "guests": ["eventWizard.sublabel.guests", "How many guests are you expecting"],
    "date": ["eventWizard.sublabel.date", "Pick your event date"],
    "contact-branch": ["eventWizard.sublabel.contactBranch", "Let's connect you with a specialist"],
    "main-venue": ["eventWizard.sublabel.mainVenue", "Choose your venue"],
    "reception-venue": ["eventWizard.sublabel.receptionVenue", "Choose your reception space"],
    "mood": ["eventWizard.sublabel.mood", "What's the mood"],
    "quote": ["eventWizard.sublabel.quote", "Your estimate"],
    "package": ["eventWizard.sublabel.package", "Choose your package"],
    "terms": ["eventWizard.sublabel.terms", "Terms & conditions"],
    "checkout": ["eventWizard.sublabel.checkout", "Review & pay your deposit"],
    "confirmation": ["eventWizard.sublabel.confirmation", "You're booked!"]
  };

  function subLabelForStep(stepId) {
    var entry = PHASE_SUBLABEL_KEYS[stepId];
    if (!entry) return "";
    return t(entry[0], entry[1]);
  }

  function updatePhaseIndicator(activePhase) {
    var activeIdx = PHASE_ORDER.indexOf(activePhase);
    var items = wizPhases.querySelectorAll(".wiz-phase");
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      var idx = PHASE_ORDER.indexOf(li.getAttribute("data-phase"));
      li.classList.remove("is-active", "is-done");
      if (idx < activeIdx) li.classList.add("is-done");
      else if (idx === activeIdx) li.classList.add("is-active");
    }
  }

  function showStep(stepId) {
    var allSteps = document.querySelectorAll(".wiz-step");
    for (var i = 0; i < allSteps.length; i++) allSteps[i].hidden = true;

    var target = document.querySelector('.wiz-step[data-step="' + stepId + '"]');
    if (!target) return;
    target.hidden = false;

    updatePhaseIndicator(target.getAttribute("data-phase"));
    wizPhaseSubLabel.textContent = subLabelForStep(stepId);

    currentStepId = stepId;
    persistState();

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ------------------------------------------------------------------------
  // PERSISTENCE — sessionStorage only, so an accidental refresh doesn't
  // lose an in-progress session. Not a real backend; nothing survives
  // beyond this browser tab.
  // ------------------------------------------------------------------------
  function persistState() {
    try {
      var toSave = {};
      for (var key in WIZ) {
        if (WIZ.hasOwnProperty(key)) toSave[key] = WIZ[key];
      }
      sessionStorage.setItem("eventWizardState", JSON.stringify({ step: currentStepId, wiz: toSave }));
    } catch (e) {
      // sessionStorage unavailable — demo still works, just won't survive a refresh
    }
  }

  function hydrateFromStorage() {
    try {
      var raw = sessionStorage.getItem("eventWizardState");
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.wiz || !parsed.step) return false;

      var saved = parsed.wiz;
      if (saved.eventDate) saved.eventDate = new Date(saved.eventDate);
      if (saved.holdUntil) saved.holdUntil = new Date(saved.holdUntil);
      for (var key in saved) {
        if (saved.hasOwnProperty(key)) WIZ[key] = saved[key];
      }

      firstNameInput.value = WIZ.firstName || "";
      lastNameInput.value = WIZ.lastName || "";
      renderEventTypes();
      updateGuestsUI();
      guests1000PlusToggle.checked = WIZ.is1000Plus;
      toggleGuestsDisabledState(WIZ.is1000Plus);

      if (WIZ.eventDate) {
        calendarViewMonth = startOfMonth(WIZ.eventDate);
        renderCalendar();
        updateSelectedDateDisplay();
      }
      updateMainVenueCopy();
      renderMainVenues();
      renderReceptionVenues();
      renderMoods();
      if (WIZ.quote) computeAndRenderQuote();
      renderPackages();
      if (WIZ.packageId) updateFinalTotalCard();
      termsAcceptCheckbox.checked = !!WIZ.termsAccepted;
      if (WIZ.quote && WIZ.finalTotal) renderOrderSummary();
      if (WIZ.depositPaid) renderConfirmation();

      showStep(parsed.step);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ------------------------------------------------------------------------
  // NAME STEP
  // ------------------------------------------------------------------------
  nameNextBtn.addEventListener("click", function () {
    var first = firstNameInput.value.trim();
    var last = lastNameInput.value.trim();
    if (!first || !last) {
      nameError.hidden = false;
      return;
    }
    nameError.hidden = true;
    WIZ.firstName = first;
    WIZ.lastName = last;
    showStep("event-type");
  });

  // ------------------------------------------------------------------------
  // EVENT TYPE STEP
  // ------------------------------------------------------------------------
  function renderEventTypes() {
    eventTypeList.innerHTML = "";
    Data.EVENT_TYPES.forEach(function (et) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "wiz-eventtype-card" + (et.id === WIZ.eventType ? " is-selected" : "");

      var h3 = document.createElement("h3");
      h3.textContent = Data.eventTypeName(et);
      var p = document.createElement("p");
      p.textContent = Data.eventTypeDescription(et);

      card.appendChild(h3);
      card.appendChild(p);
      card.addEventListener("click", function () {
        WIZ.eventType = et.id;
        eventTypeError.hidden = true;
        renderEventTypes();
      });
      eventTypeList.appendChild(card);
    });
  }

  eventTypeBackBtn.addEventListener("click", function () { showStep("name"); });
  eventTypeNextBtn.addEventListener("click", function () {
    if (!WIZ.eventType) {
      eventTypeError.hidden = false;
      return;
    }
    eventTypeError.hidden = true;
    showStep("guests");
  });

  // ------------------------------------------------------------------------
  // GUESTS STEP
  // ------------------------------------------------------------------------
  function clampGuests(v) {
    return Math.max(Data.MIN_GUESTS, Math.min(Data.MAX_GUESTS, v));
  }

  function updateGuestsUI() {
    totalGuestsValue.textContent = WIZ.totalGuests;
    totalGuestsSlider.value = WIZ.totalGuests;
    overnightGuestsSlider.max = WIZ.totalGuests;
    if (WIZ.overnightGuests > WIZ.totalGuests) WIZ.overnightGuests = WIZ.totalGuests;
    overnightGuestsValue.textContent = WIZ.overnightGuests;
    overnightGuestsSlider.value = WIZ.overnightGuests;
  }

  guestsMinusBtn.addEventListener("click", function () {
    WIZ.totalGuests = clampGuests(WIZ.totalGuests - 10);
    updateGuestsUI();
  });

  guestsPlusBtn.addEventListener("click", function () {
    WIZ.totalGuests = clampGuests(WIZ.totalGuests + 10);
    updateGuestsUI();
  });

  totalGuestsSlider.addEventListener("input", function () {
    WIZ.totalGuests = parseInt(totalGuestsSlider.value, 10);
    updateGuestsUI();
  });

  overnightMinusBtn.addEventListener("click", function () {
    WIZ.overnightGuests = Math.max(0, WIZ.overnightGuests - 5);
    updateGuestsUI();
  });

  overnightPlusBtn.addEventListener("click", function () {
    WIZ.overnightGuests = Math.min(WIZ.totalGuests, WIZ.overnightGuests + 5);
    updateGuestsUI();
  });

  overnightGuestsSlider.addEventListener("input", function () {
    WIZ.overnightGuests = parseInt(overnightGuestsSlider.value, 10);
    updateGuestsUI();
  });

  function toggleGuestsDisabledState(disabled) {
    totalGuestsSlider.disabled = disabled;
    guestsMinusBtn.disabled = disabled;
    guestsPlusBtn.disabled = disabled;
    overnightGuestsBlock.style.opacity = disabled ? "0.4" : "1";
    overnightGuestsSlider.disabled = disabled;
    overnightMinusBtn.disabled = disabled;
    overnightPlusBtn.disabled = disabled;
  }

  guests1000PlusToggle.addEventListener("change", function () {
    WIZ.is1000Plus = guests1000PlusToggle.checked;
    toggleGuestsDisabledState(WIZ.is1000Plus);
  });

  guestsBackBtn.addEventListener("click", function () { showStep("event-type"); });

  guestsNextBtn.addEventListener("click", function () {
    if (WIZ.is1000Plus) {
      showStep("contact-branch");
      return;
    }
    if (WIZ.totalGuests < Data.MIN_GUESTS) {
      guestsError.hidden = false;
      return;
    }
    guestsError.hidden = true;
    showStep("date");
  });

  // ------------------------------------------------------------------------
  // 1,000+ CONTACT BRANCH
  // ------------------------------------------------------------------------
  contactBranchBackBtn.addEventListener("click", function () { showStep("guests"); });
  contactBranchScheduleBtn.addEventListener("click", function () { openScheduleModal(); });

  // ------------------------------------------------------------------------
  // DATE STEP — custom calendar, min lead time, some dates unavailable.
  // Availability depends on the guest count already chosen in the
  // previous step (see Data.isDateUnavailable) — a bigger event sees a
  // slightly tighter set of open dates.
  // ------------------------------------------------------------------------
  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function addMonths(date, n) {
    return new Date(date.getFullYear(), date.getMonth() + n, 1);
  }

  function isSameDate(a, b) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function minSelectableDate() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Data.MIN_LEAD_DAYS);
    return d;
  }

  function renderCalendar() {
    var monthStart = calendarViewMonth;
    calendarMonthLabel.textContent = monthStart.toLocaleDateString(currentLocale(), { month: "long", year: "numeric" });
    calendarGrid.innerHTML = "";

    var firstWeekday = monthStart.getDay();
    var daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    var minDate = minSelectableDate();

    for (var i = 0; i < firstWeekday; i++) {
      var empty = document.createElement("span");
      empty.className = "wiz-calendar-day is-empty";
      calendarGrid.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var thisDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wiz-calendar-day";
      btn.textContent = day;

      var disabled = thisDate < minDate || Data.isDateUnavailable(thisDate, WIZ.totalGuests);
      btn.disabled = disabled;
      if (disabled && !(thisDate < minDate)) btn.classList.add("is-unavailable");
      if (!disabled && isSameDate(thisDate, WIZ.eventDate)) btn.classList.add("is-selected");

      if (!disabled) {
        (function (d, button) {
          button.addEventListener("click", function () {
            WIZ.eventDate = d;
            dateError.hidden = true;
            renderCalendar();
            updateSelectedDateDisplay();
          });
        })(thisDate, btn);
      }

      calendarGrid.appendChild(btn);
    }
  }

  function updateSelectedDateDisplay() {
    if (!WIZ.eventDate) {
      selectedDateDisplay.textContent = t("eventWizard.calendar.noDateSelected", "No date selected yet.");
      return;
    }
    var formatted = WIZ.eventDate.toLocaleDateString(currentLocale(), { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    selectedDateDisplay.textContent = t("eventWizard.calendar.selectedDatePrefix", "Event on") + " " + formatted + ".";
  }

  calendarPrevBtn.addEventListener("click", function () {
    calendarViewMonth = addMonths(calendarViewMonth, -1);
    renderCalendar();
    calendarJumpPanel.hidden = true;
  });

  calendarNextBtn.addEventListener("click", function () {
    calendarViewMonth = addMonths(calendarViewMonth, 1);
    renderCalendar();
    calendarJumpPanel.hidden = true;
  });

  // Month/year quick-jump — clicking the "Month Year" label reveals two
  // <select>s so people don't have to click the arrow dozens of times to
  // get a year or two out.
  function populateCalendarJumpYears() {
    var minDate = minSelectableDate();
    var minYear = minDate.getFullYear();
    var maxYear = minYear + 3;
    calendarJumpYearSelect.innerHTML = "";
    for (var y = minYear; y <= maxYear; y++) {
      var opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      calendarJumpYearSelect.appendChild(opt);
    }
    calendarJumpYearSelect.value = String(calendarViewMonth.getFullYear());
  }

  function populateCalendarJumpMonths() {
    calendarJumpMonthSelect.innerHTML = "";
    for (var m = 0; m < 12; m++) {
      var opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = new Date(2000, m, 1).toLocaleDateString(currentLocale(), { month: "long" });
      calendarJumpMonthSelect.appendChild(opt);
    }
    calendarJumpMonthSelect.value = String(calendarViewMonth.getMonth());
  }

  function jumpToSelectedMonthYear() {
    var y = parseInt(calendarJumpYearSelect.value, 10);
    var m = parseInt(calendarJumpMonthSelect.value, 10);
    calendarViewMonth = new Date(y, m, 1);
    renderCalendar();
  }

  calendarMonthLabel.addEventListener("click", function () {
    if (calendarJumpPanel.hidden) {
      populateCalendarJumpYears();
      populateCalendarJumpMonths();
      calendarJumpPanel.hidden = false;
    } else {
      calendarJumpPanel.hidden = true;
    }
  });

  calendarJumpMonthSelect.addEventListener("change", function () {
    jumpToSelectedMonthYear();
    calendarJumpPanel.hidden = true;
  });

  calendarJumpYearSelect.addEventListener("change", function () {
    populateCalendarJumpMonths();
    jumpToSelectedMonthYear();
    calendarJumpPanel.hidden = true;
  });

  dateBackBtn.addEventListener("click", function () { showStep("guests"); });

  dateNextBtn.addEventListener("click", function () {
    if (!WIZ.eventDate) {
      dateError.hidden = false;
      return;
    }
    dateError.hidden = true;
    updateMainVenueCopy();
    showStep("main-venue");
  });

  // ------------------------------------------------------------------------
  // VENUE STEPS (main event space + reception share one card renderer).
  // Weddings get a ceremony space AND a reception space (plus a mood
  // step). Every other event type just picks one venue — the reception
  // and mood concepts don't apply outside a wedding — so the main venue
  // step's own heading/sub-copy adapt to the chosen event type.
  // ------------------------------------------------------------------------
  var MAIN_ICON = '<svg class="wiz-venue-card-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 40V22a14 14 0 0 1 28 0v18"/><path d="M4 40h40"/></svg>';
  var RECEPTION_ICON = '<svg class="wiz-venue-card-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20h32l-3 20H11L8 20Z"/><path d="M16 20V12a8 8 0 0 1 16 0v8"/></svg>';

  var MAIN_VENUE_COPY = {
    "wedding": ["eventWizard.step.mainVenue.wedding.heading", "Choose your ceremony space", "eventWizard.step.mainVenue.wedding.sub", "Where you'll say your vows."],
    "corporate": ["eventWizard.step.mainVenue.corporate.heading", "Choose your event space", "eventWizard.step.mainVenue.corporate.sub", "Where your event takes place."],
    "celebration": ["eventWizard.step.mainVenue.celebration.heading", "Choose your event space", "eventWizard.step.mainVenue.celebration.sub", "Where the celebration happens."],
    "reunion": ["eventWizard.step.mainVenue.reunion.heading", "Choose your gathering space", "eventWizard.step.mainVenue.reunion.sub", "Where everyone comes together."]
  };

  function updateMainVenueCopy() {
    var entry = MAIN_VENUE_COPY[WIZ.eventType] || MAIN_VENUE_COPY.corporate;
    mainVenueHeading.textContent = t(entry[0], entry[1]);
    mainVenueSub.textContent = t(entry[2], entry[3]);
  }

  function renderVenueCard(venue, isSelected, isMain, onSelect) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "wiz-venue-card" + (isSelected ? " is-selected" : "");

    var media = document.createElement("span");
    media.className = "wiz-venue-card-media";
    media.style.background = "linear-gradient(135deg, " + venue.gradient[0] + ", " + venue.gradient[1] + ")";
    media.innerHTML = isMain ? MAIN_ICON : RECEPTION_ICON;
    card.appendChild(media);

    var body = document.createElement("span");
    body.className = "wiz-venue-card-body";

    var top = document.createElement("span");
    top.className = "wiz-venue-card-top";
    var h3 = document.createElement("h3");
    h3.textContent = venue.name;
    var cap = document.createElement("span");
    cap.className = "wiz-venue-card-cap";
    cap.textContent = t("eventWizard.venueCard.upToPrefix", "Up to") + " " + venue.capacityGuests + " " + t("eventWizard.venueCard.guestsWord", "guests");
    top.appendChild(h3);
    top.appendChild(cap);
    body.appendChild(top);

    var tagline = document.createElement("p");
    tagline.className = "wiz-venue-card-tagline";
    tagline.textContent = Data.venueTagline(venue);
    body.appendChild(tagline);

    var featuresList = document.createElement("ul");
    featuresList.className = "wiz-venue-card-features";
    Data.venueFeatures(venue).forEach(function (f) {
      var li = document.createElement("li");
      li.textContent = f;
      featuresList.appendChild(li);
    });
    body.appendChild(featuresList);

    var fee = document.createElement("p");
    fee.className = "wiz-venue-card-fee";
    fee.textContent = "+" + Data.formatCurrency(venue.fee) + " " + t("eventWizard.venueCard.feeSuffix", "venue fee");
    body.appendChild(fee);

    card.appendChild(body);
    card.addEventListener("click", function () { onSelect(venue.id); });
    return card;
  }

  function renderMainVenues() {
    mainVenueList.innerHTML = "";
    Data.EVENT_SPACES.forEach(function (v) {
      mainVenueList.appendChild(renderVenueCard(v, v.id === WIZ.mainSpaceId, true, function (id) {
        WIZ.mainSpaceId = id;
        mainVenueError.hidden = true;
        renderMainVenues();
      }));
    });
  }

  function renderReceptionVenues() {
    receptionVenueList.innerHTML = "";
    Data.RECEPTION_SPACES.forEach(function (v) {
      receptionVenueList.appendChild(renderVenueCard(v, v.id === WIZ.receptionSpaceId, false, function (id) {
        WIZ.receptionSpaceId = id;
        receptionVenueError.hidden = true;
        renderReceptionVenues();
      }));
    });
  }

  mainVenueBackBtn.addEventListener("click", function () { showStep("date"); });
  mainVenueNextBtn.addEventListener("click", function () {
    if (!WIZ.mainSpaceId) {
      mainVenueError.hidden = false;
      return;
    }
    mainVenueError.hidden = true;
    if (WIZ.eventType === "wedding") {
      showStep("reception-venue");
    } else {
      computeAndRenderQuote();
      showStep("quote");
    }
  });

  // Reception venue + mood are only ever reached from a wedding flow now.
  receptionBackBtn.addEventListener("click", function () { showStep("main-venue"); });
  receptionNextBtn.addEventListener("click", function () {
    if (!WIZ.receptionSpaceId) {
      receptionVenueError.hidden = false;
      return;
    }
    receptionVenueError.hidden = true;
    showStep("mood");
  });

  // ------------------------------------------------------------------------
  // MOOD STEP — shown only for weddings
  // ------------------------------------------------------------------------
  function renderMoods() {
    moodList.innerHTML = "";
    Data.MOODS.forEach(function (m) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "wiz-mood-card" + (m.id === WIZ.moodId ? " is-selected" : "");

      var swatch = document.createElement("span");
      swatch.className = "wiz-mood-swatch";
      swatch.style.background = "linear-gradient(135deg, " + m.gradient[0] + ", " + m.gradient[1] + ")";

      var h3 = document.createElement("h3");
      h3.textContent = m.name;
      var p = document.createElement("p");
      p.textContent = Data.moodDescription(m);

      card.appendChild(swatch);
      card.appendChild(h3);
      card.appendChild(p);
      card.addEventListener("click", function () {
        WIZ.moodId = m.id;
        moodError.hidden = true;
        renderMoods();
      });
      moodList.appendChild(card);
    });
  }

  moodBackBtn.addEventListener("click", function () { showStep("reception-venue"); });
  moodNextBtn.addEventListener("click", function () {
    if (!WIZ.moodId) {
      moodError.hidden = false;
      return;
    }
    moodError.hidden = true;
    computeAndRenderQuote();
    showStep("quote");
  });

  // ------------------------------------------------------------------------
  // QUOTE STEP — for weddings, this is a preliminary estimate before a
  // package is chosen. For every other event type there's no package
  // step, so this number IS the final total; the step's own sub-copy and
  // "next" button label adapt accordingly.
  // ------------------------------------------------------------------------
  function updateQuoteStepCopy() {
    if (WIZ.eventType === "wedding") {
      quoteStepSub.textContent = t("eventWizard.step.quote.sub", "Pick a package next to see your final total.");
      quoteNextBtn.textContent = t("eventWizard.step.quote.nextBtn", "Choose a package →");
    } else {
      quoteStepSub.textContent = t("eventWizard.step.quote.subFinal", "This is your total estimate.");
      quoteNextBtn.textContent = t("eventWizard.step.quote.nextBtnFinal", "Continue to terms →");
    }
  }

  function computeAndRenderQuote() {
    WIZ.quote = Data.computeQuote({
      mainSpaceId: WIZ.mainSpaceId,
      receptionSpaceId: WIZ.receptionSpaceId,
      totalGuests: WIZ.totalGuests,
      overnightGuests: WIZ.overnightGuests
    });

    updateQuoteStepCopy();

    quoteBreakdown.innerHTML = "";
    var roomNightsLabel = t("eventWizard.quote.roomNightsLabel", "Room nights") +
      " (" + WIZ.quote.rooms + " " + t("eventWizard.quote.roomsWord", "rooms") + " × " +
      Data.NIGHTS_STAY + " " + t("eventWizard.quote.nightsWord", "nights") + ")";
    var guestServiceLabel = t("eventWizard.quote.guestServiceFeeLabel", "Guest service fee") +
      " (" + WIZ.totalGuests + " " + t("eventWizard.venueCard.guestsWord", "guests") + ")";
    var venueConfigLabel = WIZ.receptionSpaceId
      ? t("eventWizard.quote.venueConfigLabel", "Venue configuration (event + reception)")
      : t("eventWizard.quote.venueConfigLabelSingle", "Venue configuration");
    var rows = [
      [roomNightsLabel, WIZ.quote.roomsCost],
      [venueConfigLabel, WIZ.quote.venueConfigFee],
      [guestServiceLabel, WIZ.quote.guestServiceFee]
    ];
    rows.forEach(function (r) {
      var row = document.createElement("div");
      row.className = "wiz-quote-row";
      var label = document.createElement("span");
      label.className = "wiz-quote-row-label";
      label.textContent = r[0];
      var value = document.createElement("span");
      value.className = "wiz-quote-row-value";
      value.textContent = Data.formatCurrency(r[1]);
      row.appendChild(label);
      row.appendChild(value);
      quoteBreakdown.appendChild(row);
    });

    var totalRow = document.createElement("div");
    totalRow.className = "wiz-quote-row is-total";
    var totalLabel = document.createElement("span");
    totalLabel.className = "wiz-quote-row-label";
    totalLabel.textContent = t("eventWizard.quote.estimateSubtotal", "Estimate subtotal");
    var totalValue = document.createElement("span");
    totalValue.className = "wiz-quote-row-value";
    totalValue.textContent = Data.formatCurrency(WIZ.quote.subtotal);
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);
    quoteBreakdown.appendChild(totalRow);
  }

  quoteBackBtn.addEventListener("click", function () {
    showStep(WIZ.eventType === "wedding" ? "mood" : "main-venue");
  });
  quoteNextBtn.addEventListener("click", function () {
    if (WIZ.eventType === "wedding") {
      renderPackages();
      showStep("package");
    } else {
      WIZ.packageId = null;
      WIZ.packageCost = 0;
      WIZ.finalTotal = WIZ.quote.subtotal;
      showStep("terms");
    }
  });

  // ------------------------------------------------------------------------
  // PACKAGE STEP — weddings only
  // ------------------------------------------------------------------------
  function renderPackages() {
    packageList.innerHTML = "";
    Data.PACKAGE_TIERS.forEach(function (tier) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "wiz-package-card" + (tier.id === WIZ.packageId ? " is-selected" : "");

      var h3 = document.createElement("h3");
      h3.textContent = tier.name;
      var rate = document.createElement("p");
      rate.className = "wiz-package-rate";
      rate.textContent = Data.formatCurrency(tier.perGuestRate) + " " + t("eventWizard.package.perGuestSuffix", "/ guest");
      var cost = document.createElement("p");
      cost.className = "wiz-package-cost";
      cost.textContent = "≈ " + Data.formatCurrency(tier.perGuestRate * WIZ.totalGuests) + " " +
        t("eventWizard.package.costForWord", "for") + " " + WIZ.totalGuests + " " +
        t("eventWizard.package.costGuestsWord", "guests");

      card.appendChild(h3);
      card.appendChild(rate);
      card.appendChild(cost);

      var perGuestLabel = document.createElement("p");
      perGuestLabel.className = "wiz-package-section-label";
      perGuestLabel.textContent = t("eventWizard.package.perGuestSectionLabel", "Per guest");
      card.appendChild(perGuestLabel);
      var perGuestList = document.createElement("ul");
      Data.packagePerGuestIncludes(tier).forEach(function (f) {
        var li = document.createElement("li");
        li.textContent = f;
        perGuestList.appendChild(li);
      });
      card.appendChild(perGuestList);

      var extrasLabel = document.createElement("p");
      extrasLabel.className = "wiz-package-section-label";
      extrasLabel.textContent = t("eventWizard.package.includedOnceLabel", "Included once");
      card.appendChild(extrasLabel);
      var extrasList = document.createElement("ul");
      Data.packageFlatExtras(tier).forEach(function (f) {
        var li = document.createElement("li");
        li.textContent = f;
        extrasList.appendChild(li);
      });
      card.appendChild(extrasList);

      card.addEventListener("click", function () {
        WIZ.packageId = tier.id;
        packageError.hidden = true;
        renderPackages();
        updateFinalTotalCard();
      });
      packageList.appendChild(card);
    });
  }

  function updateFinalTotalCard() {
    if (!WIZ.packageId || !WIZ.quote) {
      finalTotalCard.hidden = true;
      return;
    }
    var result = Data.computeFinalTotal(WIZ.quote.subtotal, WIZ.packageId, WIZ.totalGuests);
    WIZ.finalTotal = result.total;
    WIZ.packageCost = result.packageCost;

    finalTotalCard.hidden = false;
    finalTotalCard.innerHTML = "";
    var label = document.createElement("span");
    label.className = "wiz-final-total-label";
    label.textContent = t("eventWizard.finalTotal.label", "Your final total");
    var value = document.createElement("span");
    value.className = "wiz-final-total-value";
    value.textContent = Data.formatCurrency(result.total);
    finalTotalCard.appendChild(label);
    finalTotalCard.appendChild(value);
  }

  packageBackBtn.addEventListener("click", function () { showStep("quote"); });
  packageNextBtn.addEventListener("click", function () {
    if (!WIZ.packageId) {
      packageError.hidden = false;
      return;
    }
    packageError.hidden = true;
    showStep("terms");
  });

  // ------------------------------------------------------------------------
  // TERMS STEP
  // ------------------------------------------------------------------------
  termsAcceptCheckbox.addEventListener("change", function () {
    WIZ.termsAccepted = termsAcceptCheckbox.checked;
  });

  termsBackBtn.addEventListener("click", function () {
    showStep(WIZ.eventType === "wedding" ? "package" : "quote");
  });
  termsNextBtn.addEventListener("click", function () {
    if (!WIZ.termsAccepted) {
      termsError.hidden = false;
      return;
    }
    termsError.hidden = true;
    renderOrderSummary();
    showStep("checkout");

    // Prompt for save-progress details right away instead of waiting for
    // a blocked "Pay deposit" click — saving is required before paying,
    // so surface that requirement as soon as they land here.
    if (!WIZ.savedProgress) {
      saveRequiredNote.hidden = false;
      openSaveFlyout(true);
    }
  });

  // ------------------------------------------------------------------------
  // CHECKOUT STEP
  // ------------------------------------------------------------------------
  function addSummaryRow(dl, term, value, isTotal) {
    var dt = document.createElement("dt");
    dt.textContent = term;
    var dd = document.createElement("dd");
    dd.textContent = value;
    if (isTotal) dd.classList.add("is-total");
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function renderOrderSummary() {
    var mainSpace = Data.findById(Data.EVENT_SPACES, WIZ.mainSpaceId);
    var reception = Data.findById(Data.RECEPTION_SPACES, WIZ.receptionSpaceId);
    var mood = Data.findById(Data.MOODS, WIZ.moodId);
    var tier = Data.findById(Data.PACKAGE_TIERS, WIZ.packageId);
    var balanceDue = WIZ.finalTotal - Data.DEPOSIT_AMOUNT;
    var isWedding = WIZ.eventType === "wedding";

    orderSummaryTotalPreview.textContent = Data.formatCurrency(WIZ.finalTotal);

    var guestsValue = WIZ.totalGuests + " " + t("eventWizard.orderSummary.guestsTotalWord", "total") +
      " · " + WIZ.overnightGuests + " " + t("eventWizard.orderSummary.guestsStayingSuffix", "staying 3 nights");

    orderSummary.innerHTML = "";
    addSummaryRow(orderSummary, t("eventWizard.orderSummary.contactName", "Contact name"), WIZ.firstName + " " + WIZ.lastName);
    addSummaryRow(orderSummary, t("eventWizard.orderSummary.eventDate", "Event date"), WIZ.eventDate.toLocaleDateString(currentLocale(), { month: "long", day: "numeric", year: "numeric" }));
    addSummaryRow(orderSummary, t("eventWizard.orderSummary.guests", "Guests"), guestsValue);
    addSummaryRow(
      orderSummary,
      isWedding ? t("eventWizard.orderSummary.ceremonySpace", "Ceremony space") : t("eventWizard.orderSummary.eventSpace", "Event space"),
      mainSpace ? mainSpace.name : "—"
    );
    if (isWedding) {
      addSummaryRow(orderSummary, t("eventWizard.orderSummary.receptionSpace", "Reception space"), reception ? reception.name : "—");
      addSummaryRow(orderSummary, t("eventWizard.orderSummary.mood", "Mood"), mood ? mood.name : "—");
    }
    addSummaryRow(orderSummary, t("eventWizard.quote.estimateSubtotal", "Estimate subtotal"), Data.formatCurrency(WIZ.quote.subtotal));
    if (isWedding) {
      addSummaryRow(orderSummary, t("eventWizard.orderSummary.package", "Package"), tier ? tier.name : "—");
      addSummaryRow(orderSummary, t("eventWizard.orderSummary.packageCost", "Package cost"), Data.formatCurrency(WIZ.packageCost));
    }
    addSummaryRow(orderSummary, t("eventWizard.orderSummary.finalTotal", "Final total"), Data.formatCurrency(WIZ.finalTotal), true);
    addSummaryRow(orderSummary, t("eventWizard.orderSummary.depositDueNow", "Deposit due now"), Data.formatCurrency(Data.DEPOSIT_AMOUNT), true);
    addSummaryRow(orderSummary, t("eventWizard.orderSummary.balanceDueLater", "Balance due later"), Data.formatCurrency(balanceDue));
  }

  checkoutBackBtn.addEventListener("click", function () {
    showStep("terms");
  });

  // Light-touch formatting so the fake payment form still feels real.
  cardNumberInput.addEventListener("input", function () {
    var digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    cardNumberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });

  cardCvvInput.addEventListener("input", function () {
    cardCvvInput.value = cardCvvInput.value.replace(/\D/g, "").slice(0, 4);
  });

  // Expiry — month/year <select>s instead of free text, so there's
  // nothing to mistype: only real, current-or-future dates are offered.
  function populateExpiryYears() {
    var currentYear = new Date().getFullYear();
    cardExpiryYearSelect.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("eventWizard.checkout.expiryYearPlaceholder", "YYYY");
    cardExpiryYearSelect.appendChild(placeholder);
    for (var y = currentYear; y <= currentYear + 10; y++) {
      var opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      cardExpiryYearSelect.appendChild(opt);
    }
  }

  function populateExpiryMonths() {
    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1;
    var selectedYear = parseInt(cardExpiryYearSelect.value, 10);
    var previousValue = cardExpiryMonthSelect.value;

    cardExpiryMonthSelect.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("eventWizard.checkout.expiryMonthPlaceholder", "MM");
    cardExpiryMonthSelect.appendChild(placeholder);

    var startMonth = selectedYear === currentYear ? currentMonth : 1;
    for (var m = startMonth; m <= 12; m++) {
      var opt = document.createElement("option");
      var mm = m < 10 ? "0" + m : String(m);
      opt.value = mm;
      opt.textContent = mm;
      cardExpiryMonthSelect.appendChild(opt);
    }
    if (previousValue && parseInt(previousValue, 10) >= startMonth) {
      cardExpiryMonthSelect.value = previousValue;
    }
  }

  cardExpiryYearSelect.addEventListener("change", function () {
    populateExpiryMonths();
    cardExpiryFieldError.hidden = true;
  });
  cardExpiryMonthSelect.addEventListener("change", function () {
    cardExpiryFieldError.hidden = true;
  });

  function hideAllPaymentFieldErrors() {
    cardNameFieldError.hidden = true;
    cardNumberFieldError.hidden = true;
    cardExpiryFieldError.hidden = true;
    cardCvvFieldError.hidden = true;
  }

  payDepositBtn.addEventListener("click", function () {
    if (!WIZ.savedProgress) {
      saveRequiredNote.hidden = false;
      openSaveFlyout(true);
      return;
    }

    var cardName = cardNameInput.value.trim();
    var cardNumber = cardNumberInput.value.replace(/\s+/g, "");
    var month = cardExpiryMonthSelect.value;
    var year = cardExpiryYearSelect.value;
    var cvv = cardCvvInput.value.trim();

    hideAllPaymentFieldErrors();
    var allValid = true;
    if (!cardName) {
      cardNameFieldError.hidden = false;
      allValid = false;
    }
    if (cardNumber.length < 12) {
      cardNumberFieldError.hidden = false;
      allValid = false;
    }
    if (!month || !year) {
      cardExpiryFieldError.hidden = false;
      allValid = false;
    }
    if (cvv.length < 3) {
      cardCvvFieldError.hidden = false;
      allValid = false;
    }
    if (!allValid) return;

    saveRequiredNote.hidden = true;

    WIZ.depositPaid = true;
    WIZ.holdUntil = new Date(Date.now() + Data.HOLD_DAYS * 86400000);
    renderConfirmation();
    showStep("confirmation");
  });

  // ------------------------------------------------------------------------
  // CONFIRMATION STEP
  // ------------------------------------------------------------------------
  function renderConfirmation() {
    confirmationHeading.textContent = WIZ.firstName + " " + WIZ.lastName + t("eventWizard.confirmation.bookedSuffix", ", you're booked!");
    var balanceDue = WIZ.finalTotal - Data.DEPOSIT_AMOUNT;
    balanceDueValue.textContent = Data.formatCurrency(balanceDue);
    startCountdown();
  }

  function startCountdown() {
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    function tick() {
      var remaining = WIZ.holdUntil.getTime() - Date.now();
      if (remaining < 0) remaining = 0;

      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor((remaining % 86400000) / 3600000);
      var minutes = Math.floor((remaining % 3600000) / 60000);
      var seconds = Math.floor((remaining % 60000) / 1000);

      countdownDays.textContent = days;
      countdownHours.textContent = hours < 10 ? "0" + hours : hours;
      countdownMinutes.textContent = minutes < 10 ? "0" + minutes : minutes;
      countdownSeconds.textContent = seconds < 10 ? "0" + seconds : seconds;

      if (remaining <= 0) clearInterval(countdownIntervalId);
    }

    tick();
    countdownIntervalId = setInterval(tick, 1000);
  }

  scheduleCallBtn.addEventListener("click", function () { openScheduleModal(); });

  // ------------------------------------------------------------------------
  // SCHEDULE-A-CALL MODAL (simulated Calendly-style slot picker)
  // ------------------------------------------------------------------------
  function generateScheduleSlots() {
    var slots = [];
    var count = 0;
    var offset = 1;
    while (count < 3) {
      var day = new Date(Date.now() + offset * 86400000);
      if (day.getDay() !== 0 && day.getDay() !== 6) {
        var label = day.toLocaleDateString(currentLocale(), { weekday: "short", month: "short", day: "numeric" });
        slots.push({ id: "slot-" + offset + "-am", label: label + " · " + t("eventWizard.scheduleSlot.morningTime", "10:00 AM") });
        slots.push({ id: "slot-" + offset + "-pm", label: label + " · " + t("eventWizard.scheduleSlot.afternoonTime", "3:00 PM") });
        count++;
      }
      offset++;
    }
    return slots;
  }

  function renderScheduleSlots() {
    var slots = generateScheduleSlots();
    scheduleSlotList.innerHTML = "";
    slots.forEach(function (slot) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wiz-schedule-slot";
      btn.textContent = slot.label;
      btn.addEventListener("click", function () {
        pendingScheduleSelection = slot;
        var all = scheduleSlotList.querySelectorAll(".wiz-schedule-slot");
        for (var i = 0; i < all.length; i++) all[i].classList.remove("is-selected");
        btn.classList.add("is-selected");
        scheduleError.hidden = true;
      });
      scheduleSlotList.appendChild(btn);
    });
  }

  function openScheduleModal() {
    pendingScheduleSelection = null;
    renderScheduleSlots();
    scheduleError.hidden = true;
    scheduleModal.classList.add("is-open");
    scheduleBackdrop.classList.add("is-open");
  }

  function closeScheduleModal() {
    scheduleModal.classList.remove("is-open");
    scheduleBackdrop.classList.remove("is-open");
  }

  scheduleModalCloseBtn.addEventListener("click", closeScheduleModal);
  scheduleCancelBtn.addEventListener("click", closeScheduleModal);
  scheduleBackdrop.addEventListener("click", closeScheduleModal);

  scheduleConfirmBtn.addEventListener("click", function () {
    if (!pendingScheduleSelection) {
      scheduleError.hidden = false;
      return;
    }
    WIZ.scheduledSlot = pendingScheduleSelection;
    closeScheduleModal();

    var message = t("eventWizard.scheduleConfirm.prefix", "Call scheduled for") + " " + pendingScheduleSelection.label + ".";
    if (currentStepId === "contact-branch") {
      contactBranchScheduleNote.hidden = false;
      contactBranchScheduleNote.textContent = message;
    } else {
      scheduleConfirmationNote.hidden = false;
      scheduleConfirmationNote.textContent = message;
    }
    persistState();
  });

  // ------------------------------------------------------------------------
  // SAVE PROGRESS FLYOUT — validation reports the specific missing or
  // malformed piece (rather than one combined "fix everything" message)
  // so it's always clear what to change next.
  // ------------------------------------------------------------------------
  function openSaveFlyout(isRequired) {
    saveFlyoutRequiredNote.hidden = !isRequired;
    saveBackdrop.classList.add("is-open");
    saveFlyout.classList.add("is-open");
  }

  function closeSaveFlyout() {
    saveBackdrop.classList.remove("is-open");
    saveFlyout.classList.remove("is-open");
  }

  saveProgressToggleBtn.addEventListener("click", function () {
    if (saveFlyout.classList.contains("is-open")) closeSaveFlyout();
    else openSaveFlyout(false);
  });
  saveFlyoutCloseBtn.addEventListener("click", closeSaveFlyout);
  saveBackdrop.addEventListener("click", closeSaveFlyout);

  privacyPolicyLinkBtn.addEventListener("click", function () {
    privacyModal.classList.add("is-open");
    privacyBackdrop.classList.add("is-open");
  });
  function closePrivacyModal() {
    privacyModal.classList.remove("is-open");
    privacyBackdrop.classList.remove("is-open");
  }
  privacyModalCloseBtn.addEventListener("click", closePrivacyModal);
  privacyBackdrop.addEventListener("click", closePrivacyModal);

  function hideAllSaveErrors() {
    saveContactMissingError.hidden = true;
    saveEmailFormatError.hidden = true;
    saveCountryCodeError.hidden = true;
    savePhoneFormatError.hidden = true;
    savePrivacyError.hidden = true;
  }

  saveConfirmBtn.addEventListener("click", function () {
    var email = saveEmailInput.value.trim();
    var countryCode = saveCountryCodeInput.value.trim();
    var phone = savePhoneInput.value.trim();
    var emailTyped = email.length > 0;
    var phoneTyped = countryCode.length > 0 || phone.length > 0;
    var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var phoneValid = countryCode.length > 0 && phone.length >= 7;
    var hasContact = emailValid || phoneValid;
    var privacyChecked = savePrivacyCheckbox.checked;

    hideAllSaveErrors();

    if (!hasContact) {
      if (emailTyped && !phoneTyped) {
        saveEmailFormatError.hidden = false;
      } else if (phoneTyped && countryCode.length === 0) {
        saveCountryCodeError.hidden = false;
      } else if (phoneTyped) {
        savePhoneFormatError.hidden = false;
      } else {
        saveContactMissingError.hidden = false;
      }
      return;
    }
    if (!privacyChecked) {
      savePrivacyError.hidden = false;
      return;
    }

    WIZ.savedProgress = true;
    WIZ.saveEmail = emailValid ? email : "";
    WIZ.savePhone = phoneValid ? (countryCode + " " + phone) : "";

    saveConfirmationNote.hidden = false;
    saveRequiredNote.hidden = true;
    persistState();

    // Auto-dismiss the panel shortly after a successful save so people
    // aren't left staring at a static confirmation, unsure whether they
    // still need to close it themselves before they can pay.
    window.setTimeout(closeSaveFlyout, 1100);
  });

  // ------------------------------------------------------------------------
  // CHEAT MODE — ?cheat=1, or the in-page "Skip to checkout" shortcut in
  // the hero, both fast-forward to checkout with plausible sample
  // answers, so the later screens can be shown quickly without the full
  // flow.
  // ------------------------------------------------------------------------
  function fillCheatData() {
    WIZ.firstName = "Alex";
    WIZ.lastName = "Morgan";
    firstNameInput.value = WIZ.firstName;
    lastNameInput.value = WIZ.lastName;

    WIZ.eventType = "wedding";
    renderEventTypes();
    updateMainVenueCopy();

    WIZ.totalGuests = 150;
    WIZ.overnightGuests = 90;
    updateGuestsUI();

    var cheatDate = minSelectableDate();
    cheatDate.setDate(cheatDate.getDate() + 30);
    while (Data.isDateUnavailable(cheatDate, WIZ.totalGuests)) cheatDate.setDate(cheatDate.getDate() + 1);
    WIZ.eventDate = cheatDate;

    WIZ.mainSpaceId = Data.EVENT_SPACES[0].id;
    WIZ.receptionSpaceId = Data.RECEPTION_SPACES[0].id;
    WIZ.moodId = Data.MOODS[0].id;
    renderMainVenues();
    renderReceptionVenues();
    renderMoods();

    computeAndRenderQuote();
    WIZ.packageId = Data.PACKAGE_TIERS[1].id;
    renderPackages();
    updateFinalTotalCard();

    WIZ.termsAccepted = true;
    termsAcceptCheckbox.checked = true;

    WIZ.savedProgress = true;
    WIZ.saveEmail = "alex.morgan@example.com";

    renderOrderSummary();
    showStep("checkout");
  }

  function applyCheatMode() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("cheat") !== "1") return false;
    fillCheatData();
    return true;
  }

  // ------------------------------------------------------------------------
  // RESET — always-visible shortcut back to a clean, empty wizard.
  // Confirmed through the site's own modal (not a native browser
  // confirm() popup) for a consistent look, then clears the persisted
  // session and reloads to a bare URL (dropping any ?cheat=1) so every
  // field, render, and listener starts fresh rather than trying to
  // manually rewind ~20 pieces of state by hand.
  // ------------------------------------------------------------------------
  function openResetModal() {
    resetModal.classList.add("is-open");
    resetBackdrop.classList.add("is-open");
  }

  function closeResetModal() {
    resetModal.classList.remove("is-open");
    resetBackdrop.classList.remove("is-open");
  }

  resetWizardBtn.addEventListener("click", openResetModal);
  resetModalCloseBtn.addEventListener("click", closeResetModal);
  resetCancelBtn.addEventListener("click", closeResetModal);
  resetBackdrop.addEventListener("click", closeResetModal);

  resetConfirmBtn.addEventListener("click", function () {
    try {
      sessionStorage.removeItem("eventWizardState");
    } catch (e) {
      // sessionStorage unavailable — nothing to clear
    }
    window.location.href = window.location.pathname;
  });

  // ------------------------------------------------------------------------
  // LIVE LANGUAGE SWITCHING — re-render every dynamically-generated piece
  // so whatever step is currently on screen updates immediately when the
  // user toggles the language, without navigating them anywhere or
  // resetting their selections. Static data-i18n text is already handled
  // by i18n.js's applyTranslations() before this listener runs; this only
  // covers JS-rendered content (cards, calendar, quote/order summary,
  // confirmation heading) plus the progress bar sub-label and the
  // event-type-aware step copy, which are JS-driven and would otherwise
  // get incorrectly reset by applyTranslations() re-applying static
  // fallback text.
  // ------------------------------------------------------------------------
  window.addEventListener("langchange", function () {
    renderEventTypes();
    renderCalendar();
    updateSelectedDateDisplay();
    updateMainVenueCopy();
    renderMainVenues();
    renderReceptionVenues();
    renderMoods();
    renderPackages();
    if (WIZ.quote) computeAndRenderQuote();
    if (WIZ.packageId) updateFinalTotalCard();
    if (currentStepId) wizPhaseSubLabel.textContent = subLabelForStep(currentStepId);
    if (WIZ.quote && WIZ.finalTotal && currentStepId === "checkout") renderOrderSummary();
    if (WIZ.depositPaid && currentStepId === "confirmation") renderConfirmation();
  });

  // ------------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------------
  calendarViewMonth = startOfMonth(minSelectableDate());
  renderEventTypes();
  renderCalendar();
  updateMainVenueCopy();
  renderMainVenues();
  renderReceptionVenues();
  renderMoods();
  renderPackages();
  updateGuestsUI();
  populateExpiryYears();
  populateExpiryMonths();

  if (!applyCheatMode()) {
    if (!hydrateFromStorage()) showStep("name");
  }
})();
