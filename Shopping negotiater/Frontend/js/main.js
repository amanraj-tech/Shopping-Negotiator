/* =========================================================
   main.js — behaviour for index.html only.
   ========================================================= */
(function () {
  "use strict";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var currentTab = "text";
  var taglineEl = $("#tagline-text");
  var taglines = [
    "Smart Shopping. Better Savings.",
    "One Search. Multiple Stores.",
    "Compare More. Pay Less.",
    "Your Search. Our Comparison.",
    "Find the Best Deal."
  ];
  var taglineIndex = 0;

  function rotateTagline() {
    if (!taglineEl) return;
    taglineEl.classList.add("is-changing");
    setTimeout(function () {
      taglineIndex = (taglineIndex + 1) % taglines.length;
      taglineEl.textContent = taglines[taglineIndex];
      taglineEl.classList.remove("is-changing");
    }, 180);
  }

  if (taglineEl) {
    taglineEl.textContent = taglines[0];
    setInterval(rotateTagline, 2600);
  }

  function updateHint() {
    var hint = $("#field-hint");
    hint.classList.remove("error");
    if (currentTab === "text") hint.textContent = "Works best with brand, model and any key details.";
    else if (currentTab === "link") hint.textContent = "Paste a product page URL from any shopping platform.";
    else hint.textContent = "A clear, well-lit photo helps SN identify the product.";
  }

  $all(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentTab = btn.dataset.tab;
      $all(".tab-btn").forEach(function (b) { b.setAttribute("aria-selected", b === btn ? "true" : "false"); });
      $all(".tab-panel").forEach(function (p) { p.classList.toggle("active", p.id === "panel-" + currentTab); });
      updateHint();
    });
  });

  var uploadedFile = null;
  var uploadedDataUrl = null;
  var dropzone = $("#dropzone");
  var fileInput = $("#file-input");

  dropzone.addEventListener("click", function () { fileInput.click(); });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  ["dragover", "dragenter"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add("dragging"); });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove("dragging"); });
  });
  dropzone.addEventListener("drop", function (e) {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    uploadedFile = file;
    var reader = new FileReader();
    reader.onload = function (e) {
      uploadedDataUrl = e.target.result;
      $("#preview-img").src = uploadedDataUrl;
      $("#preview-name").textContent = file.name;
      $("#preview-size").textContent = Math.round(file.size / 1024) + " KB";
      $("#upload-preview").style.display = "flex";
      dropzone.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  $("#preview-remove").addEventListener("click", function () {
    uploadedFile = null;
    uploadedDataUrl = null;
    fileInput.value = "";
    $("#upload-preview").style.display = "none";
    dropzone.style.display = "block";
  });

  $all(".chip[data-example]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      currentTab = "text";
      $all(".tab-btn").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === "text" ? "true" : "false"); });
      $all(".tab-panel").forEach(function (p) { p.classList.toggle("active", p.id === "panel-text"); });
      updateHint();
      $("#text-input").value = chip.dataset.example;
      submitSearch();
    });
  });

  $("#demo-error-btn").addEventListener("click", function () {
    sessionStorage.setItem("haggle_query", JSON.stringify({ forceError: true }));
    sessionStorage.removeItem("haggle_skip_animation");
    window.location.href = "results.html";
  });

  $("#submit-btn").addEventListener("click", submitSearch);
  $("#text-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitSearch(); }
  });
  $("#link-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submitSearch(); }
  });

  function submitSearch() {
    var hint = $("#field-hint");
    var payload = { type: currentTab };

    if (currentTab === "text") {
      var text = $("#text-input").value.trim();
      if (!text) { hint.textContent = "Describe the product you're looking for."; hint.classList.add("error"); $("#text-input").focus(); return; }
      payload.value = text;
    } else if (currentTab === "link") {
      var link = $("#link-input").value.trim();
      if (!link) { hint.textContent = "Paste a product link to continue."; hint.classList.add("error"); $("#link-input").focus(); return; }
      payload.value = link;
    } else {
      if (!uploadedFile) { hint.textContent = "Upload a product photo to continue."; hint.classList.add("error"); return; }
      payload.value = "image upload";
      payload.fileName = uploadedFile.name;
      payload.fileDataUrl = uploadedDataUrl;
    }

    hint.classList.remove("error");
    sessionStorage.setItem("haggle_query", JSON.stringify(payload));
    sessionStorage.removeItem("haggle_skip_animation");
    window.location.href = "results.html";
  }

  var tickerItems = [
    "UNDERSTANDING REQUEST", "IDENTIFYING PRODUCT", "SEARCHING PLATFORMS",
    "MATCHING LISTINGS", "COMPARING PRICES", "RANKING RESULTS"
  ];
  function buildTicker() {
    var track = $("#ticker-track");
    if (!track) return;
    var html = "";
    for (var rep = 0; rep < 2; rep++) {
      tickerItems.forEach(function (t) {
        html += '<div class="ticker-item"><b>' + t + '</b><span class="sep">···</span></div>';
      });
    }
    track.innerHTML = html;
  }

  var PLATFORM_ALL = ["Amazon", "Flipkart", "Myntra", "Croma", "Reliance Digital", "Tata CLiQ", "Vijay Sales"];
  function initials(platform) {
    var words = platform.split(" ");
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return platform.slice(0, 2).toUpperCase();
  }
  function buildPlatformBadges() {
    var wrap = $("#platform-badges");
    if (!wrap) return;
    wrap.innerHTML = PLATFORM_ALL.map(function (p) {
      return '<div class="pbadge"><span class="pdot">' + initials(p) + '</span>' + p + '</div>';
    }).join("");
  }

  updateHint();
  buildTicker();
  buildPlatformBadges();
})();