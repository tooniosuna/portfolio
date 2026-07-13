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

      "hero.greetingPrefix": "Hello! I’m",
      "hero.srRoles": "Product Owner, Product Manager, Business Analyst",

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
      "credentials.viewProgram": "View program →"
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
      "credentials.viewProgram": "Ver programa →"
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
