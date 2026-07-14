// ==========================================================================
// dataTable.js
// Reusable, dependency-free interactive table used by every report in the
// Reporting demo (Invoice History today, Product Usage and Compliance
// reports later — they all just pass a different column/row config into
// the same component). Handles: pagination, drag-and-drop column
// reorder, default + click-to-sort, a search box across every column,
// a total row count, and CSV/"Excel" export.
//
// Loaded before reporting.js, which is the only thing that calls
// window.RptDataTable(config) or window.RptDownloadCsv(rows, filename).
// ==========================================================================

(function () {
  "use strict";

  // Turns an array-of-arrays (header row + data rows) into a real,
  // downloadable CSV file. Shared by the data table's export buttons and
  // reporting.js's Download History re-downloads, so there's exactly one
  // place that knows how to escape values and trigger a browser download.
  window.RptDownloadCsv = function (rows, filename) {
    var csvContent = rows
      .map(function (row) {
        return row
          .map(function (value) {
            var str = value == null ? "" : String(value);
            if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
              str = '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
          })
          .join(",");
      })
      .join("\r\n");

    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // config = {
  //   container: HTMLElement (gets its innerHTML replaced),
  //   columns: [{ key, label, numeric: bool, truncate: bool }],
  //   getRows: function() -> array of plain row objects, already scoped to
  //            whatever external filters (date range, customers, etc.) apply,
  //   pageSize: number (default 10),
  //   defaultSortKey / defaultSortDir: "asc" | "desc",
  //   exportFilename: base filename, no extension
  // }
  //
  // Returns { refresh() } — call refresh() when getRows()'s underlying
  // data changed (e.g. filters were applied) but the report itself (and
  // therefore its columns) didn't, so search/sort/column order stick.
  window.RptDataTable = function (config) {
    var container = config.container;
    var pageSize = config.pageSize || 10;
    var columnsByKey = {};
    config.columns.forEach(function (c) { columnsByKey[c.key] = c; });
    var columnOrder = config.columns.map(function (c) { return c.key; });

    var sortKey = config.defaultSortKey || columnOrder[0];
    var sortDir = config.defaultSortDir || "asc";
    var searchTerm = "";
    var currentPage = 1;
    var draggedKey = null;

    container.innerHTML =
      '<div class="rpt-table-toolbar">' +
        '<input type="search" class="rpt-table-search" placeholder="Search this report…" aria-label="Search this report" />' +
        '<div class="rpt-table-toolbar-actions">' +
          '<span class="rpt-table-count"></span>' +
          '<button type="button" class="rpt-table-export" data-format="csv">Download CSV</button>' +
          '<button type="button" class="rpt-table-export" data-format="excel">Download Excel</button>' +
        "</div>" +
      "</div>" +
      '<div class="rpt-table-scroll"><table class="rpt-data-table"><thead></thead><tbody></tbody></table></div>' +
      '<div class="rpt-table-pagination"></div>';

    var searchInput = container.querySelector(".rpt-table-search");
    var countEl = container.querySelector(".rpt-table-count");
    var theadEl = container.querySelector("thead");
    var tbodyEl = container.querySelector("tbody");
    var paginationEl = container.querySelector(".rpt-table-pagination");
    var exportBtns = container.querySelectorAll(".rpt-table-export");

    function getFilteredSortedRows() {
      var rows = config.getRows();

      if (searchTerm) {
        var term = searchTerm.toLowerCase();
        rows = rows.filter(function (row) {
          return columnOrder.some(function (key) {
            var val = row[key];
            return val != null && String(val).toLowerCase().indexOf(term) !== -1;
          });
        });
      }

      var col = columnsByKey[sortKey];
      rows = rows.slice().sort(function (a, b) {
        var av = a[sortKey];
        var bv = b[sortKey];
        var cmp;
        if (col && col.numeric) {
          cmp = (Number(av) || 0) - (Number(bv) || 0);
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });

      return rows;
    }

    function renderHead() {
      theadEl.innerHTML = "";
      var tr = document.createElement("tr");

      columnOrder.forEach(function (key) {
        var col = columnsByKey[key];
        var th = document.createElement("th");
        th.draggable = true;
        th.dataset.key = key;
        if (col.numeric) th.classList.add("is-numeric");

        var labelSpan = document.createElement("span");
        labelSpan.className = "rpt-th-label";
        labelSpan.textContent = col.label;
        th.appendChild(labelSpan);

        if (sortKey === key) {
          var sortIcon = document.createElement("span");
          sortIcon.className = "rpt-th-sort";
          sortIcon.textContent = sortDir === "asc" ? "▲" : "▼";
          th.appendChild(sortIcon);
        }

        th.addEventListener("click", function () {
          if (sortKey === key) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
          } else {
            sortKey = key;
            sortDir = "asc";
          }
          currentPage = 1;
          renderAll();
        });

        // Drag-and-drop column reordering. Native HTML5 DnD — no library
        // needed for a same-row, same-element-type reorder like this.
        th.addEventListener("dragstart", function (event) {
          draggedKey = key;
          event.dataTransfer.effectAllowed = "move";
          th.classList.add("is-dragging");
        });
        th.addEventListener("dragend", function () {
          th.classList.remove("is-dragging");
        });
        th.addEventListener("dragover", function (event) {
          event.preventDefault();
          th.classList.add("is-drag-over");
        });
        th.addEventListener("dragleave", function () {
          th.classList.remove("is-drag-over");
        });
        th.addEventListener("drop", function (event) {
          event.preventDefault();
          th.classList.remove("is-drag-over");
          if (!draggedKey || draggedKey === key) return;
          var fromIdx = columnOrder.indexOf(draggedKey);
          var toIdx = columnOrder.indexOf(key);
          columnOrder.splice(fromIdx, 1);
          columnOrder.splice(toIdx, 0, draggedKey);
          draggedKey = null;
          renderAll();
        });

        tr.appendChild(th);
      });

      theadEl.appendChild(tr);
    }

    function renderBody(pageRows) {
      tbodyEl.innerHTML = "";

      if (pageRows.length === 0) {
        var emptyTr = document.createElement("tr");
        var emptyTd = document.createElement("td");
        emptyTd.colSpan = columnOrder.length;
        emptyTd.className = "rpt-table-empty";
        emptyTd.textContent = "No rows match the current filters and search.";
        emptyTr.appendChild(emptyTd);
        tbodyEl.appendChild(emptyTr);
        return;
      }

      pageRows.forEach(function (row) {
        var tr = document.createElement("tr");
        columnOrder.forEach(function (key) {
          var col = columnsByKey[key];
          var td = document.createElement("td");
          if (col.numeric) td.classList.add("is-numeric");

          var displayVal = row[key];
          if (col.numeric && typeof displayVal === "number") {
            if (col.percent) {
              displayVal = displayVal.toFixed(1) + "%";
            } else {
              var formatted = displayVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              displayVal = col.currency ? "$" + formatted : formatted;
            }
          }

          if (col.truncate) {
            var span = document.createElement("span");
            span.className = "rpt-cell-truncate";
            span.textContent = displayVal;
            span.title = displayVal; // full value shows on hover once truncated
            td.appendChild(span);
          } else {
            td.textContent = displayVal;
          }

          tr.appendChild(td);
        });
        tbodyEl.appendChild(tr);
      });
    }

    function renderPagination(totalRows) {
      paginationEl.innerHTML = "";
      var totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;

      var prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.textContent = "Prev";
      prevBtn.disabled = currentPage <= 1;
      prevBtn.addEventListener("click", function () {
        currentPage -= 1;
        renderAll();
      });

      var pageLabel = document.createElement("span");
      pageLabel.className = "rpt-table-page-label";
      pageLabel.textContent = "Page " + currentPage + " of " + totalPages;

      var nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.textContent = "Next";
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.addEventListener("click", function () {
        currentPage += 1;
        renderAll();
      });

      paginationEl.appendChild(prevBtn);
      paginationEl.appendChild(pageLabel);
      paginationEl.appendChild(nextBtn);
    }

    function renderAll() {
      renderHead();
      var rows = getFilteredSortedRows();
      countEl.textContent = rows.length.toLocaleString("en-US") + " row" + (rows.length === 1 ? "" : "s");
      var start = (currentPage - 1) * pageSize;
      renderBody(rows.slice(start, start + pageSize));
      renderPagination(rows.length);
    }

    searchInput.addEventListener("input", function () {
      searchTerm = searchInput.value.trim();
      currentPage = 1;
      renderAll();
    });

    exportBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        // Export honors the current search (what you're looking at) but
        // isn't limited to just the visible page — the whole matching set.
        var rows = getFilteredSortedRows();
        var header = columnOrder.map(function (key) { return columnsByKey[key].label; });
        var body = rows.map(function (row) {
          return columnOrder.map(function (key) { return row[key]; });
        });
        // Both buttons produce a real .csv underneath — there's no
        // spreadsheet-generation library in this build. "Download Excel"
        // is only a label so it matches what a report is described as.
        window.RptDownloadCsv([header].concat(body), config.exportFilename + ".csv");
      });
    });

    renderAll();

    return {
      refresh: function () {
        currentPage = 1;
        renderAll();
      }
    };
  };
})();
