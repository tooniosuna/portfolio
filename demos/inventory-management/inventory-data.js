// ==========================================================================
// inventory-data.js
// Shared mock data for the Inventory and Order Management System demo:
// providers (each with its own ports/vessels/drivers), the raw-material
// classification hierarchy (Family > Group > Species), sizes, quality
// grades, and the shared tote ("dino") pool. Loaded before reception.js
// (and, later, sales.js / bi.js) — every module reads from the same
// window.InvData object rather than each keeping its own copy.
//
// No real database — everything here simulates a handful of database
// tables as plain in-memory JS arrays/objects, same approach as the
// Reporting demo. State resets on every page reload.
// ==========================================================================

(function () {
  "use strict";

  // ------------------------------------------------------------------------
  // PROVIDERS
  // Each provider is its own little hierarchy — selecting one on the New
  // Reception form determines which ports, vessels, and drivers are valid
  // choices for the rest of the form. Car plates are free text, not tied
  // to the provider, since the same provider can send different trucks.
  // ------------------------------------------------------------------------
  var PROVIDERS = [
    {
      id: "prov-1", name: "Pesquera Punta Arena",
      ports: ["Progreso", "Yucalpetén"],
      vessels: ["Estrella del Mar II", "Doña Carmen"],
      drivers: ["Jorge Canul", "Felipe Uc"]
    },
    {
      id: "prov-2", name: "Mariscos del Golfo",
      ports: ["Celestún", "Sisal"],
      vessels: ["La Sirena", "San Felipe I"],
      drivers: ["Manuel Chan", "Roberto Pech"]
    },
    {
      id: "prov-3", name: "Cooperativa Pescadores de Progreso",
      ports: ["Progreso"],
      vessels: ["Nuestra Señora de Progreso", "El Tiburón"],
      drivers: ["Wilbert Dzul", "Armando Koyoc"]
    },
    {
      id: "prov-4", name: "Productos del Mar Maya",
      ports: ["Dzilam de Bravo", "Río Lagartos"],
      vessels: ["Sirena del Caribe", "Doña Fidencia"],
      drivers: ["Gaspar Tun", "Eduardo Ek"]
    },
    {
      id: "prov-5", name: "Pesca y Congelados Sisal",
      ports: ["Sisal", "Chuburná"],
      vessels: ["El Halcón del Mar", "Perla Azul"],
      drivers: ["Ismael Poot", "Braulio Cauich"]
    },
    {
      id: "prov-6", name: "Grupo Pesquero Celestún",
      ports: ["Celestún"],
      vessels: ["Flamingo I", "Santa Rita"],
      drivers: ["Rogelio Chi", "Marcelino Yam"]
    },
    {
      id: "prov-7", name: "Exportadora Yucalpetén",
      ports: ["Yucalpetén", "Progreso"],
      vessels: ["Cruzada del Golfo", "La Guadalupana"],
      drivers: ["Fernando Balam", "Domingo Cocom"]
    },
    {
      id: "prov-8", name: "Camaronera San Felipe",
      ports: ["San Felipe", "Río Lagartos"],
      vessels: ["Camaronero Uno", "Estrella Rosa"],
      drivers: ["Alfredo Xool", "Bernardo Uicab"]
    },
    {
      id: "prov-9", name: "Pesquera Telchac",
      ports: ["Telchac Puerto"],
      vessels: ["Bendición del Mar", "Delfín Blanco"],
      drivers: ["Ricardo Puc", "Aurelio Chable"]
    },
    {
      id: "prov-10", name: "Mariscos Costa Maya",
      ports: ["Dzilam de Bravo", "Telchac Puerto"],
      vessels: ["Costa Maya I", "Reina del Caribe"],
      drivers: ["Ignacio May", "Feliciano Dzib"]
    }
  ];

  // ------------------------------------------------------------------------
  // FAMILY > GROUP > SPECIES
  // Grounded in what Yucatán processors actually export (grouper, snapper,
  // octopus, spiny lobster, blue crab, shrimp) rather than an invented
  // catalog. Family names translated from the plant's own terms:
  // Pescados -> Fish, Moluscos -> Mollusks, Crustáceos -> Crustaceans.
  // ------------------------------------------------------------------------
  var FAMILIES = [
    { id: "fam-fish", name: "Fish" },
    { id: "fam-mollusks", name: "Mollusks" },
    { id: "fam-crustaceans", name: "Crustaceans" }
  ];

  var GROUPS = [
    { id: "grp-snapper", familyId: "fam-fish", name: "Snapper" },
    { id: "grp-grouper", familyId: "fam-fish", name: "Grouper" },
    { id: "grp-octopus", familyId: "fam-mollusks", name: "Octopus" },
    { id: "grp-conch", familyId: "fam-mollusks", name: "Conch" },
    { id: "grp-shrimp", familyId: "fam-crustaceans", name: "Shrimp" },
    { id: "grp-lobster", familyId: "fam-crustaceans", name: "Lobster" },
    { id: "grp-crab", familyId: "fam-crustaceans", name: "Crab" }
  ];

  var SPECIES = [
    { id: "sp-red-snapper", groupId: "grp-snapper", name: "Red Snapper" },
    { id: "sp-mutton-snapper", groupId: "grp-snapper", name: "Mutton Snapper" },
    { id: "sp-yellowtail-snapper", groupId: "grp-snapper", name: "Yellowtail Snapper" },
    { id: "sp-red-grouper", groupId: "grp-grouper", name: "Red Grouper" },
    { id: "sp-black-grouper", groupId: "grp-grouper", name: "Black Grouper" },
    { id: "sp-fourseye-octopus", groupId: "grp-octopus", name: "Mexican Four-Eyed Octopus" },
    { id: "sp-common-octopus", groupId: "grp-octopus", name: "Common Octopus" },
    { id: "sp-queen-conch", groupId: "grp-conch", name: "Queen Conch" },
    { id: "sp-white-shrimp", groupId: "grp-shrimp", name: "White Shrimp" },
    { id: "sp-pink-shrimp", groupId: "grp-shrimp", name: "Pink Shrimp" },
    { id: "sp-brown-shrimp", groupId: "grp-shrimp", name: "Brown Shrimp" },
    { id: "sp-spiny-lobster", groupId: "grp-lobster", name: "Caribbean Spiny Lobster" },
    { id: "sp-blue-crab", groupId: "grp-crab", name: "Blue Crab" },
    { id: "sp-stone-crab", groupId: "grp-crab", name: "Stone Crab" }
  ];

  // Universal size scale, kept simple on purpose rather than modeling each
  // species' own real-world grading convention.
  var SIZES = [
    { id: "size-s", name: "Small", hint: "under 1 kg / piece" },
    { id: "size-m", name: "Medium", hint: "1–3 kg / piece" },
    { id: "size-l", name: "Large", hint: "3–6 kg / piece" },
    { id: "size-xl", name: "Extra Large", hint: "6 kg+ / piece" }
  ];

  var QUALITIES = [
    { id: "qual-a", name: "Grade A — Export Premium" },
    { id: "qual-b", name: "Grade B — Standard" },
    { id: "qual-c", name: "Grade C — Processing" }
  ];

  // ------------------------------------------------------------------------
  // TOTES ("dinos")
  // Shared plant equipment, not tied to any one reception — every load
  // across every reception today draws from the same pool. All start
  // empty; a tote is claimed by the first load put into it, and from then
  // on only takes further loads of the *exact same* product (species +
  // size + quality), to avoid cross-contamination.
  // ------------------------------------------------------------------------
  var TOTES = [];
  (function buildTotes() {
    for (var i = 1; i <= 24; i++) {
      TOTES.push({
        id: "tote-" + i,
        label: "Tote " + (i < 10 ? "0" + i : i),
        contents: null // null = empty, otherwise { speciesId, sizeId, qualityId }
      });
    }
  })();

  // ------------------------------------------------------------------------
  // SALESPEOPLE
  // Whoever is creating a given day's offer — selected first, on the New
  // Offer form, same role as the provider selection in Reception.
  // ------------------------------------------------------------------------
  var SALESPEOPLE = [
    { id: "sp-1", name: "Daniela Ortiz" },
    { id: "sp-2", name: "Luis Fernando Aguilar" },
    { id: "sp-3", name: "Karla Moreno" },
    { id: "sp-4", name: "Sergio Peña" },
    { id: "sp-5", name: "Adriana Cetina" }
  ];

  // ------------------------------------------------------------------------
  // CLIENTS
  // Mock US buyer companies an offer can be emailed to. Multiple can be
  // selected, and a one-off email can be typed in on top of this list.
  // ------------------------------------------------------------------------
  var CLIENTS = [
    { id: "cli-1", name: "Blue Harbor Seafood Co.", email: "purchasing@blueharborseafood.com" },
    { id: "cli-2", name: "Gulf Coast Fish Traders", email: "orders@gulfcoastfishtraders.com" },
    { id: "cli-3", name: "Atlantic Fresh Imports", email: "buyers@atlanticfreshimports.com" },
    { id: "cli-4", name: "Miami Seafood Exchange", email: "procurement@miamiseafoodexchange.com" },
    { id: "cli-5", name: "Pacific Rim Fish Co.", email: "sales@pacificrimfish.com" },
    { id: "cli-6", name: "Sunbelt Seafood Distributors", email: "orders@sunbeltseafood.com" },
    { id: "cli-7", name: "Coastal Prime Seafoods", email: "info@coastalprimeseafoods.com" },
    { id: "cli-8", name: "Harborview Fish Market Group", email: "purchasing@harborviewfmg.com" },
    { id: "cli-9", name: "East Bay Seafood Partners", email: "buyers@eastbayseafood.com" }
  ];

  // ------------------------------------------------------------------------
  // COST CATEGORIES (Sales module)
  // Each product on an offer carries these 7 cost line-items. Values are
  // simple, researched-ballpark placeholders (Mexico manufacturing labor
  // ~$5-8/hr fully burdened, wholesale vacuum bags / waxed export boxes /
  // CO or brine fish treatment) rather than exact client figures — every
  // preset is just a starting point the rep can still edit by hand.
  // ------------------------------------------------------------------------
  var COST_CATEGORIES = [
    {
      key: "manoDeObra", label: "Mano de obra (labor)",
      options: [
        { label: "Express (1 hr crew)", value: 10 },
        { label: "Standard (2 hr crew)", value: 20 },
        { label: "Extended (4 hr crew)", value: 38 }
      ]
    },
    {
      key: "ingredientes", label: "Ingredientes (treatment)",
      options: [
        { label: "Ice slurry only", value: 5 },
        { label: "Brine treatment", value: 10 },
        { label: "Carbon monoxide (CO) treatment", value: 16 }
      ]
    },
    {
      key: "empaquePrimario", label: "Empaque primario (packaging)",
      options: [
        { label: "Vacuum bag 6 x 10", value: 10 },
        { label: "Vacuum bag 8 x 12", value: 15 },
        { label: "Vacuum bag 10 x 14", value: 21 }
      ]
    },
    {
      key: "complementoPrimario", label: "Complemento primario",
      options: [
        { label: "Absorbent pad — small", value: 4 },
        { label: "Absorbent pad — large", value: 8 }
      ]
    },
    {
      key: "empaqueSecundario", label: "Empaque secundario (box)",
      options: [
        { label: "Waxed box 5 Lb", value: 15 },
        { label: "Waxed box 10 Lb", value: 22 },
        { label: "Waxed box 20 Lb", value: 32 }
      ]
    },
    {
      key: "complementoSecundario", label: "Complemento secundario",
      options: [
        { label: "None", value: 0 },
        { label: "Gel ice packs", value: 8 },
        { label: "Foam liner", value: 12 }
      ]
    },
    {
      key: "customHandling", label: "Custom & handling",
      options: [
        { label: "Standard", value: 20 },
        { label: "Priority", value: 35 }
      ]
    }
  ];

  function getDefaultCosts() {
    var costs = {};
    COST_CATEGORIES.forEach(function (cat) {
      costs[cat.key] = cat.options[0].value;
    });
    return costs;
  }

  function formatCurrency(amount) {
    var sign = amount < 0 ? "-" : "";
    var abs = Math.abs(amount);
    return sign + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ------------------------------------------------------------------------
  // CROSS-PAGE BRIDGE
  // Reception and Sales are separate pages, so a normal in-memory JS array
  // can't travel between them the way it travels between the hub/detail
  // views of a single page. Reception writes a snapshot of itself to
  // sessionStorage after every change; Sales reads that snapshot once, on
  // its own load, to know what's actually been received and is still
  // fresh. Nothing here is a "database" — it's just a way for one already-
  // rendered page to hand its in-memory state to the next page in the same
  // browser tab. Reception's own reload-resets-everything behavior is
  // untouched, since it never reads this back into itself.
  // ------------------------------------------------------------------------
  function saveState(key, value) {
    try {
      sessionStorage.setItem("invDemo_" + key, JSON.stringify(value));
    } catch (e) {
      // sessionStorage unavailable (privacy mode, etc.) — Sales just won't
      // see Reception's data across the page navigation. Not fatal.
    }
  }

  function loadState(key) {
    try {
      var raw = sessionStorage.getItem("invDemo_" + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function randomArrivalLot() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1, to avoid confusion
    var lot = "";
    for (var i = 0; i < 8; i++) {
      lot += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "LOT-" + lot;
  }

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // ------------------------------------------------------------------------
  // TRANSLATED LABELS
  // Family/Group/Species/Size/Quality names, and the cost category/option
  // labels, are generic classification vocabulary (not proper nouns like
  // provider, vessel, driver, salesperson, or client names), so they're
  // translated through i18n.js. Each item's own .name/.label stays as the
  // English fallback if i18n.js hasn't loaded for some reason. Reception.js
  // and Sales.js call these instead of reading .name/.label directly, and
  // re-run their render functions on "langchange" so labels update live.
  // ------------------------------------------------------------------------
  function translated(key, fallback) {
    if (window.i18n && typeof window.i18n.t === "function") {
      var value = window.i18n.t(key);
      if (typeof value === "string") return value;
    }
    return fallback;
  }

  function familyLabel(family) {
    if (!family) return "";
    return translated("inventory.data.family." + family.id, family.name);
  }

  function groupLabel(group) {
    if (!group) return "";
    return translated("inventory.data.group." + group.id, group.name);
  }

  function speciesLabel(species) {
    if (!species) return "";
    return translated("inventory.data.species." + species.id, species.name);
  }

  function sizeLabel(size) {
    if (!size) return "";
    return translated("inventory.data.size." + size.id + ".name", size.name);
  }

  function sizeHintLabel(size) {
    if (!size) return "";
    return translated("inventory.data.size." + size.id + ".hint", size.hint);
  }

  function qualityLabel(quality) {
    if (!quality) return "";
    return translated("inventory.data.quality." + quality.id, quality.name);
  }

  function costCategoryLabel(category) {
    if (!category) return "";
    return translated("inventory.data.costCategory." + category.key, category.label);
  }

  function costOptionLabel(category, option, index) {
    if (!category || !option) return "";
    return translated("inventory.data.costOption." + category.key + "." + index, option.label);
  }

  function getGroupsForFamily(familyId) {
    return GROUPS.filter(function (g) { return g.familyId === familyId; });
  }

  function getSpeciesForGroup(groupId) {
    return SPECIES.filter(function (s) { return s.groupId === groupId; });
  }

  // Totes that can currently accept a load of this exact product — either
  // genuinely empty, or already holding the identical species+size+quality.
  function getAvailableTotes(speciesId, sizeId, qualityId) {
    return TOTES.filter(function (t) {
      if (!t.contents) return true;
      return (
        t.contents.speciesId === speciesId &&
        t.contents.sizeId === sizeId &&
        t.contents.qualityId === qualityId
      );
    });
  }

  function claimTote(toteId, speciesId, sizeId, qualityId) {
    var tote = findById(TOTES, toteId);
    if (tote && !tote.contents) {
      tote.contents = { speciesId: speciesId, sizeId: sizeId, qualityId: qualityId };
    }
  }

  window.InvData = {
    PROVIDERS: PROVIDERS,
    FAMILIES: FAMILIES,
    GROUPS: GROUPS,
    SPECIES: SPECIES,
    SIZES: SIZES,
    QUALITIES: QUALITIES,
    TOTES: TOTES,
    SALESPEOPLE: SALESPEOPLE,
    CLIENTS: CLIENTS,
    COST_CATEGORIES: COST_CATEGORIES,
    getDefaultCosts: getDefaultCosts,
    formatCurrency: formatCurrency,
    saveState: saveState,
    loadState: loadState,
    randomArrivalLot: randomArrivalLot,
    findById: findById,
    getGroupsForFamily: getGroupsForFamily,
    getSpeciesForGroup: getSpeciesForGroup,
    getAvailableTotes: getAvailableTotes,
    claimTote: claimTote,
    familyLabel: familyLabel,
    groupLabel: groupLabel,
    speciesLabel: speciesLabel,
    sizeLabel: sizeLabel,
    sizeHintLabel: sizeHintLabel,
    qualityLabel: qualityLabel,
    costCategoryLabel: costCategoryLabel,
    costOptionLabel: costOptionLabel
  };
})();
