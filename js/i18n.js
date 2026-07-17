// ==========================================================================
// i18n.js
// Tiny, dependency-free EN/ES translation system.
//
// How it works:
//   1. Every translatable element in the HTML has a data-i18n="some.key"
//      attribute. Its existing text is the English fallback — if this
//      script fails to load for any reason, the page still reads correctly
//      in English.
//   2. attributes (like aria-label) that need translating use
//      data-i18n-aria="some.key" instead, since those aren't textContent.
//      Placeholder text on static inputs uses data-i18n-placeholder for the
//      same reason (added for the Inventory demo's form fields).
//   3. `translations` below has one object per language, both using the
//      exact same set of keys. applyTranslations() walks every tagged
//      element and writes in the string for the active language.
//   4. The active language is: ?lang=es in the URL, else whatever was
//      remembered in localStorage from a previous visit, else English.
//
// NOTE ON CONTENT STATUS:
//   Both pages are fully translated from Antonio's official Spanish CV:
//   Home (professional summary, education, volunteer roles, core skills,
//   all 6 roles) and Credentials (degree meta). Certification and
//   tool/platform names are intentionally left in English in both
//   languages — they're proper nouns, matching the Spanish CV. The
//   Download CV href and WhatsApp pre-fill message are also
//   language-aware — see contact.downloadCvHref and whatsapp.message.
// ==========================================================================

