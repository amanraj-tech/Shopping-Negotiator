/* =========================================================
   product.js — behaviour for product.html ONLY.
   Reads the product + selected listing handed off by
   results.js (sessionStorage) and renders the full detail
   view plus a compact cross-platform comparison list.

   ---------------------------------------------------------
   FUTURE BACKEND / API INTEGRATION POINT
   ---------------------------------------------------------
   Once a backend exists, this page can instead be loaded
   with a listing id in the URL (e.g. product.html?id=...)
   and fetch the single listing + its matched alternatives
   from something like GET /api/listings/:id. The render
   functions below already expect that exact shape, so only
   the data-loading step (boot()) needs to change.
   ========================================================= */
(function () {
  "use strict";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function fmtINR(n) { return "₹" + n.toLocaleString("en-IN"); }
  function initials(platform) {
    var words = platform.split(" ");
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return platform.slice(0, 2).toUpperCase();
  }

  var PLATFORM_URLS = {
    "Flipkart": "https://www.flipkart.com",
    "Amazon": "https://www.amazon.in",
    "Croma": "https://www.croma.com",
    "Reliance Digital": "https://www.reliancedigital.in",
    "Tata CLiQ": "https://www.tatacliq.com",
    "Myntra": "https://www.myntra.com",
    "Ajio": "https://www.ajio.com",
    "Nike.com": "https://www.nike.com"
  };

  var ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.4"/><path d="M11 18h2"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="5" height="7" rx="1.6"/><rect x="16" y="14" width="5" height="7" rx="1.6"/></svg>',
    shoe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16c0-2 1.5-3 3-4l4-3.5c1-.9 2-1.2 3-.5l2 1.5c1.5 1 3 1.2 5 1v3.5c0 1.5-1 2-2.5 2H4.5C3.7 16 3 16 3 16z"/><path d="M3 16v2.5c0 1 .6 1.5 1.6 1.5H19c1.1 0 2-.9 2-2v-1"/></svg>',
    package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>'
  };

  var views = { empty: $("#view-empty"), product: $("#view-product") };
  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].classList.toggle("active", k === name); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProduct(product, matchNote, sorted, selectedIndex) {
    var lowest = sorted[0].price;
    var highest = sorted[sorted.length - 1].price;
    var listing = sorted[selectedIndex];
    var isBest = selectedIndex === 0;
    var url = listing.url || PLATFORM_URLS[listing.platform] || "#";

    $("#detail-hero").innerHTML =
      (isBest ? '<div class="best-tag"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.6L21 9l-5 4.6L17.5 21 12 17.3 6.5 21 8 13.6 3 9l6.4-.4z"/></svg>Best price</div>' : '') +
      '<div class="picon">' + ICONS[product.icon] + '</div>' +
      '<div class="detail-main">' +
        '<p class="eyebrow">' + matchNote + '</p>' +
        '<h1>' + product.name + ' — ' + product.spec + '</h1>' +
        '<p class="listing-title">' + listing.title + ' · sold via ' + listing.platform + '</p>' +
        '<div class="meta-row">' +
          '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 4.6a2 2 0 0 0-2.8 0l-1.1 1.1 2.8 2.8 1.1-1.1a2 2 0 0 0 0-2.8z"/><path d="M12 8L3 17v4h4l9-9"/></svg>' + listing.rating + ' rating (' + listing.reviews + ' reviews)</span>' +
          '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="15" height="11" rx="2"/><path d="M18 10h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1 1 0 0 1-1 1H18"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="15.5" cy="18.5" r="1.5"/></svg>Delivery: ' + listing.delivery + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-price-col">' +
        '<div class="price">' + fmtINR(listing.price) + '</div>' +
        (isBest ? '<div class="save">' + fmtINR(highest - lowest) + ' cheaper than the priciest listing</div>' : '<div class="save">' + fmtINR(listing.price - lowest) + ' more than the best price found</div>') +
        '<a class="visit-btn" href="' + url + '" target="_blank" rel="noopener noreferrer">Visit ' + listing.platform + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg></a>' +
      '</div>';

    $("#info-grid").innerHTML =
      '<div class="info-cell"><b>Listed as</b><p>' + listing.title + '</p></div>' +
      '<div class="info-cell"><b>Return policy</b><p>' + listing.returns + '</p></div>' +
      '<div class="info-cell"><b>Estimated delivery</b><p>' + listing.delivery + '</p></div>';

    $("#compare-count").textContent = (sorted.length - 1) + " other platforms checked";

    var compareList = $("#compare-list");
    compareList.innerHTML = "";
    sorted.forEach(function (l, i) {
      var row = document.createElement("div");
      row.className = "compare-row" + (i === selectedIndex ? " current" : "");
      var rUrl = l.url || PLATFORM_URLS[l.platform] || "#";
      row.innerHTML =
        '<div class="cbadge">' + initials(l.platform) + '</div>' +
        '<div class="cname">' + l.platform + (i === 0 ? ' <span class="ctag">Best price</span>' : '') + (i === selectedIndex ? ' <span class="ctag">Viewing</span>' : '') + '</div>' +
        '<div class="cprice">' + fmtINR(l.price) + '</div>' +
        '<a class="cvisit" href="' + rUrl + '" target="_blank" rel="noopener noreferrer" aria-label="Visit ' + l.platform + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg></a>';
      compareList.appendChild(row);
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var raw = sessionStorage.getItem("haggle_product");
    var idxRaw = sessionStorage.getItem("haggle_selected_index");

    if (!raw || idxRaw === null) { showView("empty"); return; }

    var resolved;
    try { resolved = JSON.parse(raw); } catch (e) { resolved = null; }

    if (!resolved || !resolved.sorted || !resolved.sorted.length) { showView("empty"); return; }

    var idx = parseInt(idxRaw, 10);
    if (isNaN(idx) || idx < 0 || idx >= resolved.sorted.length) idx = 0;

    renderProduct(resolved.product, resolved.matchNote, resolved.sorted, idx);
    showView("product");
  }

  $("#back-to-results").addEventListener("click", function () {
    // Skip re-running the negotiation animation — results.js will render
    // straight from the same resolved product already in sessionStorage.
    sessionStorage.setItem("haggle_skip_animation", "true");
    window.location.href = "results.html";
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  boot();
})();