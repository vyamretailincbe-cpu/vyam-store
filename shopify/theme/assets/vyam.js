(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function money(cents) {
    return "₹" + (cents / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }

  // "₹24.95 per wash" for variants titled like "20 Pods". Mirrors snippets/per-wash.liquid.
  function perWash(v) {
    var pods = parseInt(v.title, 10);
    return pods > 0 ? money(Math.round(v.price / pods)) + " per wash" : "";
  }

  // Mobile menu
  var toggle = $("[data-menu-toggle]");
  var menu = $("[data-mobile-menu]");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
  }

  // Quantity steppers (product page). Cart steppers also submit the cart form.
  $$("[data-qty], [data-cart-qty]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = $("[data-qty-input]", btn.parentNode);
      var step = parseInt(btn.dataset.qty || btn.dataset.cartQty, 10);
      var min = btn.dataset.cartQty ? 0 : 1;
      input.value = Math.max(min, (parseInt(input.value, 10) || 0) + step);
      if (btn.dataset.cartQty) btn.closest("form").submit();
    });
  });

  // Image carousel. Each image's alt text contains its variant title (e.g. "…, 20 Pods – front of pack"),
  // so each variant shows its own images; with no match all slides are shown.
  function Carousel(box) {
    var slides = $$(".cslide", box);
    var dots = $("[data-dots]", box);
    var active = slides, i = 0, timer = null, paused = false;

    function render() {
      slides.forEach(function (s) { s.classList.toggle("on", s === active[i]); });
      if (dots) Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === i); });
    }
    function go(n) { i = ((n % active.length) + active.length) % active.length; render(); }
    function start() {
      clearInterval(timer);
      if (active.length > 1) timer = setInterval(function () { if (!paused) go(i + 1); }, 5000);
    }
    function show(group) {
      var matched = slides.filter(function (s) { return s.dataset.group.indexOf(group) !== -1; });
      active = matched.length ? matched : slides;
      i = 0;
      if (dots) {
        dots.innerHTML = "";
        active.forEach(function (_, k) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "cdot";
          b.setAttribute("aria-label", "Image " + (k + 1));
          b.addEventListener("click", function () { go(k); });
          dots.appendChild(b);
        });
      }
      $$(".cnav, [data-dots]", box).forEach(function (el) { el.hidden = active.length < 2; });
      render();
      start();
    }

    var prev = $("[data-prev]", box), next = $("[data-next]", box);
    if (prev) prev.addEventListener("click", function () { go(i - 1); });
    if (next) next.addEventListener("click", function () { go(i + 1); });
    box.addEventListener("mouseenter", function () { paused = true; });
    box.addEventListener("mouseleave", function () { paused = false; });
    return { show: show };
  }

  // Product page
  var root = $("[data-product]");
  if (root) {
    var product = JSON.parse($("[data-product-json]", root).textContent);
    var box = $("[data-carousel]", root);
    var carousel = box ? Carousel(box) : null;
    var form = $("form", root);
    var idInput = $("[data-variant-input]", root);
    var addBtn = $("[data-add]", root);
    var added = $("[data-added]", root);
    var error = $("[data-error]", root);
    var current = null;

    function select(id) {
      var v = product.variants.filter(function (x) { return String(x.id) === String(id); })[0];
      if (!v) return;
      current = v;
      idInput.value = v.id;
      $("[data-price]", root).textContent = money(v.price);
      var onSale = v.compare_at_price > v.price;
      var was = $("[data-compare]", root), save = $("[data-save]", root);
      was.hidden = save.hidden = !onSale;
      if (onSale) {
        was.textContent = money(v.compare_at_price);
        save.textContent = "Save " + Math.floor((v.compare_at_price - v.price) * 100 / v.compare_at_price) + "%";
      }
      $("[data-note]", root).textContent = perWash(v);
      addBtn.disabled = !v.available;
      addBtn.textContent = v.available ? "Add to cart" : "Sold out";
      $$("[data-variant-id]", root).forEach(function (b) { b.classList.toggle("on", b.dataset.variantId === String(v.id)); });
      if (carousel) carousel.show(v.title);
    }

    $$("[data-variant-id]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        select(b.dataset.variantId);
        history.replaceState(null, "", location.pathname + "?variant=" + b.dataset.variantId);
      });
    });
    select(idInput.value);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      addBtn.disabled = true;
      error.hidden = true;
      fetch(root.dataset.cartAdd + ".js", { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (r) {
          return r.json().then(function (j) {
            if (!r.ok) throw new Error(j.description || "Could not add to cart.");
          });
        })
        .then(function () { return fetch(root.dataset.cart + ".js").then(function (r) { return r.json(); }); })
        .then(function (cart) {
          $$("[data-cart-count]").forEach(function (el) { el.textContent = cart.item_count; el.hidden = cart.item_count === 0; });
          added.hidden = false;
          setTimeout(function () { added.hidden = true; }, 4000);
        })
        .catch(function (err) { error.textContent = err.message; error.hidden = false; })
        .then(function () { addBtn.disabled = !current.available; });
    });
  }
})();
