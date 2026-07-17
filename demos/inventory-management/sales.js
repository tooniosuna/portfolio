// ==========================================================================
// sales.js
// Sales module. Covers: today's offers hub (open / completed), the New
// Offer form (pick a salesperson), the offer detail view (add products
// straight from what's actually available, price + cost each one, watch
// utilidad calculate itself), the Save Order gate, the Complete Order step
// (confirm final kilograms per product — that's what actually deducts from
// inventory), and Download CSV / Send by Email on a completed offer — plus
// the same demo-only "View as Admin" toggle used in Reception.
//
// Reception and Sales are separate pages, so this module can't read
// Reception's live in-memory RECEPTIONS array directly. Instead it reads a
// one-time snapshot that Reception wrote to sessionStorage after its own
// last change (see inventory-data.js's saveState/loadState and
// reception.js's persist()). Sales' own state (offers) is always fresh on
// reload, same "resets every page load" rule as Reception.
// ==========================================================================

(function () {
  "use strict";

  var Data = window.InvData;

  // ------------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------------
  var OFFERS = [];
  var offerCounter = 0;
  var isAdminMode = false;
  var currentOfferId = null;
  var pendingExtraEmails = []; // custom emails typed into the Send modal, while it's open

  // One-time, read-only snapshot of whatever Reception last saved. Dates
  // arrive as ISO strings through JSON — revive the ones Sales cares about.
  var RECEPTIONS_SNAPSHOT = (function loadReceptionsSnapshot() {
    var stored = Data.loadState("receptions") || [];
    stored.forEach(function (r) {
      r.startTimestamp = new Date(r.startTimestamp);
      if (r.finalDetails) r.finalDetails.finishedAt = new Date(r.finalDetails.finishedAt);
    });
    return stored;
  })();

  // ------------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------------
  function findOffer(id) {
    for (var i = 0; i < OFFERS.length; i++) {
      if (OFFERS[i].id === id) return OFFERS[i];
    }
    return null;
  }

  function today() {
    return new Date();
  }

  function daysBetween(earlier, later) {
    return Math.floor((later - earlier) / (1000 * 60 * 60 * 24));
  }

  // Locale for human-readable dates/times follows the active language;
  // kilogram/currency figures stay in a fixed en-US number format on
  // purpose (see formatKg below and inventory-data.js's formatCurrency).
  function currentLocale() {
    return window.i18n && window.i18n.getLang() === "es" ? "es-MX" : "en-US";
  }

  function formatDate(d) {
    return d.toLocaleDateString(currentLocale(), { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  function formatTime(d) {
    return d.toLocaleTimeString(currentLocale(), { hour: "numeric", minute: "2-digit" });
  }

  function formatKg(kg) {
    return kg.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
  }

  function productLabel(product) {
    var species = Data.findById(Data.SPECIES, product.speciesId);
    var size = Data.findById(Data.SIZES, product.sizeId);
    var quality = Data.findById(Data.QUALITIES, product.qualityId);
    return Data.speciesLabel(species) + " — " + Data.sizeLabel(size) + " — " + Data.qualityLabel(quality);
  }

  function matchKey(speciesId, sizeId, qualityId) {
    return speciesId + "|" + sizeId + "|" + qualityId;
  }

  // ------------------------------------------------------------------------
  // AVAILABILITY — what's actually still sellable right now
  // A product is available if it's on a *finished* reception and still
  // within its shelf life (today - finishedAt < shelfLifeDays); after that
  // it's considered moved to the conservador/long-term storage, off the
  // "fresh" list. Multiple receptions of the exact same species+size+
  // quality (yesterday's leftover plus today's new catch, say) pool
  // together into one available amount. Nothing is reserved just by being
  // added to an in-progress offer — only a *completed* offer's confirmed
  // kilograms actually deduct from the shared pool.
  // ------------------------------------------------------------------------
  function getReceivedTotals() {
    var totals = {};
    RECEPTIONS_SNAPSHOT.forEach(function (r) {
      if (r.status !== "finished" || !r.finalDetails) return;
      var ageDays = daysBetween(r.finalDetails.finishedAt, today());
      if (ageDays >= r.finalDetails.shelfLifeDays) return;
      r.products.forEach(function (p) {
        var kg = p.loads.reduce(function (sum, l) { return sum + l.kg; }, 0);
        if (kg <= 0) return;
        var key = matchKey(p.speciesId, p.sizeId, p.qualityId);
        if (!totals[key]) {
          totals[key] = { speciesId: p.speciesId, sizeId: p.sizeId, qualityId: p.qualityId, kg: 0 };
        }
        totals[key].kg += kg;
      });
    });
    return totals;
  }

  function getConfirmedSoldTotals() {
    var sold = {};
    OFFERS.forEach(function (o) {
      if (o.status !== "completed") return;
      o.products.forEach(function (p) {
        if (!p.confirmedKg) return;
        var key = matchKey(p.speciesId, p.sizeId, p.qualityId);
        sold[key] = (sold[key] || 0) + p.confirmedKg;
      });
    });
    return sold;
  }

  function getAvailableKg(speciesId, sizeId, qualityId) {
    var key = matchKey(speciesId, sizeId, qualityId);
    var received = getReceivedTotals();
    var sold = getConfirmedSoldTotals();
    var avail = (received[key] ? received[key].kg : 0) - (sold[key] || 0);
    return avail > 0 ? avail : 0;
  }

  // excludeKeys: matches already on the offer being edited, so the same
  // product can't be added to one offer twice (add a load's worth via a
  // second reception instead — it pools in automatically).
  function getAvailableProductsList(excludeKeys) {
    var received = getReceivedTotals();
    var sold = getConfirmedSoldTotals();
    var list = [];
    Object.keys(received).forEach(function (key) {
      if (excludeKeys.indexOf(key) !== -1) return;
      var t = received[key];
      var avail = t.kg - (sold[key] || 0);
      if (avail > 0) {
        list.push({ speciesId: t.speciesId, sizeId: t.sizeId, qualityId: t.qualityId, availableKg: avail });
      }
    });
    return list;
  }

  // ------------------------------------------------------------------------
  // UTILIDAD
  // ------------------------------------------------------------------------
  function totalCostsFor(product) {
    return Data.COST_CATEGORIES.reduce(function (sum, cat) {
      return sum + (product.costs[cat.key] || 0);
    }, 0);
  }

  // Returns null when price per kg hasn't been entered yet (not computable).
  function computeLineUtilidad(offer, product) {
    var kg = offer.status === "completed"
      ? (product.confirmedKg || 0)
      : getAvailableKg(product.speciesId, product.sizeId, product.qualityId);
    var price = product.pricePerKg;
    if (typeof price !== "number" || isNaN(price)) return null;
    return (price * kg) - totalCostsFor(product);
  }

  // ------------------------------------------------------------------------
  // DOM REFS — hub view
  // ------------------------------------------------------------------------
  var hubView = document.getElementById("hubView");
  var detailView = document.getElementById("detailView");
  var hubDateLabel = document.getElementById("hubDateLabel");
  var adminToggle = document.getElementById("adminToggle");
  var newOfferBtn = document.getElementById("newOfferBtn");
  var openOffersList = document.getElementById("openOffersList");
  var openOffersEmptyNote = document.getElementById("openOffersEmptyNote");
  var completedOffersList = document.getElementById("completedOffersList");
  var completedOffersEmptyNote = document.getElementById("completedOffersEmptyNote");

  // DOM refs — detail view
  var detailBackBtn = document.getElementById("detailBackBtn");
  var detailOfferLabel = document.getElementById("detailOfferLabel");
  var detailMetaLine = document.getElementById("detailMetaLine");
  var detailStatusBadge = document.getElementById("detailStatusBadge");
  var addProductBtn = document.getElementById("addProductBtn");
  var productList = document.getElementById("productList");
  var productEmptyNote = document.getElementById("productEmptyNote");
  var saveOrderBtn = document.getElementById("saveOrderBtn");
  var completeOrderBtn = document.getElementById("completeOrderBtn");
  var saveOrderHint = document.getElementById("saveOrderHint");
  var completedSummary = document.getElementById("completedSummary");
  var totalUtilidadValue = document.getElementById("totalUtilidadValue");
  var downloadCsvBtn = document.getElementById("downloadCsvBtn");
  var sendEmailBtn = document.getElementById("sendEmailBtn");
  var sentNote = document.getElementById("sentNote");
  var editCompletedNote = document.getElementById("editCompletedNote");

  // DOM refs — modals
  var modalBackdrop = document.getElementById("modalBackdrop");

  var newOfferModal = document.getElementById("newOfferModal");
  var salespersonSelect = document.getElementById("salespersonSelect");
  var newOfferError = document.getElementById("newOfferError");
  var newOfferCloseBtn = document.getElementById("newOfferCloseBtn");
  var newOfferCancelBtn = document.getElementById("newOfferCancelBtn");
  var newOfferCreateBtn = document.getElementById("newOfferCreateBtn");

  var addProductModal = document.getElementById("addProductModal");
  var availableProductSelect = document.getElementById("availableProductSelect");
  var addProductEmptyNote = document.getElementById("addProductEmptyNote");
  var addProductError = document.getElementById("addProductError");
  var addProductCloseBtn = document.getElementById("addProductCloseBtn");
  var addProductCancelBtn = document.getElementById("addProductCancelBtn");
  var addProductSaveBtn = document.getElementById("addProductSaveBtn");

  var completeOrderModal = document.getElementById("completeOrderModal");
  var completeOrderList = document.getElementById("completeOrderList");
  var completeOrderError = document.getElementById("completeOrderError");
  var completeOrderCloseBtn = document.getElementById("completeOrderCloseBtn");
  var completeOrderCancelBtn = document.getElementById("completeOrderCancelBtn");
  var completeOrderConfirmBtn = document.getElementById("completeOrderConfirmBtn");

  var sendEmailModal = document.getElementById("sendEmailModal");
  var clientChecklist = document.getElementById("clientChecklist");
  var newEmailInput = document.getElementById("newEmailInput");
  var addEmailBtn = document.getElementById("addEmailBtn");
  var addedEmailsList = document.getElementById("addedEmailsList");
  var sendEmailError = document.getElementById("sendEmailError");
  var sendEmailCloseBtn = document.getElementById("sendEmailCloseBtn");
  var sendEmailCancelBtn = document.getElementById("sendEmailCancelBtn");
  var sendEmailSendBtn = document.getElementById("sendEmailSendBtn");

  // ------------------------------------------------------------------------
  // MODAL HELPERS — only one modal is ever open at a time, backdrop shared.
  // ------------------------------------------------------------------------
  var allModals = [newOfferModal, addProductModal, completeOrderModal, sendEmailModal];

  function openModal(modal) {
    allModals.forEach(function (m) { m.classList.remove("is-open"); });
    modal.classList.add("is-open");
    modalBackdrop.classList.add("is-open");
  }

  function closeModals() {
    allModals.forEach(function (m) { m.classList.remove("is-open"); });
    modalBackdrop.classList.remove("is-open");
  }

  modalBackdrop.addEventListener("click", closeModals);

  // ------------------------------------------------------------------------
  // HUB VIEW — today's offers
  // ------------------------------------------------------------------------
  function renderHubDate() {
    hubDateLabel.textContent = window.i18n.t("inventory.common.todayPrefix") + " — " + formatDate(today());
  }

  function renderOfferCard(offer) {
    var salesperson = Data.findById(Data.SALESPEOPLE, offer.salespersonId);

    var card = document.createElement("button");
    card.type = "button";
    card.className = "card inv-reception-card";

    var top = document.createElement("div");
    top.className = "inv-reception-card-top";

    var num = document.createElement("span");
    num.className = "inv-reception-card-lot";
    num.textContent = offer.offerNumber;

    var badge = document.createElement("span");
    badge.className = "inv-status-badge " + (offer.status === "completed" ? "is-finished" : "is-progress");
    badge.textContent = offer.status === "completed"
      ? window.i18n.t("inventory.sales.status.completed")
      : window.i18n.t("inventory.common.inProgress");

    top.appendChild(num);
    top.appendChild(badge);

    var salespersonLine = document.createElement("p");
    salespersonLine.className = "inv-reception-card-provider";
    salespersonLine.textContent = salesperson.name;

    var meta = document.createElement("p");
    meta.className = "inv-reception-card-meta";
    meta.textContent = window.i18n.t("inventory.sales.hub.createdLabel") + " " + formatTime(offer.createdAt);

    var stats = document.createElement("p");
    stats.className = "inv-reception-card-stats";
    stats.textContent = offer.products.length + " " + window.i18n.t(offer.products.length === 1 ? "inventory.common.productSingular" : "inventory.common.productPlural");

    card.appendChild(top);
    card.appendChild(salespersonLine);
    card.appendChild(meta);
    card.appendChild(stats);

    card.addEventListener("click", function () {
      openDetail(offer.id);
    });

    return card;
  }

  function renderHubLists() {
    var open = OFFERS.filter(function (o) { return o.status === "in-progress"; });
    var completed = OFFERS.filter(function (o) { return o.status === "completed"; });

    openOffersList.innerHTML = "";
    open.forEach(function (o) { openOffersList.appendChild(renderOfferCard(o)); });
    openOffersEmptyNote.hidden = open.length > 0;

    completedOffersList.innerHTML = "";
    completed.forEach(function (o) { completedOffersList.appendChild(renderOfferCard(o)); });
    completedOffersEmptyNote.hidden = completed.length > 0;
  }

  function showHub() {
    currentOfferId = null;
    detailView.hidden = true;
    hubView.hidden = false;
    renderHubLists();
  }

  newOfferBtn.addEventListener("click", openNewOfferModal);
  detailBackBtn.addEventListener("click", showHub);

  adminToggle.addEventListener("change", function () {
    isAdminMode = adminToggle.checked;
    document.body.classList.toggle("inv-admin-mode", isAdminMode);
    if (currentOfferId) renderDetail();
  });

  // ------------------------------------------------------------------------
  // NEW OFFER MODAL
  // ------------------------------------------------------------------------
  function openNewOfferModal() {
    salespersonSelect.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = window.i18n.t("inventory.sales.modal.newOffer.salespersonPlaceholder");
    salespersonSelect.appendChild(placeholder);
    Data.SALESPEOPLE.forEach(function (sp) {
      var el = document.createElement("option");
      el.value = sp.id;
      el.textContent = sp.name;
      salespersonSelect.appendChild(el);
    });
    newOfferError.hidden = true;
    openModal(newOfferModal);
  }

  newOfferCloseBtn.addEventListener("click", closeModals);
  newOfferCancelBtn.addEventListener("click", closeModals);

  newOfferCreateBtn.addEventListener("click", function () {
    var salespersonId = salespersonSelect.value;
    if (!salespersonId) {
      newOfferError.hidden = false;
      return;
    }
    newOfferError.hidden = true;

    offerCounter += 1;
    var padded = offerCounter < 10 ? "00" + offerCounter : offerCounter < 100 ? "0" + offerCounter : String(offerCounter);
    var offer = {
      id: "offer-" + offerCounter,
      offerNumber: "OFR-" + padded,
      salespersonId: salespersonId,
      createdAt: today(),
      status: "in-progress",
      savedAt: null,
      completedAt: null,
      sentAt: null,
      recipients: [],
      products: []
    };
    OFFERS.push(offer);

    closeModals();
    showHub();
  });

  // ------------------------------------------------------------------------
  // DETAIL VIEW
  // ------------------------------------------------------------------------
  function openDetail(offerId) {
    currentOfferId = offerId;
    hubView.hidden = true;
    detailView.hidden = false;
    renderDetail();
  }

  function updateRowUtilidad(row, offer, product) {
    var span = row.querySelector('[data-role="utilidad-value"]');
    if (!span) return;
    var utilidad = computeLineUtilidad(offer, product);
    if (utilidad === null) {
      span.textContent = "—";
      span.className = "inv-sales-utilidad-value";
    } else {
      span.textContent = Data.formatCurrency(utilidad);
      span.className = "inv-sales-utilidad-value " + (utilidad < 0 ? "is-negative" : "is-positive");
    }
  }

  function updateTotalUtilidadDisplay(offer) {
    if (offer.status !== "completed") return;
    var total = offer.products.reduce(function (sum, p) { return sum + (computeLineUtilidad(offer, p) || 0); }, 0);
    totalUtilidadValue.textContent = Data.formatCurrency(total);
  }

  function offerIsReadyToSave(offer) {
    return offer.products.length > 0 && offer.products.every(function (p) {
      return typeof p.pricePerKg === "number" && !isNaN(p.pricePerKg) && p.pricePerKg > 0;
    });
  }

  function updateFooterButtons(offer) {
    var ready = offerIsReadyToSave(offer);
    saveOrderBtn.disabled = !ready;
    if (offer.savedAt) {
      completeOrderBtn.hidden = false;
      saveOrderHint.textContent = window.i18n.t("inventory.sales.detail.saveOrderHintSaved");
    } else {
      completeOrderBtn.hidden = true;
      saveOrderHint.textContent = ready
        ? window.i18n.t("inventory.sales.detail.saveOrderHintReady")
        : window.i18n.t("inventory.sales.detail.saveOrderHintDefault");
    }
  }

  function markOfferDirty(offer) {
    offer.savedAt = null;
    updateFooterButtons(offer);
  }

  function renderProductRow(offer, product, canEdit) {
    var isCompleted = offer.status === "completed";

    var row = document.createElement("div");
    row.className = "card inv-product-row";

    var head = document.createElement("div");
    head.className = "inv-product-row-head";

    var name = document.createElement("h3");
    name.textContent = productLabel(product);

    var qty = isCompleted
      ? (product.confirmedKg || 0)
      : getAvailableKg(product.speciesId, product.sizeId, product.qualityId);

    var qtyLabel = document.createElement("span");
    qtyLabel.className = "inv-product-row-total";
    qtyLabel.textContent = (isCompleted ? window.i18n.t("inventory.sales.detail.confirmedLabel") : window.i18n.t("inventory.sales.detail.availableNowLabel")) + formatKg(qty);

    head.appendChild(name);
    head.appendChild(qtyLabel);
    row.appendChild(head);

    // Cost grid — 7 categories, each a preset dropdown + an editable
    // number field that starts at the preset's value.
    var grid = document.createElement("div");
    grid.className = "inv-sales-cost-grid";

    Data.COST_CATEGORIES.forEach(function (cat) {
      var field = document.createElement("div");
      field.className = "inv-sales-cost-field";

      var label = document.createElement("span");
      label.className = "inv-field-label";
      label.textContent = Data.costCategoryLabel(cat);
      field.appendChild(label);

      var select = document.createElement("select");
      select.disabled = !canEdit;
      cat.options.forEach(function (opt, optIndex) {
        var el = document.createElement("option");
        el.value = opt.value;
        el.textContent = Data.costOptionLabel(cat, opt, optIndex) + " (" + Data.formatCurrency(opt.value) + ")";
        select.appendChild(el);
      });
      var currentValue = product.costs[cat.key];
      var matchesPreset = cat.options.some(function (opt) { return opt.value === currentValue; });
      if (!matchesPreset) {
        var customOpt = document.createElement("option");
        customOpt.value = currentValue;
        customOpt.textContent = window.i18n.t("inventory.sales.detail.customCostOption") + " (" + Data.formatCurrency(currentValue) + ")";
        select.appendChild(customOpt);
      }
      select.value = String(currentValue);

      var input = document.createElement("input");
      input.type = "number";
      input.step = "0.01";
      input.min = "0";
      input.disabled = !canEdit;
      input.value = currentValue;

      select.addEventListener("change", function () {
        var val = parseFloat(select.value);
        input.value = val;
        product.costs[cat.key] = val;
        markOfferDirty(offer);
        updateRowUtilidad(row, offer, product);
        updateTotalUtilidadDisplay(offer);
      });

      input.addEventListener("input", function () {
        var val = parseFloat(input.value);
        product.costs[cat.key] = isNaN(val) ? 0 : val;
        markOfferDirty(offer);
        updateRowUtilidad(row, offer, product);
        updateTotalUtilidadDisplay(offer);
      });

      field.appendChild(select);
      field.appendChild(input);
      grid.appendChild(field);
    });
    row.appendChild(grid);

    // Price per kg + utilidad readout
    var priceRow = document.createElement("div");
    priceRow.className = "inv-sales-price-row";

    var priceField = document.createElement("label");
    priceField.className = "inv-field";
    var priceLabel = document.createElement("span");
    priceLabel.className = "inv-field-label";
    priceLabel.textContent = window.i18n.t("inventory.sales.detail.pricePerKgLabel");
    var priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.step = "0.01";
    priceInput.min = "0";
    priceInput.placeholder = window.i18n.t("inventory.sales.detail.pricePerKgPlaceholder");
    priceInput.disabled = !canEdit;
    if (typeof product.pricePerKg === "number") priceInput.value = product.pricePerKg;

    priceInput.addEventListener("input", function () {
      var val = parseFloat(priceInput.value);
      product.pricePerKg = isNaN(val) ? null : val;
      markOfferDirty(offer);
      updateRowUtilidad(row, offer, product);
      updateTotalUtilidadDisplay(offer);
    });

    priceField.appendChild(priceLabel);
    priceField.appendChild(priceInput);

    var utilidadBox = document.createElement("div");
    utilidadBox.className = "inv-sales-utilidad";
    var utilidadLabel = document.createElement("span");
    utilidadLabel.className = "inv-field-label";
    utilidadLabel.textContent = window.i18n.t("inventory.sales.detail.utilidadLabel");
    var utilidadValue = document.createElement("span");
    utilidadValue.className = "inv-sales-utilidad-value";
    utilidadValue.setAttribute("data-role", "utilidad-value");
    utilidadBox.appendChild(utilidadLabel);
    utilidadBox.appendChild(utilidadValue);

    priceRow.appendChild(priceField);
    priceRow.appendChild(utilidadBox);
    row.appendChild(priceRow);

    updateRowUtilidad(row, offer, product);

    return row;
  }

  function renderDetail() {
    var offer = findOffer(currentOfferId);
    if (!offer) { showHub(); return; }

    var salesperson = Data.findById(Data.SALESPEOPLE, offer.salespersonId);
    var canEdit = offer.status === "in-progress" || isAdminMode;

    detailOfferLabel.textContent = offer.offerNumber;
    detailMetaLine.textContent =
      salesperson.name + " · " + window.i18n.t("inventory.sales.hub.createdLabel") + " " + formatDate(offer.createdAt) + ", " + formatTime(offer.createdAt);

    detailStatusBadge.className = "inv-status-badge " + (offer.status === "completed" ? "is-finished" : "is-progress");
    detailStatusBadge.textContent = offer.status === "completed"
      ? window.i18n.t("inventory.sales.status.completed")
      : window.i18n.t("inventory.common.inProgress");

    productList.innerHTML = "";
    offer.products.forEach(function (product) {
      productList.appendChild(renderProductRow(offer, product, canEdit));
    });
    productEmptyNote.hidden = offer.products.length > 0;

    // Adding new products is only allowed while an offer is still in
    // progress — once completed, confirmed kilograms are locked in and a
    // new product would have no confirmed amount to deduct, even for admin.
    addProductBtn.hidden = offer.status !== "in-progress";

    if (offer.status === "completed") {
      saveOrderBtn.hidden = true;
      completeOrderBtn.hidden = true;
      saveOrderHint.hidden = true;
      completedSummary.hidden = false;
      updateTotalUtilidadDisplay(offer);
      if (offer.sentAt) {
        sentNote.hidden = false;
        sentNote.textContent = window.i18n.t("inventory.sales.detail.sentPrefix") + " " + formatDate(offer.sentAt) + " " + window.i18n.t("inventory.sales.detail.sentTo") + " " + offer.recipients.join(", ");
      } else {
        sentNote.hidden = true;
      }
      editCompletedNote.hidden = !isAdminMode;
    } else {
      completedSummary.hidden = true;
      saveOrderBtn.hidden = false;
      saveOrderHint.hidden = false;
      updateFooterButtons(offer);
    }
  }

  addProductBtn.addEventListener("click", openAddProductModal);
  completeOrderBtn.addEventListener("click", openCompleteOrderModal);
  sendEmailBtn.addEventListener("click", openSendEmailModal);

  saveOrderBtn.addEventListener("click", function () {
    var offer = findOffer(currentOfferId);
    if (!offer || !offerIsReadyToSave(offer)) return;
    offer.savedAt = today();
    updateFooterButtons(offer);
  });

  // ------------------------------------------------------------------------
  // ADD PRODUCT MODAL — pick straight from what's currently available
  // ------------------------------------------------------------------------
  function openAddProductModal() {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    var existingKeys = offer.products.map(function (p) {
      return matchKey(p.speciesId, p.sizeId, p.qualityId);
    });
    var available = getAvailableProductsList(existingKeys);

    availableProductSelect.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = window.i18n.t("inventory.sales.modal.addProduct.selectPlaceholder");
    availableProductSelect.appendChild(placeholder);
    available.forEach(function (item) {
      var species = Data.findById(Data.SPECIES, item.speciesId);
      var size = Data.findById(Data.SIZES, item.sizeId);
      var quality = Data.findById(Data.QUALITIES, item.qualityId);
      var el = document.createElement("option");
      el.value = matchKey(item.speciesId, item.sizeId, item.qualityId);
      el.textContent = Data.speciesLabel(species) + " — " + Data.sizeLabel(size) + " — " + Data.qualityLabel(quality) +
        " (" + formatKg(item.availableKg) + " " + window.i18n.t("inventory.sales.modal.addProduct.availableSuffix") + ")";
      availableProductSelect.appendChild(el);
    });

    var hasAny = available.length > 0;
    addProductEmptyNote.hidden = hasAny;
    availableProductSelect.hidden = !hasAny;
    addProductSaveBtn.disabled = !hasAny;
    addProductError.hidden = true;

    openModal(addProductModal);
  }

  addProductCloseBtn.addEventListener("click", closeModals);
  addProductCancelBtn.addEventListener("click", closeModals);

  addProductSaveBtn.addEventListener("click", function () {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    var val = availableProductSelect.value;
    if (!val) {
      addProductError.hidden = false;
      return;
    }
    addProductError.hidden = true;

    var parts = val.split("|");
    offer.products.push({
      id: offer.id + "-p" + (offer.products.length + 1),
      speciesId: parts[0],
      sizeId: parts[1],
      qualityId: parts[2],
      pricePerKg: null,
      costs: Data.getDefaultCosts(),
      confirmedKg: null
    });
    markOfferDirty(offer);

    closeModals();
    renderDetail();
  });

  // ------------------------------------------------------------------------
  // COMPLETE ORDER MODAL — confirm final kg per product; this is what
  // actually deducts from the shared available pool.
  // ------------------------------------------------------------------------
  function openCompleteOrderModal() {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    completeOrderList.innerHTML = "";
    offer.products.forEach(function (product) {
      var avail = getAvailableKg(product.speciesId, product.sizeId, product.qualityId);

      var row = document.createElement("div");
      row.className = "inv-sales-confirm-row";

      var label = document.createElement("label");
      label.textContent = productLabel(product) + " — " + window.i18n.t("inventory.sales.modal.completeOrder.availableLabel") + " " + formatKg(avail);

      var input = document.createElement("input");
      input.type = "number";
      input.step = "0.1";
      input.min = "0.1";
      input.max = avail;
      input.value = avail;
      input.setAttribute("data-product-id", product.id);

      row.appendChild(label);
      row.appendChild(input);
      completeOrderList.appendChild(row);
    });

    completeOrderError.hidden = true;
    openModal(completeOrderModal);
  }

  completeOrderCloseBtn.addEventListener("click", closeModals);
  completeOrderCancelBtn.addEventListener("click", closeModals);

  completeOrderConfirmBtn.addEventListener("click", function () {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    var inputs = completeOrderList.getElementsByTagName("input");
    var confirmations = [];
    var valid = true;

    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var productId = inp.getAttribute("data-product-id");
      var product = null;
      for (var j = 0; j < offer.products.length; j++) {
        if (offer.products[j].id === productId) { product = offer.products[j]; break; }
      }
      if (!product) continue;

      var avail = getAvailableKg(product.speciesId, product.sizeId, product.qualityId);
      var kg = parseFloat(inp.value);
      if (isNaN(kg) || kg <= 0 || kg > avail + 0.0001) valid = false;
      confirmations.push({ product: product, kg: kg });
    }

    if (!valid) {
      completeOrderError.hidden = false;
      return;
    }
    completeOrderError.hidden = true;

    confirmations.forEach(function (c) { c.product.confirmedKg = c.kg; });
    offer.status = "completed";
    offer.completedAt = today();

    closeModals();
    renderDetail();
  });

  // ------------------------------------------------------------------------
  // SEND EMAIL MODAL — client checklist + freeform extra emails
  // ------------------------------------------------------------------------
  function renderAddedEmails() {
    addedEmailsList.innerHTML = "";
    pendingExtraEmails.forEach(function (email, idx) {
      var li = document.createElement("li");
      li.textContent = email + " ";

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "inv-modal-close";
      removeBtn.style.fontSize = "1rem";
      removeBtn.style.padding = "0";
      removeBtn.setAttribute("aria-label", window.i18n.t("inventory.sales.modal.sendEmail.removeAriaLabel") + " " + email);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", function () {
        pendingExtraEmails.splice(idx, 1);
        renderAddedEmails();
      });

      li.appendChild(removeBtn);
      addedEmailsList.appendChild(li);
    });
  }

  function openSendEmailModal() {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    clientChecklist.innerHTML = "";
    Data.CLIENTS.forEach(function (c) {
      var label = document.createElement("label");
      label.className = "inv-sales-client-option";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = c.id;
      if (offer.recipients.indexOf(c.email) !== -1) checkbox.checked = true;

      var nameEl = document.createElement("strong");
      nameEl.textContent = c.name;
      var emailEl = document.createElement("span");
      emailEl.textContent = " (" + c.email + ")";

      label.appendChild(checkbox);
      label.appendChild(nameEl);
      label.appendChild(emailEl);
      clientChecklist.appendChild(label);
    });

    pendingExtraEmails = offer.recipients.filter(function (email) {
      return !Data.CLIENTS.some(function (c) { return c.email === email; });
    }).slice();
    renderAddedEmails();

    newEmailInput.value = "";
    sendEmailError.hidden = true;
    openModal(sendEmailModal);
  }

  sendEmailCloseBtn.addEventListener("click", closeModals);
  sendEmailCancelBtn.addEventListener("click", closeModals);

  addEmailBtn.addEventListener("click", function () {
    var email = newEmailInput.value.trim();
    var looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!looksValid) return;
    if (pendingExtraEmails.indexOf(email) === -1) {
      pendingExtraEmails.push(email);
      renderAddedEmails();
    }
    newEmailInput.value = "";
  });

  sendEmailSendBtn.addEventListener("click", function () {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    var checkboxes = clientChecklist.getElementsByTagName("input");
    var selectedEmails = [];
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        var client = Data.findById(Data.CLIENTS, checkboxes[i].value);
        if (client) selectedEmails.push(client.email);
      }
    }
    var allRecipients = selectedEmails.concat(pendingExtraEmails);

    if (allRecipients.length === 0) {
      sendEmailError.hidden = false;
      return;
    }
    sendEmailError.hidden = true;

    offer.recipients = allRecipients;
    offer.sentAt = today();

    closeModals();
    renderDetail();
  });

  // ------------------------------------------------------------------------
  // DOWNLOAD CSV — a stand-in for the real Excel export
  // ------------------------------------------------------------------------
  function csvCell(value) {
    var str = String(value);
    if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  downloadCsvBtn.addEventListener("click", function () {
    var offer = findOffer(currentOfferId);
    if (!offer) return;

    var rows = [];
    var costHeaders = Data.COST_CATEGORIES.map(function (cat) { return Data.costCategoryLabel(cat); });
    rows.push(
      [
        window.i18n.t("inventory.sales.csv.species"),
        window.i18n.t("inventory.sales.csv.size"),
        window.i18n.t("inventory.sales.csv.quality"),
        window.i18n.t("inventory.sales.csv.kilograms"),
        window.i18n.t("inventory.sales.csv.pricePerKg")
      ].concat(costHeaders, [
        window.i18n.t("inventory.sales.csv.totalCosts"),
        window.i18n.t("inventory.sales.csv.revenue"),
        window.i18n.t("inventory.sales.detail.utilidadLabel")
      ])
    );

    offer.products.forEach(function (p) {
      var species = Data.speciesLabel(Data.findById(Data.SPECIES, p.speciesId));
      var size = Data.sizeLabel(Data.findById(Data.SIZES, p.sizeId));
      var quality = Data.qualityLabel(Data.findById(Data.QUALITIES, p.qualityId));
      var kg = p.confirmedKg || 0;
      var costs = totalCostsFor(p);
      var revenue = (p.pricePerKg || 0) * kg;
      var utilidad = revenue - costs;
      var costValues = Data.COST_CATEGORIES.map(function (cat) { return (p.costs[cat.key] || 0).toFixed(2); });

      rows.push(
        [species, size, quality, kg.toFixed(1), (p.pricePerKg || 0).toFixed(2)]
          .concat(costValues, [costs.toFixed(2), revenue.toFixed(2), utilidad.toFixed(2)])
      );
    });

    var totalUtilidad = offer.products.reduce(function (sum, p) { return sum + (computeLineUtilidad(offer, p) || 0); }, 0);
    var blankCols = [];
    for (var blankCount = 5 + Data.COST_CATEGORIES.length + 2; blankCount > 0; blankCount--) {
      blankCols.push("");
    }
    rows.push([]);
    rows.push(blankCols.concat([window.i18n.t("inventory.sales.detail.totalUtilidadLabel"), totalUtilidad.toFixed(2)]));

    var csvContent = rows.map(function (row) {
      return row.map(csvCell).join(",");
    }).join("\r\n");

    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = offer.offerNumber + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // ------------------------------------------------------------------------
  // LIVE LANGUAGE SWITCHING — re-render whatever's currently on screen so
  // dynamic content (which isn't covered by data-i18n) updates immediately
  // instead of waiting for a reload.
  // ------------------------------------------------------------------------
  window.addEventListener("langchange", function () {
    renderHubDate();
    if (!hubView.hidden) renderHubLists();
    if (!detailView.hidden && currentOfferId) renderDetail();

    if (newOfferModal.classList.contains("is-open") && salespersonSelect.options.length) {
      salespersonSelect.options[0].textContent = window.i18n.t("inventory.sales.modal.newOffer.salespersonPlaceholder");
    }

    if (addProductModal.classList.contains("is-open") && availableProductSelect.options.length) {
      availableProductSelect.options[0].textContent = window.i18n.t("inventory.sales.modal.addProduct.selectPlaceholder");
    }

    if (completeOrderModal.classList.contains("is-open")) {
      openCompleteOrderModal();
    }

    if (sendEmailModal.classList.contains("is-open")) {
      renderAddedEmails();
    }
  });

  // ------------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------------
  renderHubDate();
  showHub();
})();
