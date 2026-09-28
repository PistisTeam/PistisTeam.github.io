/* Progressive enhancement only: native touch/trackpad/keyboard scrolling also
   works without JavaScript. Each row owns its scroll position and controls. */
(() => {
  function initialize() {
    document.querySelectorAll("[data-result-row]").forEach(row => {
      if (row.dataset.scrollReady) return;
      const strip = row.querySelector(".benchmark-strip");
      const controls = row.querySelector(".result-row-controls");
      const previous = controls.querySelector('[data-scroll-direction="-1"]');
      const next = controls.querySelector('[data-scroll-direction="1"]');
      row.dataset.scrollReady = "true";
      controls.hidden = false;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let drag = null;

      function updateControls() {
        previous.disabled = strip.scrollLeft <= 1;
        next.disabled = strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 1;
      }

      function move(direction) {
        const chart = strip.querySelector(".small-chart");
        const stride = chart.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap);
        strip.scrollBy({ left: direction * stride, behavior: reducedMotion.matches ? "instant" : "smooth" });
      }

      previous.addEventListener("click", () => move(-1));
      next.addEventListener("click", () => move(1));
      strip.addEventListener("scroll", updateControls, { passive: true });
      const observer = new ResizeObserver(updateControls);
      observer.observe(strip);
      strip.addEventListener("keydown", event => {
        if (event.target !== strip) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          strip.scrollTo({ left: event.key === "Home" ? 0 : strip.scrollWidth, behavior: "instant" });
        }
      });

      strip.addEventListener("pointerdown", event => {
        // Leave touch panning and scrollbar interaction to the browser.
        if (event.pointerType !== "mouse" || event.button !== 0 || event.offsetY >= strip.clientHeight) return;
        drag = { id: event.pointerId, x: event.clientX, left: strip.scrollLeft, active: false };
      });
      strip.addEventListener("pointermove", event => {
        if (!drag || event.pointerId !== drag.id) return;
        const distance = event.clientX - drag.x;
        if (!drag.active && Math.abs(distance) < 5) return;
        if (!drag.active) {
          drag.active = true;
          strip.setPointerCapture(event.pointerId);
          strip.classList.add("is-dragging");
        }
        event.preventDefault();
        strip.scrollLeft = drag.left - distance;
      });
      function finishDrag(event) {
        if (!drag || event.pointerId !== drag.id) return;
        if (strip.hasPointerCapture(event.pointerId)) strip.releasePointerCapture(event.pointerId);
        strip.classList.remove("is-dragging");
        drag = null;
      }
      strip.addEventListener("pointerup", finishDrag);
      strip.addEventListener("pointercancel", finishDrag);
      strip.addEventListener("lostpointercapture", finishDrag);
      strip.addEventListener("pointerleave", event => { if (drag && !drag.active) finishDrag(event); });
      strip.addEventListener("dragstart", event => event.preventDefault());
      updateControls();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