(function () {
  var STORAGE_KEY = "portfolio-lang";
  var DEFAULT_LANG = "en";

  var translations = {
    en: {
      "nav.home": "Home",
      "nav.experience": "Experience",
      "nav.contact": "Contact",
      "nav.linkedinAriaLabel": "Antonio Osuna on LinkedIn",
      "nav.toggleAriaLabel": "Toggle navigation menu",
      "nav.demos": "Real Demos",

      "hero.greetingPrefix": "Hello! I’m",
      "hero.srRoles": "Product Owner, Product Manager, Business Analyst",
      "hero.demosCta": "See real demos →",

      "summary.heading": "Professional summary",
      "summary.p1": "Product Owner with a product management mindset and a strong Business Analyst foundation. I turn business goals into clear requirements, aligned teams, and user-friendly digital products, creating shared understanding from idea to delivery.",
      "summary.p2": "Currently based in Cancún, MX. Open to relocation.",

      "education.heading": "Education",
      "education.verifyLink": "Verify my credentials →",
      "education.degreeTitle": "Bachelor’s Degree in Digital Business & Software Engineering",
      "education.meta": "Anahuac Mayab University · Mérida, MX · Aug 2016 – Jun 2020",
      "volunteer.heading": "Leadership & volunteer roles",
      "volunteer.item1": "President of the Engineering Student Association",
      "volunteer.item2": "COO at Genera",
      "volunteer.item3": "Project Manager at Gente Nueva",
      "volunteer.item4": "Frontend Developer at Gente Nueva",

      "certCard.heading": "Certifications & Professional Development",
      "cert.name1": "AI for Product Owners",
      "cert.name2": "Software Product Management Proficiency",
      "cert.name3": "Google Foundations of Project Management",
      "cert.name4": "IBM AI Product Manager",
      "cert.name5": "PSPO I (Professional Scrum Product Owner)",
      "cert.inProgress": "In progress",

      "skills.heading": "Skills & tools",
      "skills.groupCore": "Core skills",
      "skills.groupCollab": "Product & collaboration",
      "skills.groupAnalytics": "Analytics & data",
      "skills.groupAI": "AI & automation",
      "skills.groupTech": "Technical basics",
      "skills.core1": "Product Ownership, Product Management, and Business Analysis",
      "skills.core2": "Stakeholder Alignment and Requirements Definition",
      "skills.core3": "Agile Product Delivery: Scrum, SAFe, PI Planning",
      "skills.core4": "AI-Assisted Product Discovery, Documentation, and Delivery",

      "roles.heading": "Roles & experience",
      "roles.demoBadge": "View demo",

      "roles.r1.title": "Product & Business Analyst Consultant",
      "roles.r1.meta": "Urso Core · Cancún, MX · May 2026 – Present",
      "roles.r1.summary": "Independent consulting work helping small businesses define, build, and improve digital products, websites, AI-enabled workflows, and growth systems.",
      "roles.r1.b1": "Translate business needs into clear requirements, user flows, scope, and implementation plans.",
      "roles.r1.b2": "Build and launch websites and digital experiences using SEO, structured data, analytics, HTML, CSS, JavaScript, and CMS tools.",
      "roles.r1.b3": "Work directly with business owners to prioritize scope, make tradeoffs, and move projects from idea to launch.",

      "roles.r2.title": "Product Owner / Senior Business Analyst — eCommerce Ordering & Reporting",
      "roles.r2.meta": "HCLTech · Monterrey, MX · Sep 2024 – May 2026",
      "roles.r2.summary": "Led product ownership and business analysis for a new eCommerce Reporting platform built from scratch to replace Legacy Oracle BI, partnering with Product Management, UX, Data Engineering, engineering leadership, QA, IT Support, Customer Experience, eCommerce SMEs, and National Sales stakeholders across internal users and external National Accounts.",
      "roles.r2.b1": "Led gap analysis between Legacy Oracle BI and the new Reporting platform, translating business needs into Jira user stories, acceptance criteria, UI/UX flows, data requirements, and functional documentation in Confluence.",
      "roles.r2.b2": "Owned backlog readiness across 2-week sprints and quarterly PI Planning, ensuring developers had refined, prioritized, and dependency-aware work up to 3 months ahead.",
      "roles.r2.b3": "Partnered with UX, Product Management, Tech Leads, Architects, and Data Engineering to create and validate mockups with leadership, define reporting data requirements, and support dashboard/reporting solution design.",
      "roles.r2.b4": "Drove business user adoption and continuous improvement for the Legacy Oracle BI transition through release notes, functional documentation, IT Support enablement, Adobe Analytics reviews, feedback analysis, and structured feedback readouts.",
      "roles.r2.b5": "Used adoption data, support feedback, and stakeholder readouts to identify gaps, surface new requirements to leadership, reprioritize work, and quickly move high-impact improvements into mockups, stories, refinement, and planning.",
      "roles.r2.b6": "Served as Project Reporting Manager for HCLTech BA, Product, and UX team members on the account, supporting operational processes, administrative reporting, leadership communication, and account execution.",

      "roles.r3.title": "Sales Representative — Travel & Hospitality",
      "roles.r3.meta": "Playa Hotels & Resorts · Cancún, MX · Feb 2024 – Aug 2024",
      "roles.r3.summary": "Sales consultant for a high-end vacation club, focused on trust-building and persuasive communication. Worked in a high-pressure, target-driven environment requiring adaptability, empathy, and the ability to uncover dominant buying motives through structured discovery.",
      "roles.r3.b1": "Conducted in-depth discovery sessions to identify customer needs and emotional drivers, tailoring pitches accordingly.",
      "roles.r3.b2": "Delivered persuasive sales presentations aligned with customer values, product benefits, and urgency triggers.",
      "roles.r3.b3": "Thrived under pressure in a fast-paced environment, consistently meeting sales expectations through preparation and rapport-building.",

      "roles.r4.title": "Product Manager / Business Analyst — EdTech & Internal Platforms",
      "roles.r4.meta": "Red de Colegios Semper Altius · Mexico City, MX · Nov 2021 – Nov 2023",
      "roles.r4.summary": "Led digital product delivery, internal tool modernization, and business analysis for a national education network serving 70+ campuses and over 90,000 students and staff. Acted as the sole client-side product and analysis lead, responsible for requirements gathering, vendor management, platform delivery, stakeholder alignment, and training.",
      "roles.r4.b1": "Directed three major software development initiatives from discovery to launch, managing requirements, vendor selection, contracts, delivery timelines, and post-release adoption.",
      "roles.r4.b2": "Collaborated with cross-functional stakeholders to translate institutional needs into actionable product requirements.",
      "roles.r4.b3": "Delivered user onboarding and documentation; managed CMS and supported national Microsoft 365 operations across campuses.",

      "roles.r5.title": "Customer Service Coordinator — Food Manufacturing / Supply Chain",
      "roles.r5.meta": "Harbar LLC · Remote · Sep 2020 – Nov 2021",
      "roles.r5.summary": "Coordinated service operations for a US-based food manufacturer with major retail clients. Led documentation, system optimization, and process improvement across customer service, operations, and finance.",
      "roles.r5.b1": "Managed EDI, ERP, and CRM systems for 110+ accounts, optimizing processes for clients like Trader Joe’s, Walmart, and U.S. Government vendors.",
      "roles.r5.b2": "Created cross-department sales protocols and documentation that improved order processing speed and operational accuracy.",
      "roles.r5.b3": "Spearheaded the company’s first on-time monthly financial closing; supported $40M+ in annual order volume with high service quality.",

      "roles.r6.title": "Project Business Analyst — Seafood Industry / Logistics",
      "roles.r6.meta": "Caiman Products · Yucatán, MX · Jul 2019 – Jul 2020",
      "roles.r6.summary": "Led the development of a business intelligence system for a seafood distributor. Combined technical analysis, process optimization, and data modeling to improve efficiency across operations.",
      "roles.r6.b1": "Designed and implemented a centralized system reducing manual reporting and Excel dependency.",
      "roles.r6.b2": "Enabled 20+ hours/week in time savings through system automation.",
      "roles.r6.b3": "Reduced physical infrastructure by 35% through cloud migration; improved same-day shipping processes.",

      "contact.heading": "Contact",
      "contact.intro": "Interested in working together? Let’s connect.",
      "contact.linkedin": "Connect on LinkedIn",
      "contact.downloadCv": "Download CV",
      "contact.downloadCvHref": "assets/AntonioOsunaCV.pdf",

      "whatsapp.ariaLabel": "Chat on WhatsApp",
      // Raw message text, not URL-encoded — applyTranslations() builds the
      // full wa.me href from this so the pre-fill switches with language.
      "whatsapp.message": "I saw your profile, let's chat!",

      "credentials.title": "Credentials",
      "credentials.intro": "This page verifies everything referenced on my portfolio and CV: my degree and cédula profesional, plus every certification badge — earned and in progress.",
      "credentials.degreeHeading": "Bachelor’s degree",
      "credentials.degreeMeta": "Digital Business & Software Engineering · Anahuac Mayab University · Mérida, MX",
      "credentials.cedulaLabel": "Cédula profesional:",
      "credentials.verifyLink": "Verify on the SEP portal →",
      "credentials.note": "The SEP portal doesn’t generate a direct link to individual results — search using the cédula number above.",
      "credentials.earnedHeading": "Earned certifications",
      "credentials.inProgressHeading": "In progress",
      "credentials.viewCredential": "View credential →",
      "credentials.viewProgram": "View program →",

      "demosPage.title": "Real demos",
      "demosPage.intro": "Interactive recreations of real products I’ve built — simplified and de-branded, but the functionality is genuine. Jump straight to one below.",
      "demosPage.nav.reporting": "Reporting tool",
      "demosPage.nav.eventWizard": "Event wizard",
      "demosPage.nav.inventory": "Inventory & Order Management",

      "demos.comingSoon": "Coming soon",
      "demos.constructionLabel": "Under construction",
      "demos.constructionPageMessage": "This interactive demo is being built — check back soon.",
      "demos.backToDemos": "← Back to real demos",
      "demos.viewDemoCta": "View demo →",

      "demos.reporting.title": "Reporting tool",
      "demos.reporting.description": "An embedded reporting experience recreating a tool I helped build for a national eCommerce platform — dashboards, drillable report sections, sorting, search, and exports, all without leaving the page.",

      "demos.eventWizard.title": "Resort event wizard",
      "demos.eventWizard.description": "A self-serve planning wizard for private events at a resort — pick a date, browse event and reception venues, choose a package, and reserve with a deposit, step by step.",

      "demos.inventory.title": "Inventory and Order Management System",
      "demos.inventory.description": "A raw-material intake, inventory, and sales tool I helped design for a fresh seafood exporter — replacing a slow ERP process that was costing real, time-sensitive sales.",

      // ---- Inventory demo: shared across hub/reception/sales ----
      "inventory.common.viewAsAdmin": "View as admin",
      "inventory.common.inProgress": "In progress",
      "inventory.common.products": "Products",
      "inventory.common.addProductBtn": "+ Add product",
      "inventory.common.addProductSaveBtn": "Add product",
      "inventory.common.addProductModalTitle": "Add product",
      "inventory.common.productEmptyNote": "No products added yet — add at least one to continue.",
      "inventory.common.backToHub": "← Back to Inventory and Order Management",
      "inventory.common.cancelBtn": "Cancel",
      "inventory.common.createBtn": "Create",
      "inventory.common.closeAriaLabel": "Close",
      "inventory.common.todayPrefix": "Today",
      "inventory.common.productSingular": "product",
      "inventory.common.productPlural": "products",
      "inventory.common.daySingular": "day",
      "inventory.common.dayPlural": "days",

      // ---- Inventory demo: module hub (index.html) ----
      "inventory.hub.intro": "Fresh seafood from the Yucatán Peninsula was caught, processed, and often sold and flown to US buyers within hours — but the data behind it lived in a slow, manual ERP. As the business analyst, I worked with an industrial engineer to design a lighter system for intake, inventory, and sales.",
      "inventory.quickTour.heading": "Quick tour — the happy path",
      "inventory.quickTour.step1": "Log a truck's intake in Reception — species, size, and quantity.",
      "inventory.quickTour.step2": "Check real, live inventory before building a Sales order.",
      "inventory.quickTour.step3": "See cost and margin per order as you build it.",
      "inventory.quickTour.step4": "Everything updates instantly — no more waiting on a slow ERP.",
      "inventory.hub.diagram.ariaLabel": "Process diagram: Receive, then Sell, then Ship. The transition from Receive to Sell used to be a slow, manual bottleneck that cost sales.",
      "inventory.hub.diagram.step1.title": "Receive",
      "inventory.hub.diagram.step1.desc": "Fresh catch arrives, gets classified by species and size, and is stored fast.",
      "inventory.hub.diagram.step2.title": "Sell",
      "inventory.hub.diagram.step2.desc": "Sales sees what’s really available and books the order on the spot.",
      "inventory.hub.diagram.step3.title": "Ship",
      "inventory.hub.diagram.step3.desc": "Order is packed and flown out the same day — sometimes the same hour.",
      "inventory.hub.bottleneck.label": "The old bottleneck:",
      "inventory.hub.bottleneck.text": "product sat waiting while someone hand-keyed it into a slow ERP — hours that cost real, time-sensitive sales.",
      "inventory.hub.modulesHeading": "2 modules",
      "inventory.hub.card1.title": "Reception of raw material",
      "inventory.hub.card1.desc": "Register each truck as it arrives — provider, products, quantities, and storage — the moment it pulls in.",
      "inventory.hub.card2.title": "Sales",
      "inventory.hub.card2.desc": "Check available inventory and put together a sales order in minutes, not hours.",
      "inventory.hub.card.cta": "Open module →",

      // ---- Inventory demo: Reception module (reception.html/.js) ----
      "inventory.reception.hub.heading": "Reception of Raw Material",
      "inventory.reception.hub.newReceptionBtn": "+ New reception",
      "inventory.reception.hub.inProgressEmpty": "No receptions in progress yet today.",
      "inventory.reception.hub.finishedHeading": "Finished receptions",
      "inventory.reception.hub.finishedEmpty": "No finished receptions yet today.",

      "inventory.reception.detail.backBtn": "← Back to today's receptions",
      "inventory.reception.detail.addFinalDetailsBtn": "Add final details",
      "inventory.reception.detail.finalDetailsHint": "Add at least one product with at least one load first.",
      "inventory.reception.detail.finalDetailsHeading": "Final details",
      "inventory.reception.detail.avgTempLabel": "Average temperature",
      "inventory.reception.detail.shelfLifeLabel": "Shelf life",
      "inventory.reception.detail.editFinalDetailsNote": "Viewing as admin — you can still add products and loads to this finished reception.",
      "inventory.reception.detail.noLoadsYet": "No loads yet — add at least one.",
      "inventory.reception.detail.addLoadBtn": "+ Add load",
      "inventory.reception.detail.driverLabel": "Driver",
      "inventory.reception.detail.platesLabel": "Plates",
      "inventory.reception.detail.startedLabel": "Started",

      "inventory.reception.status.finished": "Finished",

      "inventory.reception.modal.newReception.title": "New reception",
      "inventory.reception.modal.newReception.arrivalLotLabel": "Arrival lot",
      "inventory.reception.modal.newReception.providerLabel": "Provider *",
      "inventory.reception.modal.newReception.portLabel": "Port *",
      "inventory.reception.modal.newReception.vesselLabel": "Vessel *",
      "inventory.reception.modal.newReception.driverLabel": "Delivery driver *",
      "inventory.reception.modal.newReception.platesLabel": "Car plates *",
      "inventory.reception.modal.newReception.platesPlaceholder": "e.g. YUC-4521",
      "inventory.reception.modal.newReception.startTimeLabel": "Start time",
      "inventory.reception.modal.newReception.errorMsg": "Please fill in every field.",
      "inventory.reception.modal.newReception.providerPlaceholder": "Select a provider…",
      "inventory.reception.modal.newReception.selectProviderFirst": "Select a provider first…",
      "inventory.reception.modal.newReception.portPlaceholder": "Select a port…",
      "inventory.reception.modal.newReception.vesselPlaceholder": "Select a vessel…",
      "inventory.reception.modal.newReception.driverPlaceholder": "Select a driver…",

      "inventory.reception.modal.addProduct.productLabel": "Product",
      "inventory.reception.modal.addProduct.familyLabel": "Family *",
      "inventory.reception.modal.addProduct.groupLabel": "Group *",
      "inventory.reception.modal.addProduct.speciesLabel": "Species *",
      "inventory.reception.modal.addProduct.sizeLabel": "Size *",
      "inventory.reception.modal.addProduct.qualityLabel": "Quality *",
      "inventory.reception.modal.addProduct.errorMsg": "Please complete every field.",
      "inventory.reception.modal.addProduct.duplicateError": "This exact product is already on this reception — add a load to it instead.",
      "inventory.reception.modal.addProduct.previewPlaceholder": "Select a family to begin…",
      "inventory.reception.modal.addProduct.familyPlaceholder": "Select a family…",
      "inventory.reception.modal.addProduct.selectFamilyFirst": "Select a family first…",
      "inventory.reception.modal.addProduct.selectGroupFirst": "Select a group first…",
      "inventory.reception.modal.addProduct.selectSpeciesFirst": "Select a species first…",
      "inventory.reception.modal.addProduct.selectSizeFirst": "Select a size first…",
      "inventory.reception.modal.addProduct.groupPlaceholder": "Select a group…",
      "inventory.reception.modal.addProduct.speciesPlaceholder": "Select a species…",
      "inventory.reception.modal.addProduct.sizePlaceholder": "Select a size…",
      "inventory.reception.modal.addProduct.qualityPlaceholder": "Select a quality…",

      "inventory.reception.modal.addLoad.title": "Add load",
      "inventory.reception.modal.addLoad.kgLabel": "Kilograms *",
      "inventory.reception.modal.addLoad.kgPlaceholder": "e.g. 120.5",
      "inventory.reception.modal.addLoad.toteLabel": "Tote *",
      "inventory.reception.modal.addLoad.toteHint": "Only totes that are empty or already hold this exact product are shown, to avoid cross-contamination.",
      "inventory.reception.modal.addLoad.errorMsg": "Please fill in every field.",
      "inventory.reception.modal.addLoad.saveBtn": "Add load",
      "inventory.reception.modal.addLoad.totePlaceholder": "Select a tote…",
      "inventory.reception.modal.addLoad.toteHoldsProduct": " (already holds this product)",
      "inventory.reception.modal.addLoad.toteEmpty": " (empty)",

      "inventory.reception.modal.finalDetails.title": "Add final details",
      "inventory.reception.modal.finalDetails.avgTempLabel": "Average temperature (°C) *",
      "inventory.reception.modal.finalDetails.avgTempPlaceholder": "e.g. 2.5",
      "inventory.reception.modal.finalDetails.shelfLifeLabel": "Shelf life (days) *",
      "inventory.reception.modal.finalDetails.shelfLifePlaceholder": "e.g. 5",
      "inventory.reception.modal.finalDetails.lockHint": "Saving locks this reception — after this, only an admin can edit it.",
      "inventory.reception.modal.finalDetails.errorMsg": "Please fill in every field.",
      "inventory.reception.modal.finalDetails.saveBtn": "Save & finish",

      // ---- Inventory demo: Sales module (sales.html/.js) ----
      "inventory.sales.hub.heading": "Sales",
      "inventory.sales.hub.newOfferBtn": "+ New offer",
      "inventory.sales.hub.openOffersHeading": "Open offers",
      "inventory.sales.hub.openOffersEmpty": "No open offers yet today.",
      "inventory.sales.hub.completedOffersHeading": "Completed offers",
      "inventory.sales.hub.completedOffersEmpty": "No completed offers yet today.",
      "inventory.sales.hub.createdLabel": "Created",

      "inventory.sales.detail.backBtn": "← Back to today's offers",
      "inventory.sales.detail.saveOrderBtn": "Save order",
      "inventory.sales.detail.completeOrderBtn": "Complete order",
      "inventory.sales.detail.saveOrderHintDefault": "Add at least one product and a price per kilogram for each, then save to continue.",
      "inventory.sales.detail.saveOrderHintSaved": "Saved — you can now complete the order.",
      "inventory.sales.detail.saveOrderHintReady": "Ready — click Save order to continue.",
      "inventory.sales.detail.orderSummaryHeading": "Order summary",
      "inventory.sales.detail.totalUtilidadLabel": "Total utilidad",
      "inventory.sales.detail.downloadCsvBtn": "Download as CSV",
      "inventory.sales.detail.sendEmailBtn": "Send by email",
      "inventory.sales.detail.editCompletedNote": "Viewing as admin — you can still adjust prices and costs on this completed offer. Confirmed kilograms stay locked.",
      "inventory.sales.detail.confirmedLabel": "Confirmed: ",
      "inventory.sales.detail.availableNowLabel": "Available now: ",
      "inventory.sales.detail.customCostOption": "Custom",
      "inventory.sales.detail.pricePerKgLabel": "Price per kilogram (USD) *",
      "inventory.sales.detail.pricePerKgPlaceholder": "e.g. 4.50",
      "inventory.sales.detail.utilidadLabel": "Utilidad",
      "inventory.sales.detail.sentPrefix": "Sent",
      "inventory.sales.detail.sentTo": "to:",

      "inventory.sales.status.completed": "Completed",

      "inventory.sales.modal.newOffer.title": "New offer",
      "inventory.sales.modal.newOffer.salespersonLabel": "Salesperson *",
      "inventory.sales.modal.newOffer.errorMsg": "Please select a salesperson.",
      "inventory.sales.modal.newOffer.salespersonPlaceholder": "Select a salesperson…",

      "inventory.sales.modal.addProduct.hint": "Only products still within their shelf life — and not already fully claimed by another completed offer — show up here. The full available amount is added automatically.",
      "inventory.sales.modal.addProduct.availableProductLabel": "Available product *",
      "inventory.sales.modal.addProduct.emptyNote": "Nothing available to sell right now — finish a reception first.",
      "inventory.sales.modal.addProduct.errorMsg": "Please select a product.",
      "inventory.sales.modal.addProduct.selectPlaceholder": "Select a product…",
      "inventory.sales.modal.addProduct.availableSuffix": "available",

      "inventory.sales.modal.completeOrder.title": "Complete order",
      "inventory.sales.modal.completeOrder.hint": "Confirm how much of each product the buyer is actually taking — the full available amount, or less. Whatever you confirm here is deducted from inventory for the rest of today’s offers.",
      "inventory.sales.modal.completeOrder.lockHint": "Completing locks this offer — after this, only an admin can adjust prices or costs, and confirmed kilograms can’t change.",
      "inventory.sales.modal.completeOrder.errorMsg": "Please confirm a valid amount (greater than 0, up to what’s available) for every product.",
      "inventory.sales.modal.completeOrder.confirmBtn": "Confirm & complete",
      "inventory.sales.modal.completeOrder.availableLabel": "available",

      "inventory.sales.modal.sendEmail.title": "Send by email",
      "inventory.sales.modal.sendEmail.possibleClients": "Possible clients",
      "inventory.sales.modal.sendEmail.addAnotherLabel": "Add another email",
      "inventory.sales.modal.sendEmail.addBtn": "+ Add",
      "inventory.sales.modal.sendEmail.errorMsg": "Please select or add at least one recipient.",
      "inventory.sales.modal.sendEmail.sendBtn": "Send",
      "inventory.sales.modal.sendEmail.removeAriaLabel": "Remove",

      "inventory.sales.csv.species": "Species",
      "inventory.sales.csv.size": "Size",
      "inventory.sales.csv.quality": "Quality",
      "inventory.sales.csv.kilograms": "Kilograms",
      "inventory.sales.csv.pricePerKg": "Price per kg",
      "inventory.sales.csv.totalCosts": "Total costs",
      "inventory.sales.csv.revenue": "Revenue",

      // ---- Inventory demo: shared mock-data classification labels ----
      // Provider/port/vessel/driver/salesperson/client names are proper
      // nouns and stay the same in both languages (same convention as
      // certification/tool names elsewhere on the site).
      "inventory.data.family.fam-fish": "Fish",
      "inventory.data.family.fam-mollusks": "Mollusks",
      "inventory.data.family.fam-crustaceans": "Crustaceans",

      "inventory.data.group.grp-snapper": "Snapper",
      "inventory.data.group.grp-grouper": "Grouper",
      "inventory.data.group.grp-octopus": "Octopus",
      "inventory.data.group.grp-conch": "Conch",
      "inventory.data.group.grp-shrimp": "Shrimp",
      "inventory.data.group.grp-lobster": "Lobster",
      "inventory.data.group.grp-crab": "Crab",

      "inventory.data.species.sp-red-snapper": "Red Snapper",
      "inventory.data.species.sp-mutton-snapper": "Mutton Snapper",
      "inventory.data.species.sp-yellowtail-snapper": "Yellowtail Snapper",
      "inventory.data.species.sp-red-grouper": "Red Grouper",
      "inventory.data.species.sp-black-grouper": "Black Grouper",
      "inventory.data.species.sp-fourseye-octopus": "Mexican Four-Eyed Octopus",
      "inventory.data.species.sp-common-octopus": "Common Octopus",
      "inventory.data.species.sp-queen-conch": "Queen Conch",
      "inventory.data.species.sp-white-shrimp": "White Shrimp",
      "inventory.data.species.sp-pink-shrimp": "Pink Shrimp",
      "inventory.data.species.sp-brown-shrimp": "Brown Shrimp",
      "inventory.data.species.sp-spiny-lobster": "Caribbean Spiny Lobster",
      "inventory.data.species.sp-blue-crab": "Blue Crab",
      "inventory.data.species.sp-stone-crab": "Stone Crab",

      "inventory.data.size.size-s.name": "Small",
      "inventory.data.size.size-s.hint": "under 1 kg / piece",
      "inventory.data.size.size-m.name": "Medium",
      "inventory.data.size.size-m.hint": "1–3 kg / piece",
      "inventory.data.size.size-l.name": "Large",
      "inventory.data.size.size-l.hint": "3–6 kg / piece",
      "inventory.data.size.size-xl.name": "Extra Large",
      "inventory.data.size.size-xl.hint": "6 kg+ / piece",

      "inventory.data.quality.qual-a": "Grade A — Export Premium",
      "inventory.data.quality.qual-b": "Grade B — Standard",
      "inventory.data.quality.qual-c": "Grade C — Processing",

      "inventory.data.costCategory.manoDeObra": "Mano de obra (labor)",
      "inventory.data.costCategory.ingredientes": "Ingredientes (treatment)",
      "inventory.data.costCategory.empaquePrimario": "Empaque primario (packaging)",
      "inventory.data.costCategory.complementoPrimario": "Complemento primario",
      "inventory.data.costCategory.empaqueSecundario": "Empaque secundario (box)",
      "inventory.data.costCategory.complementoSecundario": "Complemento secundario",
      "inventory.data.costCategory.customHandling": "Custom & handling",

      "inventory.data.costOption.manoDeObra.0": "Express (1 hr crew)",
      "inventory.data.costOption.manoDeObra.1": "Standard (2 hr crew)",
      "inventory.data.costOption.manoDeObra.2": "Extended (4 hr crew)",
      "inventory.data.costOption.ingredientes.0": "Ice slurry only",
      "inventory.data.costOption.ingredientes.1": "Brine treatment",
      "inventory.data.costOption.ingredientes.2": "Carbon monoxide (CO) treatment",
      "inventory.data.costOption.empaquePrimario.0": "Vacuum bag 6 x 10",
      "inventory.data.costOption.empaquePrimario.1": "Vacuum bag 8 x 12",
      "inventory.data.costOption.empaquePrimario.2": "Vacuum bag 10 x 14",
      "inventory.data.costOption.complementoPrimario.0": "Absorbent pad — small",
      "inventory.data.costOption.complementoPrimario.1": "Absorbent pad — large",
      "inventory.data.costOption.empaqueSecundario.0": "Waxed box 5 Lb",
      "inventory.data.costOption.empaqueSecundario.1": "Waxed box 10 Lb",
      "inventory.data.costOption.empaqueSecundario.2": "Waxed box 20 Lb",
      "inventory.data.costOption.complementoSecundario.0": "None",
      "inventory.data.costOption.complementoSecundario.1": "Gel ice packs",
      "inventory.data.costOption.complementoSecundario.2": "Foam liner",
      "inventory.data.costOption.customHandling.0": "Standard",
      "inventory.data.costOption.customHandling.1": "Priority",

      // ---- Reporting demo: filter bar / flyout chrome ----
      "reporting.filters.title": "Filters",
      "reporting.filters.closeAriaLabel": "Close filters",
      "reporting.filters.dialogAriaLabel": "Reporting filters",
      "reporting.filters.dateRangeLabel": "Date range",
      "reporting.filters.dateRangeHint": "Up to 2 years back, through yesterday — data refreshes daily, not live.",
      "reporting.filters.startLabel": "Start",
      "reporting.filters.endLabel": "End",
      "reporting.filters.dateError": "Start date must be on or before the end date.",
      "reporting.filters.regionLabel": "Region",
      "reporting.filters.customersLabel": "Customers",
      "reporting.filters.customersHint": "At least one customer is always required.",
      "reporting.filters.customersError": "Select at least one customer.",
      "reporting.filters.selectAll": "Select all",
      "reporting.filters.unselectAll": "Unselect all",
      "reporting.filters.reset": "Reset",
      "reporting.filters.apply": "Apply filters",
      "reporting.filters.loadingFilters": "Loading filters…",
      "reporting.filters.summaryLabel": "Filters",
      "reporting.filters.allCustomersPrefix": "All",
      "reporting.filters.customerSingular": "customer",
      "reporting.filters.customerPlural": "customers",
      "reporting.filters.allRegions": "All regions",
      "reporting.filters.region.northeast": "Northeast",
      "reporting.filters.region.southeast": "Southeast",
      "reporting.filters.region.midwest": "Midwest",
      "reporting.filters.region.west": "West",

      // ---- Reporting demo: page-level chrome ----
      "reporting.page.heading": "Customer Reporting",
      "reporting.page.description": "A recreation of a reporting platform I helped build for a national eCommerce business — so users could get their invoice, product, and compliance reports without ever leaving the platform they were already working in.",
      "reporting.quickTour.heading": "Quick tour — the happy path",
      "reporting.quickTour.step1": "Filter by date range, region, or customer — every view updates at once.",
      "reporting.quickTour.step2": "Switch between report tables and interactive charts.",
      "reporting.quickTour.step3": "Click into any row to drill into the full order or product details.",
      "reporting.quickTour.step4": "Sort, search, and export any table straight to CSV.",
      "reporting.tableViews.heading": "Table Views",

      // ---- Reporting demo: download history flyout ----
      "reporting.history.downloadBtn": "Download History",
      "reporting.history.dialogAriaLabel": "Download history",
      "reporting.history.heading": "Download history",
      "reporting.history.redownloadBtn": "Re-download",

      // ---- Reporting demo: charts ----
      "reporting.charts.heading": "Charts",
      "reporting.charts.spendByClass.title": "Spend by Class",
      "reporting.charts.topProducts.title": "Top Products",
      "reporting.charts.metricToggle.dollars": "Dollars ($)",
      "reporting.charts.metricToggle.cases": "Cases",
      "reporting.charts.seeMorePrefix": "See more",
      "reporting.charts.seeLess": "See less",
      "reporting.charts.emptyState": "No purchases match the current filters.",
      "reporting.charts.yoyNew": "New",
      "reporting.charts.casesSuffix": "cases",

      // ---- Reporting demo: section cards + report/section display names ----
      // (report row DATA — invoice numbers, product descriptions, statuses,
      // dates, amounts — is intentionally left untranslated everywhere in
      // this demo; only these fixed chrome labels below translate.)
      "reporting.section.invoiceHistory.title": "Invoice History",
      "reporting.section.invoiceHistory.desc": "Invoice-level and line-item detail for every purchase in your filtered range.",
      "reporting.section.productUsage.title": "Product Usage",
      "reporting.section.productUsage.desc": "What was actually bought — summarized, trended month over month, and broken down by product.",
      "reporting.section.compliance.title": "Compliance",
      "reporting.section.compliance.desc": "Contracted vs. non-contracted purchasing.",

      "reporting.reportName.invoiceHistory": "Invoice History",
      "reporting.reportName.invoiceDetails": "Invoice Details",
      "reporting.reportName.purchaseSummary": "Purchase Summary",
      "reporting.reportName.purchaseTrends": "Purchase Trends",
      "reporting.reportName.purchaseDetails": "Purchase Details",
      "reporting.reportName.complianceSummary": "Compliance Summary",

      "reporting.stub.prefix": "The interactive table for “",
      "reporting.stub.suffix": "” lands in a later slice.",

      // ---- Reporting demo: mobile download flyout ----
      "reporting.mobileFlyout.hint": "Table views aren’t available on small screens yet — pick a report below to download it directly.",
      "reporting.mobileFlyout.dialogAriaLabel": "Choose a report to download",

      // ---- Reporting demo: data table column headers (chrome only — the
      // row VALUES under these headers are mocked report data and stay
      // in English everywhere in this demo) ----
      "reporting.table.columnHeader.invoiceNumber": "Invoice #",
      "reporting.table.columnHeader.invoiceDate": "Invoice Date",
      "reporting.table.columnHeader.customerName": "Customer Name",
      "reporting.table.columnHeader.customerNumber": "Customer #",
      "reporting.table.columnHeader.total": "Total ($)",
      "reporting.table.columnHeader.cases": "Cases",
      "reporting.table.columnHeader.weight": "Weight (lb)",
      "reporting.table.columnHeader.productNumber": "Product #",
      "reporting.table.columnHeader.productDescription": "Product Description",
      "reporting.table.columnHeader.sku": "SKU",
      "reporting.table.columnHeader.manufacturer": "Manufacturer Name",
      "reporting.table.columnHeader.storageType": "Storage Type",
      "reporting.table.columnHeader.classNumber": "Class #",
      "reporting.table.columnHeader.classDescription": "Class Description",
      "reporting.table.columnHeader.categoryNumber": "Category #",
      "reporting.table.columnHeader.categoryDescription": "Category Description",
      "reporting.table.columnHeader.groupNumber": "Group #",
      "reporting.table.columnHeader.groupDescription": "Group Description",
      "reporting.table.columnHeader.contractedAmount": "Contracted ($)",
      "reporting.table.columnHeader.contractedPctAmount": "Contracted % ($)",
      "reporting.table.columnHeader.contractedCases": "Contracted Cases",
      "reporting.table.columnHeader.contractedPctCases": "Contracted % (Cases)",
      "reporting.table.columnHeader.dollarsUnit": "$",
      "reporting.table.columnHeader.casesUnit": "Cases",

      // ---- Reporting demo: data table toolbar / pagination ----
      "reporting.table.searchPlaceholder": "Search this report…",
      "reporting.table.searchAriaLabel": "Search this report",
      "reporting.table.downloadCsv": "Download CSV",
      "reporting.table.downloadExcel": "Download Excel",
      "reporting.table.rowSingular": "row",
      "reporting.table.rowPlural": "rows",
      "reporting.table.emptyState": "No rows match the current filters and search.",
      "reporting.pagination.prev": "Prev",
      "reporting.pagination.next": "Next",
      "reporting.pagination.pageWord": "Page",
      "reporting.pagination.ofWord": "of",

      "eventWizard.progress.phase.details": "Details",
      "eventWizard.progress.phase.selection": "Selection",
      "eventWizard.progress.phase.deposit": "Deposit",
      "eventWizard.progress.saveBtn": "Save progress",
      "eventWizard.progress.resetBtn": "Reset",
      "eventWizard.reset.confirm": "Start over from step 1? This clears your current answers.",
      "eventWizard.sublabel.name": "Let's start with you",
      "eventWizard.sublabel.eventType": "What are you planning?",
      "eventWizard.sublabel.date": "Pick your event date",
      "eventWizard.sublabel.guests": "How many guests are you expecting",
      "eventWizard.sublabel.contactBranch": "Let's connect you with a specialist",
      "eventWizard.sublabel.mainVenue": "Choose your venue",
      "eventWizard.sublabel.receptionVenue": "Choose your reception space",
      "eventWizard.sublabel.mood": "What's the mood",
      "eventWizard.sublabel.quote": "Your estimate",
      "eventWizard.sublabel.package": "Choose your package",
      "eventWizard.sublabel.terms": "Terms & conditions",
      "eventWizard.sublabel.checkout": "Review & pay your deposit",
      "eventWizard.sublabel.confirmation": "You're booked!",

      "eventWizard.hero.accent": "— Resort Event Wizard",
      "eventWizard.hero.skipToCheckout": "Skip to checkout (demo)",
      "eventWizard.hero.intro": "A self-serve planning flow for booking a private event at a beachfront resort — weddings, corporate retreats, milestone celebrations, family reunions, and more. Pick a date, browse event and reception venues, choose a package, and reserve with a deposit, without a single phone call.",
      "eventWizard.quickTour.heading": "Quick tour — the happy path",
      "eventWizard.quickTour.step1": "Tell us what you're planning and how many guests.",
      "eventWizard.quickTour.step2": "Pick an available date and browse real venues, priced live.",
      "eventWizard.quickTour.step3": "Get an instant estimate — a package for weddings, straight to your total otherwise.",
      "eventWizard.quickTour.step4": "Reserve with a simulated deposit and see it confirmed in seconds.",
      "eventWizard.hero.chip1.title": "Connected to the PMS",
      "eventWizard.hero.chip1.body": "Property Management System — holds the rooms and event spaces the moment a deposit clears.",
      "eventWizard.hero.chip2.title": "Connected to the CRM",
      "eventWizard.hero.chip2.body": "Customer Relationship Management — gives sales full guest and event context before they ever call.",

      "eventWizard.actions.continue": "Continue →",
      "eventWizard.actions.back": "← Back",
      "eventWizard.common.closeAriaLabel": "Close",

      "eventWizard.step.name.heading": "What's your name?",
      "eventWizard.step.name.sub": "Let's start with you.",
      "eventWizard.step.name.firstNameLabel": "First name *",
      "eventWizard.step.name.firstNamePlaceholder": "e.g. Jamie",
      "eventWizard.step.name.lastNameLabel": "Last name *",
      "eventWizard.step.name.lastNamePlaceholder": "e.g. Rivera",
      "eventWizard.errors.nameRequired": "Please enter both a first and last name.",

      "eventWizard.step.eventType.heading": "What are you planning?",
      "eventWizard.step.eventType.sub": "This helps us tailor the rest of your options.",
      "eventWizard.errors.pleaseChooseEventType": "Please choose an event type.",

      "eventWizard.step.date.heading": "When's your event?",
      "eventWizard.step.date.sub": "Grayed-out days are already booked for a group your size.",
      "eventWizard.calendar.prevAriaLabel": "Previous month",
      "eventWizard.calendar.jumpAriaLabel": "Jump to a month or year",
      "eventWizard.calendar.jumpMonthAriaLabel": "Jump to month",
      "eventWizard.calendar.jumpYearAriaLabel": "Jump to year",
      "eventWizard.calendar.nextAriaLabel": "Next month",
      "eventWizard.calendar.weekday.su": "Su",
      "eventWizard.calendar.weekday.mo": "Mo",
      "eventWizard.calendar.weekday.tu": "Tu",
      "eventWizard.calendar.weekday.we": "We",
      "eventWizard.calendar.weekday.th": "Th",
      "eventWizard.calendar.weekday.fr": "Fr",
      "eventWizard.calendar.weekday.sa": "Sa",
      "eventWizard.calendar.legend.available": "Available",
      "eventWizard.calendar.legend.unavailable": "Already booked",
      "eventWizard.calendar.legend.selected": "Your date",
      "eventWizard.calendar.noDateSelected": "No date selected yet.",
      "eventWizard.calendar.selectedDatePrefix": "Event on",
      "eventWizard.calendar.selectedDateSuffix": "— arrival the night before, departure the morning after.",
      "eventWizard.errors.pleaseChooseDate": "Please pick an available date.",

      "eventWizard.step.guests.heading": "How many guests?",
      "eventWizard.step.guests.sub": "A rough headcount for your event.",
      "eventWizard.guests.fewerAriaLabel": "Fewer guests",
      "eventWizard.guests.label": "guests",
      "eventWizard.guests.moreAriaLabel": "More guests",
      "eventWizard.guests.the1000PlusLabel": "Actually, we're planning for 1,000+ guests",
      "eventWizard.guests.overnightQuestion": "Of those, about how many will stay 3 nights at the resort?",
      "eventWizard.guests.overnightHint": "Arrival night, event night, and the night after.",
      "eventWizard.guests.fewerOvernightAriaLabel": "Fewer overnight guests",
      "eventWizard.guests.overnightLabel": "staying overnight",
      "eventWizard.guests.moreOvernightAriaLabel": "More overnight guests",
      "eventWizard.errors.invalidGuestCount": "Please enter a valid guest count.",

      "eventWizard.step.contactBranch.heading": "Let's plan something big, together",
      "eventWizard.step.contactBranch.sub": "Events of 1,000+ guests get a dedicated planning team instead of a self-serve quote. Save your details, or grab a time on their calendar now.",
      "eventWizard.step.contactBranch.backBtn": "← Change guest count",
      "eventWizard.step.contactBranch.scheduleBtn": "Schedule a call →",

      "eventWizard.step.mainVenue.heading": "Choose your venue",
      "eventWizard.step.mainVenue.sub": "Where your event takes place.",
      "eventWizard.step.mainVenue.wedding.heading": "Choose your ceremony space",
      "eventWizard.step.mainVenue.wedding.sub": "Where you'll say your vows.",
      "eventWizard.step.mainVenue.corporate.heading": "Choose your event space",
      "eventWizard.step.mainVenue.corporate.sub": "Where your event takes place.",
      "eventWizard.step.mainVenue.celebration.heading": "Choose your event space",
      "eventWizard.step.mainVenue.celebration.sub": "Where the celebration happens.",
      "eventWizard.step.mainVenue.reunion.heading": "Choose your gathering space",
      "eventWizard.step.mainVenue.reunion.sub": "Where everyone comes together.",
      "eventWizard.errors.pleaseChooseMainVenue": "Please choose a venue.",

      "eventWizard.step.receptionVenue.heading": "Choose your reception space",
      "eventWizard.step.receptionVenue.sub": "Where you'll gather afterward.",
      "eventWizard.errors.pleaseChooseReceptionVenue": "Please choose a reception space.",

      "eventWizard.venueCard.upToPrefix": "Up to",
      "eventWizard.venueCard.guestsWord": "guests",
      "eventWizard.venueCard.feeSuffix": "venue fee",

      "eventWizard.step.mood.heading": "What's the mood?",
      "eventWizard.step.mood.sub": "Pick the mood that feels most like you.",
      "eventWizard.errors.pleaseChooseMood": "Please choose a mood.",
      "eventWizard.step.mood.nextBtn": "See my estimate →",

      "eventWizard.step.quote.heading": "Your estimate",
      "eventWizard.step.quote.sub": "Pick a package next to see your final total.",
      "eventWizard.step.quote.subFinal": "This is your total estimate.",
      "eventWizard.step.quote.nextBtn": "Choose a package →",
      "eventWizard.step.quote.nextBtnFinal": "Continue to terms →",
      "eventWizard.quote.roomNightsLabel": "Room nights",
      "eventWizard.quote.roomsWord": "rooms",
      "eventWizard.quote.nightsWord": "nights",
      "eventWizard.quote.guestServiceFeeLabel": "Guest service fee",
      "eventWizard.quote.venueConfigLabel": "Venue configuration (event + reception)",
      "eventWizard.quote.venueConfigLabelSingle": "Venue configuration",
      "eventWizard.quote.estimateSubtotal": "Estimate subtotal",

      "eventWizard.step.package.heading": "Choose your package",
      "eventWizard.step.package.sub": "Every package is priced per guest, on top of your estimate.",
      "eventWizard.errors.pleaseChoosePackage": "Please choose a package.",
      "eventWizard.step.package.nextBtn": "Continue to terms →",
      "eventWizard.package.perGuestSuffix": "/ guest",
      "eventWizard.package.costForWord": "for",
      "eventWizard.package.costGuestsWord": "guests",
      "eventWizard.package.perGuestSectionLabel": "Per guest",
      "eventWizard.package.includedOnceLabel": "Included once",
      "eventWizard.finalTotal.label": "Your final total",

      "eventWizard.step.terms.heading": "Terms & conditions",
      "eventWizard.step.terms.sub": "The short version — plain language, no fine print.",
      "eventWizard.terms.bullet1": "Your $1,500 deposit holds your date and venue for 5 days.",
      "eventWizard.terms.bullet2": "The balance is due within those same 5 days, or the hold may be released.",
      "eventWizard.terms.bullet3": "Guest counts and venue selections can be adjusted up to 30 days before the event.",
      "eventWizard.terms.bullet4": "Cancel more than 90 days out for a full refund; inside 90 days, the deposit isn't refundable.",
      "eventWizard.terms.bullet5": "All prices here are estimates and will be finalized with your event specialist.",
      "eventWizard.terms.acceptCheckbox": "I've read and accept these terms",
      "eventWizard.errors.pleaseAcceptTerms": "Please accept the terms to continue.",
      "eventWizard.step.terms.nextBtn": "Continue to checkout →",

      "eventWizard.step.checkout.heading": "Review & pay your deposit",
      "eventWizard.step.checkout.sub": "Here's everything, in one place.",
      "eventWizard.checkout.paymentHeading": "Payment",
      "eventWizard.checkout.simulatedNote": "Simulated payment — no real card is charged.",
      "eventWizard.checkout.saveRequiredNote": "Save your progress first — that's how your specialist follows up.",
      "eventWizard.checkout.expiryMonthAriaLabel": "Expiry month",
      "eventWizard.checkout.expiryYearAriaLabel": "Expiry year",
      "eventWizard.checkout.expiryMonthPlaceholder": "MM",
      "eventWizard.checkout.expiryYearPlaceholder": "YYYY",
      "eventWizard.checkout.cardNameLabel": "Name on card *",
      "eventWizard.checkout.cardNamePlaceholder": "e.g. Jamie Rivera",
      "eventWizard.checkout.cardNumberLabel": "Card number *",
      "eventWizard.checkout.expiryLabel": "Expiry *",
      "eventWizard.checkout.cvvLabel": "CVV *",
      "eventWizard.errors.paymentFieldsRequired": "Please fill in all payment fields.",
      "eventWizard.errors.cardNameRequired": "Enter the name on the card.",
      "eventWizard.errors.cardNumberInvalid": "Enter a valid card number.",
      "eventWizard.errors.cardExpiryRequired": "Select an expiry month and year.",
      "eventWizard.errors.cardCvvInvalid": "Enter a valid CVV.",

      "eventWizard.orderSummary.heading": "Order summary",
      "eventWizard.orderSummary.guestsTotalWord": "total",
      "eventWizard.orderSummary.guestsStayingSuffix": "staying 3 nights",
      "eventWizard.orderSummary.contactName": "Contact name",
      "eventWizard.orderSummary.eventDate": "Event date",
      "eventWizard.orderSummary.guests": "Guests",
      "eventWizard.orderSummary.mainEventSpace": "Main event space",
      "eventWizard.orderSummary.ceremonySpace": "Ceremony space",
      "eventWizard.orderSummary.eventSpace": "Event space",
      "eventWizard.orderSummary.receptionSpace": "Reception space",
      "eventWizard.orderSummary.mood": "Mood",
      "eventWizard.orderSummary.package": "Package",
      "eventWizard.orderSummary.packageCost": "Package cost",
      "eventWizard.orderSummary.finalTotal": "Final total",
      "eventWizard.orderSummary.depositDueNow": "Deposit due now",
      "eventWizard.orderSummary.balanceDueLater": "Balance due later",

      "eventWizard.confirmation.defaultSubtext": "An event specialist will reach out shortly to confirm your booking.",
      "eventWizard.confirmation.balanceDueLabel": "Balance due",
      "eventWizard.confirmation.heldHint": "Your date and venue are held for:",
      "eventWizard.confirmation.scheduleCallBtn": "Schedule a call with your specialist",
      "eventWizard.confirmation.bookedSuffix": ", you're booked!",
      "eventWizard.countdown.days": "days",
      "eventWizard.countdown.hours": "hrs",
      "eventWizard.countdown.minutes": "min",
      "eventWizard.countdown.seconds": "sec",

      "eventWizard.saveFlyout.ariaLabel": "Save your progress",
      "eventWizard.saveFlyout.heading": "Save your progress",
      "eventWizard.saveFlyout.requiredNote": "Save to continue — this is required before paying your deposit.",
      "eventWizard.saveFlyout.body": "We'll keep your quote ready. Leave an email or a cell number and we can pick up right where you left off.",
      "eventWizard.saveFlyout.emailLabel": "Email",
      "eventWizard.saveFlyout.emailPlaceholder": "you@email.com",
      "eventWizard.saveFlyout.orDivider": "— or —",
      "eventWizard.saveFlyout.countryCodeLabel": "Country code",
      "eventWizard.saveFlyout.countryCodePlaceholder": "+52",
      "eventWizard.saveFlyout.cellPhoneLabel": "Cell phone",
      "eventWizard.saveFlyout.cellPhonePlaceholder": "998 123 4567",
      "eventWizard.saveFlyout.agreePrefix": "I agree to the",
      "eventWizard.saveFlyout.privacyPolicyLinkText": "privacy policy",
      "eventWizard.errors.saveProgress": "Please provide a valid email, or a phone number with country code.",
      "eventWizard.errors.saveContactMissing": "Enter an email or phone number.",
      "eventWizard.errors.saveEmailFormat": "That email doesn't look right.",
      "eventWizard.errors.saveCountryCodeMissing": "Add a country code, e.g. +52.",
      "eventWizard.errors.savePhoneFormat": "Enter a valid phone number.",
      "eventWizard.errors.savePrivacyRequired": "Check the box to accept the privacy policy.",
      "eventWizard.saveFlyout.saveBtn": "Save my progress",
      "eventWizard.saveFlyout.savedConfirmation": "Saved! We've sent a link to pick up right where you left off.",

      "eventWizard.privacyModal.ariaLabel": "Privacy policy",
      "eventWizard.privacyModal.heading": "Privacy policy (demo)",
      "eventWizard.privacyModal.p1": "This is a simulated policy for a portfolio demo — nothing you enter here is stored or sent anywhere.",
      "eventWizard.privacyModal.p2": "In the real product, this section would plainly cover: what we collect (your name, contact info, and event details), why (to hold your date and follow up about your event), who sees it (your assigned event specialist and the resort's booking team), and how to have it deleted at any time by contacting us directly.",

      "eventWizard.scheduleModal.ariaLabel": "Schedule a call",
      "eventWizard.scheduleModal.heading": "Schedule a call",
      "eventWizard.scheduleModal.hint": "Pick a time that works for you (simulated — like a Calendly booking).",
      "eventWizard.errors.pleaseChooseTimeSlot": "Please pick a time slot.",
      "eventWizard.scheduleModal.cancelBtn": "Cancel",
      "eventWizard.scheduleModal.confirmBtn": "Confirm time",
      "eventWizard.resetModal.ariaLabel": "Start over",
      "eventWizard.resetModal.heading": "Start over?",
      "eventWizard.resetModal.body": "This clears your current answers and takes you back to step 1.",
      "eventWizard.resetModal.cancelBtn": "Cancel",
      "eventWizard.resetModal.confirmBtn": "Start over",
      "eventWizard.scheduleSlot.morningTime": "10:00 AM",
      "eventWizard.scheduleSlot.afternoonTime": "3:00 PM",
      "eventWizard.scheduleConfirm.prefix": "Call scheduled for",
      "eventWizard.scheduleConfirm.suffix": ". We'll send a calendar invite to your saved contact.",

      "eventWizard.data.eventType.wedding.name": "Wedding",
      "eventWizard.data.eventType.wedding.description": "Ceremony and reception for you and your guests",
      "eventWizard.data.eventType.corporate.name": "Corporate event",
      "eventWizard.data.eventType.corporate.description": "Meetings, retreats, launches, or team celebrations",
      "eventWizard.data.eventType.celebration.name": "Milestone celebration",
      "eventWizard.data.eventType.celebration.description": "Birthdays, anniversaries, quinceañeras, and more",
      "eventWizard.data.eventType.reunion.name": "Family reunion / other gathering",
      "eventWizard.data.eventType.reunion.description": "Any other private event for your group",

      "eventWizard.data.space.palapa.tagline": "Oceanfront elegance at the water's edge",
      "eventWizard.data.space.palapa.feature.0": "Oceanfront setting, steps from the sand",
      "eventWizard.data.space.palapa.feature.1": "Natural palapa shade structure",
      "eventWizard.data.space.palapa.feature.2": "Best for sunset events (4–6pm)",
      "eventWizard.data.space.palapa.feature.3": "White folding chairs included",
      "eventWizard.data.space.jardin.tagline": "Celebrate under a garden canopy",
      "eventWizard.data.space.jardin.feature.0": "Manicured tropical garden setting",
      "eventWizard.data.space.jardin.feature.1": "Stone fountain backdrop",
      "eventWizard.data.space.jardin.feature.2": "String-light canopy overhead",
      "eventWizard.data.space.jardin.feature.3": "Covered arbor for shade",
      "eventWizard.data.space.terraza.tagline": "Sunset views above the coastline",
      "eventWizard.data.space.terraza.feature.0": "Rooftop terrace with panoramic ocean views",
      "eventWizard.data.space.terraza.feature.1": "Open-air, best after 5pm",
      "eventWizard.data.space.terraza.feature.2": "Built-in ambient lighting",
      "eventWizard.data.space.terraza.feature.3": "Room for a live trio or quartet",

      "eventWizard.data.reception.salon.tagline": "Oceanview ballroom with room to dance",
      "eventWizard.data.reception.salon.feature.0": "Floor-to-ceiling ocean-view windows",
      "eventWizard.data.reception.salon.feature.1": "Air-conditioned indoor ballroom",
      "eventWizard.data.reception.salon.feature.2": "Built-in dance floor & staging",
      "eventWizard.data.reception.salon.feature.3": "Flexible round or long-table layouts",
      "eventWizard.data.reception.patio.tagline": "Open-air dinner under swaying palms",
      "eventWizard.data.reception.patio.feature.0": "Open-air, palm-shaded courtyard",
      "eventWizard.data.reception.patio.feature.1": "String lights strung overhead",
      "eventWizard.data.reception.patio.feature.2": "Outdoor dance floor add-on available",
      "eventWizard.data.reception.patio.feature.3": "Tropical, casual-elegant atmosphere",
      "eventWizard.data.reception.terrazaGrand.tagline": "Indoor-outdoor flexibility, any season",
      "eventWizard.data.reception.terrazaGrand.feature.0": "Retractable roof for weather flexibility",
      "eventWizard.data.reception.terrazaGrand.feature.1": "Panoramic coastline views",
      "eventWizard.data.reception.terrazaGrand.feature.2": "Largest-capacity reception space",
      "eventWizard.data.reception.terrazaGrand.feature.3": "Built-in bar and lounge areas",

      "eventWizard.data.mood.barefoot.description": "Relaxed beachfront elegance — whites, blues, and bare feet in the sand.",
      "eventWizard.data.mood.tropical.description": "Lush greenery, blush and gold tones, candlelight after dark.",
      "eventWizard.data.mood.classic.description": "Refined and timeless — ivory, champagne, and traditional florals.",
      "eventWizard.data.mood.modern.description": "Clean lines, a neutral palette, and sculptural floral moments.",
      "eventWizard.data.mood.fiesta.description": "Bold color, papel picado, and a party that doesn't stop.",
      "eventWizard.data.mood.boho.description": "Rustic-chic with earthy tones, macramé, and wildflowers.",

      "eventWizard.data.package.essential.perGuestInclude.0": "Plated 3-course dinner, one entrée choice",
      "eventWizard.data.package.essential.perGuestInclude.1": "House wine & beer bar, 4 hours",
      "eventWizard.data.package.essential.perGuestInclude.2": "Welcome mocktail on arrival",
      "eventWizard.data.package.essential.flatExtra.0": "DJ & basic sound system",
      "eventWizard.data.package.essential.flatExtra.1": "Standard floral centerpieces",
      "eventWizard.data.package.essential.flatExtra.2": "Day-of coordinator",
      "eventWizard.data.package.premium.perGuestInclude.0": "Plated 3-course dinner, two entrée choices",
      "eventWizard.data.package.premium.perGuestInclude.1": "Premium open bar with top-shelf tequila & mezcal, 5 hours",
      "eventWizard.data.package.premium.perGuestInclude.2": "Welcome cocktail, hand-passed at arrival",
      "eventWizard.data.package.premium.flatExtra.0": "Live trio during cocktail hour + DJ for the reception",
      "eventWizard.data.package.premium.flatExtra.1": "Elevated floral design",
      "eventWizard.data.package.premium.flatExtra.2": "Dedicated event coordinator",
      "eventWizard.data.package.premium.flatExtra.3": "Sparkler send-off",
      "eventWizard.data.package.luxury.perGuestInclude.0": "Chef's tasting menu + interactive food stations",
      "eventWizard.data.package.luxury.perGuestInclude.1": "Top-shelf open bar, 6 hours, plus a champagne toast",
      "eventWizard.data.package.luxury.perGuestInclude.2": "Welcome cocktail + late-night snack",
      "eventWizard.data.package.luxury.flatExtra.0": "Live band + DJ",
      "eventWizard.data.package.luxury.flatExtra.1": "Custom floral design & lounge furniture",
      "eventWizard.data.package.luxury.flatExtra.2": "Full event production team",
      "eventWizard.data.package.luxury.flatExtra.3": "Private after-party space",
      "eventWizard.data.package.luxury.flatExtra.4": "Fireworks show over the water"
    },

    es: {
      "nav.home": "Inicio",
      "nav.experience": "Experiencia",
      "nav.contact": "Contacto",
      "nav.linkedinAriaLabel": "Antonio Osuna en LinkedIn",
      "nav.toggleAriaLabel": "Mostrar u ocultar el menú de navegación",

      "hero.greetingPrefix": "¡Hola! Soy",
      // Confirmed with Antonio: role titles stay in English in both
      // languages — his Spanish CV keeps "Product Owner | Product
      // Management | Business Analysis" untranslated in the header too.
      "hero.srRoles": "Product Owner, Product Manager, Business Analyst",

      "summary.heading": "Resumen profesional",
      "summary.p1": "Product Owner con enfoque de Product Management y una sólida base en Análisis de Negocio. Transformo objetivos de negocio en requerimientos claros, equipos alineados y productos digitales intuitivos, generando un entendimiento compartido desde la idea hasta la entrega.",
      "summary.p2": "Actualmente radicado en Cancún, MX. Abierto a reubicación.",

      "education.heading": "Educación",
      "education.verifyLink": "Verificar mis credenciales →",
      "education.degreeTitle": "Ingeniería en Informática y Negocios Digitales",
      "education.meta": "Universidad Anáhuac Mayab · Mérida, MX · Ago 2016 – Jun 2020",
      "volunteer.heading": "Roles de voluntariado",
      "volunteer.item1": "Presidente de la Sociedad de Alumnos de la Escuela de Ingeniería",
      "volunteer.item2": "Director de Operaciones en Genera",
      "volunteer.item3": "Project Manager en Gente Nueva",
      "volunteer.item4": "Frontend Developer en Gente Nueva",

      "certCard.heading": "Certificaciones y desarrollo profesional",
      // Certification/program names are proper nouns — same in both
      // languages unless the Spanish CV says otherwise (Slice 9).
      "cert.name1": "AI for Product Owners",
      "cert.name2": "Software Product Management Proficiency",
      "cert.name3": "Google Foundations of Project Management",
      "cert.name4": "IBM AI Product Manager",
      "cert.name5": "PSPO I (Professional Scrum Product Owner)",
      "cert.inProgress": "En curso",

      "skills.heading": "Habilidades y herramientas",
      "skills.groupCore": "Habilidades principales",
      "skills.groupCollab": "Producto y colaboración",
      "skills.groupAnalytics": "Analítica y datos",
      "skills.groupAI": "IA y automatización",
      "skills.groupTech": "Fundamentos técnicos",
      "skills.core1": "Product Ownership, Product Management y Análisis de Negocio",
      "skills.core2": "Alineación de stakeholders y definición de requerimientos",
      "skills.core3": "Entrega ágil de producto: Scrum, SAFe y PI Planning",
      "skills.core4": "Product Discovery, documentación y entrega con apoyo de IA",

      "roles.heading": "Experiencia laboral",

      "roles.r1.title": "Consultor de Productos Digitales",
      "roles.r1.meta": "Urso Core · Cancún, MX · May 2026 – Presente",
      "roles.r1.summary": "Trabajo de consultoría independiente para ayudar a pequeñas empresas a definir, desarrollar y mejorar productos digitales, sitios web, flujos de trabajo habilitados por IA y sistemas orientados al crecimiento.",
      "roles.r1.b1": "Traduzco necesidades de negocio en requerimientos claros, flujos de usuario, alcance y planes de implementación.",
      "roles.r1.b2": "Desarrollo y publico sitios web y experiencias digitales utilizando SEO, datos estructurados, analítica, HTML, CSS, JavaScript y herramientas CMS.",
      "roles.r1.b3": "Trabajo directamente con propietarios de negocios para priorizar el alcance, evaluar ventajas, y llevar los proyectos desde la idea hasta el lanzamiento.",

      // Title kept in English on purpose — matches the Spanish CV, which
      // leaves this one untranslated.
      "roles.r2.title": "Product Owner / Senior Business Analyst — eCommerce Ordering & Reporting",
      "roles.r2.meta": "HCLTech · Monterrey, MX · Sep 2024 – May 2026",
      "roles.r2.summary": "Lideré el Producto y análisis de negocio para una nueva plataforma de Reportes de eCommerce, desarrollada desde cero para reemplazar Legacy Oracle BI, colaborando con Product Management, UX, Ingenieros de Datos, Arquitectos, QA, IT Support, Customer Experience, SMEs de eCommerce y stakeholders de Ventas (Nacional), atendiendo tanto a usuarios internos como a externos.",
      "roles.r2.b1": "Lideré el análisis de brechas entre Legacy Oracle BI y la nueva plataforma de Reportes, traduciendo necesidades de negocio en historias de usuario en Jira, criterios de aceptación, flujos UI/UX, requerimientos de datos y documentación funcional en Confluence.",
      "roles.r2.b2": "Gestioné la preparación del backlog durante sprints de 2 semanas y ciclos trimestrales de Planeación, asegurando que el equipo de desarrollo contara con trabajo refinado, priorizado y con dependencias identificadas hasta con 3 meses de anticipación.",
      "roles.r2.b3": "Colaboré con UX, Product Management, Tech Leads, Arquitectos e Ingenieros de Datos para crear mockups y validarlos con liderazgo, definir requerimientos de datos para Reportes y apoyar el diseño de dashboards y soluciones.",
      "roles.r2.b4": "Impulsé la adopción por parte de usuarios de negocio y la mejora continua durante la transición de Legacy Oracle BI mediante notas de actualización, documentación funcional, capacitación a IT Support, revisiones de Adobe Analytics, análisis de feedback y presentaciones estructuradas de hallazgos.",
      "roles.r2.b5": "Utilicé datos de adopción, feedback de soporte y sesiones de presentación con stakeholders para identificar brechas, llevar nuevos requerimientos al liderazgo, repriorizar el trabajo y convertir rápidamente mejoras de alto impacto en mockups, historias, refinamiento y planeación.",
      "roles.r2.b6": "Me desempeñé como Project Reporting Manager para integrantes de los equipos de BA, Product y UX de HCLTech asignados a la cuenta, apoyando procesos operativos, reportes administrativos, comunicación con liderazgo y ejecución de la cuenta.",

      "roles.r3.title": "Representante de Ventas — Viajes & Hotelería",
      "roles.r3.meta": "Playa Hotels & Resorts · Cancún, MX · Feb 2024 – Ago 2024",
      "roles.r3.summary": "Representante de ventas para un club vacacional de alta gama, enfocado en generar confianza y comunicar de manera persuasiva. Trabajé en un entorno de alta presión y orientado a metas que requería adaptabilidad, empatía y la capacidad de identificar los principales motivadores de compra mediante un proceso estructurado de discovery.",
      "roles.r3.b1": "Realicé sesiones de discovery a profundidad para identificar las necesidades y motivadores emocionales de los clientes, adaptando las propuestas de venta según cada caso.",
      "roles.r3.b2": "Realicé presentaciones de venta persuasivas alineadas con los valores del cliente, los beneficios del producto y los factores de urgencia.",
      "roles.r3.b3": "Me desempeñé eficazmente bajo presión en un entorno acelerado, cumpliendo consistentemente con las expectativas de venta mediante preparación y generación de confianza.",

      "roles.r4.title": "Product Manager / Analista de Negocio — EdTech & Plataformas Internas",
      "roles.r4.meta": "Red de Colegios Semper Altius · CDMX, MX · Nov 2021 – Nov 2023",
      "roles.r4.summary": "Lideré la entrega de productos digitales, la modernización de herramientas internas y el Business Analysis para una red educativa nacional con más de 70 campus y más de 90,000 estudiantes y colaboradores. Actué como único responsable del lado del cliente para producto y análisis, a cargo del levantamiento de requerimientos, gestión de proveedores, entrega de plataformas, alineación de stakeholders y capacitación.",
      "roles.r4.b1": "Dirigí tres importantes iniciativas de desarrollo de software desde discovery hasta el lanzamiento, gestionando requerimientos, selección de proveedores, contratos, tiempos de entrega y adopción posterior al lanzamiento.",
      "roles.r4.b2": "Colaboré con stakeholders de distintas áreas para traducir necesidades institucionales en requerimientos de producto accionables.",
      "roles.r4.b3": "Impartí onboarding a usuarios y generé documentación; administré el CMS y apoyé la operación nacional de Microsoft 365 en los distintos campus.",

      "roles.r5.title": "Customer Service Coordinator — Alimentos / Cadena de Suministro",
      "roles.r5.meta": "Harbar LLC · Remoto · Sep 2020 – Nov 2021",
      "roles.r5.summary": "Coordiné operaciones de servicio para un fabricante de alimentos con sede en Estados Unidos y clientes importantes del sector retail. Lideré la documentación, optimización de sistemas y mejora de procesos entre las áreas de servicio al cliente, operaciones y finanzas.",
      "roles.r5.b1": "Gestioné sistemas EDI, ERP y CRM para más de 110 cuentas, optimizando procesos para clientes como Trader Joe’s, Walmart y proveedores del Gobierno de Estados Unidos.",
      "roles.r5.b2": "Creé protocolos comerciales y documentación interdepartamental que mejoraron la velocidad del procesamiento de pedidos y la precisión operativa.",
      "roles.r5.b3": "Lideré el primer cierre financiero mensual puntual de la empresa; di soporte a un volumen anual de pedidos superior a USD 40 millones, manteniendo una alta calidad de servicio.",

      "roles.r6.title": "Analista de Negocio — Alimentos / Logística",
      "roles.r6.meta": "Caiman Products · Yucatán, MX · Jul 2019 – Jul 2020",
      "roles.r6.summary": "Lideré el desarrollo de un sistema de Business Intelligence para un distribuidor de productos del mar. Combiné análisis técnico, optimización de procesos y modelado de datos para mejorar la eficiencia de las operaciones.",
      "roles.r6.b1": "Diseñé e implementé un sistema centralizado que redujo los reportes manuales y la dependencia de Excel.",
      "roles.r6.b2": "Generé ahorros de más de 20 horas por semana mediante la automatización del sistema.",
      "roles.r6.b3": "Reduje la infraestructura física en 35% mediante una migración a la nube y mejoré los procesos de envío en el mismo día.",

      "contact.heading": "Contacto",
      "contact.intro": "¿Interesado en trabajar juntos? Conectemos.",
      "contact.linkedin": "Conectar en LinkedIn",
      "contact.downloadCv": "Descargar CV",
      "contact.downloadCvHref": "assets/AntonioOsuna%20CV(ES).pdf",

      "whatsapp.ariaLabel": "Chatear por WhatsApp",
      "whatsapp.message": "Vi tu perfil, ¡conversemos!",

      "credentials.title": "Credenciales",
      "credentials.intro": "Esta página verifica todo lo referenciado en mi portafolio y CV: mi título y cédula profesional, además de cada certificación — obtenidas y en curso.",
      "credentials.degreeHeading": "Licenciatura",
      "credentials.degreeMeta": "Ingeniería en Informática y Negocios Digitales · Universidad Anáhuac Mayab · Mérida, MX",
      "credentials.cedulaLabel": "Cédula profesional:",
      "credentials.verifyLink": "Verificar en el portal de la SEP →",
      "credentials.note": "El portal de la SEP no genera un enlace directo a resultados individuales — busca con el número de cédula indicado arriba.",
      "credentials.earnedHeading": "Certificaciones obtenidas",
      "credentials.inProgressHeading": "En curso",
      "credentials.viewCredential": "Ver credencial →",
      "credentials.viewProgram": "Ver programa →",

      "demosPage.title": "Demos reales",
      "demosPage.intro": "Recreaciones interactivas de productos reales que he desarrollado — simplificadas y sin marca, pero con funcionalidad genuina. Ve directo a una de ellas abajo.",
      "demosPage.nav.reporting": "Herramienta de reportes",
      "demosPage.nav.eventWizard": "Asistente de eventos",
      "demosPage.nav.inventory": "Inventario y gestión de pedidos",

      "demos.comingSoon": "Próximamente",
      "demos.constructionLabel": "En construcción",
      "demos.constructionPageMessage": "Este demo interactivo está en desarrollo — vuelve pronto.",
      "demos.backToDemos": "← Volver a demos reales",
      "demos.viewDemoCta": "Ver demo →",

      "demos.reporting.title": "Herramienta de reportes",
      "demos.reporting.description": "Una experiencia de reportes embebida que recrea una herramienta que ayudé a construir para una plataforma nacional de eCommerce — dashboards, secciones de reportes navegables, ordenamiento, búsqueda y exportación, todo sin salir de la página.",

      "demos.eventWizard.title": "Asistente de eventos del resort",
      "demos.eventWizard.description": "Un asistente de autoservicio para planear eventos privados en un resort — elige una fecha, explora espacios para el evento y la recepción, elige un paquete y reserva con un depósito, paso a paso.",

      "demos.inventory.title": "Sistema de inventario y gestión de pedidos",
      "demos.inventory.description": "Una herramienta de recepción de materia prima, inventario y ventas que ayudé a diseñar para un exportador de mariscos — reemplazando un proceso lento de ERP que costaba ventas reales y sensibles al tiempo.",

      // ---- Inventory demo: shared across hub/reception/sales ----
      "inventory.common.viewAsAdmin": "Ver como administrador",
      "inventory.common.inProgress": "En progreso",
      "inventory.common.products": "Productos",
      "inventory.common.addProductBtn": "+ Agregar producto",
      "inventory.common.addProductSaveBtn": "Agregar producto",
      "inventory.common.addProductModalTitle": "Agregar producto",
      "inventory.common.productEmptyNote": "Aún no se han agregado productos — agrega al menos uno para continuar.",
      "inventory.common.backToHub": "← Volver a Inventario y Gestión de Pedidos",
      "inventory.common.cancelBtn": "Cancelar",
      "inventory.common.createBtn": "Crear",
      "inventory.common.closeAriaLabel": "Cerrar",
      "inventory.common.todayPrefix": "Hoy",
      "inventory.common.productSingular": "producto",
      "inventory.common.productPlural": "productos",
      "inventory.common.daySingular": "día",
      "inventory.common.dayPlural": "días",

      // ---- Inventory demo: module hub (index.html) ----
      "inventory.hub.intro": "El marisco fresco de la península de Yucatán se pescaba, procesaba y muchas veces se vendía y enviaba por avión a compradores en Estados Unidos en cuestión de horas — pero los datos detrás de esto vivían en un ERP lento y manual. Como analista de negocio, trabajé con un ingeniero industrial para diseñar un sistema más ágil para la recepción, el inventario y las ventas.",
      "inventory.quickTour.heading": "Recorrido rápido — el camino ideal",
      "inventory.quickTour.step1": "Registra la llegada de un camión en Recepción — especie, tamaño y cantidad.",
      "inventory.quickTour.step2": "Consulta el inventario real y actualizado antes de armar un pedido de Ventas.",
      "inventory.quickTour.step3": "Ve el costo y margen de cada pedido mientras lo armas.",
      "inventory.quickTour.step4": "Todo se actualiza al instante — se acabó la espera de un ERP lento.",
      "inventory.hub.diagram.ariaLabel": "Diagrama del proceso: Recepción, luego Venta, luego Envío. La transición de Recepción a Venta solía ser un cuello de botella lento y manual que costaba ventas.",
      "inventory.hub.diagram.step1.title": "Recepción",
      "inventory.hub.diagram.step1.desc": "La pesca fresca llega, se clasifica por especie y tamaño, y se almacena rápidamente.",
      "inventory.hub.diagram.step2.title": "Venta",
      "inventory.hub.diagram.step2.desc": "Ventas ve lo que realmente está disponible y registra el pedido al instante.",
      "inventory.hub.diagram.step3.title": "Envío",
      "inventory.hub.diagram.step3.desc": "El pedido se empaca y se envía por avión el mismo día — a veces en la misma hora.",
      "inventory.hub.bottleneck.label": "El cuello de botella anterior:",
      "inventory.hub.bottleneck.text": "el producto esperaba mientras alguien lo capturaba a mano en un ERP lento — horas que costaban ventas reales y sensibles al tiempo.",
      "inventory.hub.modulesHeading": "2 módulos",
      "inventory.hub.card1.title": "Recepción de materia prima",
      "inventory.hub.card1.desc": "Registra cada camión en cuanto llega — proveedor, productos, cantidades y almacenamiento — en el momento en que entra.",
      "inventory.hub.card2.title": "Ventas",
      "inventory.hub.card2.desc": "Consulta el inventario disponible y arma un pedido de venta en minutos, no en horas.",
      "inventory.hub.card.cta": "Abrir módulo →",

      // ---- Inventory demo: Reception module (reception.html/.js) ----
      "inventory.reception.hub.heading": "Recepción de Materia Prima",
      "inventory.reception.hub.newReceptionBtn": "+ Nueva recepción",
      "inventory.reception.hub.inProgressEmpty": "Aún no hay recepciones en progreso hoy.",
      "inventory.reception.hub.finishedHeading": "Recepciones finalizadas",
      "inventory.reception.hub.finishedEmpty": "Aún no hay recepciones finalizadas hoy.",

      "inventory.reception.detail.backBtn": "← Volver a las recepciones de hoy",
      "inventory.reception.detail.addFinalDetailsBtn": "Agregar detalles finales",
      "inventory.reception.detail.finalDetailsHint": "Agrega al menos un producto con al menos una carga primero.",
      "inventory.reception.detail.finalDetailsHeading": "Detalles finales",
      "inventory.reception.detail.avgTempLabel": "Temperatura promedio",
      "inventory.reception.detail.shelfLifeLabel": "Vida de anaquel",
      "inventory.reception.detail.editFinalDetailsNote": "Viendo como administrador — aún puedes agregar productos y cargas a esta recepción finalizada.",
      "inventory.reception.detail.noLoadsYet": "Aún no hay cargas — agrega al menos una.",
      "inventory.reception.detail.addLoadBtn": "+ Agregar carga",
      "inventory.reception.detail.driverLabel": "Chofer",
      "inventory.reception.detail.platesLabel": "Placas",
      "inventory.reception.detail.startedLabel": "Iniciada",

      "inventory.reception.status.finished": "Finalizada",

      "inventory.reception.modal.newReception.title": "Nueva recepción",
      "inventory.reception.modal.newReception.arrivalLotLabel": "Lote de llegada",
      "inventory.reception.modal.newReception.providerLabel": "Proveedor *",
      "inventory.reception.modal.newReception.portLabel": "Puerto *",
      "inventory.reception.modal.newReception.vesselLabel": "Embarcación *",
      "inventory.reception.modal.newReception.driverLabel": "Chofer de entrega *",
      "inventory.reception.modal.newReception.platesLabel": "Placas del vehículo *",
      "inventory.reception.modal.newReception.platesPlaceholder": "p. ej. YUC-4521",
      "inventory.reception.modal.newReception.startTimeLabel": "Hora de inicio",
      "inventory.reception.modal.newReception.errorMsg": "Por favor completa todos los campos.",
      "inventory.reception.modal.newReception.providerPlaceholder": "Selecciona un proveedor…",
      "inventory.reception.modal.newReception.selectProviderFirst": "Selecciona primero un proveedor…",
      "inventory.reception.modal.newReception.portPlaceholder": "Selecciona un puerto…",
      "inventory.reception.modal.newReception.vesselPlaceholder": "Selecciona una embarcación…",
      "inventory.reception.modal.newReception.driverPlaceholder": "Selecciona un chofer…",

      "inventory.reception.modal.addProduct.productLabel": "Producto",
      "inventory.reception.modal.addProduct.familyLabel": "Familia *",
      "inventory.reception.modal.addProduct.groupLabel": "Grupo *",
      "inventory.reception.modal.addProduct.speciesLabel": "Especie *",
      "inventory.reception.modal.addProduct.sizeLabel": "Tamaño *",
      "inventory.reception.modal.addProduct.qualityLabel": "Calidad *",
      "inventory.reception.modal.addProduct.errorMsg": "Por favor completa todos los campos.",
      "inventory.reception.modal.addProduct.duplicateError": "Este producto exacto ya está en esta recepción — agrega una carga en su lugar.",
      "inventory.reception.modal.addProduct.previewPlaceholder": "Selecciona una familia para comenzar…",
      "inventory.reception.modal.addProduct.familyPlaceholder": "Selecciona una familia…",
      "inventory.reception.modal.addProduct.selectFamilyFirst": "Selecciona primero una familia…",
      "inventory.reception.modal.addProduct.selectGroupFirst": "Selecciona primero un grupo…",
      "inventory.reception.modal.addProduct.selectSpeciesFirst": "Selecciona primero una especie…",
      "inventory.reception.modal.addProduct.selectSizeFirst": "Selecciona primero un tamaño…",
      "inventory.reception.modal.addProduct.groupPlaceholder": "Selecciona un grupo…",
      "inventory.reception.modal.addProduct.speciesPlaceholder": "Selecciona una especie…",
      "inventory.reception.modal.addProduct.sizePlaceholder": "Selecciona un tamaño…",
      "inventory.reception.modal.addProduct.qualityPlaceholder": "Selecciona una calidad…",

      "inventory.reception.modal.addLoad.title": "Agregar carga",
      "inventory.reception.modal.addLoad.kgLabel": "Kilogramos *",
      "inventory.reception.modal.addLoad.kgPlaceholder": "p. ej. 120.5",
      "inventory.reception.modal.addLoad.toteLabel": "Tote *",
      "inventory.reception.modal.addLoad.toteHint": "Solo se muestran los totes vacíos o que ya contienen este producto exacto, para evitar contaminación cruzada.",
      "inventory.reception.modal.addLoad.errorMsg": "Por favor completa todos los campos.",
      "inventory.reception.modal.addLoad.saveBtn": "Agregar carga",
      "inventory.reception.modal.addLoad.totePlaceholder": "Selecciona un tote…",
      "inventory.reception.modal.addLoad.toteHoldsProduct": " (ya contiene este producto)",
      "inventory.reception.modal.addLoad.toteEmpty": " (vacío)",

      "inventory.reception.modal.finalDetails.title": "Agregar detalles finales",
      "inventory.reception.modal.finalDetails.avgTempLabel": "Temperatura promedio (°C) *",
      "inventory.reception.modal.finalDetails.avgTempPlaceholder": "p. ej. 2.5",
      "inventory.reception.modal.finalDetails.shelfLifeLabel": "Vida de anaquel (días) *",
      "inventory.reception.modal.finalDetails.shelfLifePlaceholder": "p. ej. 5",
      "inventory.reception.modal.finalDetails.lockHint": "Guardar bloquea esta recepción — después de esto, solo un administrador puede editarla.",
      "inventory.reception.modal.finalDetails.errorMsg": "Por favor completa todos los campos.",
      "inventory.reception.modal.finalDetails.saveBtn": "Guardar y finalizar",

      // ---- Inventory demo: Sales module (sales.html/.js) ----
      "inventory.sales.hub.heading": "Ventas",
      "inventory.sales.hub.newOfferBtn": "+ Nueva oferta",
      "inventory.sales.hub.openOffersHeading": "Ofertas abiertas",
      "inventory.sales.hub.openOffersEmpty": "Aún no hay ofertas abiertas hoy.",
      "inventory.sales.hub.completedOffersHeading": "Ofertas completadas",
      "inventory.sales.hub.completedOffersEmpty": "Aún no hay ofertas completadas hoy.",
      "inventory.sales.hub.createdLabel": "Creada",

      "inventory.sales.detail.backBtn": "← Volver a las ofertas de hoy",
      "inventory.sales.detail.saveOrderBtn": "Guardar pedido",
      "inventory.sales.detail.completeOrderBtn": "Completar pedido",
      "inventory.sales.detail.saveOrderHintDefault": "Agrega al menos un producto y un precio por kilogramo para cada uno, luego guarda para continuar.",
      "inventory.sales.detail.saveOrderHintSaved": "Guardado — ya puedes completar el pedido.",
      "inventory.sales.detail.saveOrderHintReady": "Listo — haz clic en Guardar pedido para continuar.",
      "inventory.sales.detail.orderSummaryHeading": "Resumen del pedido",
      "inventory.sales.detail.totalUtilidadLabel": "Total utilidad",
      "inventory.sales.detail.downloadCsvBtn": "Descargar como CSV",
      "inventory.sales.detail.sendEmailBtn": "Enviar por correo",
      "inventory.sales.detail.editCompletedNote": "Viendo como administrador — aún puedes ajustar precios y costos en esta oferta completada. Los kilogramos confirmados permanecen bloqueados.",
      "inventory.sales.detail.confirmedLabel": "Confirmado: ",
      "inventory.sales.detail.availableNowLabel": "Disponible ahora: ",
      "inventory.sales.detail.customCostOption": "Personalizado",
      "inventory.sales.detail.pricePerKgLabel": "Precio por kilogramo (USD) *",
      "inventory.sales.detail.pricePerKgPlaceholder": "p. ej. 4.50",
      "inventory.sales.detail.utilidadLabel": "Utilidad",
      "inventory.sales.detail.sentPrefix": "Enviado",
      "inventory.sales.detail.sentTo": "a:",

      "inventory.sales.status.completed": "Completada",

      "inventory.sales.modal.newOffer.title": "Nueva oferta",
      "inventory.sales.modal.newOffer.salespersonLabel": "Vendedor *",
      "inventory.sales.modal.newOffer.errorMsg": "Por favor selecciona un vendedor.",
      "inventory.sales.modal.newOffer.salespersonPlaceholder": "Selecciona un vendedor…",

      "inventory.sales.modal.addProduct.hint": "Aquí solo aparecen los productos que aún están dentro de su vida de anaquel — y que no han sido reclamados por completo por otra oferta completada. La cantidad disponible total se agrega automáticamente.",
      "inventory.sales.modal.addProduct.availableProductLabel": "Producto disponible *",
      "inventory.sales.modal.addProduct.emptyNote": "No hay nada disponible para vender en este momento — finaliza una recepción primero.",
      "inventory.sales.modal.addProduct.errorMsg": "Por favor selecciona un producto.",
      "inventory.sales.modal.addProduct.selectPlaceholder": "Selecciona un producto…",
      "inventory.sales.modal.addProduct.availableSuffix": "disponible",

      "inventory.sales.modal.completeOrder.title": "Completar pedido",
      "inventory.sales.modal.completeOrder.hint": "Confirma cuánto de cada producto está tomando realmente el comprador — la cantidad disponible total, o menos. Lo que confirmes aquí se descuenta del inventario para el resto de las ofertas de hoy.",
      "inventory.sales.modal.completeOrder.lockHint": "Completar bloquea esta oferta — después de esto, solo un administrador puede ajustar precios o costos, y los kilogramos confirmados ya no pueden cambiar.",
      "inventory.sales.modal.completeOrder.errorMsg": "Por favor confirma una cantidad válida (mayor que 0, hasta lo disponible) para cada producto.",
      "inventory.sales.modal.completeOrder.confirmBtn": "Confirmar y completar",
      "inventory.sales.modal.completeOrder.availableLabel": "disponible",

      "inventory.sales.modal.sendEmail.title": "Enviar por correo",
      "inventory.sales.modal.sendEmail.possibleClients": "Posibles clientes",
      "inventory.sales.modal.sendEmail.addAnotherLabel": "Agregar otro correo",
      "inventory.sales.modal.sendEmail.addBtn": "+ Agregar",
      "inventory.sales.modal.sendEmail.errorMsg": "Por favor selecciona o agrega al menos un destinatario.",
      "inventory.sales.modal.sendEmail.sendBtn": "Enviar",
      "inventory.sales.modal.sendEmail.removeAriaLabel": "Eliminar",

      "inventory.sales.csv.species": "Especie",
      "inventory.sales.csv.size": "Tamaño",
      "inventory.sales.csv.quality": "Calidad",
      "inventory.sales.csv.kilograms": "Kilogramos",
      "inventory.sales.csv.pricePerKg": "Precio por kg",
      "inventory.sales.csv.totalCosts": "Costos totales",
      "inventory.sales.csv.revenue": "Ingresos",

      // ---- Inventory demo: shared mock-data classification labels ----
      "inventory.data.family.fam-fish": "Pescados",
      "inventory.data.family.fam-mollusks": "Moluscos",
      "inventory.data.family.fam-crustaceans": "Crustáceos",

      "inventory.data.group.grp-snapper": "Pargo",
      "inventory.data.group.grp-grouper": "Mero",
      "inventory.data.group.grp-octopus": "Pulpo",
      "inventory.data.group.grp-conch": "Caracol",
      "inventory.data.group.grp-shrimp": "Camarón",
      "inventory.data.group.grp-lobster": "Langosta",
      "inventory.data.group.grp-crab": "Cangrejo",

      "inventory.data.species.sp-red-snapper": "Pargo Rojo",
      "inventory.data.species.sp-mutton-snapper": "Pargo Mutton",
      "inventory.data.species.sp-yellowtail-snapper": "Pargo Colirrubia",
      "inventory.data.species.sp-red-grouper": "Mero Rojo",
      "inventory.data.species.sp-black-grouper": "Mero Negro",
      "inventory.data.species.sp-fourseye-octopus": "Pulpo Maya",
      "inventory.data.species.sp-common-octopus": "Pulpo Común",
      "inventory.data.species.sp-queen-conch": "Caracol Rosado",
      "inventory.data.species.sp-white-shrimp": "Camarón Blanco",
      "inventory.data.species.sp-pink-shrimp": "Camarón Rosado",
      "inventory.data.species.sp-brown-shrimp": "Camarón Café",
      "inventory.data.species.sp-spiny-lobster": "Langosta Espinosa del Caribe",
      "inventory.data.species.sp-blue-crab": "Jaiba Azul",
      "inventory.data.species.sp-stone-crab": "Cangrejo Moro",

      "inventory.data.size.size-s.name": "Chica",
      "inventory.data.size.size-s.hint": "menos de 1 kg / pieza",
      "inventory.data.size.size-m.name": "Mediana",
      "inventory.data.size.size-m.hint": "1–3 kg / pieza",
      "inventory.data.size.size-l.name": "Grande",
      "inventory.data.size.size-l.hint": "3–6 kg / pieza",
      "inventory.data.size.size-xl.name": "Extra Grande",
      "inventory.data.size.size-xl.hint": "6 kg+ / pieza",

      "inventory.data.quality.qual-a": "Grado A — Premium de Exportación",
      "inventory.data.quality.qual-b": "Grado B — Estándar",
      "inventory.data.quality.qual-c": "Grado C — Procesamiento",

      "inventory.data.costCategory.manoDeObra": "Mano de obra",
      "inventory.data.costCategory.ingredientes": "Ingredientes (tratamiento)",
      "inventory.data.costCategory.empaquePrimario": "Empaque primario",
      "inventory.data.costCategory.complementoPrimario": "Complemento primario",
      "inventory.data.costCategory.empaqueSecundario": "Empaque secundario (caja)",
      "inventory.data.costCategory.complementoSecundario": "Complemento secundario",
      "inventory.data.costCategory.customHandling": "Aduana y manejo",

      "inventory.data.costOption.manoDeObra.0": "Exprés (cuadrilla de 1 hr)",
      "inventory.data.costOption.manoDeObra.1": "Estándar (cuadrilla de 2 hr)",
      "inventory.data.costOption.manoDeObra.2": "Extendida (cuadrilla de 4 hr)",
      "inventory.data.costOption.ingredientes.0": "Solo hielo en suspensión",
      "inventory.data.costOption.ingredientes.1": "Tratamiento con salmuera",
      "inventory.data.costOption.ingredientes.2": "Tratamiento con monóxido de carbono (CO)",
      "inventory.data.costOption.empaquePrimario.0": "Bolsa al vacío 6 x 10",
      "inventory.data.costOption.empaquePrimario.1": "Bolsa al vacío 8 x 12",
      "inventory.data.costOption.empaquePrimario.2": "Bolsa al vacío 10 x 14",
      "inventory.data.costOption.complementoPrimario.0": "Almohadilla absorbente — chica",
      "inventory.data.costOption.complementoPrimario.1": "Almohadilla absorbente — grande",
      "inventory.data.costOption.empaqueSecundario.0": "Caja encerada 5 Lb",
      "inventory.data.costOption.empaqueSecundario.1": "Caja encerada 10 Lb",
      "inventory.data.costOption.empaqueSecundario.2": "Caja encerada 20 Lb",
      "inventory.data.costOption.complementoSecundario.0": "Ninguno",
      "inventory.data.costOption.complementoSecundario.1": "Geles refrigerantes",
      "inventory.data.costOption.complementoSecundario.2": "Forro de espuma",
      "inventory.data.costOption.customHandling.0": "Estándar",
      "inventory.data.costOption.customHandling.1": "Prioritario",

      // ---- Reporting demo: filter bar / flyout chrome ----
      "reporting.filters.title": "Filtros",
      "reporting.filters.closeAriaLabel": "Cerrar filtros",
      "reporting.filters.dialogAriaLabel": "Filtros de reportes",
      "reporting.filters.dateRangeLabel": "Rango de fechas",
      "reporting.filters.dateRangeHint": "Hasta 2 años atrás, hasta ayer — los datos se actualizan a diario, no en tiempo real.",
      "reporting.filters.startLabel": "Inicio",
      "reporting.filters.endLabel": "Fin",
      "reporting.filters.dateError": "La fecha de inicio debe ser igual o anterior a la fecha de fin.",
      "reporting.filters.regionLabel": "Región",
      "reporting.filters.customersLabel": "Clientes",
      "reporting.filters.customersHint": "Siempre se requiere al menos un cliente.",
      "reporting.filters.customersError": "Selecciona al menos un cliente.",
      "reporting.filters.selectAll": "Seleccionar todos",
      "reporting.filters.unselectAll": "Deseleccionar todos",
      "reporting.filters.reset": "Restablecer",
      "reporting.filters.apply": "Aplicar filtros",
      "reporting.filters.loadingFilters": "Cargando filtros…",
      "reporting.filters.summaryLabel": "Filtros",
      "reporting.filters.allCustomersPrefix": "Todos",
      "reporting.filters.customerSingular": "cliente",
      "reporting.filters.customerPlural": "clientes",
      "reporting.filters.allRegions": "Todas las regiones",
      "reporting.filters.region.northeast": "Noreste",
      "reporting.filters.region.southeast": "Sureste",
      "reporting.filters.region.midwest": "Medio Oeste",
      "reporting.filters.region.west": "Oeste",

      // ---- Reporting demo: page-level chrome ----
      "reporting.page.heading": "Reportes de clientes",
      "reporting.page.description": "Una recreación de una plataforma de reportes que ayudé a construir para un negocio nacional de eCommerce — para que los usuarios pudieran obtener sus reportes de facturas, productos y cumplimiento sin salir nunca de la plataforma en la que ya estaban trabajando.",
      "reporting.quickTour.heading": "Recorrido rápido — el camino ideal",
      "reporting.quickTour.step1": "Filtra por rango de fechas, región o cliente — cada vista se actualiza a la vez.",
      "reporting.quickTour.step2": "Alterna entre tablas de reportes y gráficas interactivas.",
      "reporting.quickTour.step3": "Da clic en cualquier fila para ver el detalle completo del pedido o producto.",
      "reporting.quickTour.step4": "Ordena, busca y exporta cualquier tabla directo a CSV.",
      "reporting.tableViews.heading": "Vistas de tabla",

      // ---- Reporting demo: download history flyout ----
      "reporting.history.downloadBtn": "Historial de descargas",
      "reporting.history.dialogAriaLabel": "Historial de descargas",
      "reporting.history.heading": "Historial de descargas",
      "reporting.history.redownloadBtn": "Volver a descargar",

      // ---- Reporting demo: charts ----
      "reporting.charts.heading": "Gráficas",
      "reporting.charts.spendByClass.title": "Gasto por Clase",
      "reporting.charts.topProducts.title": "Productos principales",
      "reporting.charts.metricToggle.dollars": "Dólares ($)",
      "reporting.charts.metricToggle.cases": "Cajas",
      "reporting.charts.seeMorePrefix": "Ver más",
      "reporting.charts.seeLess": "Ver menos",
      "reporting.charts.emptyState": "Ninguna compra coincide con los filtros actuales.",
      "reporting.charts.yoyNew": "Nuevo",
      "reporting.charts.casesSuffix": "cajas",

      // ---- Reporting demo: section cards + report/section display names ----
      "reporting.section.invoiceHistory.title": "Historial de facturas",
      "reporting.section.invoiceHistory.desc": "Detalle a nivel de factura y de línea para cada compra dentro de tu rango filtrado.",
      "reporting.section.productUsage.title": "Uso de productos",
      "reporting.section.productUsage.desc": "Lo que realmente se compró — resumido, con tendencia mes a mes, y desglosado por producto.",
      "reporting.section.compliance.title": "Cumplimiento",
      "reporting.section.compliance.desc": "Compras contratadas vs. no contratadas.",

      "reporting.reportName.invoiceHistory": "Historial de facturas",
      "reporting.reportName.invoiceDetails": "Detalle de facturas",
      "reporting.reportName.purchaseSummary": "Resumen de compras",
      "reporting.reportName.purchaseTrends": "Tendencias de compra",
      "reporting.reportName.purchaseDetails": "Detalle de compras",
      "reporting.reportName.complianceSummary": "Resumen de cumplimiento",

      "reporting.stub.prefix": "La tabla interactiva para “",
      "reporting.stub.suffix": "” llegará en una fase posterior.",

      // ---- Reporting demo: mobile download flyout ----
      "reporting.mobileFlyout.hint": "Las vistas de tabla aún no están disponibles en pantallas pequeñas — elige un reporte abajo para descargarlo directamente.",
      "reporting.mobileFlyout.dialogAriaLabel": "Elige un reporte para descargar",

      // ---- Reporting demo: data table column headers ----
      "reporting.table.columnHeader.invoiceNumber": "N.º de factura",
      "reporting.table.columnHeader.invoiceDate": "Fecha de factura",
      "reporting.table.columnHeader.customerName": "Nombre del cliente",
      "reporting.table.columnHeader.customerNumber": "N.º de cliente",
      "reporting.table.columnHeader.total": "Total ($)",
      "reporting.table.columnHeader.cases": "Cajas",
      "reporting.table.columnHeader.weight": "Peso (lb)",
      "reporting.table.columnHeader.productNumber": "N.º de producto",
      "reporting.table.columnHeader.productDescription": "Descripción del producto",
      "reporting.table.columnHeader.sku": "SKU",
      "reporting.table.columnHeader.manufacturer": "Nombre del fabricante",
      "reporting.table.columnHeader.storageType": "Tipo de almacenamiento",
      "reporting.table.columnHeader.classNumber": "N.º de clase",
      "reporting.table.columnHeader.classDescription": "Descripción de clase",
      "reporting.table.columnHeader.categoryNumber": "N.º de categoría",
      "reporting.table.columnHeader.categoryDescription": "Descripción de categoría",
      "reporting.table.columnHeader.groupNumber": "N.º de grupo",
      "reporting.table.columnHeader.groupDescription": "Descripción de grupo",
      "reporting.table.columnHeader.contractedAmount": "Contratado ($)",
      "reporting.table.columnHeader.contractedPctAmount": "% Contratado ($)",
      "reporting.table.columnHeader.contractedCases": "Cajas contratadas",
      "reporting.table.columnHeader.contractedPctCases": "% Contratado (Cajas)",
      "reporting.table.columnHeader.dollarsUnit": "$",
      "reporting.table.columnHeader.casesUnit": "Cajas",

      // ---- Reporting demo: data table toolbar / pagination ----
      "reporting.table.searchPlaceholder": "Buscar en este reporte…",
      "reporting.table.searchAriaLabel": "Buscar en este reporte",
      "reporting.table.downloadCsv": "Descargar CSV",
      "reporting.table.downloadExcel": "Descargar Excel",
      "reporting.table.rowSingular": "fila",
      "reporting.table.rowPlural": "filas",
      "reporting.table.emptyState": "Ninguna fila coincide con los filtros y la búsqueda actuales.",
      "reporting.pagination.prev": "Anterior",
      "reporting.pagination.next": "Siguiente",
      "reporting.pagination.pageWord": "Página",
      "reporting.pagination.ofWord": "de",

      "eventWizard.progress.phase.details": "Detalles",
      "eventWizard.progress.phase.selection": "Selección",
      "eventWizard.progress.phase.deposit": "Depósito",
      "eventWizard.progress.saveBtn": "Guardar progreso",
      "eventWizard.progress.resetBtn": "Reiniciar",
      "eventWizard.reset.confirm": "¿Volver al paso 1? Esto borrará tus respuestas actuales.",
      "eventWizard.sublabel.name": "Empecemos contigo",
      "eventWizard.sublabel.eventType": "¿Qué estás planeando?",
      "eventWizard.sublabel.date": "Elige la fecha de tu evento",
      "eventWizard.sublabel.guests": "¿Cuántos invitados esperas?",
      "eventWizard.sublabel.contactBranch": "Te conectamos con un especialista",
      "eventWizard.sublabel.mainVenue": "Elige tu espacio",
      "eventWizard.sublabel.receptionVenue": "Elige tu espacio de recepción",
      "eventWizard.sublabel.mood": "¿Cuál es el ambiente?",
      "eventWizard.sublabel.quote": "Tu estimado",
      "eventWizard.sublabel.package": "Elige tu paquete",
      "eventWizard.sublabel.terms": "Términos y condiciones",
      "eventWizard.sublabel.checkout": "Revisa y paga tu depósito",
      "eventWizard.sublabel.confirmation": "¡Ya está reservado!",

      "eventWizard.hero.accent": "— Asistente de Eventos del Resort",
      "eventWizard.hero.skipToCheckout": "Saltar al pago (demo)",
      "eventWizard.hero.intro": "Un flujo de autoservicio para reservar un evento privado en un resort frente al mar — bodas, retiros corporativos, celebraciones especiales, reuniones familiares y más. Elige una fecha, explora espacios para el evento y la recepción, elige un paquete y reserva con un depósito, sin una sola llamada telefónica.",
      "eventWizard.quickTour.heading": "Recorrido rápido — el camino ideal",
      "eventWizard.quickTour.step1": "Cuéntanos qué estás planeando y cuántos invitados.",
      "eventWizard.quickTour.step2": "Elige una fecha disponible y explora espacios reales, con precio al instante.",
      "eventWizard.quickTour.step3": "Obtén una cotización instantánea — un paquete para bodas, o directo a tu total en otros casos.",
      "eventWizard.quickTour.step4": "Reserva con un depósito simulado y velo confirmado en segundos.",
      "eventWizard.hero.chip1.title": "Conectado al PMS",
      "eventWizard.hero.chip1.body": "Property Management System — reserva las habitaciones y espacios del evento en cuanto se confirma el depósito.",
      "eventWizard.hero.chip2.title": "Conectado al CRM",
      "eventWizard.hero.chip2.body": "Customer Relationship Management — le da a ventas todo el contexto del huésped y del evento antes de la primera llamada.",

      "eventWizard.actions.continue": "Continuar →",
      "eventWizard.actions.back": "← Atrás",
      "eventWizard.common.closeAriaLabel": "Cerrar",

      "eventWizard.step.name.heading": "¿Cuál es tu nombre?",
      "eventWizard.step.name.sub": "Empecemos contigo.",
      "eventWizard.step.name.firstNameLabel": "Nombre *",
      "eventWizard.step.name.firstNamePlaceholder": "ej. Jamie",
      "eventWizard.step.name.lastNameLabel": "Apellido *",
      "eventWizard.step.name.lastNamePlaceholder": "ej. Rivera",
      "eventWizard.errors.nameRequired": "Por favor ingresa tu nombre y apellido.",

      "eventWizard.step.eventType.heading": "¿Qué estás planeando?",
      "eventWizard.step.eventType.sub": "Esto nos ayuda a personalizar el resto de tus opciones.",
      "eventWizard.errors.pleaseChooseEventType": "Por favor elige un tipo de evento.",

      "eventWizard.step.date.heading": "¿Cuándo es tu evento?",
      "eventWizard.step.date.sub": "Los días en gris ya están reservados para un grupo de tu tamaño.",
      "eventWizard.calendar.prevAriaLabel": "Mes anterior",
      "eventWizard.calendar.jumpAriaLabel": "Saltar a un mes o año",
      "eventWizard.calendar.jumpMonthAriaLabel": "Saltar a mes",
      "eventWizard.calendar.jumpYearAriaLabel": "Saltar a año",
      "eventWizard.calendar.nextAriaLabel": "Mes siguiente",
      "eventWizard.calendar.weekday.su": "Do",
      "eventWizard.calendar.weekday.mo": "Lu",
      "eventWizard.calendar.weekday.tu": "Ma",
      "eventWizard.calendar.weekday.we": "Mi",
      "eventWizard.calendar.weekday.th": "Ju",
      "eventWizard.calendar.weekday.fr": "Vi",
      "eventWizard.calendar.weekday.sa": "Sá",
      "eventWizard.calendar.legend.available": "Disponible",
      "eventWizard.calendar.legend.unavailable": "Ya reservado",
      "eventWizard.calendar.legend.selected": "Tu fecha",
      "eventWizard.calendar.noDateSelected": "Aún no has seleccionado una fecha.",
      "eventWizard.calendar.selectedDatePrefix": "Evento el",
      "eventWizard.calendar.selectedDateSuffix": "— llegada la noche anterior, salida la mañana siguiente.",
      "eventWizard.errors.pleaseChooseDate": "Por favor elige una fecha disponible.",

      "eventWizard.step.guests.heading": "¿Cuántos invitados?",
      "eventWizard.step.guests.sub": "Un número aproximado para tu evento.",
      "eventWizard.guests.fewerAriaLabel": "Menos invitados",
      "eventWizard.guests.label": "invitados",
      "eventWizard.guests.moreAriaLabel": "Más invitados",
      "eventWizard.guests.the1000PlusLabel": "En realidad, estamos planeando para 1,000+ invitados",
      "eventWizard.guests.overnightQuestion": "De esos, ¿aproximadamente cuántos se hospedarán 3 noches en el resort?",
      "eventWizard.guests.overnightHint": "Noche de llegada, noche del evento y la noche siguiente.",
      "eventWizard.guests.fewerOvernightAriaLabel": "Menos invitados hospedados",
      "eventWizard.guests.overnightLabel": "se hospedarán",
      "eventWizard.guests.moreOvernightAriaLabel": "Más invitados hospedados",
      "eventWizard.errors.invalidGuestCount": "Por favor ingresa un número de invitados válido.",

      "eventWizard.step.contactBranch.heading": "Planeemos algo grande, juntos",
      "eventWizard.step.contactBranch.sub": "Los eventos de 1,000+ invitados reciben un equipo de planeación dedicado en lugar de una cotización de autoservicio. Guarda tus datos, o agenda una llamada ahora.",
      "eventWizard.step.contactBranch.backBtn": "← Cambiar número de invitados",
      "eventWizard.step.contactBranch.scheduleBtn": "Agendar una llamada →",

      "eventWizard.step.mainVenue.heading": "Elige tu espacio",
      "eventWizard.step.mainVenue.sub": "Donde se llevará a cabo tu evento.",
      "eventWizard.step.mainVenue.wedding.heading": "Elige tu espacio de ceremonia",
      "eventWizard.step.mainVenue.wedding.sub": "Donde dirán sus votos.",
      "eventWizard.step.mainVenue.corporate.heading": "Elige tu espacio de evento",
      "eventWizard.step.mainVenue.corporate.sub": "Donde se llevará a cabo tu evento.",
      "eventWizard.step.mainVenue.celebration.heading": "Elige tu espacio de evento",
      "eventWizard.step.mainVenue.celebration.sub": "Donde será la celebración.",
      "eventWizard.step.mainVenue.reunion.heading": "Elige tu espacio de reunión",
      "eventWizard.step.mainVenue.reunion.sub": "Donde todos se reunirán.",
      "eventWizard.errors.pleaseChooseMainVenue": "Por favor elige un espacio.",

      "eventWizard.step.receptionVenue.heading": "Elige tu espacio de recepción",
      "eventWizard.step.receptionVenue.sub": "Donde se reunirán después.",
      "eventWizard.errors.pleaseChooseReceptionVenue": "Por favor elige un espacio de recepción.",

      "eventWizard.venueCard.upToPrefix": "Hasta",
      "eventWizard.venueCard.guestsWord": "invitados",
      "eventWizard.venueCard.feeSuffix": "cuota del espacio",

      "eventWizard.step.mood.heading": "¿Cuál es el ambiente?",
      "eventWizard.step.mood.sub": "Elige el ambiente que más se sienta como tú.",
      "eventWizard.errors.pleaseChooseMood": "Por favor elige un ambiente.",
      "eventWizard.step.mood.nextBtn": "Ver mi estimado →",

      "eventWizard.step.quote.heading": "Tu estimado",
      "eventWizard.step.quote.sub": "Elige un paquete a continuación para ver tu total final.",
      "eventWizard.step.quote.subFinal": "Este es tu total estimado.",
      "eventWizard.step.quote.nextBtn": "Elegir un paquete →",
      "eventWizard.step.quote.nextBtnFinal": "Continuar a términos →",
      "eventWizard.quote.roomNightsLabel": "Noches de habitación",
      "eventWizard.quote.roomsWord": "habitaciones",
      "eventWizard.quote.nightsWord": "noches",
      "eventWizard.quote.guestServiceFeeLabel": "Cuota de servicio por invitado",
      "eventWizard.quote.venueConfigLabel": "Configuración de espacios (evento + recepción)",
      "eventWizard.quote.venueConfigLabelSingle": "Configuración de espacio",
      "eventWizard.quote.estimateSubtotal": "Subtotal estimado",

      "eventWizard.step.package.heading": "Elige tu paquete",
      "eventWizard.step.package.sub": "Cada paquete tiene un precio por invitado, sobre tu estimado.",
      "eventWizard.errors.pleaseChoosePackage": "Por favor elige un paquete.",
      "eventWizard.step.package.nextBtn": "Continuar a los términos →",
      "eventWizard.package.perGuestSuffix": "/ invitado",
      "eventWizard.package.costForWord": "para",
      "eventWizard.package.costGuestsWord": "invitados",
      "eventWizard.package.perGuestSectionLabel": "Por invitado",
      "eventWizard.package.includedOnceLabel": "Incluido una vez",
      "eventWizard.finalTotal.label": "Tu total final",

      "eventWizard.step.terms.heading": "Términos y condiciones",
      "eventWizard.step.terms.sub": "La versión corta — en lenguaje simple, sin letra pequeña.",
      "eventWizard.terms.bullet1": "Tu depósito de $1,500 reserva tu fecha y espacio por 5 días.",
      "eventWizard.terms.bullet2": "El saldo debe pagarse dentro de esos mismos 5 días, o la reserva podría liberarse.",
      "eventWizard.terms.bullet3": "El número de invitados y la selección de espacios pueden ajustarse hasta 30 días antes del evento.",
      "eventWizard.terms.bullet4": "Cancela con más de 90 días de anticipación para un reembolso completo; dentro de los 90 días, el depósito no es reembolsable.",
      "eventWizard.terms.bullet5": "Todos los precios aquí son estimados y se confirmarán con tu especialista en eventos.",
      "eventWizard.terms.acceptCheckbox": "He leído y acepto estos términos",
      "eventWizard.errors.pleaseAcceptTerms": "Por favor acepta los términos para continuar.",
      "eventWizard.step.terms.nextBtn": "Continuar al pago →",

      "eventWizard.step.checkout.heading": "Revisa y paga tu depósito",
      "eventWizard.step.checkout.sub": "Aquí está todo, en un solo lugar.",
      "eventWizard.checkout.paymentHeading": "Pago",
      "eventWizard.checkout.simulatedNote": "Pago simulado — no se cobra ninguna tarjeta real.",
      "eventWizard.checkout.saveRequiredNote": "Guarda tu progreso primero — así es como tu especialista dará seguimiento.",
      "eventWizard.checkout.expiryMonthAriaLabel": "Mes de vencimiento",
      "eventWizard.checkout.expiryYearAriaLabel": "Año de vencimiento",
      "eventWizard.checkout.expiryMonthPlaceholder": "MM",
      "eventWizard.checkout.expiryYearPlaceholder": "AAAA",
      "eventWizard.checkout.cardNameLabel": "Nombre en la tarjeta *",
      "eventWizard.checkout.cardNamePlaceholder": "ej. Jamie Rivera",
      "eventWizard.checkout.cardNumberLabel": "Número de tarjeta *",
      "eventWizard.checkout.expiryLabel": "Vencimiento *",
      "eventWizard.checkout.cvvLabel": "CVV *",
      "eventWizard.errors.paymentFieldsRequired": "Por favor completa todos los campos de pago.",
      "eventWizard.errors.cardNameRequired": "Ingresa el nombre en la tarjeta.",
      "eventWizard.errors.cardNumberInvalid": "Ingresa un número de tarjeta válido.",
      "eventWizard.errors.cardExpiryRequired": "Selecciona el mes y año de vencimiento.",
      "eventWizard.errors.cardCvvInvalid": "Ingresa un CVV válido.",

      "eventWizard.orderSummary.heading": "Resumen del pedido",
      "eventWizard.orderSummary.guestsTotalWord": "total",
      "eventWizard.orderSummary.guestsStayingSuffix": "se hospedarán 3 noches",
      "eventWizard.orderSummary.contactName": "Nombre de contacto",
      "eventWizard.orderSummary.eventDate": "Fecha del evento",
      "eventWizard.orderSummary.guests": "Invitados",
      "eventWizard.orderSummary.mainEventSpace": "Espacio principal del evento",
      "eventWizard.orderSummary.ceremonySpace": "Espacio de ceremonia",
      "eventWizard.orderSummary.eventSpace": "Espacio del evento",
      "eventWizard.orderSummary.receptionSpace": "Espacio de recepción",
      "eventWizard.orderSummary.mood": "Ambiente",
      "eventWizard.orderSummary.package": "Paquete",
      "eventWizard.orderSummary.packageCost": "Costo del paquete",
      "eventWizard.orderSummary.finalTotal": "Total final",
      "eventWizard.orderSummary.depositDueNow": "Depósito a pagar ahora",
      "eventWizard.orderSummary.balanceDueLater": "Saldo pendiente posterior",

      "eventWizard.confirmation.defaultSubtext": "Un especialista en eventos se pondrá en contacto pronto para confirmar tu reserva.",
      "eventWizard.confirmation.balanceDueLabel": "Saldo pendiente",
      "eventWizard.confirmation.heldHint": "Tu fecha y espacio están reservados por:",
      "eventWizard.confirmation.scheduleCallBtn": "Agendar una llamada con tu especialista",
      "eventWizard.confirmation.bookedSuffix": ", ¡ya está reservado!",
      "eventWizard.countdown.days": "días",
      "eventWizard.countdown.hours": "hrs",
      "eventWizard.countdown.minutes": "min",
      "eventWizard.countdown.seconds": "seg",

      "eventWizard.saveFlyout.ariaLabel": "Guardar tu progreso",
      "eventWizard.saveFlyout.heading": "Guardar tu progreso",
      "eventWizard.saveFlyout.requiredNote": "Guarda para continuar — esto es obligatorio antes de pagar tu depósito.",
      "eventWizard.saveFlyout.body": "Mantendremos tu cotización lista. Déjanos un correo o un número celular y podemos continuar justo donde lo dejaste.",
      "eventWizard.saveFlyout.emailLabel": "Correo electrónico",
      "eventWizard.saveFlyout.emailPlaceholder": "tu@correo.com",
      "eventWizard.saveFlyout.orDivider": "— o —",
      "eventWizard.saveFlyout.countryCodeLabel": "Código de país",
      "eventWizard.saveFlyout.countryCodePlaceholder": "+52",
      "eventWizard.saveFlyout.cellPhoneLabel": "Celular",
      "eventWizard.saveFlyout.cellPhonePlaceholder": "998 123 4567",
      "eventWizard.saveFlyout.agreePrefix": "Acepto la",
      "eventWizard.saveFlyout.privacyPolicyLinkText": "política de privacidad",
      "eventWizard.errors.saveProgress": "Por favor proporciona un correo válido, o un número de teléfono con código de país.",
      "eventWizard.errors.saveContactMissing": "Ingresa un correo o número de teléfono.",
      "eventWizard.errors.saveEmailFormat": "Ese correo no se ve correcto.",
      "eventWizard.errors.saveCountryCodeMissing": "Agrega un código de país, ej. +52.",
      "eventWizard.errors.savePhoneFormat": "Ingresa un número de teléfono válido.",
      "eventWizard.errors.savePrivacyRequired": "Marca la casilla para aceptar la política de privacidad.",
      "eventWizard.saveFlyout.saveBtn": "Guardar mi progreso",
      "eventWizard.saveFlyout.savedConfirmation": "¡Guardado! Te hemos enviado un enlace para continuar justo donde lo dejaste.",

      "eventWizard.privacyModal.ariaLabel": "Política de privacidad",
      "eventWizard.privacyModal.heading": "Política de privacidad (demo)",
      "eventWizard.privacyModal.p1": "Esta es una política simulada para un demo de portafolio — nada de lo que ingreses aquí se almacena ni se envía a ningún lado.",
      "eventWizard.privacyModal.p2": "En el producto real, esta sección cubriría claramente: qué recopilamos (tu nombre, información de contacto y detalles del evento), por qué (para reservar tu fecha y dar seguimiento sobre tu evento), quién lo ve (tu especialista en eventos asignado y el equipo de reservas del resort), y cómo solicitar que se elimine en cualquier momento contactándonos directamente.",

      "eventWizard.scheduleModal.ariaLabel": "Agendar una llamada",
      "eventWizard.scheduleModal.heading": "Agendar una llamada",
      "eventWizard.scheduleModal.hint": "Elige un horario que te convenga (simulado — como una reserva de Calendly).",
      "eventWizard.errors.pleaseChooseTimeSlot": "Por favor elige un horario.",
      "eventWizard.scheduleModal.cancelBtn": "Cancelar",
      "eventWizard.scheduleModal.confirmBtn": "Confirmar horario",
      "eventWizard.resetModal.ariaLabel": "Empezar de nuevo",
      "eventWizard.resetModal.heading": "¿Empezar de nuevo?",
      "eventWizard.resetModal.body": "Esto borra tus respuestas actuales y te lleva de vuelta al paso 1.",
      "eventWizard.resetModal.cancelBtn": "Cancelar",
      "eventWizard.resetModal.confirmBtn": "Empezar de nuevo",
      "eventWizard.scheduleSlot.morningTime": "10:00 a.m.",
      "eventWizard.scheduleSlot.afternoonTime": "3:00 p.m.",
      "eventWizard.scheduleConfirm.prefix": "Llamada agendada para",
      "eventWizard.scheduleConfirm.suffix": ". Enviaremos una invitación de calendario a tu contacto guardado.",

      "eventWizard.data.eventType.wedding.name": "Boda",
      "eventWizard.data.eventType.wedding.description": "Ceremonia y recepción para ti y tus invitados",
      "eventWizard.data.eventType.corporate.name": "Evento corporativo",
      "eventWizard.data.eventType.corporate.description": "Juntas, retiros, lanzamientos o celebraciones de equipo",
      "eventWizard.data.eventType.celebration.name": "Celebración especial",
      "eventWizard.data.eventType.celebration.description": "Cumpleaños, aniversarios, quinceañeras y más",
      "eventWizard.data.eventType.reunion.name": "Reunión familiar / otro evento",
      "eventWizard.data.eventType.reunion.description": "Cualquier otro evento privado para tu grupo",

      "eventWizard.data.space.palapa.tagline": "Elegancia frente al mar, justo al borde del agua",
      "eventWizard.data.space.palapa.feature.0": "Frente al mar, a pasos de la arena",
      "eventWizard.data.space.palapa.feature.1": "Estructura natural de palapa para sombra",
      "eventWizard.data.space.palapa.feature.2": "Ideal para eventos al atardecer (4–6pm)",
      "eventWizard.data.space.palapa.feature.3": "Sillas plegables blancas incluidas",
      "eventWizard.data.space.jardin.tagline": "Celebra bajo un dosel de jardín",
      "eventWizard.data.space.jardin.feature.0": "Jardín tropical cuidado",
      "eventWizard.data.space.jardin.feature.1": "Fondo con fuente de piedra",
      "eventWizard.data.space.jardin.feature.2": "Dosel de luces colgantes",
      "eventWizard.data.space.jardin.feature.3": "Arco cubierto para sombra",
      "eventWizard.data.space.terraza.tagline": "Vistas al atardecer sobre la costa",
      "eventWizard.data.space.terraza.feature.0": "Terraza en la azotea con vistas panorámicas al mar",
      "eventWizard.data.space.terraza.feature.1": "Al aire libre, ideal después de las 5pm",
      "eventWizard.data.space.terraza.feature.2": "Iluminación ambiental integrada",
      "eventWizard.data.space.terraza.feature.3": "Espacio para un trío o cuarteto en vivo",

      "eventWizard.data.reception.salon.tagline": "Salón con vista al mar y espacio para bailar",
      "eventWizard.data.reception.salon.feature.0": "Ventanales de piso a techo con vista al mar",
      "eventWizard.data.reception.salon.feature.1": "Salón interior con aire acondicionado",
      "eventWizard.data.reception.salon.feature.2": "Pista de baile y escenario integrados",
      "eventWizard.data.reception.salon.feature.3": "Distribución flexible en mesas redondas o alargadas",
      "eventWizard.data.reception.patio.tagline": "Cena al aire libre bajo palmeras",
      "eventWizard.data.reception.patio.feature.0": "Patio al aire libre con sombra de palmeras",
      "eventWizard.data.reception.patio.feature.1": "Luces colgantes en lo alto",
      "eventWizard.data.reception.patio.feature.2": "Pista de baile exterior disponible como extra",
      "eventWizard.data.reception.patio.feature.3": "Ambiente tropical, elegante y casual",
      "eventWizard.data.reception.terrazaGrand.tagline": "Flexibilidad interior-exterior, en cualquier temporada",
      "eventWizard.data.reception.terrazaGrand.feature.0": "Techo retráctil para adaptarse al clima",
      "eventWizard.data.reception.terrazaGrand.feature.1": "Vistas panorámicas de la costa",
      "eventWizard.data.reception.terrazaGrand.feature.2": "Espacio de recepción de mayor capacidad",
      "eventWizard.data.reception.terrazaGrand.feature.3": "Bar y áreas de lounge integrados",

      "eventWizard.data.mood.barefoot.description": "Elegancia relajada frente al mar — blancos, azules y pies descalzos en la arena.",
      "eventWizard.data.mood.tropical.description": "Vegetación exuberante, tonos rosa y dorado, luz de velas al anochecer.",
      "eventWizard.data.mood.classic.description": "Refinado y atemporal — marfil, champán y flores tradicionales.",
      "eventWizard.data.mood.modern.description": "Líneas limpias, paleta neutra y arreglos florales escultóricos.",
      "eventWizard.data.mood.fiesta.description": "Colores vibrantes, papel picado y una fiesta que no para.",
      "eventWizard.data.mood.boho.description": "Rústico-chic con tonos tierra, macramé y flores silvestres.",

      "eventWizard.data.package.essential.perGuestInclude.0": "Cena de 3 tiempos servida, con una opción de plato fuerte",
      "eventWizard.data.package.essential.perGuestInclude.1": "Barra de vino y cerveza de la casa, 4 horas",
      "eventWizard.data.package.essential.perGuestInclude.2": "Mocktail de bienvenida a la llegada",
      "eventWizard.data.package.essential.flatExtra.0": "DJ y sistema de sonido básico",
      "eventWizard.data.package.essential.flatExtra.1": "Centros de mesa florales estándar",
      "eventWizard.data.package.essential.flatExtra.2": "Coordinador el día del evento",
      "eventWizard.data.package.premium.perGuestInclude.0": "Cena de 3 tiempos servida, con dos opciones de plato fuerte",
      "eventWizard.data.package.premium.perGuestInclude.1": "Barra libre premium con tequila y mezcal de primera, 5 horas",
      "eventWizard.data.package.premium.perGuestInclude.2": "Coctel de bienvenida servido a la llegada",
      "eventWizard.data.package.premium.flatExtra.0": "Trío en vivo durante el coctel + DJ para la recepción",
      "eventWizard.data.package.premium.flatExtra.1": "Diseño floral elevado",
      "eventWizard.data.package.premium.flatExtra.2": "Coordinador de eventos dedicado",
      "eventWizard.data.package.premium.flatExtra.3": "Despedida con luces de bengala",
      "eventWizard.data.package.luxury.perGuestInclude.0": "Menú degustación del chef + estaciones de comida interactivas",
      "eventWizard.data.package.luxury.perGuestInclude.1": "Barra libre de primera, 6 horas, más un brindis con champán",
      "eventWizard.data.package.luxury.perGuestInclude.2": "Coctel de bienvenida + snack de medianoche",
      "eventWizard.data.package.luxury.flatExtra.0": "Banda en vivo + DJ",
      "eventWizard.data.package.luxury.flatExtra.1": "Diseño floral personalizado y mobiliario lounge",
      "eventWizard.data.package.luxury.flatExtra.2": "Equipo completo de producción del evento",
      "eventWizard.data.package.luxury.flatExtra.3": "Espacio privado para after-party",
      "eventWizard.data.package.luxury.flatExtra.4": "Espectáculo de fuegos artificiales sobre el mar"
    }
  };

  // hero.roles (the typewriter words) live here as an array rather than a
  // data-i18n string, since main.js types them out letter by letter
  // instead of writing them in directly — see getRoles() in main.js.
  // Confirmed with Antonio: these stay in English in both languages.
  translations.en["hero.roles"] = ["Product Owner", "Product Manager", "Business Analyst"];
  translations.es["hero.roles"] = ["Product Owner", "Product Manager", "Business Analyst"];

  function getStoredLang() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Private/incognito mode can block localStorage — fail silently,
      // the toggle still works for the rest of the current visit.
    }
  }

  function getInitialLang() {
    var params = new URLSearchParams(window.location.search);
    var queryLang = params.get("lang");
    if (queryLang === "en" || queryLang === "es") {
      // Persist immediately: if someone arrives via a ?lang=es link (e.g.
      // the Spanish CV) and then clicks an internal link that doesn't
      // carry the query string (like Home -> Credentials), the language
      // they landed on should still stick instead of reverting to
      // whatever was stored before.
      setStoredLang(queryLang);
      return queryLang;
    }

    var stored = getStoredLang();
    if (stored === "en" || stored === "es") {
      return stored;
    }

    return DEFAULT_LANG;
  }

  var currentLang = getInitialLang();

  var WHATSAPP_NUMBER = "5219988459830";

  function applyTranslations() {
    var dict = translations[currentLang] || translations[DEFAULT_LANG];

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = dict[key];
      if (typeof value === "string") {
        el.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      var value = dict[key];
      if (typeof value === "string") {
        el.setAttribute("aria-label", value);
      }
    });

    document.querySelectorAll("[data-i18n-href]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-href");
      var value = dict[key];
      if (typeof value === "string") {
        el.setAttribute("href", value);
      }
    });

    // Placeholder text on static <input>/<textarea> elements — same idea as
    // data-i18n-aria, since placeholder isn't textContent either.
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      var value = dict[key];
      if (typeof value === "string") {
        el.setAttribute("placeholder", value);
      }
    });

    // WhatsApp pre-fill message: built from the raw text (not stored
    // pre-encoded), so it always matches the active language.
    var waMessage = dict["whatsapp.message"];
    if (typeof waMessage === "string") {
      var waHref = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(waMessage);
      document.querySelectorAll(".whatsapp-button").forEach(function (el) {
        el.setAttribute("href", waHref);
      });
    }

    document.documentElement.setAttribute("lang", currentLang);

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === currentLang;
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "es") return;
    currentLang = lang;
    setStoredLang(lang);
    applyTranslations();
    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });

    applyTranslations();
  });

  // Small public API other scripts (main.js's typewriter) read from,
  // instead of duplicating language state/dictionary logic.
  window.i18n = {
    getLang: function () {
      return currentLang;
    },
    t: function (key) {
      var dict = translations[currentLang] || translations[DEFAULT_LANG];
      return dict[key];
    }
  };
})();
