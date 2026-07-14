// ==========================================================================
// reception.js
// Reception of Raw Material module. Covers: today's receptions hub (in
// progress / finished), the New Reception form (provider-driven cascading
// port/vessel/driver), the reception detail view, adding products (the
// Family > Group > Species > Size > Quality builder), adding loads (kg +
// tote, filtered to avoid cross-contamination), and the final-details step
// that locks a reception — plus a demo-only "View as Admin" toggle that
// unlocks editing on a locked (finished) reception.
//
// Scoped to this page only. All state (receptions, tote occupancy) lives
// in memory — reloading the page resets everything back to empty, same as
// the Reporting demo. Products/loads are add-only in this pass; there's no
// remove/undo once something's been added to a reception (only the whole
// reception can move from in-progress to finished).
// ==========================================================================

(function () {
  "use strict";

  var Data = window.InvData;

  // ------------------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------------------
  var RECEPTIONS = [];
  var receptionCounter = 0;
  var isAdminMode = false;
  var currentReceptionId = null; // which reception the detail view is showing
  var currentLoadProductId = null; // which product the Add Load modal is for
  var pendingArrivalLot = ""; // generated when New Reception opens
  var pendingStartTimestamp = null; // captured when New Reception opens — the truck pulling in, not whenever Create is clicked

  // Snapshots RECEPTIONS + receptionCounter to sessionStorage after every
  // change, so the Sales page (loaded separately, later) can read what's
  // actually been received. Reception itself never reads this back in —
  // it still starts empty on every reload, same as before.
  function persist() {
    Data.saveState("receptions", RECEPTIONS);
    Data.saveState("receptionCounter", receptionCounter);
  }

  function findReception(id) {
    for (var i = 0; i < RECEPTIONS.length; i++) {
      if (RECEPTIONS[i].id === id) return RECEPTIONS[i];
    }
    return null;
  }

  function today() {
    return new Date();
  }

  function formatDate(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  function formatTime(d) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function formatKg(kg) {
    return kg.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
  }

  function productTotalKg(product) {
    return product.loads.reduce(function (sum, l) { return sum + l.kg; }, 0);
  }

  function productHasLoads(product) {
    return product.loads.length > 0;
  }

  function receptionIsReadyToFinish(reception) {
    return reception.products.length > 0 && reception.products.every(productHasLoads);
  }

  function productLabel(product) {
    var species = Data.findById(Data.SPECIES, product.speciesId);
    var size = Data.findById(Data.SIZES, product.sizeId);
    var quality = Data.findById(Data.QUALITIES, product.qualityId);
    return species.name + " — " + size.name + " — " + quality.name;
  }

  // ------------------------------------------------------------------------
  // DOM REFS — hub view
  // ------------------------------------------------------------------------
  var hubView = document.getElementById("hubView");
  var detailView = document.getElementById("detailView");
  var hubDateLabel = document.getElementById("hubDateLabel");
  var adminToggle = document.getElementById("adminToggle");
  var newReceptionBtn = document.getElementById("newReceptionBtn");
  var inProgressList = document.getElementById("inProgressList");
  var inProgressEmptyNote = document.getElementById("inProgressEmptyNote");
  var finishedList = document.getElementById("finishedList");
  var finishedEmptyNote = document.getElementById("finishedEmptyNote");

  // DOM refs — detail view
  var detailBackBtn = document.getElementById("detailBackBtn");
  var detailLotLabel = document.getElementById("detailLotLabel");
  var detailMetaLine = document.getElementById("detailMetaLine");
  var detailStatusBadge = document.getElementById("detailStatusBadge");
  var addProductBtn = document.getElementById("addProductBtn");
  var productList = document.getElementById("productList");
  var productEmptyNote = document.getElementById("productEmptyNote");
  var addFinalDetailsBtn = document.getElementById("addFinalDetailsBtn");
  var finalDetailsHint = document.getElementById("finalDetailsHint");
  var finalDetailsSummary = document.getElementById("finalDetailsSummary");
  var finalTempValue = document.getElementById("finalTempValue");
  var finalShelfLifeValue = document.getElementById("finalShelfLifeValue");
  var editFinalDetailsNote = document.getElementById("editFinalDetailsNote");

  // DOM refs — modals
  var modalBackdrop = document.getElementById("modalBackdrop");

  var newReceptionModal = document.getElementById("newReceptionModal");
  var newArrivalLotDisplay = document.getElementById("newArrivalLotDisplay");
  var providerSelect = document.getElementById("providerSelect");
  var portSelect = document.getElementById("portSelect");
  var vesselSelect = document.getElementById("vesselSelect");
  var driverSelect = document.getElementById("driverSelect");
  var platesInput = document.getElementById("platesInput");
  var startTimeDisplay = document.getElementById("startTimeDisplay");
  var newReceptionError = document.getElementById("newReceptionError");
  var newReceptionCloseBtn = document.getElementById("newReceptionCloseBtn");
  var newReceptionCancelBtn = document.getElementById("newReceptionCancelBtn");
  var newReceptionCreateBtn = document.getElementById("newReceptionCreateBtn");

  var addProductModal = document.getElementById("addProductModal");
  var productPreviewLabel = document.getElementById("productPreviewLabel");
  var familySelect = document.getElementById("familySelect");
  var groupSelect = document.getElementById("groupSelect");
  var speciesSelect = document.getElementById("speciesSelect");
  var sizeSelect = document.getElementById("sizeSelect");
  var qualitySelect = document.getElementById("qualitySelect");
  var addProductError = document.getElementById("addProductError");
  var addProductCloseBtn = document.getElementById("addProductCloseBtn");
  var addProductCancelBtn = document.getElementById("addProductCancelBtn");
  var addProductSaveBtn = document.getElementById("addProductSaveBtn");

  var addLoadModal = document.getElementById("addLoadModal");
  var addLoadProductLabel = document.getElementById("addLoadProductLabel");
  var loadKgInput = document.getElementById("loadKgInput");
  var toteSelect = document.getElementById("toteSelect");
  var addLoadError = document.getElementById("addLoadError");
  var addLoadCloseBtn = document.getElementById("addLoadCloseBtn");
  var addLoadCancelBtn = document.getElementById("addLoadCancelBtn");
  var addLoadSaveBtn = document.getElementById("addLoadSaveBtn");

  var finalDetailsModal = document.getElementById("finalDetailsModal");
  var avgTempInput = document.getElementById("avgTempInput");
  var shelfLifeInput = document.getElementById("shelfLifeInput");
  var finalDetailsError = document.getElementById("finalDetailsError");
  var finalDetailsCloseBtn = document.getElementById("finalDetailsCloseBtn");
  var finalDetailsCancelBtn = document.getElementById("finalDetailsCancelBtn");
  var finalDetailsSaveBtn = document.getElementById("finalDetailsSaveBtn");

  // ------------------------------------------------------------------------
  // MODAL HELPERS — only one modal is ever open at a time, backdrop shared.
  // ------------------------------------------------------------------------
  var allModals = [newReceptionModal, addProductModal, addLoadModal, finalDetailsModal];

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
  // HUB VIEW — today's receptions
  // ------------------------------------------------------------------------
  function renderHubDate() {
    hubDateLabel.textContent = "Today — " + formatDate(today());
  }

  function renderReceptionCard(reception) {
    var provider = Data.findById(Data.PROVIDERS, reception.providerId);
    var totalKg = reception.products.reduce(function (sum, p) { return sum + productTotalKg(p); }, 0);

    var card = document.createElement("button");
    card.type = "button";
    card.className = "card inv-reception-card";

    var top = document.createElement("div");
    top.className = "inv-reception-card-top";

    var lot = document.createElement("span");
    lot.className = "inv-reception-card-lot";
    lot.textContent = reception.arrivalLot;

    var badge = document.createElement("span");
    badge.className = "inv-status-badge " + (reception.status === "finished" ? "is-finished" : "is-progress");
    badge.textContent = reception.status === "finished" ? "Finished" : "In progress";

    top.appendChild(lot);
    top.appendChild(badge);

    var providerLine = document.createElement("p");
    providerLine.className = "inv-reception-card-provider";
    providerLine.textContent = provider.name;

    var meta = document.createElement("p");
    meta.className = "inv-reception-card-meta";
    meta.textContent =
      reception.port + " · " + reception.vessel + " · " + formatTime(reception.startTimestamp);

    var stats = document.createElement("p");
    stats.className = "inv-reception-card-stats";
    stats.textContent =
      reception.products.length + " product" + (reception.products.length === 1 ? "" : "s") +
      " · " + formatKg(totalKg);

    card.appendChild(top);
    card.appendChild(providerLine);
    card.appendChild(meta);
    card.appendChild(stats);

    card.addEventListener("click", function () {
      openDetail(reception.id);
    });

    return card;
  }

  function renderHubLists() {
    var inProgress = RECEPTIONS.filter(function (r) { return r.status === "in-progress"; });
    var finished = RECEPTIONS.filter(function (r) { return r.status === "finished"; });

    inProgressList.innerHTML = "";
    inProgress.forEach(function (r) { inProgressList.appendChild(renderReceptionCard(r)); });
    inProgressEmptyNote.hidden = inProgress.length > 0;

    finishedList.innerHTML = "";
    finished.forEach(function (r) { finishedList.appendChild(renderReceptionCard(r)); });
    finishedEmptyNote.hidden = finished.length > 0;
  }

  function showHub() {
    currentReceptionId = null;
    detailView.hidden = true;
    hubView.hidden = false;
    renderHubLists();
  }

  newReceptionBtn.addEventListener("click", openNewReceptionModal);
  detailBackBtn.addEventListener("click", showHub);

  adminToggle.addEventListener("change", function () {
    isAdminMode = adminToggle.checked;
    document.body.classList.toggle("inv-admin-mode", isAdminMode);
    if (currentReceptionId) renderDetail();
  });

  // ------------------------------------------------------------------------
  // NEW RECEPTION MODAL
  // ------------------------------------------------------------------------
  function populateSelect(select, options, placeholder) {
    select.innerHTML = "";
    var placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = placeholder;
    select.appendChild(placeholderOpt);
    options.forEach(function (opt) {
      var el = document.createElement("option");
      el.value = opt;
      el.textContent = opt;
      select.appendChild(el);
    });
  }

  function resetNewReceptionForm() {
    pendingArrivalLot = Data.randomArrivalLot();
    newArrivalLotDisplay.textContent = pendingArrivalLot;

    var providerOpts = document.createElement("option");
    providerOpts.value = "";
    providerOpts.textContent = "Select a provider…";
    providerSelect.innerHTML = "";
    providerSelect.appendChild(providerOpts);
    Data.PROVIDERS.forEach(function (p) {
      var el = document.createElement("option");
      el.value = p.id;
      el.textContent = p.name;
      providerSelect.appendChild(el);
    });

    populateSelect(portSelect, [], "Select a provider first…");
    populateSelect(vesselSelect, [], "Select a provider first…");
    populateSelect(driverSelect, [], "Select a provider first…");
    portSelect.disabled = true;
    vesselSelect.disabled = true;
    driverSelect.disabled = true;

    platesInput.value = "";
    pendingStartTimestamp = today();
    startTimeDisplay.textContent = "Today, " + formatTime(pendingStartTimestamp);
    newReceptionError.hidden = true;
  }

  function openNewReceptionModal() {
    resetNewReceptionForm();
    openModal(newReceptionModal);
  }

  providerSelect.addEventListener("change", function () {
    var provider = Data.findById(Data.PROVIDERS, providerSelect.value);
    if (!provider) {
      populateSelect(portSelect, [], "Select a provider first…");
      populateSelect(vesselSelect, [], "Select a provider first…");
      populateSelect(driverSelect, [], "Select a provider first…");
      portSelect.disabled = true;
      vesselSelect.disabled = true;
      driverSelect.disabled = true;
      return;
    }
    populateSelect(portSelect, provider.ports, "Select a port…");
    populateSelect(vesselSelect, provider.vessels, "Select a vessel…");
    populateSelect(driverSelect, provider.drivers, "Select a driver…");
    portSelect.disabled = false;
    vesselSelect.disabled = false;
    driverSelect.disabled = false;
  });

  function closeNewReceptionModal() {
    closeModals();
  }

  newReceptionCloseBtn.addEventListener("click", closeNewReceptionModal);
  newReceptionCancelBtn.addEventListener("click", closeNewReceptionModal);

  newReceptionCreateBtn.addEventListener("click", function () {
    var providerId = providerSelect.value;
    var port = portSelect.value;
    var vessel = vesselSelect.value;
    var driver = driverSelect.value;
    var plates = platesInput.value.trim();

    if (!providerId || !port || !vessel || !driver || !plates) {
      newReceptionError.hidden = false;
      return;
    }
    newReceptionError.hidden = true;

    receptionCounter += 1;
    var reception = {
      id: "rec-" + receptionCounter,
      arrivalLot: pendingArrivalLot,
      providerId: providerId,
      port: port,
      vessel: vessel,
      driver: driver,
      plates: plates,
      startTimestamp: pendingStartTimestamp,
      status: "in-progress",
      products: [],
      finalDetails: null
    };
    RECEPTIONS.push(reception);
    persist();

    closeModals();
    showHub();
  });

  // ------------------------------------------------------------------------
  // DETAIL VIEW
  // ------------------------------------------------------------------------
  function openDetail(receptionId) {
    currentReceptionId = receptionId;
    hubView.hidden = true;
    detailView.hidden = false;
    renderDetail();
  }

  function renderProductRow(reception, product, canEdit) {
    var row = document.createElement("div");
    row.className = "card inv-product-row";

    var head = document.createElement("div");
    head.className = "inv-product-row-head";

    var name = document.createElement("h3");
    name.textContent = productLabel(product);

    var total = document.createElement("span");
    total.className = "inv-product-row-total";
    total.textContent = formatKg(productTotalKg(product));

    head.appendChild(name);
    head.appendChild(total);
    row.appendChild(head);

    if (product.loads.length > 0) {
      var loadsList = document.createElement("ul");
      loadsList.className = "inv-load-list";
      product.loads.forEach(function (load) {
        var tote = Data.findById(Data.TOTES, load.toteId);
        var li = document.createElement("li");
        li.textContent = formatKg(load.kg) + " — " + tote.label;
        loadsList.appendChild(li);
      });
      row.appendChild(loadsList);
    } else {
      var noLoads = document.createElement("p");
      noLoads.className = "inv-empty-note-inline";
      noLoads.textContent = "No loads yet — add at least one.";
      row.appendChild(noLoads);
    }

    if (canEdit) {
      var addLoadRowBtn = document.createElement("button");
      addLoadRowBtn.type = "button";
      addLoadRowBtn.className = "btn-outline inv-add-load-btn";
      addLoadRowBtn.textContent = "+ Add load";
      addLoadRowBtn.addEventListener("click", function () {
        openAddLoadModal(product.id);
      });
      row.appendChild(addLoadRowBtn);
    }

    return row;
  }

  function renderDetail() {
    var reception = findReception(currentReceptionId);
    if (!reception) { showHub(); return; }

    var provider = Data.findById(Data.PROVIDERS, reception.providerId);
    var canEdit = reception.status === "in-progress" || isAdminMode;

    detailLotLabel.textContent = reception.arrivalLot;
    detailMetaLine.textContent =
      provider.name + " · " + reception.port + " · " + reception.vessel +
      " · Driver: " + reception.driver + " · Plates: " + reception.plates +
      " · Started " + formatTime(reception.startTimestamp);

    detailStatusBadge.className = "inv-status-badge " + (reception.status === "finished" ? "is-finished" : "is-progress");
    detailStatusBadge.textContent = reception.status === "finished" ? "Finished" : "In progress";

    productList.innerHTML = "";
    reception.products.forEach(function (product) {
      productList.appendChild(renderProductRow(reception, product, canEdit));
    });
    productEmptyNote.hidden = reception.products.length > 0;

    addProductBtn.hidden = !canEdit;

    if (reception.status === "finished") {
      addFinalDetailsBtn.hidden = true;
      finalDetailsHint.hidden = true;
      finalDetailsSummary.hidden = false;
      finalTempValue.textContent = reception.finalDetails.avgTemp.toFixed(1) + " °C";
      finalShelfLifeValue.textContent =
        reception.finalDetails.shelfLifeDays + " day" + (reception.finalDetails.shelfLifeDays === 1 ? "" : "s");
      editFinalDetailsNote.hidden = !isAdminMode;
    } else {
      finalDetailsSummary.hidden = true;
      var ready = receptionIsReadyToFinish(reception);
      addFinalDetailsBtn.hidden = false;
      addFinalDetailsBtn.disabled = !ready;
      finalDetailsHint.hidden = ready;
    }
  }

  addProductBtn.addEventListener("click", openAddProductModal);
  addFinalDetailsBtn.addEventListener("click", openFinalDetailsModal);

  // ------------------------------------------------------------------------
  // ADD PRODUCT MODAL — Family > Group > Species > Size > Quality, in order
  // ------------------------------------------------------------------------
  function updateProductPreview() {
    var parts = [];
    var family = Data.findById(Data.FAMILIES, familySelect.value);
    var group = Data.findById(Data.GROUPS, groupSelect.value);
    var species = Data.findById(Data.SPECIES, speciesSelect.value);
    var size = Data.findById(Data.SIZES, sizeSelect.value);
    var quality = Data.findById(Data.QUALITIES, qualitySelect.value);
    if (family) parts.push(family.name);
    if (group) parts.push(group.name);
    if (species) parts.push(species.name);
    if (size) parts.push(size.name);
    if (quality) parts.push(quality.name);
    productPreviewLabel.textContent = parts.length > 0 ? parts.join(" → ") : "Select a family to begin…";
  }

  function resetAddProductForm() {
    var familyOpt = document.createElement("option");
    familyOpt.value = "";
    familyOpt.textContent = "Select a family…";
    familySelect.innerHTML = "";
    familySelect.appendChild(familyOpt);
    Data.FAMILIES.forEach(function (f) {
      var el = document.createElement("option");
      el.value = f.id;
      el.textContent = f.name;
      familySelect.appendChild(el);
    });

    populateSelect(groupSelect, [], "Select a family first…");
    populateSelect(speciesSelect, [], "Select a group first…");
    populateSelect(sizeSelect, [], "Select a species first…");
    populateSelect(qualitySelect, [], "Select a size first…");
    groupSelect.disabled = true;
    speciesSelect.disabled = true;
    sizeSelect.disabled = true;
    qualitySelect.disabled = true;

    addProductError.hidden = true;
    updateProductPreview();
  }

  // Size/Quality don't actually depend on species (universal scale), but
  // they're still revealed in sequence to match the plant's own step-by-step
  // classification process.
  function populateSizeAndQualitySelects() {
    var sizeOpt = document.createElement("option");
    sizeOpt.value = "";
    sizeOpt.textContent = "Select a size…";
    sizeSelect.innerHTML = "";
    sizeSelect.appendChild(sizeOpt);
    Data.SIZES.forEach(function (s) {
      var el = document.createElement("option");
      el.value = s.id;
      el.textContent = s.name + " (" + s.hint + ")";
      sizeSelect.appendChild(el);
    });
    sizeSelect.disabled = false;
  }

  function populateQualitySelect() {
    var qualOpt = document.createElement("option");
    qualOpt.value = "";
    qualOpt.textContent = "Select a quality…";
    qualitySelect.innerHTML = "";
    qualitySelect.appendChild(qualOpt);
    Data.QUALITIES.forEach(function (q) {
      var el = document.createElement("option");
      el.value = q.id;
      el.textContent = q.name;
      qualitySelect.appendChild(el);
    });
    qualitySelect.disabled = false;
  }

  function openAddProductModal() {
    resetAddProductForm();
    openModal(addProductModal);
  }

  familySelect.addEventListener("change", function () {
    var family = Data.findById(Data.FAMILIES, familySelect.value);
    populateSelect(speciesSelect, [], "Select a group first…");
    populateSelect(sizeSelect, [], "Select a species first…");
    populateSelect(qualitySelect, [], "Select a size first…");
    speciesSelect.disabled = true;
    sizeSelect.disabled = true;
    qualitySelect.disabled = true;

    if (!family) {
      populateSelect(groupSelect, [], "Select a family first…");
      groupSelect.disabled = true;
      updateProductPreview();
      return;
    }

    var groupOpt = document.createElement("option");
    groupOpt.value = "";
    groupOpt.textContent = "Select a group…";
    groupSelect.innerHTML = "";
    groupSelect.appendChild(groupOpt);
    Data.getGroupsForFamily(family.id).forEach(function (g) {
      var el = document.createElement("option");
      el.value = g.id;
      el.textContent = g.name;
      groupSelect.appendChild(el);
    });
    groupSelect.disabled = false;
    updateProductPreview();
  });

  groupSelect.addEventListener("change", function () {
    var group = Data.findById(Data.GROUPS, groupSelect.value);
    populateSelect(sizeSelect, [], "Select a species first…");
    populateSelect(qualitySelect, [], "Select a size first…");
    sizeSelect.disabled = true;
    qualitySelect.disabled = true;

    if (!group) {
      populateSelect(speciesSelect, [], "Select a group first…");
      speciesSelect.disabled = true;
      updateProductPreview();
      return;
    }

    var speciesOpt = document.createElement("option");
    speciesOpt.value = "";
    speciesOpt.textContent = "Select a species…";
    speciesSelect.innerHTML = "";
    speciesSelect.appendChild(speciesOpt);
    Data.getSpeciesForGroup(group.id).forEach(function (s) {
      var el = document.createElement("option");
      el.value = s.id;
      el.textContent = s.name;
      speciesSelect.appendChild(el);
    });
    speciesSelect.disabled = false;
    updateProductPreview();
  });

  speciesSelect.addEventListener("change", function () {
    populateSelect(qualitySelect, [], "Select a size first…");
    qualitySelect.disabled = true;
    if (!speciesSelect.value) {
      populateSelect(sizeSelect, [], "Select a species first…");
      sizeSelect.disabled = true;
      updateProductPreview();
      return;
    }
    populateSizeAndQualitySelects();
    updateProductPreview();
  });

  sizeSelect.addEventListener("change", function () {
    if (!sizeSelect.value) {
      populateSelect(qualitySelect, [], "Select a size first…");
      qualitySelect.disabled = true;
      updateProductPreview();
      return;
    }
    populateQualitySelect();
    updateProductPreview();
  });

  qualitySelect.addEventListener("change", updateProductPreview);

  function closeAddProductModal() {
    closeModals();
  }

  addProductCloseBtn.addEventListener("click", closeAddProductModal);
  addProductCancelBtn.addEventListener("click", closeAddProductModal);

  addProductSaveBtn.addEventListener("click", function () {
    var reception = findReception(currentReceptionId);
    if (!reception) return;

    var familyId = familySelect.value;
    var groupId = groupSelect.value;
    var speciesId = speciesSelect.value;
    var sizeId = sizeSelect.value;
    var qualityId = qualitySelect.value;

    if (!familyId || !groupId || !speciesId || !sizeId || !qualityId) {
      addProductError.hidden = false;
      addProductError.textContent = "Please complete every field.";
      return;
    }

    var alreadyExists = reception.products.some(function (p) {
      return p.speciesId === speciesId && p.sizeId === sizeId && p.qualityId === qualityId;
    });
    if (alreadyExists) {
      addProductError.hidden = false;
      addProductError.textContent = "This exact product is already on this reception — add a load to it instead.";
      return;
    }

    addProductError.hidden = true;
    reception.products.push({
      id: reception.id + "-p" + (reception.products.length + 1),
      familyId: familyId,
      groupId: groupId,
      speciesId: speciesId,
      sizeId: sizeId,
      qualityId: qualityId,
      loads: []
    });
    persist();

    closeModals();
    renderDetail();
  });

  // ------------------------------------------------------------------------
  // ADD LOAD MODAL — kg + tote, filtered to avoid cross-contamination
  // ------------------------------------------------------------------------
  function openAddLoadModal(productId) {
    var reception = findReception(currentReceptionId);
    if (!reception) return;
    var product = null;
    for (var i = 0; i < reception.products.length; i++) {
      if (reception.products[i].id === productId) { product = reception.products[i]; break; }
    }
    if (!product) return;

    currentLoadProductId = productId;
    addLoadProductLabel.textContent = productLabel(product);
    loadKgInput.value = "";

    var available = Data.getAvailableTotes(product.speciesId, product.sizeId, product.qualityId);
    var toteOpt = document.createElement("option");
    toteOpt.value = "";
    toteOpt.textContent = "Select a tote…";
    toteSelect.innerHTML = "";
    toteSelect.appendChild(toteOpt);
    available.forEach(function (t) {
      var el = document.createElement("option");
      el.value = t.id;
      el.textContent = t.label + (t.contents ? " (already holds this product)" : " (empty)");
      toteSelect.appendChild(el);
    });

    addLoadError.hidden = true;
    openModal(addLoadModal);
  }

  function closeAddLoadModal() {
    closeModals();
  }

  addLoadCloseBtn.addEventListener("click", closeAddLoadModal);
  addLoadCancelBtn.addEventListener("click", closeAddLoadModal);

  addLoadSaveBtn.addEventListener("click", function () {
    var reception = findReception(currentReceptionId);
    if (!reception) return;
    var product = null;
    for (var i = 0; i < reception.products.length; i++) {
      if (reception.products[i].id === currentLoadProductId) { product = reception.products[i]; break; }
    }
    if (!product) return;

    var kg = parseFloat(loadKgInput.value);
    var toteId = toteSelect.value;

    if (!kg || kg <= 0 || !toteId) {
      addLoadError.hidden = false;
      return;
    }
    addLoadError.hidden = true;

    Data.claimTote(toteId, product.speciesId, product.sizeId, product.qualityId);
    product.loads.push({
      id: product.id + "-l" + (product.loads.length + 1),
      kg: kg,
      toteId: toteId
    });
    persist();

    closeModals();
    renderDetail();
  });

  // ------------------------------------------------------------------------
  // FINAL DETAILS MODAL — locks the reception once saved
  // ------------------------------------------------------------------------
  function openFinalDetailsModal() {
    avgTempInput.value = "";
    shelfLifeInput.value = "";
    finalDetailsError.hidden = true;
    openModal(finalDetailsModal);
  }

  function closeFinalDetailsModal() {
    closeModals();
  }

  finalDetailsCloseBtn.addEventListener("click", closeFinalDetailsModal);
  finalDetailsCancelBtn.addEventListener("click", closeFinalDetailsModal);

  finalDetailsSaveBtn.addEventListener("click", function () {
    var reception = findReception(currentReceptionId);
    if (!reception) return;

    var avgTemp = parseFloat(avgTempInput.value);
    var shelfLifeDays = parseInt(shelfLifeInput.value, 10);

    if (isNaN(avgTemp) || isNaN(shelfLifeDays) || shelfLifeDays < 0) {
      finalDetailsError.hidden = false;
      return;
    }
    finalDetailsError.hidden = true;

    // finishedAt stamps the start of the shelf-life clock — Sales reads
    // this (via window.InvReceptions) to know how much longer a product
    // can still be offered before it's considered moved to long-term
    // storage and off the "fresh" list.
    reception.finalDetails = { avgTemp: avgTemp, shelfLifeDays: shelfLifeDays, finishedAt: today() };
    reception.status = "finished";
    persist();

    closeModals();
    showHub();
  });

  // ------------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------------
  renderHubDate();
  showHub();
})();
