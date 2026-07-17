// ==========================================================================
// reporting.js
// Customer Reporting demo. Covers: the master filter bar/flyout, the
// skeleton-loading mechanism, the mock invoice dataset, the section cards
// + active report area and its 3 sections (Invoice History, Product
// Usage, Compliance — all wired to window.RptDataTable from
// dataTable.js), the mocked Download History flyout, and the Spend by
// Class / Top Products charts. Any future report added to a SECTIONS
// entry without a matching REPORTS[...] entry falls back to a "coming in
// a later slice" stub automatically — that's just a safety net now, not
// describing anything currently unbuilt.
//
// Everything here is scoped to this file/page only (not loaded on any
// other page), and all filter state lives in memory only — refreshing or
// leaving the Reporting page always resets to the defaults below.
// ==========================================================================

(function () {
  "use strict";

  // Small i18n helper mirroring the fallback pattern used across the site:
  // if window.i18n isn't available (or the key is missing) fall back to
  // the English string passed in, so chrome text never renders blank.
  // Used ONLY for UI chrome (headings, labels, buttons, empty states) —
  // never inside the mock data-generation code below.
  function t(key, fallback) {
    var val = window.i18n && window.i18n.t ? window.i18n.t(key) : null;
    return typeof val === "string" ? val : fallback;
  }

  // ------------------------------------------------------------------------
  // MOCK DATA
  // 16 fictional foodservice customers spread across 4 US regions.
  // "Southwest" is deliberately left with zero customers so the "only show
  // regions that actually have customers" rule has something real to prove
  // — it should never appear as a selectable region below.
  // "We Never Purchase Foods" is a deliberate zero-data customer (see
  // neverPurchases below, honored in the invoice generator) so every
  // empty-state (table, chart) has a real, reachable way to show up.
  // ------------------------------------------------------------------------
  var CUSTOMERS = [
    { id: "c0", name: "We Never Purchase Foods", region: "Northeast", neverPurchases: true },
    { id: "c1", name: "Blue Harbor Bistro Group", region: "Northeast" },
    { id: "c2", name: "Maple Row Cafés", region: "Northeast" },
    { id: "c3", name: "Northfield Dining Co.", region: "Northeast" },
    { id: "c4", name: "Harborview Catering", region: "Northeast" },
    { id: "c5", name: "Palmetto Table Group", region: "Southeast" },
    { id: "c6", name: "Gulf Coast Hospitality", region: "Southeast" },
    { id: "c7", name: "Magnolia Diner Collective", region: "Southeast" },
    { id: "c8", name: "Sunbelt Food Services", region: "Southeast" },
    { id: "c9", name: "Prairie Kitchen Partners", region: "Midwest" },
    { id: "c10", name: "Lakeside Restaurant Group", region: "Midwest" },
    { id: "c11", name: "Heartland Café Co.", region: "Midwest" },
    { id: "c12", name: "Cornfield Catering", region: "Midwest" },
    { id: "c13", name: "Pacific Grove Bistros", region: "West" },
    { id: "c14", name: "Sierra Table Group", region: "West" },
    { id: "c15", name: "Coastline Dining Co.", region: "West" }
  ];

  // Stand-in customer numbers (e.g. "CUST-1001"), same idea as an ERP
  // account number — added by index rather than baked into the array
  // above so it stays consistent if the roster ever changes.
  CUSTOMERS.forEach(function (c, idx) { c.number = "CUST-" + (1001 + idx); });

  var ALL_CUSTOMER_IDS = CUSTOMERS.map(function (c) { return c.id; });

  // Only regions with at least one customer ever show up as a filter chip.
  // Recomputed from CUSTOMERS rather than hardcoded, so this stays correct
  // automatically if the mock roster changes later.
  var REGIONS = Array.from(new Set(CUSTOMERS.map(function (c) { return c.region; })));

  // Region names are filter option chrome (chip labels + the small region
  // tag shown per customer in the filter list) — not report row data (no
  // report column ever displays "region"), so these translate.
  var REGION_LABEL_KEYS = {
    "Northeast": "reporting.filters.region.northeast",
    "Southeast": "reporting.filters.region.southeast",
    "Midwest": "reporting.filters.region.midwest",
    "West": "reporting.filters.region.west"
  };
  function getRegionLabel(region) {
    var key = REGION_LABEL_KEYS[region];
    return key ? t(key, region) : region;
  }

  var MS_PER_DAY = 24 * 60 * 60 * 1000;
  var LOOKBACK_DAYS = 730; // ~2 years

  // ------------------------------------------------------------------------
  // DATE HELPERS
  // ------------------------------------------------------------------------
  function toISODate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseISODate(iso) {
    var parts = iso.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function getYesterday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setTime(d.getTime() - MS_PER_DAY);
    return d;
  }

  function formatDisplayDate(iso) {
    return parseISODate(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  var yesterday = getYesterday();
  var maxDateISO = toISODate(yesterday);
  var minDateISO = toISODate(new Date(yesterday.getTime() - LOOKBACK_DAYS * MS_PER_DAY));

  var defaultStart = new Date(yesterday.getTime() - 29 * MS_PER_DAY); // trailing 30 days

  // ------------------------------------------------------------------------
  // MOCK PURCHASING DATA (Invoice History / Invoice Details)
  // A fixed ~2-year invoice history is generated once per customer using a
  // seeded PRNG (mulberry32), keyed off the customer's id. That means the
  // "historic" invoices are stable across filter changes and page
  // reloads — narrowing the date range or customer list filters this
  // fixed dataset down, it never regenerates different numbers each time,
  // which is what makes sorting/paging feel trustworthy across changes.
  // ------------------------------------------------------------------------
  // Class > Category > Group > Product is the same hierarchy real SKUs are
  // built on. Only Purchase Details (R4) surfaces all of it — Summary and
  // Trends just use number/description/price/weight.
  var PRODUCTS = [
    { number: "P-1001", description: "Frozen Gulf Shrimp 21/25, 5lb Bag", price: 62.5, weight: 5,
      sku: "SKU-70001", manufacturer: "Coastal Seafood Co.", storageType: "Frozen",
      classNumber: "CL-30", classDescription: "Seafood", categoryNumber: "CAT-310", categoryDescription: "Shellfish",
      groupNumber: "GRP-3101", groupDescription: "Shrimp" },
    { number: "P-1002", description: "Diced Tomatoes, #10 Can", price: 11.95, weight: 6.5,
      sku: "SKU-70002", manufacturer: "Sunfield Canning Co.", storageType: "Dry",
      classNumber: "CL-50", classDescription: "Grocery & Dry Goods", categoryNumber: "CAT-510", categoryDescription: "Canned Goods",
      groupNumber: "GRP-5101", groupDescription: "Vegetables" },
    { number: "P-1003", description: "Idaho Russet Potatoes, 50lb Case", price: 24.1, weight: 50,
      sku: "SKU-70003", manufacturer: "Harvest Valley Farms", storageType: "Dry",
      classNumber: "CL-10", classDescription: "Produce", categoryNumber: "CAT-110", categoryDescription: "Fresh Vegetables",
      groupNumber: "GRP-1101", groupDescription: "Potatoes" },
    { number: "P-1004", description: "Boneless Skinless Chicken Breast, 40lb Case", price: 88.4, weight: 40,
      sku: "SKU-70004", manufacturer: "Blue Ridge Poultry", storageType: "Frozen",
      classNumber: "CL-20", classDescription: "Meat & Poultry", categoryNumber: "CAT-210", categoryDescription: "Poultry",
      groupNumber: "GRP-2101", groupDescription: "Chicken" },
    { number: "P-1005", description: "Shredded Mozzarella Cheese, 5lb Bag", price: 19.75, weight: 5,
      sku: "SKU-70005", manufacturer: "Prairie Dairy Co.", storageType: "Refrigerated",
      classNumber: "CL-40", classDescription: "Dairy", categoryNumber: "CAT-410", categoryDescription: "Cheese",
      groupNumber: "GRP-4101", groupDescription: "Shredded Cheese" },
    { number: "P-1006", description: "Romaine Lettuce, 24-Count Case", price: 27.3, weight: 24,
      sku: "SKU-70006", manufacturer: "Harvest Valley Farms", storageType: "Refrigerated",
      classNumber: "CL-10", classDescription: "Produce", categoryNumber: "CAT-110", categoryDescription: "Fresh Vegetables",
      groupNumber: "GRP-1103", groupDescription: "Lettuce" },
    { number: "P-1007", description: "All-Purpose Flour, 50lb Bag", price: 18.6, weight: 50,
      sku: "SKU-70007", manufacturer: "Golden Fields Milling", storageType: "Dry",
      classNumber: "CL-50", classDescription: "Grocery & Dry Goods", categoryNumber: "CAT-520", categoryDescription: "Baking",
      groupNumber: "GRP-5201", groupDescription: "Flour" },
    { number: "P-1008", description: "Yellow Onions, 50lb Sack", price: 21.2, weight: 50,
      sku: "SKU-70008", manufacturer: "Harvest Valley Farms", storageType: "Dry",
      classNumber: "CL-10", classDescription: "Produce", categoryNumber: "CAT-110", categoryDescription: "Fresh Vegetables",
      groupNumber: "GRP-1102", groupDescription: "Onions" },
    { number: "P-1009", description: "Ground Beef 80/20, 40lb Case", price: 118.0, weight: 40,
      sku: "SKU-70009", manufacturer: "Blue Ridge Meats", storageType: "Frozen",
      classNumber: "CL-20", classDescription: "Meat & Poultry", categoryNumber: "CAT-220", categoryDescription: "Beef",
      groupNumber: "GRP-2201", groupDescription: "Ground Beef" },
    { number: "P-1010", description: "Vegetable Oil, 35lb Jug", price: 42.9, weight: 35,
      sku: "SKU-70010", manufacturer: "Golden Fields Milling", storageType: "Dry",
      classNumber: "CL-50", classDescription: "Grocery & Dry Goods", categoryNumber: "CAT-530", categoryDescription: "Oils & Shortening",
      groupNumber: "GRP-5301", groupDescription: "Vegetable Oil" },
    { number: "P-1011", description: "Long Grain White Rice, 50lb Bag", price: 26.4, weight: 50,
      sku: "SKU-70011", manufacturer: "Golden Fields Milling", storageType: "Dry",
      classNumber: "CL-50", classDescription: "Grocery & Dry Goods", categoryNumber: "CAT-540", categoryDescription: "Rice & Grains",
      groupNumber: "GRP-5401", groupDescription: "Rice" },
    { number: "P-1012", description: "Atlantic Salmon Fillets, 10lb Case", price: 96.75, weight: 10,
      sku: "SKU-70012", manufacturer: "Coastal Seafood Co.", storageType: "Frozen",
      classNumber: "CL-30", classDescription: "Seafood", categoryNumber: "CAT-320", categoryDescription: "Finfish",
      groupNumber: "GRP-3201", groupDescription: "Salmon" }
  ];

  var PRODUCTS_BY_NUMBER = {};
  PRODUCTS.forEach(function (p) { PRODUCTS_BY_NUMBER[p.number] = p; });

  // The 3 calendar months Purchase Trends compares — computed once from
  // "yesterday" (the latest date the mock ETL would have loaded), not
  // hardcoded, so this stays correct whenever the demo is opened. The
  // current month is partial (through yesterday); the two before it are
  // full calendar months.
  var TREND_MONTHS = [0, 1, 2].map(function (monthsAgo) {
    var base = new Date(yesterday.getFullYear(), yesterday.getMonth() - monthsAgo, 1);
    return {
      year: base.getFullYear(),
      month: base.getMonth(),
      maxDay: monthsAgo === 0 ? yesterday.getDate() : null,
      label: base.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    };
  });

  function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var ALL_INVOICES = (function generateInvoices() {
    var invoices = [];
    var invoiceCounter = 20000;
    var earliestMs = parseISODate(minDateISO).getTime();
    var latestMs = parseISODate(maxDateISO).getTime();

    CUSTOMERS.forEach(function (customer) {
      if (customer.neverPurchases) return; // guaranteed zero-data customer, on purpose

      var rng = mulberry32(hashString(customer.id));
      var cursor = earliestMs + Math.floor(rng() * 14) * MS_PER_DAY;

      while (cursor <= latestMs) {
        invoiceCounter += 1;
        var lineItemCount = 2 + Math.floor(rng() * 3); // 2–4 line items
        var lineItems = [];

        for (var i = 0; i < lineItemCount; i++) {
          var product = PRODUCTS[Math.floor(rng() * PRODUCTS.length)];
          var cases = 1 + Math.floor(rng() * 12);
          lineItems.push({
            product: product,
            cases: cases,
            amount: Math.round(product.price * cases * 100) / 100,
            weight: Math.round(product.weight * cases * 10) / 10
          });
        }

        var totalAmount = lineItems.reduce(function (sum, li) { return sum + li.amount; }, 0);
        var totalCases = lineItems.reduce(function (sum, li) { return sum + li.cases; }, 0);
        var totalWeight = lineItems.reduce(function (sum, li) { return sum + li.weight; }, 0);

        invoices.push({
          invoiceNumber: "INV-" + invoiceCounter,
          invoiceDate: toISODate(new Date(cursor)),
          customer: customer,
          lineItems: lineItems,
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalCases: totalCases,
          totalWeight: Math.round(totalWeight * 10) / 10
        });

        // Roughly one invoice every 12–24 days per customer.
        cursor += (12 + Math.floor(rng() * 13)) * MS_PER_DAY;
      }
    });

    return invoices;
  })();

  function getFilteredInvoices() {
    var startMs = parseISODate(state.startDate).getTime();
    var endMs = parseISODate(state.endDate).getTime();
    return ALL_INVOICES.filter(function (inv) {
      var ms = parseISODate(inv.invoiceDate).getTime();
      return ms >= startMs && ms <= endMs && state.customerIds.indexOf(inv.customer.id) !== -1;
    });
  }

  function buildInvoiceHistoryRows() {
    return getFilteredInvoices().map(function (inv) {
      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerName: inv.customer.name,
        customerNumber: inv.customer.number,
        totalAmount: inv.totalAmount,
        totalCases: inv.totalCases,
        totalWeight: inv.totalWeight
      };
    });
  }

  function buildInvoiceDetailsRows() {
    var rows = [];
    getFilteredInvoices().forEach(function (inv) {
      inv.lineItems.forEach(function (li) {
        rows.push({
          productNumber: li.product.number,
          productDescription: li.product.description,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customer.name,
          customerNumber: inv.customer.number,
          totalAmount: li.amount,
          totalCases: li.cases,
          totalWeight: li.weight
        });
      });
    });
    return rows;
  }

  function isDateInMonth(dateISO, year, month, maxDay) {
    var d = parseISODate(dateISO);
    if (d.getFullYear() !== year || d.getMonth() !== month) return false;
    if (maxDay != null && d.getDate() > maxDay) return false;
    return true;
  }

  // Product Usage's 3 reports all aggregate the same underlying line
  // items Invoice Details already uses — a real reporting tool would pull
  // these from the same fact table, just grouped differently.
  function buildPurchaseSummaryRows() {
    var totals = {};
    getFilteredInvoices().forEach(function (inv) {
      inv.lineItems.forEach(function (li) {
        var key = li.product.number;
        if (!totals[key]) {
          totals[key] = { product: li.product, amount: 0, cases: 0, weight: 0 };
        }
        totals[key].amount += li.amount;
        totals[key].cases += li.cases;
        totals[key].weight += li.weight;
      });
    });
    return Object.keys(totals).map(function (key) {
      var t = totals[key];
      return {
        productNumber: t.product.number,
        productDescription: t.product.description,
        totalAmount: Math.round(t.amount * 100) / 100,
        totalCases: t.cases,
        totalWeight: Math.round(t.weight * 10) / 10
      };
    });
  }

  function buildPurchaseDetailsRows() {
    return buildPurchaseSummaryRows().map(function (row) {
      var product = PRODUCTS_BY_NUMBER[row.productNumber];
      return {
        productNumber: row.productNumber,
        productDescription: row.productDescription,
        sku: product.sku,
        manufacturer: product.manufacturer,
        storageType: product.storageType,
        classNumber: product.classNumber,
        classDescription: product.classDescription,
        categoryNumber: product.categoryNumber,
        categoryDescription: product.categoryDescription,
        groupNumber: product.groupNumber,
        groupDescription: product.groupDescription,
        totalAmount: row.totalAmount,
        totalCases: row.totalCases,
        totalWeight: row.totalWeight
      };
    });
  }

  // ------------------------------------------------------------------------
  // MOCK CONTRACT TABLE (Compliance section)
  // Stands in for a real "customer contract terms" table: for every
  // customer × product pairing, whether that specific combination is
  // currently under a purchase contract (bigger committed volume, better
  // price). Real contract rules — volume tiers, effective dates, renewal
  // terms — are intentionally NOT modeled here; Tony's call was to mock
  // this rather than build it out. Deterministic (seeded per
  // customer+product pair) so the same combination is always contracted
  // or not, across reloads and filter changes.
  // ------------------------------------------------------------------------
  var CONTRACT_TABLE = (function buildContractTable() {
    var table = {}; // "customerId::productNumber" -> boolean
    CUSTOMERS.forEach(function (customer) {
      if (customer.neverPurchases) return;
      PRODUCTS.forEach(function (product) {
        var rng = mulberry32(hashString(customer.id + "::" + product.number));
        table[customer.id + "::" + product.number] = rng() < 0.55;
      });
    });
    return table;
  })();

  function isContracted(customerId, productNumber) {
    return !!CONTRACT_TABLE[customerId + "::" + productNumber];
  }

  // Mimics Purchase Summary (Product #, Product Description, Total $,
  // Cases, Weight), grouped by product across the filtered invoices, plus
  // Contracted $ / Contracted Cases and their % of the product's total —
  // a simple rule-of-three against the mock contract table above.
  function buildComplianceSummaryRows() {
    var totals = {};
    getFilteredInvoices().forEach(function (inv) {
      inv.lineItems.forEach(function (li) {
        var key = li.product.number;
        if (!totals[key]) {
          totals[key] = {
            product: li.product,
            amount: 0,
            cases: 0,
            weight: 0,
            contractedAmount: 0,
            contractedCases: 0
          };
        }
        totals[key].amount += li.amount;
        totals[key].cases += li.cases;
        totals[key].weight += li.weight;
        if (isContracted(inv.customer.id, li.product.number)) {
          totals[key].contractedAmount += li.amount;
          totals[key].contractedCases += li.cases;
        }
      });
    });

    return Object.keys(totals).map(function (key) {
      var t = totals[key];
      var pctAmount = t.amount === 0 ? 0 : (t.contractedAmount / t.amount) * 100;
      var pctCases = t.cases === 0 ? 0 : (t.contractedCases / t.cases) * 100;
      return {
        productNumber: t.product.number,
        productDescription: t.product.description,
        totalAmount: Math.round(t.amount * 100) / 100,
        contractedAmount: Math.round(t.contractedAmount * 100) / 100,
        contractedPctAmount: Math.round(pctAmount * 10) / 10,
        totalCases: t.cases,
        contractedCases: t.contractedCases,
        contractedPctCases: Math.round(pctCases * 10) / 10,
        totalWeight: Math.round(t.weight * 10) / 10
      };
    });
  }

  // Deliberately scoped to the customer/region filters only, NOT the
  // master date-range filter — the whole point of this report is a fixed
  // 3-calendar-month comparison, so the date-range picker doesn't
  // additionally narrow it. Flagged to Tony as a judgment call.
  function buildPurchaseTrendsRows() {
    var invoicesForCustomers = ALL_INVOICES.filter(function (inv) {
      return state.customerIds.indexOf(inv.customer.id) !== -1;
    });

    var totals = {}; // productNumber -> { product, m: [{amount,cases} x3] }

    invoicesForCustomers.forEach(function (inv) {
      inv.lineItems.forEach(function (li) {
        var key = li.product.number;
        if (!totals[key]) {
          totals[key] = {
            product: li.product,
            m: [{ amount: 0, cases: 0 }, { amount: 0, cases: 0 }, { amount: 0, cases: 0 }]
          };
        }
        TREND_MONTHS.forEach(function (m, idx) {
          if (isDateInMonth(inv.invoiceDate, m.year, m.month, m.maxDay)) {
            totals[key].m[idx].amount += li.amount;
            totals[key].m[idx].cases += li.cases;
          }
        });
      });
    });

    return Object.keys(totals).map(function (key) {
      var t = totals[key];
      return {
        productNumber: t.product.number,
        productDescription: t.product.description,
        m0Amount: Math.round(t.m[0].amount * 100) / 100,
        m1Amount: Math.round(t.m[1].amount * 100) / 100,
        m2Amount: Math.round(t.m[2].amount * 100) / 100,
        m0Cases: t.m[0].cases,
        m1Cases: t.m[1].cases,
        m2Cases: t.m[2].cases
      };
    });
  }

  // Naming convention kept consistent across every report on purpose:
  // "Total ($)" / "Cases" / "Weight (lb)" mean the same thing whether
  // they're an invoice total, a line item, or a product aggregate.
  // Column "label" strings below stay as the English fallback (same
  // pattern as the rest of the site); "labelKey" is what actually renders
  // once i18n.js is loaded, via dataTable.js's getColumnLabel(). These are
  // column HEADERS — chrome — never the generated row values underneath.
  var REPORTS = {
    "Invoice History": {
      columns: [
        { key: "invoiceNumber", label: "Invoice #", labelKey: "reporting.table.columnHeader.invoiceNumber" },
        { key: "invoiceDate", label: "Invoice Date", labelKey: "reporting.table.columnHeader.invoiceDate" },
        { key: "customerName", label: "Customer Name", labelKey: "reporting.table.columnHeader.customerName", truncate: true },
        { key: "customerNumber", label: "Customer #", labelKey: "reporting.table.columnHeader.customerNumber" },
        { key: "totalAmount", label: "Total ($)", labelKey: "reporting.table.columnHeader.total", numeric: true, currency: true },
        { key: "totalCases", label: "Cases", labelKey: "reporting.table.columnHeader.cases", numeric: true },
        { key: "totalWeight", label: "Weight (lb)", labelKey: "reporting.table.columnHeader.weight", numeric: true }
      ],
      getRows: buildInvoiceHistoryRows,
      defaultSortKey: "invoiceDate",
      defaultSortDir: "desc"
    },
    "Invoice Details": {
      columns: [
        { key: "productNumber", label: "Product #", labelKey: "reporting.table.columnHeader.productNumber" },
        { key: "productDescription", label: "Product Description", labelKey: "reporting.table.columnHeader.productDescription", truncate: true },
        { key: "invoiceNumber", label: "Invoice #", labelKey: "reporting.table.columnHeader.invoiceNumber" },
        { key: "invoiceDate", label: "Invoice Date", labelKey: "reporting.table.columnHeader.invoiceDate" },
        { key: "customerName", label: "Customer Name", labelKey: "reporting.table.columnHeader.customerName", truncate: true },
        { key: "customerNumber", label: "Customer #", labelKey: "reporting.table.columnHeader.customerNumber" },
        { key: "totalAmount", label: "Total ($)", labelKey: "reporting.table.columnHeader.total", numeric: true, currency: true },
        { key: "totalCases", label: "Cases", labelKey: "reporting.table.columnHeader.cases", numeric: true },
        { key: "totalWeight", label: "Weight (lb)", labelKey: "reporting.table.columnHeader.weight", numeric: true }
      ],
      getRows: buildInvoiceDetailsRows,
      defaultSortKey: "invoiceDate",
      defaultSortDir: "desc"
    },
    "Purchase Summary": {
      columns: [
        { key: "productNumber", label: "Product #", labelKey: "reporting.table.columnHeader.productNumber" },
        { key: "productDescription", label: "Product Description", labelKey: "reporting.table.columnHeader.productDescription", truncate: true },
        { key: "totalAmount", label: "Total ($)", labelKey: "reporting.table.columnHeader.total", numeric: true, currency: true },
        { key: "totalCases", label: "Cases", labelKey: "reporting.table.columnHeader.cases", numeric: true },
        { key: "totalWeight", label: "Weight (lb)", labelKey: "reporting.table.columnHeader.weight", numeric: true }
      ],
      getRows: buildPurchaseSummaryRows,
      defaultSortKey: "totalAmount",
      defaultSortDir: "desc"
    },
    "Purchase Trends": {
      // Month columns mix a real computed month/year (left in en-US, same
      // convention as every other date on this page) with a translated
      // unit suffix — labelFn recomputes that suffix live on langchange.
      columns: [
        { key: "productNumber", label: "Product #", labelKey: "reporting.table.columnHeader.productNumber" },
        { key: "productDescription", label: "Product Description", labelKey: "reporting.table.columnHeader.productDescription", truncate: true },
        { key: "m0Amount", label: TREND_MONTHS[0].label + " ($)", labelFn: function () { return TREND_MONTHS[0].label + " (" + t("reporting.table.columnHeader.dollarsUnit", "$") + ")"; }, numeric: true, currency: true },
        { key: "m1Amount", label: TREND_MONTHS[1].label + " ($)", labelFn: function () { return TREND_MONTHS[1].label + " (" + t("reporting.table.columnHeader.dollarsUnit", "$") + ")"; }, numeric: true, currency: true },
        { key: "m2Amount", label: TREND_MONTHS[2].label + " ($)", labelFn: function () { return TREND_MONTHS[2].label + " (" + t("reporting.table.columnHeader.dollarsUnit", "$") + ")"; }, numeric: true, currency: true },
        { key: "m0Cases", label: TREND_MONTHS[0].label + " (Cases)", labelFn: function () { return TREND_MONTHS[0].label + " (" + t("reporting.table.columnHeader.casesUnit", "Cases") + ")"; }, numeric: true },
        { key: "m1Cases", label: TREND_MONTHS[1].label + " (Cases)", labelFn: function () { return TREND_MONTHS[1].label + " (" + t("reporting.table.columnHeader.casesUnit", "Cases") + ")"; }, numeric: true },
        { key: "m2Cases", label: TREND_MONTHS[2].label + " (Cases)", labelFn: function () { return TREND_MONTHS[2].label + " (" + t("reporting.table.columnHeader.casesUnit", "Cases") + ")"; }, numeric: true }
      ],
      getRows: buildPurchaseTrendsRows,
      defaultSortKey: "m0Amount",
      defaultSortDir: "desc"
    },
    "Purchase Details": {
      columns: [
        { key: "productNumber", label: "Product #", labelKey: "reporting.table.columnHeader.productNumber" },
        { key: "productDescription", label: "Product Description", labelKey: "reporting.table.columnHeader.productDescription", truncate: true },
        { key: "sku", label: "SKU", labelKey: "reporting.table.columnHeader.sku" },
        { key: "manufacturer", label: "Manufacturer Name", labelKey: "reporting.table.columnHeader.manufacturer", truncate: true },
        { key: "storageType", label: "Storage Type", labelKey: "reporting.table.columnHeader.storageType" },
        { key: "classNumber", label: "Class #", labelKey: "reporting.table.columnHeader.classNumber" },
        { key: "classDescription", label: "Class Description", labelKey: "reporting.table.columnHeader.classDescription", truncate: true },
        { key: "categoryNumber", label: "Category #", labelKey: "reporting.table.columnHeader.categoryNumber" },
        { key: "categoryDescription", label: "Category Description", labelKey: "reporting.table.columnHeader.categoryDescription", truncate: true },
        { key: "groupNumber", label: "Group #", labelKey: "reporting.table.columnHeader.groupNumber" },
        { key: "groupDescription", label: "Group Description", labelKey: "reporting.table.columnHeader.groupDescription", truncate: true },
        { key: "totalAmount", label: "Total ($)", labelKey: "reporting.table.columnHeader.total", numeric: true, currency: true },
        { key: "totalCases", label: "Cases", labelKey: "reporting.table.columnHeader.cases", numeric: true },
        { key: "totalWeight", label: "Weight (lb)", labelKey: "reporting.table.columnHeader.weight", numeric: true }
      ],
      getRows: buildPurchaseDetailsRows,
      defaultSortKey: "totalAmount",
      defaultSortDir: "desc"
    },
    "Compliance Summary": {
      columns: [
        { key: "productNumber", label: "Product #", labelKey: "reporting.table.columnHeader.productNumber" },
        { key: "productDescription", label: "Product Description", labelKey: "reporting.table.columnHeader.productDescription", truncate: true },
        { key: "totalAmount", label: "Total ($)", labelKey: "reporting.table.columnHeader.total", numeric: true, currency: true },
        { key: "contractedAmount", label: "Contracted ($)", labelKey: "reporting.table.columnHeader.contractedAmount", numeric: true, currency: true },
        { key: "contractedPctAmount", label: "Contracted % ($)", labelKey: "reporting.table.columnHeader.contractedPctAmount", numeric: true, percent: true },
        { key: "totalCases", label: "Cases", labelKey: "reporting.table.columnHeader.cases", numeric: true },
        { key: "contractedCases", label: "Contracted Cases", labelKey: "reporting.table.columnHeader.contractedCases", numeric: true },
        { key: "contractedPctCases", label: "Contracted % (Cases)", labelKey: "reporting.table.columnHeader.contractedPctCases", numeric: true, percent: true },
        { key: "totalWeight", label: "Weight (lb)", labelKey: "reporting.table.columnHeader.weight", numeric: true }
      ],
      getRows: buildComplianceSummaryRows,
      defaultSortKey: "totalAmount",
      defaultSortDir: "desc"
    }
  };

  // Maps each fixed report name (used as both a REPORTS/segment-button
  // display string and, unrelated, as the REPORTS object's lookup key) to
  // its translated display label. The English name itself keeps being
  // used internally for lookups (REPORTS[name], dataset.reportName, the
  // History entries below) — only what's shown on screen changes.
  var REPORT_NAME_KEYS = {
    "Invoice History": "reporting.reportName.invoiceHistory",
    "Invoice Details": "reporting.reportName.invoiceDetails",
    "Purchase Summary": "reporting.reportName.purchaseSummary",
    "Purchase Trends": "reporting.reportName.purchaseTrends",
    "Purchase Details": "reporting.reportName.purchaseDetails",
    "Compliance Summary": "reporting.reportName.complianceSummary"
  };
  function getReportDisplayName(reportName) {
    var key = REPORT_NAME_KEYS[reportName];
    return key ? t(key, reportName) : reportName;
  }

  // ------------------------------------------------------------------------
  // FILTER STATE
  // "state" is the last *applied* filters (what the rest of the page reads).
  // "pending" is a working copy edited inside the open flyout; it's only
  // copied into "state" when the user clicks Apply.
  // ------------------------------------------------------------------------
  var state = {
    startDate: toISODate(defaultStart),
    endDate: maxDateISO,
    customerIds: ALL_CUSTOMER_IDS.slice(),
    regions: [] // empty = no region filter = every customer is eligible
  };

  var pending = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Customers currently selectable given pending.regions (or all customers
  // if no region is selected — "no filter, no problem").
  function visibleCustomers(regions) {
    if (!regions || regions.length === 0) return CUSTOMERS;
    return CUSTOMERS.filter(function (c) { return regions.indexOf(c.region) !== -1; });
  }

  // ------------------------------------------------------------------------
  // DOM REFERENCES
  // ------------------------------------------------------------------------
  var summaryBtn = document.getElementById("filterSummaryBtn");
  var summaryText = document.getElementById("filterSummaryText");
  var flyout = document.getElementById("filterFlyout");
  var closeBtn = document.getElementById("filterCloseBtn");
  var startInput = document.getElementById("filterStartDate");
  var endInput = document.getElementById("filterEndDate");
  var dateError = document.getElementById("dateError");
  var regionChipGroup = document.getElementById("regionChipGroup");
  var customerList = document.getElementById("customerList");
  var customerError = document.getElementById("customerError");
  var applyBtn = document.getElementById("filterApplyBtn");
  var resetBtn = document.getElementById("filterResetBtn");
  var selectAllBtn = document.getElementById("selectAllBtn");
  var filtersDetailLine = document.getElementById("filtersDetailLine");

  if (!summaryBtn || !flyout) return; // safety net if markup isn't present

  // ------------------------------------------------------------------------
  // RENDERING
  // ------------------------------------------------------------------------
  // "Filters (n)" — n = every selected customer, +1 for the date range
  // (always active), + every selected region (0 if none). Keeps the
  // button itself short; the actual date/customer/region summary now
  // lives near the "Table Views" heading instead (see filtersDetailLine).
  function countActiveFilters() {
    return state.customerIds.length + 1 + state.regions.length;
  }

  function renderSummary() {
    summaryText.textContent = t("reporting.filters.summaryLabel", "Filters") + " (" + countActiveFilters() + ")";

    var custCount = state.customerIds.length;
    var custNoun = custCount === 1
      ? t("reporting.filters.customerSingular", "customer")
      : t("reporting.filters.customerPlural", "customers");
    var custLabel = custCount === CUSTOMERS.length
      ? t("reporting.filters.allCustomersPrefix", "All") + " " + custCount + " " + custNoun
      : custCount + " " + custNoun;
    var regionLabel = state.regions.length === 0
      ? t("reporting.filters.allRegions", "All regions")
      : state.regions.map(getRegionLabel).join(", ");

    if (filtersDetailLine) {
      filtersDetailLine.textContent =
        formatDisplayDate(state.startDate) + " – " + formatDisplayDate(state.endDate) +
        " · " + custLabel + " · " + regionLabel;
    }
  }

  function renderRegionChips() {
    regionChipGroup.innerHTML = "";
    REGIONS.forEach(function (region) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "rpt-chip";
      if (pending.regions.indexOf(region) !== -1) chip.classList.add("is-active");
      chip.textContent = getRegionLabel(region);
      chip.setAttribute("aria-pressed", pending.regions.indexOf(region) !== -1 ? "true" : "false");
      chip.addEventListener("click", function () {
        var idx = pending.regions.indexOf(region);
        if (idx === -1) {
          pending.regions.push(region);
        } else {
          pending.regions.splice(idx, 1);
        }
        // Narrowing (or widening) the region set changes which customers
        // are selectable — drop any pending selection that's no longer
        // visible. If that would leave zero customers checked, fall back
        // to selecting everyone still visible so the "at least one" rule
        // never gets violated by a region change alone.
        var visible = visibleCustomers(pending.regions).map(function (c) { return c.id; });
        pending.customerIds = pending.customerIds.filter(function (id) {
          return visible.indexOf(id) !== -1;
        });
        if (pending.customerIds.length === 0) {
          pending.customerIds = visible.slice();
        }
        renderRegionChips();
        renderCustomerList();
        validate();
      });
      regionChipGroup.appendChild(chip);
    });
  }

  function updateSelectAllLabel() {
    if (!selectAllBtn) return;
    var visible = visibleCustomers(pending.regions);
    var allChecked = visible.length > 0 && visible.every(function (c) {
      return pending.customerIds.indexOf(c.id) !== -1;
    });
    selectAllBtn.textContent = allChecked
      ? t("reporting.filters.unselectAll", "Unselect all")
      : t("reporting.filters.selectAll", "Select all");
  }

  function renderCustomerList() {
    customerList.innerHTML = "";
    var visible = visibleCustomers(pending.regions);
    visible.forEach(function (customer) {
      var item = document.createElement("label");
      item.className = "rpt-customer-item";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = pending.customerIds.indexOf(customer.id) !== -1;
      checkbox.addEventListener("change", function () {
        var idx = pending.customerIds.indexOf(customer.id);
        // Unchecking down to zero is allowed now — Apply just gets
        // disabled with a "select at least one customer" message (see
        // validate()) instead of silently forcing the box back on.
        if (checkbox.checked && idx === -1) {
          pending.customerIds.push(customer.id);
        } else if (!checkbox.checked && idx !== -1) {
          pending.customerIds.splice(idx, 1);
        }
        updateSelectAllLabel();
        validate();
      });

      var name = document.createElement("span");
      name.className = "rpt-customer-name";
      name.textContent = customer.name;
      name.title = customer.name; // full name on hover if it ever truncates

      var region = document.createElement("span");
      region.className = "rpt-customer-region";
      region.textContent = getRegionLabel(customer.region);

      item.appendChild(checkbox);
      item.appendChild(name);
      item.appendChild(region);
      customerList.appendChild(item);
    });

    updateSelectAllLabel();
  }

  function validate() {
    var valid = true;

    if (pending.startDate > pending.endDate) {
      dateError.textContent = t("reporting.filters.dateError", "Start date must be on or before the end date.");
      dateError.hidden = false;
      valid = false;
    } else {
      dateError.hidden = true;
    }

    if (pending.customerIds.length === 0) {
      customerError.hidden = false;
      valid = false;
    } else {
      customerError.hidden = true;
    }

    applyBtn.disabled = !valid;
    applyBtn.style.opacity = valid ? "1" : "0.5";
    applyBtn.style.cursor = valid ? "pointer" : "not-allowed";
    return valid;
  }

  // ------------------------------------------------------------------------
  // FLYOUT OPEN / CLOSE
  // ------------------------------------------------------------------------
  function openFlyout() {
    pending = clone(state);
    startInput.value = pending.startDate;
    endInput.value = pending.endDate;
    renderRegionChips();
    renderCustomerList();
    validate();

    flyout.classList.add("is-open");
    summaryBtn.setAttribute("aria-expanded", "true");
    document.addEventListener("click", handleOutsideClick, true);
    document.addEventListener("keydown", handleEscape);
  }

  function closeFlyout() {
    flyout.classList.remove("is-open");
    summaryBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", handleOutsideClick, true);
    document.removeEventListener("keydown", handleEscape);
  }

  function handleOutsideClick(event) {
    if (!flyout.contains(event.target) && !summaryBtn.contains(event.target)) {
      closeFlyout();
    }
  }

  function handleEscape(event) {
    if (event.key === "Escape") closeFlyout();
  }

  summaryBtn.addEventListener("click", function () {
    if (flyout.classList.contains("is-open")) {
      closeFlyout();
    } else {
      openFlyout();
    }
  });

  closeBtn.addEventListener("click", closeFlyout);

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", function () {
      var visible = visibleCustomers(pending.regions);
      var visibleIds = visible.map(function (c) { return c.id; });
      var allChecked = visible.length > 0 && visible.every(function (c) {
        return pending.customerIds.indexOf(c.id) !== -1;
      });

      if (allChecked) {
        pending.customerIds = pending.customerIds.filter(function (id) {
          return visibleIds.indexOf(id) === -1;
        });
      } else {
        visibleIds.forEach(function (id) {
          if (pending.customerIds.indexOf(id) === -1) pending.customerIds.push(id);
        });
      }

      renderCustomerList();
      validate();
    });
  }

  startInput.addEventListener("change", function () {
    pending.startDate = startInput.value;
    validate();
  });

  endInput.addEventListener("change", function () {
    pending.endDate = endInput.value;
    validate();
  });

  resetBtn.addEventListener("click", function () {
    pending = {
      startDate: toISODate(defaultStart),
      endDate: maxDateISO,
      customerIds: ALL_CUSTOMER_IDS.slice(),
      regions: []
    };
    startInput.value = pending.startDate;
    endInput.value = pending.endDate;
    renderRegionChips();
    renderCustomerList();
    validate();
  });

  applyBtn.addEventListener("click", function () {
    if (!validate()) return;
    state = clone(pending);
    renderSummary();
    closeFlyout();
    runSkeleton();
    // Refresh happens immediately underneath the skeleton overlay — since
    // the overlay hides the real content while .is-loading is set, the
    // updated rows only become visible once the 1-second skeleton clears.
    if (activeSectionKey) renderActiveReportContent();
    renderClassChart();
    renderTopProducts();
  });

  [startInput, endInput].forEach(function (input) {
    input.min = minDateISO;
    input.max = maxDateISO;
  });

  // ------------------------------------------------------------------------
  // SKELETON LOADING
  // Fires for ~1 second on every element tagged data-skeleton-target, by
  // default. Pass a specific element (or array of elements) to scope the
  // skeleton to just that one — used whenever only one report/chart
  // actually changed (switching the active report within a section,
  // toggling a chart's $/cases metric) so the other, untouched
  // reports/charts don't grey out along with it. The master Apply button
  // is the one case that legitimately affects everything at once, so it
  // still calls this with no argument.
  // ------------------------------------------------------------------------
  function runSkeleton(scope) {
    var targets = scope
      ? (Array.isArray(scope) ? scope : [scope])
      : Array.prototype.slice.call(document.querySelectorAll("[data-skeleton-target]"));
    targets.forEach(function (el) { el.classList.add("is-loading"); });
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.remove("is-loading"); });
    }, 1000);
  }

  // ------------------------------------------------------------------------
  // SECTION CARDS + ACTIVE REPORT AREA
  // Only one section is ever "open" at a time (confirmed with Tony).
  // Clicking a live card opens the shared area below with that section's
  // report switcher. Reports with a REPORTS[...] entry (Invoice History's
  // two, as of R3) get a real interactive table; reports that don't have
  // one yet (Product Usage's three, until R4) fall back to a stub note —
  // same shared area either way.
  // ------------------------------------------------------------------------
  var SECTIONS = {
    invoiceHistory: {
      title: "Invoice History",
      titleKey: "reporting.section.invoiceHistory.title",
      reports: ["Invoice History", "Invoice Details"]
    },
    productUsage: {
      title: "Product Usage",
      titleKey: "reporting.section.productUsage.title",
      reports: ["Purchase Summary", "Purchase Trends", "Purchase Details"]
    },
    compliance: {
      title: "Compliance",
      titleKey: "reporting.section.compliance.title",
      reports: ["Compliance Summary"]
    }
  };
  function getSectionDisplayTitle(sectionKey) {
    var section = SECTIONS[sectionKey];
    return t(section.titleKey, section.title);
  }

  var sectionCards = document.querySelectorAll(".rpt-section-card[data-section]");
  var activeReport = document.getElementById("activeReport");
  var activeReportTitle = document.getElementById("activeReportTitle");
  var segmentGroup = document.getElementById("reportSegmentGroup");
  var activeReportTableHost = document.getElementById("activeReportTableHost");
  var activeReportStub = document.getElementById("activeReportStub");

  var activeSectionKey = null;
  var activeReportName = null;
  var currentTableInstance = null;
  var currentTableReportName = null;
  // Tracks which section's buttons are currently built, so switching the
  // active report *within* the same section only toggles the existing
  // buttons' classes (letting the CSS transition actually animate
  // between two states of the same element) instead of tearing the
  // whole segment group down and rebuilding it from scratch every time.
  var segmentGroupSectionKey = null;

  // Mounts (or refreshes) the real table for whatever report is currently
  // selected, or falls back to the "coming in a later slice" stub if that
  // report doesn't have a REPORTS[...] entry yet.
  function renderActiveReportContent() {
    var reportDef = REPORTS[activeReportName];

    if (!reportDef) {
      currentTableInstance = null;
      currentTableReportName = null;
      activeReportTableHost.hidden = true;
      activeReportTableHost.innerHTML = "";
      activeReportStub.hidden = false;
      activeReportStub.textContent =
        t("reporting.stub.prefix", "The interactive table for “") +
        getReportDisplayName(activeReportName) +
        t("reporting.stub.suffix", "” lands in a later slice.");
      return;
    }

    activeReportStub.hidden = true;
    activeReportTableHost.hidden = false;

    if (currentTableInstance && currentTableReportName === activeReportName) {
      // Same report, just re-read getRows() — keeps the visitor's search,
      // sort, and column order intact across a filter change.
      currentTableInstance.refresh();
    } else {
      currentTableInstance = window.RptDataTable({
        container: activeReportTableHost,
        columns: reportDef.columns,
        getRows: reportDef.getRows,
        pageSize: 10,
        defaultSortKey: reportDef.defaultSortKey,
        defaultSortDir: reportDef.defaultSortDir,
        exportFilename: activeReportName.replace(/\s+/g, "-").toLowerCase()
      });
      currentTableReportName = activeReportName;
    }
  }

  // Only rebuilds the buttons when the section itself changed (a
  // different section has a different set of reports); switching which
  // report is active within the same section just updates the existing
  // buttons' state below, so their "is-active" background/color
  // transition actually animates instead of popping between two
  // freshly-created elements.
  function renderSegmentGroup() {
    var section = SECTIONS[activeSectionKey];

    if (segmentGroupSectionKey !== activeSectionKey) {
      segmentGroup.innerHTML = "";
      section.reports.forEach(function (reportName) {
        var seg = document.createElement("button");
        seg.type = "button";
        seg.className = "rpt-segment";
        seg.textContent = getReportDisplayName(reportName);
        seg.dataset.reportName = reportName;
        seg.addEventListener("click", function () {
          if (reportName === activeReportName) return;
          activeReportName = reportName;
          activeReportTitle.textContent = getReportDisplayName(activeReportName);
          updateSegmentGroupState();
          runSkeleton(activeReport);
          renderActiveReportContent();
        });
        segmentGroup.appendChild(seg);
      });
      segmentGroupSectionKey = activeSectionKey;
    }

    updateSegmentGroupState();
  }

  function updateSegmentGroupState() {
    Array.prototype.forEach.call(segmentGroup.children, function (btn) {
      var isActive = btn.dataset.reportName === activeReportName;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  // Custom-eased scroll, not the browser's built-in scrollIntoView. That
  // was scrolling to fit the *entire* report area — header, table,
  // pagination — into view, which for a tall report meant a much bigger
  // (and, at the native "smooth" speed, faster-feeling) jump than
  // clicking a section card should cause. This instead scrolls just
  // enough to bring the report's own title below the sticky nav + filter
  // bar, at a calmer, fixed pace — friendlier if you're clicking through
  // several sections in a row.
  function smoothScrollTo(targetY, duration) {
    var startY = window.pageYOffset;
    var distance = targetY - startY;
    if (Math.abs(distance) < 1) return;
    var startTime = null;

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutQuad(progress));
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  // Nav (65px) plus the sticky filter bar just below it, plus a little
  // breathing room — so the report's title doesn't land tucked right
  // under them.
  var STICKY_HEADER_OFFSET = 130;

  function scrollToActiveReport() {
    var targetY = activeReport.getBoundingClientRect().top + window.pageYOffset - STICKY_HEADER_OFFSET;
    smoothScrollTo(Math.max(targetY, 0), 500);
  }

  function openSection(sectionKey) {
    activeSectionKey = sectionKey;
    var section = SECTIONS[sectionKey];
    activeReportName = section.reports[0];

    sectionCards.forEach(function (card) {
      card.classList.toggle("is-active", card.getAttribute("data-section") === sectionKey);
    });

    renderSegmentGroup();
    activeReport.classList.add("is-open");
    activeReportTitle.textContent = getReportDisplayName(activeReportName);
    scrollToActiveReport();
    runSkeleton(activeReport);
    renderActiveReportContent();
  }

  // Matches the site's existing 768px breakpoint. Below it there's no
  // table view at all (per Tony's call) — tapping a section opens the
  // mobile download flyout instead of the inline table area.
  function isMobileViewport() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  sectionCards.forEach(function (card) {
    card.addEventListener("click", function () {
      var sectionKey = card.getAttribute("data-section");
      if (isMobileViewport()) {
        openMobileReportFlyout(sectionKey);
      } else {
        openSection(sectionKey);
      }
    });
  });

  // ------------------------------------------------------------------------
  // MOBILE REPORT DOWNLOAD FLYOUT (Slice R5)
  // On small screens there's no interactive table at all — tapping a
  // section opens this bottom-sheet flyout instead, listing that
  // section's reports with a direct CSV/Excel download for each (no
  // in-page table to browse first). Any report without a REPORTS[...]
  // entry just shows "Coming soon" instead of buttons — a safety net,
  // not describing anything currently unbuilt.
  // ------------------------------------------------------------------------
  var mobileBackdrop = document.getElementById("mobileReportBackdrop");
  var mobileFlyout = document.getElementById("mobileReportFlyout");
  var mobileFlyoutTitle = document.getElementById("mobileReportFlyoutTitle");
  var mobileReportList = document.getElementById("mobileReportList");
  var mobileCloseBtn = document.getElementById("mobileReportCloseBtn");
  // Tracks whichever section's reports are currently listed in the mobile
  // flyout, purely so a langchange while it's open can re-render its
  // chrome (title, report names, "Coming soon" tag) in the new language.
  var openMobileSectionKey = null;

  function downloadReportAs(reportName) {
    var reportDef = REPORTS[reportName];
    if (!reportDef) return;
    var rows = reportDef.getRows();
    var header = reportDef.columns.map(function (c) { return c.label; });
    var body = rows.map(function (row) {
      return reportDef.columns.map(function (c) { return row[c.key]; });
    });
    // Same rule as the desktop table's export buttons: both formats
    // produce a real .csv underneath, "Excel" is just a label.
    window.RptDownloadCsv([header].concat(body), reportName.replace(/\s+/g, "-").toLowerCase() + ".csv");
  }

  function renderMobileReportList(sectionKey) {
    var section = SECTIONS[sectionKey];
    mobileFlyoutTitle.textContent = getSectionDisplayTitle(sectionKey);
    mobileReportList.innerHTML = "";

    section.reports.forEach(function (reportName) {
      var reportDef = REPORTS[reportName];
      var item = document.createElement("div");
      item.className = "rpt-mobile-report-item";

      var name = document.createElement("span");
      name.className = "rpt-mobile-report-name";
      name.textContent = getReportDisplayName(reportName);
      item.appendChild(name);

      if (reportDef) {
        var actions = document.createElement("div");
        actions.className = "rpt-mobile-report-actions";

        ["CSV", "Excel"].forEach(function (formatLabel) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "rpt-mobile-download-btn";
          btn.textContent = formatLabel;
          btn.addEventListener("click", function () {
            downloadReportAs(reportName);
            closeMobileReportFlyout();
          });
          actions.appendChild(btn);
        });

        item.appendChild(actions);
      } else {
        var tag = document.createElement("span");
        tag.className = "rpt-card-tag";
        tag.textContent = t("demos.comingSoon", "Coming soon");
        item.appendChild(tag);
      }

      mobileReportList.appendChild(item);
    });
  }

  function openMobileReportFlyout(sectionKey) {
    openMobileSectionKey = sectionKey;
    renderMobileReportList(sectionKey);
    mobileBackdrop.classList.add("is-open");
    mobileFlyout.classList.add("is-open");
    document.addEventListener("keydown", handleMobileEscape);
  }

  function closeMobileReportFlyout() {
    mobileBackdrop.classList.remove("is-open");
    mobileFlyout.classList.remove("is-open");
    document.removeEventListener("keydown", handleMobileEscape);
    openMobileSectionKey = null;
  }

  function handleMobileEscape(event) {
    if (event.key === "Escape") closeMobileReportFlyout();
  }

  mobileBackdrop.addEventListener("click", closeMobileReportFlyout);
  mobileCloseBtn.addEventListener("click", closeMobileReportFlyout);

  // ------------------------------------------------------------------------
  // SPEND BY CLASS CHART (Slice R6)
  // Aggregates the same mock invoices by product class (Class > Category >
  // Group > Product — same hierarchy Purchase Details exposes) and
  // compares the currently-filtered date range against the same date
  // range exactly one year earlier, per class, for the YoY badge.
  // ------------------------------------------------------------------------
  var classMetric = "amount"; // "amount" | "cases"
  var classChartExpanded = false;
  var classChartCard = document.getElementById("classChartCard");
  var classMetricToggle = document.getElementById("classMetricToggle");
  var classChartAxis = document.getElementById("classChartAxis");
  var classChartScroll = document.getElementById("classChartScroll");
  var classChartExpandBtn = document.getElementById("classChartExpandBtn");

  // 10 canonical classes — the 5 with real products in the catalog, plus
  // 5 more that intentionally have none yet, so "a class with zero
  // purchases still shows as a real 0 bar" has real cases to prove it,
  // not just whatever the filters happen to exclude.
  var CLASS_LIST = [
    { classNumber: "CL-10", classDescription: "Produce" },
    { classNumber: "CL-20", classDescription: "Meat & Poultry" },
    { classNumber: "CL-30", classDescription: "Seafood" },
    { classNumber: "CL-40", classDescription: "Dairy" },
    { classNumber: "CL-50", classDescription: "Grocery & Dry Goods" },
    { classNumber: "CL-60", classDescription: "Beverages" },
    { classNumber: "CL-70", classDescription: "Bakery" },
    { classNumber: "CL-80", classDescription: "Paper & Disposables" },
    { classNumber: "CL-90", classDescription: "Cleaning & Sanitation" },
    { classNumber: "CL-100", classDescription: "Condiments & Sauces" }
  ];

  function shiftYearBack(iso) {
    var d = parseISODate(iso);
    d.setFullYear(d.getFullYear() - 1);
    return toISODate(d);
  }

  // Only customers/regions apply beyond the current-vs-prior-year date
  // windows computed below — there's no separate "date range" concept to
  // additionally apply on top of those two windows.
  function getClassChartData() {
    var startMs = parseISODate(state.startDate).getTime();
    var endMs = parseISODate(state.endDate).getTime();
    var priorStartMs = parseISODate(shiftYearBack(state.startDate)).getTime();
    var priorEndMs = parseISODate(shiftYearBack(state.endDate)).getTime();

    var totalsByClass = {};
    CLASS_LIST.forEach(function (c) {
      totalsByClass[c.classNumber] = {
        classDescription: c.classDescription,
        current: { amount: 0, cases: 0 },
        prior: { amount: 0, cases: 0 }
      };
    });

    ALL_INVOICES.forEach(function (inv) {
      if (state.customerIds.indexOf(inv.customer.id) === -1) return;
      var ms = parseISODate(inv.invoiceDate).getTime();
      var inCurrent = ms >= startMs && ms <= endMs;
      var inPrior = ms >= priorStartMs && ms <= priorEndMs;
      if (!inCurrent && !inPrior) return;

      inv.lineItems.forEach(function (li) {
        var cls = li.product.classNumber;
        if (!totalsByClass[cls]) return; // safety net — every real product's class is in CLASS_LIST
        if (inCurrent) {
          totalsByClass[cls].current.amount += li.amount;
          totalsByClass[cls].current.cases += li.cases;
        }
        if (inPrior) {
          totalsByClass[cls].prior.amount += li.amount;
          totalsByClass[cls].prior.cases += li.cases;
        }
      });
    });

    var rows = CLASS_LIST.map(function (c) {
      var t = totalsByClass[c.classNumber];
      return {
        classNumber: c.classNumber,
        classDescription: c.classDescription,
        currentAmount: Math.round(t.current.amount * 100) / 100,
        currentCases: t.current.cases,
        priorAmount: Math.round(t.prior.amount * 100) / 100,
        priorCases: t.prior.cases
      };
    });

    // Descending by whichever metric is currently selected, left-to-right
    // (or top-to-bottom on mobile) — biggest first.
    rows.sort(function (a, b) {
      var av = classMetric === "amount" ? a.currentAmount : a.currentCases;
      var bv = classMetric === "amount" ? b.currentAmount : b.currentCases;
      return bv - av;
    });

    return rows;
  }

  // No prior-year data at all reads as "New" rather than a divide-by-zero
  // or a meaningless percentage.
  function computeYoy(currentVal, priorVal) {
    if (priorVal === 0) {
      return currentVal === 0
        ? { label: "0%", cls: "is-neutral" }
        : { label: t("reporting.charts.yoyNew", "New"), cls: "is-positive" };
    }
    var pct = ((currentVal - priorVal) / priorVal) * 100;
    var label = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
    var cls = pct > 0 ? "is-positive" : pct < 0 ? "is-negative" : "is-neutral";
    return { label: label, cls: cls };
  }

  // Exact value shown on hover (desktop) and always-on (mobile, since
  // hover has no touch equivalent) — 2 decimals either way, $ sign only
  // for dollars, per Tony's call.
  function formatExactValue(value, metric) {
    var formatted = value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return metric === "amount" ? "$" + formatted : formatted + " " + t("reporting.charts.casesSuffix", "cases");
  }

  function formatAxisValue(value, metric) {
    if (metric === "amount") {
      return value >= 1000 ? "$" + Math.round(value / 1000) + "K" : "$" + Math.round(value);
    }
    return Math.round(value).toLocaleString("en-US");
  }

  // Options here never change, so the buttons are only ever built once
  // (guarded by children.length); every toggle afterward just flips
  // "is-active" on the same two persistent elements, so the CSS
  // background/color transition actually has something to animate
  // between instead of two freshly-created buttons popping in.
  function renderClassMetricToggle() {
    if (classMetricToggle.children.length === 0) {
      [
        { key: "amount", label: t("reporting.charts.metricToggle.dollars", "Dollars ($)") },
        { key: "cases", label: t("reporting.charts.metricToggle.cases", "Cases") }
      ].forEach(function (opt) {
        var seg = document.createElement("button");
        seg.type = "button";
        seg.className = "rpt-segment";
        seg.textContent = opt.label;
        seg.dataset.key = opt.key;
        seg.addEventListener("click", function () {
          if (opt.key === classMetric) return;
          classMetric = opt.key;
          updateClassMetricToggleState();
          runSkeleton(classChartCard);
          renderClassChart();
        });
        classMetricToggle.appendChild(seg);
      });
    }
    updateClassMetricToggleState();
  }

  function updateClassMetricToggleState() {
    Array.prototype.forEach.call(classMetricToggle.children, function (btn) {
      var isActive = btn.dataset.key === classMetric;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderClassChart() {
    var data = getClassChartData();

    classChartAxis.innerHTML = "";
    classChartScroll.innerHTML = "";
    classChartScroll.classList.toggle("is-expanded", classChartExpanded);

    // 10 classes worth of exactly-zero purchases (e.g. the "We Never
    // Purchase Foods" customer selected alone) reads better as one clear
    // message than a wall of flat bars.
    var grandTotal = data.reduce(function (sum, d) {
      return sum + d.currentAmount + d.currentCases;
    }, 0);

    if (grandTotal === 0) {
      var empty = document.createElement("p");
      empty.className = "rpt-stub-note";
      empty.textContent = t("reporting.charts.emptyState", "No purchases match the current filters.");
      classChartScroll.appendChild(empty);
      classChartExpandBtn.hidden = true;
      return;
    }

    var maxValue = data.reduce(function (max, d) {
      var v = classMetric === "amount" ? d.currentAmount : d.currentCases;
      return Math.max(max, v);
    }, 0);
    if (maxValue === 0) maxValue = 1;

    [1, 0.75, 0.5, 0.25, 0].forEach(function (fraction) {
      var tick = document.createElement("span");
      tick.className = "rpt-axis-tick";
      tick.textContent = formatAxisValue(maxValue * fraction, classMetric);
      classChartAxis.appendChild(tick);
    });

    data.forEach(function (d) {
      var value = classMetric === "amount" ? d.currentAmount : d.currentCases;
      var priorValue = classMetric === "amount" ? d.priorAmount : d.priorCases;
      var heightPct = Math.max(2, Math.round((value / maxValue) * 100)); // floor so a real-but-tiny value stays visible
      var yoy = computeYoy(value, priorValue);
      var exactValue = formatExactValue(value, classMetric);

      var item = document.createElement("div");
      item.className = "rpt-class-bar-item";

      var label = document.createElement("span");
      label.className = "rpt-class-bar-label";
      label.textContent = d.classDescription;

      var track = document.createElement("div");
      track.className = "rpt-class-bar-track";

      var tooltip = document.createElement("span");
      tooltip.className = "rpt-class-bar-tooltip";
      tooltip.textContent = exactValue;

      // Set via a CSS custom property, not a fixed height/width inline
      // style, so CSS can read it as a bar's WIDTH on mobile (horizontal
      // growth) and as its HEIGHT on desktop (vertical growth) without
      // any JS needing to know which layout is currently active.
      var bar = document.createElement("div");
      bar.className = "rpt-class-bar";
      bar.style.setProperty("--bar-fill", heightPct + "%");
      bar.tabIndex = 0;

      track.appendChild(tooltip);
      track.appendChild(bar);

      // Mobile-only always-visible amount (hover has no touch equivalent —
      // see reporting.css for the desktop/mobile split).
      var amount = document.createElement("span");
      amount.className = "rpt-class-bar-amount";
      amount.textContent = exactValue;

      var yoyEl = document.createElement("span");
      yoyEl.className = "rpt-class-bar-yoy " + yoy.cls;
      yoyEl.textContent = yoy.label;

      item.appendChild(label);
      item.appendChild(track);
      item.appendChild(amount);
      item.appendChild(yoyEl);
      classChartScroll.appendChild(item);
    });

    // "See more/See less" only matters on mobile (CSS hides items past
    // the 3rd there and shows this button; desktop hides the button and
    // shows all 10 in the horizontally-scrolling strip regardless).
    if (data.length > 3) {
      classChartExpandBtn.hidden = false;
      classChartExpandBtn.textContent = classChartExpanded
        ? t("reporting.charts.seeLess", "See less")
        : t("reporting.charts.seeMorePrefix", "See more") + " (" + (data.length - 3) + ")";
    } else {
      classChartExpandBtn.hidden = true;
    }
  }

  if (classChartExpandBtn) {
    classChartExpandBtn.addEventListener("click", function () {
      classChartExpanded = !classChartExpanded;
      renderClassChart();
    });
  }

  // ------------------------------------------------------------------------
  // TOP PRODUCTS CHART
  // Top 10 products by total $ (or cases), aggregated from the same
  // filtered invoices Purchase Summary uses — date range + customers,
  // no special prior-year window (that's only a Spend by Class thing).
  // A ranked list rather than bars: placeholder icon, description,
  // manufacturer/product #, and the metric value.
  // ------------------------------------------------------------------------
  var topProductsMetric = "amount"; // "amount" | "cases"
  var topProductsExpanded = false;
  var topProductsCard = document.getElementById("topProductsCard");
  var topProductsMetricToggle = document.getElementById("topProductsMetricToggle");
  var topProductsList = document.getElementById("topProductsList");
  var topProductsExpandBtn = document.getElementById("topProductsExpandBtn");

  function getTopProductsData() {
    var totals = {};
    getFilteredInvoices().forEach(function (inv) {
      inv.lineItems.forEach(function (li) {
        var key = li.product.number;
        if (!totals[key]) {
          totals[key] = { product: li.product, amount: 0, cases: 0 };
        }
        totals[key].amount += li.amount;
        totals[key].cases += li.cases;
      });
    });

    var rows = Object.keys(totals).map(function (key) {
      var t = totals[key];
      return {
        productNumber: t.product.number,
        productDescription: t.product.description,
        manufacturer: t.product.manufacturer,
        amount: Math.round(t.amount * 100) / 100,
        cases: t.cases
      };
    });

    rows.sort(function (a, b) {
      var av = topProductsMetric === "amount" ? a.amount : a.cases;
      var bv = topProductsMetric === "amount" ? b.amount : b.cases;
      return bv - av;
    });

    return rows.slice(0, 10);
  }

  // Same "build once, then just toggle state" pattern as
  // renderClassMetricToggle — see its comment above.
  function renderTopProductsMetricToggle() {
    if (topProductsMetricToggle.children.length === 0) {
      [
        { key: "amount", label: t("reporting.charts.metricToggle.dollars", "Dollars ($)") },
        { key: "cases", label: t("reporting.charts.metricToggle.cases", "Cases") }
      ].forEach(function (opt) {
        var seg = document.createElement("button");
        seg.type = "button";
        seg.className = "rpt-segment";
        seg.textContent = opt.label;
        seg.dataset.key = opt.key;
        seg.addEventListener("click", function () {
          if (opt.key === topProductsMetric) return;
          topProductsMetric = opt.key;
          updateTopProductsMetricToggleState();
          runSkeleton(topProductsCard);
          renderTopProducts();
        });
        topProductsMetricToggle.appendChild(seg);
      });
    }
    updateTopProductsMetricToggleState();
  }

  function updateTopProductsMetricToggleState() {
    Array.prototype.forEach.call(topProductsMetricToggle.children, function (btn) {
      var isActive = btn.dataset.key === topProductsMetric;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  // A single generic placeholder icon stands in for a real product photo
  // on every row — this is mock data, so it intentionally doesn't pretend
  // to have real per-product imagery.
  var TOP_PRODUCT_PLACEHOLDER_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 8l-9-5-9 5 9 5 9-5z"></path>' +
      '<path d="M3 8v8l9 5 9-5V8"></path>' +
      '<path d="M12 13v8"></path>' +
    "</svg>";

  function renderTopProducts() {
    var data = getTopProductsData();
    topProductsList.innerHTML = "";
    topProductsList.classList.toggle("is-expanded", topProductsExpanded);

    if (data.length === 0) {
      var empty = document.createElement("p");
      empty.className = "rpt-stub-note";
      empty.textContent = t("reporting.charts.emptyState", "No purchases match the current filters.");
      topProductsList.appendChild(empty);
      topProductsExpandBtn.hidden = true;
      return;
    }

    data.forEach(function (row, idx) {
      var item = document.createElement("div");
      item.className = "rpt-top-product-item";

      var rank = document.createElement("span");
      rank.className = "rpt-top-product-rank";
      rank.textContent = String(idx + 1);

      var media = document.createElement("span");
      media.className = "rpt-top-product-media";
      media.innerHTML = TOP_PRODUCT_PLACEHOLDER_ICON;

      var info = document.createElement("span");
      info.className = "rpt-top-product-info";

      var desc = document.createElement("span");
      desc.className = "rpt-top-product-desc";
      desc.textContent = row.productDescription;
      desc.title = row.productDescription;

      var meta = document.createElement("span");
      meta.className = "rpt-top-product-meta";
      meta.textContent = row.manufacturer + " · " + row.productNumber;

      info.appendChild(desc);
      info.appendChild(meta);

      var value = document.createElement("span");
      value.className = "rpt-top-product-value";
      value.textContent = formatExactValue(
        topProductsMetric === "amount" ? row.amount : row.cases,
        topProductsMetric
      );

      item.appendChild(rank);
      item.appendChild(media);
      item.appendChild(info);
      item.appendChild(value);
      topProductsList.appendChild(item);
    });

    if (data.length > 3) {
      topProductsExpandBtn.hidden = false;
      topProductsExpandBtn.textContent = topProductsExpanded
        ? t("reporting.charts.seeLess", "See less")
        : t("reporting.charts.seeMorePrefix", "See more") + " (" + (data.length - 3) + ")";
    } else {
      topProductsExpandBtn.hidden = true;
    }
  }

  if (topProductsExpandBtn) {
    topProductsExpandBtn.addEventListener("click", function () {
      topProductsExpanded = !topProductsExpanded;
      renderTopProducts();
    });
  }

  // ------------------------------------------------------------------------
  // DOWNLOAD HISTORY (mocked)
  // A handful of pre-seeded past "downloads". Re-download regenerates a
  // small, real CSV on the fly — frozen to what that entry says rather
  // than the live filters, since these represent past runs. "Excel"
  // entries still produce a real .csv under the hood (no spreadsheet
  // library, per Tony's call on real-but-simple exports); only the label
  // shown to the user says Excel, matching what that report was
  // originally downloaded as.
  // ------------------------------------------------------------------------
  var HISTORY = [
    {
      reportName: "Invoice History",
      dateRangeLabel: "Jun 1 – Jun 30, 2026",
      format: "CSV",
      rows: [
        ["Invoice #", "Customer", "Total ($)"],
        ["INV-10112", "Blue Harbor Bistro Group", "1980.25"],
        ["INV-10113", "Lakeside Restaurant Group", "742.10"]
      ]
    },
    {
      reportName: "Purchase Summary",
      dateRangeLabel: "May 1 – May 31, 2026",
      format: "Excel",
      rows: [
        ["Product #", "Product Description", "Dollars ($)", "Cases"],
        ["P-4021", "Frozen Gulf Shrimp 21/25", "3120.00", "48"],
        ["P-4110", "Diced Tomatoes #10 Can", "860.40", "72"]
      ]
    },
    {
      reportName: "Invoice Details",
      dateRangeLabel: "Apr 15 – May 15, 2026",
      format: "CSV",
      rows: [
        ["Product #", "Product Description", "Invoice #", "Customer", "Total ($)"],
        ["P-2200", "Idaho Russet Potatoes 50lb", "INV-09981", "Palmetto Table Group", "410.00"]
      ]
    }
  ];

  // CSV generation/download itself lives in dataTable.js as
  // window.RptDownloadCsv, shared with the real report tables' export
  // buttons so there's exactly one place that knows how to build a CSV.

  var historyBtn = document.getElementById("historyBtn");
  var historyFlyout = document.getElementById("historyFlyout");
  var historyList = document.getElementById("historyList");

  function renderHistoryList() {
    historyList.innerHTML = "";
    HISTORY.forEach(function (entry) {
      var item = document.createElement("div");
      item.className = "rpt-history-item";

      var info = document.createElement("div");
      info.className = "rpt-history-item-info";

      var name = document.createElement("span");
      name.className = "rpt-history-item-name";
      name.textContent = getReportDisplayName(entry.reportName);
      name.title = getReportDisplayName(entry.reportName);

      var meta = document.createElement("span");
      meta.className = "rpt-history-item-meta";
      meta.textContent = entry.dateRangeLabel + " · " + entry.format;

      info.appendChild(name);
      info.appendChild(meta);

      var redownload = document.createElement("button");
      redownload.type = "button";
      redownload.className = "rpt-history-redownload";
      redownload.textContent = t("reporting.history.redownloadBtn", "Re-download");
      redownload.addEventListener("click", function () {
        var filename = entry.reportName.replace(/\s+/g, "-").toLowerCase() + "-history.csv";
        window.RptDownloadCsv(entry.rows, filename);
      });

      item.appendChild(info);
      item.appendChild(redownload);
      historyList.appendChild(item);
    });
  }

  function openHistoryFlyout() {
    historyFlyout.classList.add("is-open");
    historyBtn.setAttribute("aria-expanded", "true");
    document.addEventListener("click", handleHistoryOutsideClick, true);
    document.addEventListener("keydown", handleHistoryEscape);
  }

  function closeHistoryFlyout() {
    historyFlyout.classList.remove("is-open");
    historyBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", handleHistoryOutsideClick, true);
    document.removeEventListener("keydown", handleHistoryEscape);
  }

  function handleHistoryOutsideClick(event) {
    if (!historyFlyout.contains(event.target) && !historyBtn.contains(event.target)) {
      closeHistoryFlyout();
    }
  }

  function handleHistoryEscape(event) {
    if (event.key === "Escape") closeHistoryFlyout();
  }

  historyBtn.addEventListener("click", function () {
    if (historyFlyout.classList.contains("is-open")) {
      closeHistoryFlyout();
    } else {
      openHistoryFlyout();
    }
  });

  // ------------------------------------------------------------------------
  // LIVE LANGUAGE SWITCH
  // Re-renders CHROME ONLY — filter labels, region/report/section names,
  // column headers, buttons, empty states, pagination. ALL_INVOICES, the
  // mock CONTRACT_TABLE, CUSTOMERS, and PRODUCTS are never touched or
  // regenerated here; getRows()/getFilteredInvoices() just re-read the
  // exact same fixed dataset, so the report rows themselves never change
  // when the language toggles.
  // ------------------------------------------------------------------------
  window.addEventListener("langchange", function () {
    renderSummary();

    // The filter flyout's region chips/customer list only exist once it's
    // been opened at least once ("pending" stays null until then).
    if (pending) {
      renderRegionChips();
      renderCustomerList();
      validate();
    }

    if (activeSectionKey) {
      Array.prototype.forEach.call(segmentGroup.children, function (btn) {
        btn.textContent = getReportDisplayName(btn.dataset.reportName);
      });
      activeReportTitle.textContent = getReportDisplayName(activeReportName);

      if (currentTableInstance) {
        currentTableInstance.retranslate();
      } else {
        // Stub report (no REPORTS[...] entry yet) — re-render its message.
        renderActiveReportContent();
      }
    }

    renderHistoryList();

    Array.prototype.forEach.call(classMetricToggle.children, function (btn) {
      btn.textContent = btn.dataset.key === "amount"
        ? t("reporting.charts.metricToggle.dollars", "Dollars ($)")
        : t("reporting.charts.metricToggle.cases", "Cases");
    });
    renderClassChart();

    Array.prototype.forEach.call(topProductsMetricToggle.children, function (btn) {
      btn.textContent = btn.dataset.key === "amount"
        ? t("reporting.charts.metricToggle.dollars", "Dollars ($)")
        : t("reporting.charts.metricToggle.cases", "Cases");
    });
    renderTopProducts();

    if (openMobileSectionKey && mobileFlyout.classList.contains("is-open")) {
      renderMobileReportList(openMobileSectionKey);
    }
  });

  // ------------------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------------------
  renderSummary();
  renderHistoryList();
  renderClassMetricToggle();
  renderClassChart();
  renderTopProductsMetricToggle();
  renderTopProducts();
})();
