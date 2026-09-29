/* =========================================================
   results.js — behaviour for results.html ONLY.
   Responsibilities:
     - product catalog + text/link matching (frontend prototype
       stand-in for the future backend/AI matching service)
     - the negotiation console: stepper + per-platform "checking
       platforms" simulation
     - sorting listings and rendering the ranked results state
     - the loading-to-results transition
     - handing off a selected listing to product.html

   ---------------------------------------------------------
   FUTURE BACKEND / API INTEGRATION POINT
   ---------------------------------------------------------
   Everything inside CATALOG + matchProduct() is temporary
   frontend-only sample data. When the Python backend and AI
   matching service exist, replace:
     1. matchProduct(query)   -> POST /api/identify  (text/link)
                                  POST /api/identify-image (image)
     2. the simulated platform "checking" loop in
        runNegotiation()      -> real async platform search
                                  calls, streamed or polled from
                                  the backend as they resolve
   The rendering / animation code below can stay as-is; it only
   needs a resolved `product` object shaped like the CATALOG
   entries below.
   ========================================================= */
(function () {
  "use strict";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function fmtINR(n) { return "₹" + n.toLocaleString("en-IN"); }
  function initials(platform) {
    var words = platform.split(" ");
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return platform.slice(0, 2).toUpperCase();
  }

  /* ---------------- catalog (frontend prototype sample data) ---------------- */
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
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.4"/><path d="M11 18h2"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="5" height="7" rx="1.6"/><rect x="16" y="14" width="5" height="7" rx="1.6"/></svg>',
    shoe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16c0-2 1.5-3 3-4l4-3.5c1-.9 2-1.2 3-.5l2 1.5c1.5 1 3 1.2 5 1v3.5c0 1.5-1 2-2.5 2H4.5C3.7 16 3 16 3 16z"/><path d="M3 16v2.5c0 1 .6 1.5 1.6 1.5H19c1.1 0 2-.9 2-2v-1"/></svg>',
    package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>'
  };

  var CATALOG = [
    {
      id: "s25", name: "Samsung Galaxy S25 5G", spec: "256GB · Black", icon: "phone",
      keywords: ["samsung", "galaxy", "s25"],
      listings: [
        { platform: "Flipkart", title: "Samsung Galaxy S25 5G Smartphone (256GB, Black)", price: 72499, delivery: "Tomorrow", rating: 4.5, reviews: "18.2k", returns: "7-day replacement", url: "https://www.flipkart.com/search?q=Samsung%20Galaxy%20S25%205G%20256GB%20Black" },
        { platform: "Croma", title: "Samsung S25 256 GB Black", price: 73999, delivery: "2 days", rating: 4.4, reviews: "3.1k", returns: "10-day replacement", url: "https://www.croma.com/searchB?q=Samsung%20Galaxy%20S25%20256GB%20Black" },
        { platform: "Amazon", title: "Samsung Galaxy S25 (Black, 12GB, 256GB Storage)", price: 74999, delivery: "Tomorrow", rating: 4.4, reviews: "22.6k", returns: "10-day replacement", url: "https://www.amazon.in/Samsung-Smartphone-Icyblue-Snapdragon-ProVisual/dp/B0DSBCGVKF" },
        { platform: "Reliance Digital", title: "Samsung Galaxy S25 5G (256GB) — Black", price: 75490, delivery: "3 days", rating: 4.3, reviews: "1.4k", returns: "7-day replacement", url: "https://www.reliancedigital.in/search?q=Samsung%20Galaxy%20S25%20256GB%20Black" },
        { platform: "Tata CLiQ", title: "Samsung Galaxy S25 5G Mobile Phone 256GB Black", price: 76999, delivery: "4 days", rating: 4.2, reviews: "860", returns: "7-day replacement", url: "https://www.tatacliq.com/search/?searchCategory=all&text=Samsung%20Galaxy%20S25%20256GB%20Black" }
      ]
    },
    {
      id: "ip16", name: "Apple iPhone 16", spec: "128GB · Blue", icon: "phone",
      keywords: ["iphone", "apple", "16"],
      listings: [
        { platform: "Amazon", title: "Apple iPhone 16 (128 GB) — Blue", price: 74900, delivery: "Tomorrow", rating: 4.7, reviews: "31.5k", returns: "10-day replacement", url: "https://www.amazon.in/s?k=Apple+iPhone+16+128GB+Blue" },
        { platform: "Flipkart", title: "APPLE iPhone 16 128GB Blue", price: 75499, delivery: "2 days", rating: 4.6, reviews: "27.8k", returns: "7-day replacement", url: "https://www.flipkart.com/search?q=Apple%20iPhone%2016%20128GB%20Blue" },
        { platform: "Croma", title: "Apple iPhone 16 Blue 128 GB", price: 76900, delivery: "2 days", rating: 4.5, reviews: "2.9k", returns: "10-day replacement", url: "https://www.croma.com/searchB?q=Apple%20iPhone%2016%20128GB%20Blue" },
        { platform: "Reliance Digital", title: "Apple iPhone 16 (128GB, Blue)", price: 77490, delivery: "3 days", rating: 4.5, reviews: "1.1k", returns: "7-day replacement", url: "https://www.reliancedigital.in/search?q=Apple%20iPhone%2016%20128GB%20Blue" },
        { platform: "Tata CLiQ", title: "iPhone 16 128 GB Blue — Apple", price: 78999, delivery: "4 days", rating: 4.4, reviews: "640", returns: "7-day replacement", url: "https://www.tatacliq.com/search/?searchCategory=all&text=Apple%20iPhone%2016%20128GB%20Blue" }
      ]
    },
    {
      id: "xm5", name: "Sony WH-1000XM5", spec: "Wireless Noise Cancelling Headphones", icon: "headphones",
      keywords: ["sony", "headphone", "xm5", "wh-1000", "noise cancel"],
      listings: [
        { platform: "Amazon", title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones", price: 26990, delivery: "Tomorrow", rating: 4.6, reviews: "9.8k", returns: "10-day replacement", url: "https://www.amazon.in/s?k=Sony+WH-1000XM5+Wireless+Noise+Cancelling+Headphones" },
        { platform: "Flipkart", title: "SONY WH-1000XM5 Bluetooth Headset", price: 27990, delivery: "2 days", rating: 4.5, reviews: "6.2k", returns: "7-day replacement", url: "https://www.flipkart.com/search?q=Sony%20WH-1000XM5%20Bluetooth%20Headset" },
        { platform: "Croma", title: "Sony WH1000XM5 Over-Ear Noise Cancellation Headphones", price: 28499, delivery: "3 days", rating: 4.5, reviews: "1.2k", returns: "10-day replacement", url: "https://www.croma.com/searchB?q=Sony%20WH-1000XM5%20Headphones" },
        { platform: "Reliance Digital", title: "Sony WH-1000XM5 Wireless Headphone — Black", price: 28990, delivery: "3 days", rating: 4.4, reviews: "780", returns: "7-day replacement", url: "https://www.reliancedigital.in/search?q=Sony%20WH-1000XM5%20Black" },
        { platform: "Tata CLiQ", title: "Sony WH-1000XM5 Noise Cancelling Wireless Headset", price: 29990, delivery: "4 days", rating: 4.3, reviews: "410", returns: "7-day replacement", url: "https://www.tatacliq.com/search/?searchCategory=all&text=Sony%20WH-1000XM5" }
      ]
    },
    {
      id: "pegasus", name: "Nike Air Zoom Pegasus 41", spec: "Men's Running Shoes", icon: "shoe",
      keywords: ["nike", "shoe", "pegasus", "running", "sneaker"],
      listings: [
        { platform: "Myntra", title: "Nike Men Air Zoom Pegasus 41 Running Shoes", price: 8995, delivery: "2 days", rating: 4.4, reviews: "2.6k", returns: "14-day return", url: "https://www.myntra.com/nike-air-zoom-pegasus-41" },
        { platform: "Flipkart", title: "NIKE Pegasus 41 Running Shoes For Men", price: 9295, delivery: "2 days", rating: 4.3, reviews: "1.9k", returns: "7-day replacement", url: "https://www.flipkart.com/search?q=Nike%20Pegasus%2041%20Running%20Shoes%20Men" },
        { platform: "Ajio", title: "Nike Air Zoom Pegasus 41 — Men's Shoes", price: 9495, delivery: "3 days", rating: 4.3, reviews: "1.1k", returns: "15-day return", url: "https://www.ajio.com/search/?text=Nike%20Air%20Zoom%20Pegasus%2041" },
        { platform: "Amazon", title: "Nike Pegasus 41 Men's Road Running Shoes", price: 9995, delivery: "Tomorrow", rating: 4.2, reviews: "3.4k", returns: "10-day replacement", url: "https://www.amazon.in/s?k=Nike+Air+Zoom+Pegasus+41+Mens+Running+Shoes" },
        { platform: "Nike.com", title: "Nike Air Zoom Pegasus 41", price: 10495, delivery: "5 days", rating: 4.5, reviews: "920", returns: "30-day return", url: "https://www.nike.com/in/w/pegasus-running-shoes-37v7jz5e1x6" }
      ]
    }
  ];

  function matchProduct(text) {
    var q = (text || "").toLowerCase();
    for (var i = 0; i < CATALOG.length; i++) {
      var p = CATALOG[i];
      for (var j = 0; j < p.keywords.length; j++) {
        if (q.indexOf(p.keywords[j]) !== -1) return p;
      }
    }
    return null;
  }

  /* ---------------- view switching ---------------- */
  var views = { console: $("#view-console"), error: $("#view-error"), results: $("#view-results") };
  function showView(name) {
    Object.keys(views).forEach(function (k) {
      views[k].classList.toggle("active", k === name);
      views[k].setAttribute("aria-hidden", k === name ? "false" : "true");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- negotiation console ---------------- */
  var STAGES = [
    { key: "understand", label: "Understand", msg: "Understanding your request…", sub: "Parsing brand, model and specification" },
    { key: "identify", label: "Identify", msg: "Product identified.", sub: "Confirmed the exact model and variant" },
    { key: "search", label: "Search", msg: "Checking shopping platforms…", sub: "Querying live catalogues across retailers" },
    { key: "compare", label: "Compare", msg: "Comparing matched listings…", sub: "Filtering out listings that don't match" },
    { key: "rank", label: "Rank", msg: "Ranking the best deals…", sub: "Sorting confirmed quotes by price" },
    { key: "done", label: "Done", msg: "Best deal found.", sub: "Preparing your results" }
  ];

  var searchToken = 0;

  function renderStepper(activeIndex) {
    var stepper = $("#stepper");
    stepper.innerHTML = STAGES.map(function (s, i) {
      var cls = i < activeIndex ? "done" : (i === activeIndex ? "current" : "");
      return '<div class="step ' + cls + '" role="listitem"><div class="step-dot"></div><div class="step-label">' + s.label + '</div></div>';
    }).join("");
  }

  function setStage(i) {
    var s = STAGES[i];
    renderStepper(i);
    $("#stage-message").textContent = s.msg;
    $("#stage-sub").textContent = s.sub;
  }

  async function runNegotiation(product, listingsPromise, matchNote) {
    var myToken = ++searchToken;
    $("#identified-chip-slot").innerHTML = "";
    $("#rows-panel").innerHTML = "";
    showView("console");
    setStage(0);
    await delay(950);
    if (myToken !== searchToken) return;

    setStage(1);
    $("#identified-chip-slot").innerHTML =
      '<div class="identified-chip"><div class="picon">' + ICONS[product.icon] + '</div>' +
      '<div class="pinfo"><p>' + product.name + '</p><small>' + product.spec + '</small></div>' +
      '<div class="pcheck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg></div></div>';
    await delay(750);
    if (myToken !== searchToken) return;

    setStage(2);
    var listings;
    try {
      listings = await listingsPromise;
    } catch (e) {
      if (myToken !== searchToken) return;
      showError();
      return;
    }
    if (!listings || !listings.length) {
      showError();
      return;
    }
    product.listings = listings;

    var rowsPanel = $("#rows-panel");
    var rowEls = product.listings.map(function (listing, i) {
      var el = document.createElement("div");
      el.className = "prow";
      el.style.animationDelay = (i * 0.05) + "s";
      el.innerHTML =
        '<div class="pbadge2">' + initials(listing.platform) + '</div>' +
        '<div class="pname">' + listing.platform + '</div>' +
        '<div class="pstatus" data-status>Waiting…</div>' +
        '<div class="spinner" data-spinner style="display:none;"></div>' +
        '<div class="pprice" data-price>' + fmtINR(listing.price) + '</div>';
      rowsPanel.appendChild(el);
      return el;
    });

    for (var i = 0; i < rowEls.length; i++) {
      if (myToken !== searchToken) return;
      var el = rowEls[i], listing = product.listings[i];
      var statusEl = el.querySelector("[data-status]");
      var spinnerEl = el.querySelector("[data-spinner]");
      var priceEl = el.querySelector("[data-price]");

      statusEl.textContent = "Connecting…";
      statusEl.classList.add("live");
      spinnerEl.style.display = "block";
      await delay(260 + Math.random() * 160);
      if (myToken !== searchToken) return;

      statusEl.textContent = "Checking price & stock…";
      await delay(320 + Math.random() * 220);
      if (myToken !== searchToken) return;

      statusEl.textContent = "Quote received";
      statusEl.classList.remove("live");
      spinnerEl.style.display = "none";
      priceEl.classList.add("show");
      el.classList.add("settled");
      await delay(90);
    }

    if (myToken !== searchToken) return;
    setStage(3);
    await delay(700);
    if (myToken !== searchToken) return;

    setStage(4);
    await delay(750);
    if (myToken !== searchToken) return;

    setStage(5);
    await delay(600);
    if (myToken !== searchToken) return;

    var sorted = renderResults(product, matchNote);
    showView("results");

    // Persist the resolved product so product.html (and a fast "back"
    // from it) don't need to re-run matching or the animation.
    sessionStorage.setItem("haggle_product", JSON.stringify({ product: product, matchNote: matchNote, sorted: sorted }));
  }

  $("#cancel-search").addEventListener("click", function () {
    searchToken++;
    window.location.href = "index.html";
  });

  /* ---------------- error / empty state ---------------- */
  function showError(title, message) {
    if (title) $("#error-title").textContent = title;
    if (message) $("#error-message").textContent = message;
    showView("error");
  }
  $("#error-retry").addEventListener("click", function () { window.location.href = "index.html"; });
  $("#error-home").addEventListener("click", function () { window.location.href = "index.html"; });
  $("#back-to-search").addEventListener("click", function () { window.location.href = "index.html"; });
  $("#new-search-btn").addEventListener("click", function () {
    sessionStorage.removeItem("haggle_query");
    sessionStorage.removeItem("haggle_product");
    sessionStorage.removeItem("haggle_skip_animation");
    window.location.href = "index.html";
  });

  /* ---------------- results rendering ---------------- */
  function renderResults(product, matchNote) {
    var sorted = product.listings.slice().sort(function (a, b) { return a.price - b.price; });
    var lowest = sorted[0].price;
    var highest = sorted[sorted.length - 1].price;

    $("#identified-banner").innerHTML =
      '<div class="picon">' + ICONS[product.icon] + '</div>' +
      '<div><h2>' + product.name + '<span style="color:var(--text-faint); font-weight:500;"> — ' + product.spec + '</span></h2>' +
      '<div class="match-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>' + matchNote + ' · ' + sorted.length + ' matching listings found</div></div>' +
      '<div class="stat"><div class="n">' + fmtINR(highest - lowest) + '</div><div class="l">Max. saved by comparing</div></div>';

    $("#results-count").textContent = sorted.length + " platforms compared";

    var list = $("#results-list");
    list.innerHTML = "";

    sorted.forEach(function (listing, idx) {
      var isBest = idx === 0;
      var saved = highest - listing.price;
      var card = document.createElement("div");
      card.className = isBest ? "best-card" : "rank-card";
      card.style.animationDelay = (idx * 0.09) + "s";

      var url = listing.url || PLATFORM_URLS[listing.platform] || "#";
      var meta = "";
      if (listing.rating !== undefined && listing.rating !== null) {
        meta += '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 4.6a2 2 0 0 0-2.8 0l-1.1 1.1 2.8 2.8 1.1-1.1a2 2 0 0 0 0-2.8z"/><path d="M12 8L3 17v4h4l9-9"/></svg>' + listing.rating + (listing.reviews ? ' (' + listing.reviews + ')' : '') + '</span>';
      }
      if (listing.delivery) {
        meta += '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="15" height="11" rx="2"/><path d="M18 10h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1 1 0 0 1-1 1H18"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="15.5" cy="18.5" r="1.5"/></svg>Delivery: ' + listing.delivery + '</span>';
      }

      card.innerHTML =
        (isBest ? '<div class="best-tag"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.6L21 9l-5 4.6L17.5 21 12 17.3 6.5 21 8 13.6 3 9l6.4-.4z"/></svg>Best price</div>' : '') +
        '<div class="rank-badge">' + (idx + 1) + '</div>' +
        '<div class="card-body">' +
          '<p class="platform-name">' + listing.platform + '</p>' +
          '<p class="listing-title">' + listing.title + '</p>' +
          (meta ? '<div class="card-meta">' + meta + '</div>' : '') +
        '</div>' +
        '<div class="price-block"><div class="price">' + fmtINR(listing.price) + '</div>' + (saved > 0 ? '<div class="save">Save ' + fmtINR(saved) + ' vs. highest</div>' : '<div class="save">Reference price</div>') + '</div>' +
          '<div class="card-actions">' +
          '<a class="visit-btn' + (isBest ? '' : ' secondary') + '" href="' + url + '" target="_blank" rel="noopener noreferrer">Visit site<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg></a>' +
          '<button class="detail-link" data-detail="' + idx + '">View full details</button>' +
        '</div>';

      list.appendChild(card);
    });

    // "View full details" -> hand the resolved product + selected index
    // to product.html.
    Array.prototype.slice.call(list.querySelectorAll("[data-detail]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        sessionStorage.setItem("haggle_product", JSON.stringify({ product: product, matchNote: matchNote, sorted: sorted }));
        sessionStorage.setItem("haggle_selected_index", btn.dataset.detail);
        window.location.href = "product.html";
      });
    });

    return sorted;
  }

  function fetchBackendListings(value) {
    var request = fetch("http://localhost:5000/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", value: value })
    }).then(function (response) {
      if (!response.ok) throw new Error("Backend search failed");
      return response.json();
    }).then(function (data) {
      return data.listings || [];
    });

    return Promise.race([
      request,
      delay(15000).then(function () { throw new Error("Backend search timed out"); })
    ]);
  }

  /* ---------------- boot: read the handoff from index.html ---------------- */
  function boot() {
    var skip = sessionStorage.getItem("haggle_skip_animation");
    var storedResolved = sessionStorage.getItem("haggle_product");

    if (skip === "true" && storedResolved) {
      sessionStorage.removeItem("haggle_skip_animation");
      try {
        var resolved = JSON.parse(storedResolved);
        renderResults(resolved.product, resolved.matchNote);
        showView("results");
        return;
      } catch (e) { /* fall through to normal flow */ }
    }

    var raw = sessionStorage.getItem("haggle_query");
    if (!raw) {
      showError("Start a search first", "There's no search in progress. Head back and describe a product, paste a link, or upload a photo to get started.");
      return;
    }

    var query;
    try { query = JSON.parse(raw); } catch (e) { query = null; }

    if (!query || query.forceError) {
      showError();
      return;
    }

    if (query.type !== "text") {
      showError();
      return;
    }

    var product = {
      name: query.value,
      spec: "Live results from shopping platforms",
      icon: "package",
      listings: []
    };

    var matchNote = query.type === "text" ? "Matched from your description"
      : query.type === "link" ? "Matched from the product link"
      : "Matched from your photo";

    runNegotiation(product, fetchBackendListings(query.value), matchNote);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  boot();
})();