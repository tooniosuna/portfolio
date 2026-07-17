// ==========================================================================
// event-wizard-data.js
// Shared mock data for the Resort Event Wizard demo: the event-type list,
// the venue catalog (main event + reception spaces at a single fictional
// resort), the mood options (shown only for weddings), the 3 package
// tiers, and the constants/formula behind the quote estimate. Loaded
// before event-wizard.js — same "simulate a table in a database" approach
// as the Inventory demo, just plain in-memory arrays exposed on
// window.EventWizardData.
//
// The resort itself ("Osuna Resort & Spa") is fictional — same
// de-branding convention used elsewhere on the site. The wizard covers
// any private event hosted at the resort (weddings, corporate events,
// milestone celebrations, reunions), not weddings specifically.
// ==========================================================================

(function () {
  "use strict";

  // ------------------------------------------------------------------------
  // EVENT TYPES
  // ------------------------------------------------------------------------
  var EVENT_TYPES = [
    {
      id: "wedding",
      name: "Wedding",
      nameKey: "eventWizard.data.eventType.wedding.name",
      description: "Ceremony and reception for you and your guests",
      descriptionKey: "eventWizard.data.eventType.wedding.description"
    },
    {
      id: "corporate",
      name: "Corporate event",
      nameKey: "eventWizard.data.eventType.corporate.name",
      description: "Meetings, retreats, launches, or team celebrations",
      descriptionKey: "eventWizard.data.eventType.corporate.description"
    },
    {
      id: "celebration",
      name: "Milestone celebration",
      nameKey: "eventWizard.data.eventType.celebration.name",
      description: "Birthdays, anniversaries, quinceañeras, and more",
      descriptionKey: "eventWizard.data.eventType.celebration.description"
    },
    {
      id: "reunion",
      name: "Family reunion / other gathering",
      nameKey: "eventWizard.data.eventType.reunion.name",
      description: "Any other private event for your group",
      descriptionKey: "eventWizard.data.eventType.reunion.description"
    }
  ];

  // ------------------------------------------------------------------------
  // EVENT SPACES (the "main" venue — ceremony, keynote, main celebration)
  // ------------------------------------------------------------------------
  var EVENT_SPACES = [
    {
      id: "space-palapa",
      name: "Palapa Point",
      tagline: "Oceanfront elegance at the water's edge",
      taglineKey: "eventWizard.data.space.palapa.tagline",
      capacityGuests: 150,
      fee: 2000,
      gradient: ["#bfe3f0", "#eaf6fb"],
      features: [
        "Oceanfront setting, steps from the sand",
        "Natural palapa shade structure",
        "Best for sunset events (4–6pm)",
        "White folding chairs included"
      ],
      featureKeys: [
        "eventWizard.data.space.palapa.feature.0",
        "eventWizard.data.space.palapa.feature.1",
        "eventWizard.data.space.palapa.feature.2",
        "eventWizard.data.space.palapa.feature.3"
      ]
    },
    {
      id: "space-jardin",
      name: "Jardín Alameda",
      tagline: "Celebrate under a garden canopy",
      taglineKey: "eventWizard.data.space.jardin.tagline",
      capacityGuests: 250,
      fee: 3500,
      gradient: ["#d9ead3", "#f3f9ef"],
      features: [
        "Manicured tropical garden setting",
        "Stone fountain backdrop",
        "String-light canopy overhead",
        "Covered arbor for shade"
      ],
      featureKeys: [
        "eventWizard.data.space.jardin.feature.0",
        "eventWizard.data.space.jardin.feature.1",
        "eventWizard.data.space.jardin.feature.2",
        "eventWizard.data.space.jardin.feature.3"
      ]
    },
    {
      id: "space-terraza",
      name: "Terraza Cielo",
      tagline: "Sunset views above the coastline",
      taglineKey: "eventWizard.data.space.terraza.tagline",
      capacityGuests: 120,
      fee: 2800,
      gradient: ["#f7d9e3", "#fdf1f5"],
      features: [
        "Rooftop terrace with panoramic ocean views",
        "Open-air, best after 5pm",
        "Built-in ambient lighting",
        "Room for a live trio or quartet"
      ],
      featureKeys: [
        "eventWizard.data.space.terraza.feature.0",
        "eventWizard.data.space.terraza.feature.1",
        "eventWizard.data.space.terraza.feature.2",
        "eventWizard.data.space.terraza.feature.3"
      ]
    }
  ];

  // ------------------------------------------------------------------------
  // RECEPTION SPACES
  // ------------------------------------------------------------------------
  var RECEPTION_SPACES = [
    {
      id: "rec-salon",
      name: "Salón Marea",
      tagline: "Oceanview ballroom with room to dance",
      taglineKey: "eventWizard.data.reception.salon.tagline",
      capacityGuests: 300,
      fee: 5000,
      gradient: ["#cfe2f3", "#eef6fc"],
      features: [
        "Floor-to-ceiling ocean-view windows",
        "Air-conditioned indoor ballroom",
        "Built-in dance floor & staging",
        "Flexible round or long-table layouts"
      ],
      featureKeys: [
        "eventWizard.data.reception.salon.feature.0",
        "eventWizard.data.reception.salon.feature.1",
        "eventWizard.data.reception.salon.feature.2",
        "eventWizard.data.reception.salon.feature.3"
      ]
    },
    {
      id: "rec-patio",
      name: "Patio de las Palmas",
      tagline: "Open-air dinner under swaying palms",
      taglineKey: "eventWizard.data.reception.patio.tagline",
      capacityGuests: 220,
      fee: 4000,
      gradient: ["#fce8cf", "#fef6ea"],
      features: [
        "Open-air, palm-shaded courtyard",
        "String lights strung overhead",
        "Outdoor dance floor add-on available",
        "Tropical, casual-elegant atmosphere"
      ],
      featureKeys: [
        "eventWizard.data.reception.patio.feature.0",
        "eventWizard.data.reception.patio.feature.1",
        "eventWizard.data.reception.patio.feature.2",
        "eventWizard.data.reception.patio.feature.3"
      ]
    },
    {
      id: "rec-terraza-grand",
      name: "Gran Terraza",
      tagline: "Indoor-outdoor flexibility, any season",
      taglineKey: "eventWizard.data.reception.terrazaGrand.tagline",
      capacityGuests: 400,
      fee: 6500,
      gradient: ["#e3d9f3", "#f7f2fc"],
      features: [
        "Retractable roof for weather flexibility",
        "Panoramic coastline views",
        "Largest-capacity reception space",
        "Built-in bar and lounge areas"
      ],
      featureKeys: [
        "eventWizard.data.reception.terrazaGrand.feature.0",
        "eventWizard.data.reception.terrazaGrand.feature.1",
        "eventWizard.data.reception.terrazaGrand.feature.2",
        "eventWizard.data.reception.terrazaGrand.feature.3"
      ]
    }
  ];

  // ------------------------------------------------------------------------
  // MOODS — shown only when the event type is a wedding.
  // ------------------------------------------------------------------------
  // Mood NAMES are kept in English in both languages, same stylistic
  // choice as venue proper names — these read as evocative styling/brand
  // names on the site (see event-wizard.js's header comment for the
  // rationale). Only the descriptions are translated.
  var MOODS = [
    {
      id: "mood-barefoot",
      name: "Barefoot & Breezy",
      description: "Relaxed beachfront elegance — whites, blues, and bare feet in the sand.",
      descriptionKey: "eventWizard.data.mood.barefoot.description",
      gradient: ["#bfe3f0", "#eaf6fb"]
    },
    {
      id: "mood-tropical",
      name: "Tropical Romance",
      description: "Lush greenery, blush and gold tones, candlelight after dark.",
      descriptionKey: "eventWizard.data.mood.tropical.description",
      gradient: ["#d9ead3", "#f9e9ee"]
    },
    {
      id: "mood-classic",
      name: "Classic Ballroom Elegance",
      description: "Refined and timeless — ivory, champagne, and traditional florals.",
      descriptionKey: "eventWizard.data.mood.classic.description",
      gradient: ["#f0e6d2", "#fbf8f0"]
    },
    {
      id: "mood-modern",
      name: "Modern Minimal",
      description: "Clean lines, a neutral palette, and sculptural floral moments.",
      descriptionKey: "eventWizard.data.mood.modern.description",
      gradient: ["#e5e5ea", "#f7f7f9"]
    },
    {
      id: "mood-fiesta",
      name: "Vibrant Fiesta",
      description: "Bold color, papel picado, and a party that doesn't stop.",
      descriptionKey: "eventWizard.data.mood.fiesta.description",
      gradient: ["#fbdcae", "#fdeee0"]
    },
    {
      id: "mood-boho",
      name: "Bohemian Garden",
      description: "Rustic-chic with earthy tones, macramé, and wildflowers.",
      descriptionKey: "eventWizard.data.mood.boho.description",
      gradient: ["#e6d9c3", "#f6f0e6"]
    }
  ];

  // ------------------------------------------------------------------------
  // PACKAGE TIERS — priced per guest, chosen after the initial estimate.
  // Each tier splits into perGuestIncludes (things that scale with the
  // guest count — food, drink, favors) and flatExtras (one-time additions
  // to the whole event, included once regardless of guest count).
  // ------------------------------------------------------------------------
  // Tier NAMES (Essential/Premium/Luxury) are kept in English in both
  // languages, same brand-name convention as venue names — only the
  // inclusion bullets translate.
  var PACKAGE_TIERS = [
    {
      id: "pkg-essential",
      name: "Essential",
      perGuestRate: 150,
      perGuestIncludes: [
        "Plated 3-course dinner, one entrée choice",
        "House wine & beer bar, 4 hours",
        "Welcome mocktail on arrival"
      ],
      perGuestIncludeKeys: [
        "eventWizard.data.package.essential.perGuestInclude.0",
        "eventWizard.data.package.essential.perGuestInclude.1",
        "eventWizard.data.package.essential.perGuestInclude.2"
      ],
      flatExtras: [
        "DJ & basic sound system",
        "Standard floral centerpieces",
        "Day-of coordinator"
      ],
      flatExtraKeys: [
        "eventWizard.data.package.essential.flatExtra.0",
        "eventWizard.data.package.essential.flatExtra.1",
        "eventWizard.data.package.essential.flatExtra.2"
      ]
    },
    {
      id: "pkg-premium",
      name: "Premium",
      perGuestRate: 225,
      perGuestIncludes: [
        "Plated 3-course dinner, two entrée choices",
        "Premium open bar with top-shelf tequila & mezcal, 5 hours",
        "Welcome cocktail, hand-passed at arrival"
      ],
      perGuestIncludeKeys: [
        "eventWizard.data.package.premium.perGuestInclude.0",
        "eventWizard.data.package.premium.perGuestInclude.1",
        "eventWizard.data.package.premium.perGuestInclude.2"
      ],
      flatExtras: [
        "Live trio during cocktail hour + DJ for the reception",
        "Elevated floral design",
        "Dedicated event coordinator",
        "Sparkler send-off"
      ],
      flatExtraKeys: [
        "eventWizard.data.package.premium.flatExtra.0",
        "eventWizard.data.package.premium.flatExtra.1",
        "eventWizard.data.package.premium.flatExtra.2",
        "eventWizard.data.package.premium.flatExtra.3"
      ]
    },
    {
      id: "pkg-luxury",
      name: "Luxury",
      perGuestRate: 350,
      perGuestIncludes: [
        "Chef's tasting menu + interactive food stations",
        "Top-shelf open bar, 6 hours, plus a champagne toast",
        "Welcome cocktail + late-night snack"
      ],
      perGuestIncludeKeys: [
        "eventWizard.data.package.luxury.perGuestInclude.0",
        "eventWizard.data.package.luxury.perGuestInclude.1",
        "eventWizard.data.package.luxury.perGuestInclude.2"
      ],
      flatExtras: [
        "Live band + DJ",
        "Custom floral design & lounge furniture",
        "Full event production team",
        "Private after-party space",
        "Fireworks show over the water"
      ],
      flatExtraKeys: [
        "eventWizard.data.package.luxury.flatExtra.0",
        "eventWizard.data.package.luxury.flatExtra.1",
        "eventWizard.data.package.luxury.flatExtra.2",
        "eventWizard.data.package.luxury.flatExtra.3",
        "eventWizard.data.package.luxury.flatExtra.4"
      ]
    }
  ];

  // ------------------------------------------------------------------------
  // CONSTANTS — all simple, made-up rules, stated plainly rather than
  // hidden inside the math, same spirit as Reception/Sales' simplifications.
  // ------------------------------------------------------------------------
  var MIN_GUESTS = 10;
  var MAX_GUESTS = 1000; // above this, the wizard branches to "let's talk"
  var MIN_LEAD_DAYS = 90; // earliest selectable event date, from today
  var NIGHTS_STAY = 3; // arrival night, event night, night after
  var GUESTS_PER_ROOM = 2; // average occupancy used for room math
  var NIGHTLY_ROOM_RATE = 220; // USD per room per night
  var PER_GUEST_SERVICE_FEE = 40; // USD per guest — staffing/setup/rentals
  var DEPOSIT_AMOUNT = 1500; // USD, flat
  var HOLD_DAYS = 5; // deposit holds the venue + rooms this many days

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // ------------------------------------------------------------------------
  // TRANSLATED LABELS
  // Event type names/descriptions, venue taglines/features, mood
  // descriptions, and package inclusion bullets are all translatable
  // descriptive text (not proper nouns), so they're resolved through
  // i18n.js at render time — same "look up by key, fall back to the
  // English string on the object" pattern used by the Inventory demo's
  // inventory-data.js (see translated()/familyLabel() etc. there).
  // Venue proper names (Palapa Point, Jardín Alameda, Salón Marea, etc.)
  // and the mood/package tier NAMES stay identical in both languages —
  // callers should keep reading those straight off .name.
  // ------------------------------------------------------------------------
  function translated(key, fallback) {
    if (window.i18n && typeof window.i18n.t === "function") {
      var value = window.i18n.t(key);
      if (typeof value === "string") return value;
    }
    return fallback;
  }

  function eventTypeName(eventType) {
    if (!eventType) return "";
    return translated(eventType.nameKey, eventType.name);
  }

  function eventTypeDescription(eventType) {
    if (!eventType) return "";
    return translated(eventType.descriptionKey, eventType.description);
  }

  function venueTagline(venue) {
    if (!venue) return "";
    return translated(venue.taglineKey, venue.tagline);
  }

  function venueFeatures(venue) {
    if (!venue) return [];
    return venue.features.map(function (f, i) {
      return translated(venue.featureKeys[i], f);
    });
  }

  function moodDescription(mood) {
    if (!mood) return "";
    return translated(mood.descriptionKey, mood.description);
  }

  function packagePerGuestIncludes(tier) {
    if (!tier) return [];
    return tier.perGuestIncludes.map(function (f, i) {
      return translated(tier.perGuestIncludeKeys[i], f);
    });
  }

  function packageFlatExtras(tier) {
    if (!tier) return [];
    return tier.flatExtras.map(function (f, i) {
      return translated(tier.flatExtraKeys[i], f);
    });
  }

  function estimateRooms(overnightGuests) {
    return Math.ceil(overnightGuests / GUESTS_PER_ROOM);
  }

  // Simulates roughly 1 in 6 dates already being booked ("due to space") —
  // deterministic per calendar day (and guest count) rather than
  // random-on-every-render, so the same date is consistently blocked or
  // open as the user pages between months instead of flickering. Folding
  // totalGuests into the hash means a bigger event sees a different (and
  // slightly more restricted) set of open dates than a smaller one for
  // the same calendar day — simulating that availability depends on how
  // much space the event needs. Not tied to any real calendar system;
  // just a simple made-up rule, same spirit as the rest of the demo's math.
  function isDateUnavailable(date, totalGuests) {
    var epochDay = Math.floor(date.getTime() / 86400000);
    var guestFactor = Math.floor((totalGuests || 100) / 25);
    var hash = (epochDay * 2654435761 + guestFactor * 40503) % 2147483647;
    var threshold = totalGuests && totalGuests > 300 ? 4 : 6;
    return Math.abs(hash) % threshold === 0;
  }

  // The preliminary estimate shown right after the venue steps (and mood,
  // for weddings), before a package is chosen: room nights + the main
  // event/reception "configuration" fee + a flat per-guest service fee.
  function computeQuote(input) {
    var mainSpace = findById(EVENT_SPACES, input.mainSpaceId);
    var reception = findById(RECEPTION_SPACES, input.receptionSpaceId);
    var rooms = estimateRooms(input.overnightGuests);
    var roomsCost = rooms * NIGHTS_STAY * NIGHTLY_ROOM_RATE;
    var venueConfigFee = (mainSpace ? mainSpace.fee : 0) + (reception ? reception.fee : 0);
    var guestServiceFee = input.totalGuests * PER_GUEST_SERVICE_FEE;

    return {
      rooms: rooms,
      roomsCost: roomsCost,
      venueConfigFee: venueConfigFee,
      guestServiceFee: guestServiceFee,
      subtotal: roomsCost + venueConfigFee + guestServiceFee
    };
  }

  // Final total once a package tier is chosen: quote subtotal + the
  // tier's per-guest rate across the total guest count.
  function computeFinalTotal(quoteSubtotal, packageId, totalGuests) {
    var tier = findById(PACKAGE_TIERS, packageId);
    var packageCost = tier ? tier.perGuestRate * totalGuests : 0;
    return {
      packageCost: packageCost,
      total: quoteSubtotal + packageCost
    };
  }

  function formatCurrency(amount) {
    return "$" + Math.round(amount).toLocaleString("en-US");
  }

  window.EventWizardData = {
    EVENT_TYPES: EVENT_TYPES,
    EVENT_SPACES: EVENT_SPACES,
    RECEPTION_SPACES: RECEPTION_SPACES,
    MOODS: MOODS,
    PACKAGE_TIERS: PACKAGE_TIERS,
    MIN_GUESTS: MIN_GUESTS,
    MAX_GUESTS: MAX_GUESTS,
    MIN_LEAD_DAYS: MIN_LEAD_DAYS,
    NIGHTS_STAY: NIGHTS_STAY,
    GUESTS_PER_ROOM: GUESTS_PER_ROOM,
    NIGHTLY_ROOM_RATE: NIGHTLY_ROOM_RATE,
    PER_GUEST_SERVICE_FEE: PER_GUEST_SERVICE_FEE,
    DEPOSIT_AMOUNT: DEPOSIT_AMOUNT,
    HOLD_DAYS: HOLD_DAYS,
    findById: findById,
    estimateRooms: estimateRooms,
    isDateUnavailable: isDateUnavailable,
    computeQuote: computeQuote,
    computeFinalTotal: computeFinalTotal,
    formatCurrency: formatCurrency,
    eventTypeName: eventTypeName,
    eventTypeDescription: eventTypeDescription,
    venueTagline: venueTagline,
    venueFeatures: venueFeatures,
    moodDescription: moodDescription,
    packagePerGuestIncludes: packagePerGuestIncludes,
    packageFlatExtras: packageFlatExtras
  };
})();
