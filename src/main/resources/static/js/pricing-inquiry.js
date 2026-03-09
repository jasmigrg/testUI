(() => {
  document.querySelectorAll(".input-date").forEach((wrap) => {
    const display = wrap.querySelector(".date-display");
    const hidden = wrap.querySelector(".date-hidden");
    const btn = wrap.querySelector(".calendar-btn");
    const sync = (val) => {
      if (!val) return;
      const parts = val.split("-");
      if (parts.length !== 3) return;
      display.value = parts[1] + "/" + parts[2] + "/" + parts[0];
    };
    btn.addEventListener("click", () => (hidden.showPicker ? hidden.showPicker() : hidden.click()));
    hidden.addEventListener("change", (e) => sync(e.target.value));
  });

  const section = document.getElementById("priceSection");
  const toggle = section?.querySelector(".collapse-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const activePanel = section.querySelector(".tab-panel:not([hidden])");
      if (!activePanel) return;
      const collapsed = activePanel.classList.toggle("collapsed");
      toggle.setAttribute("aria-expanded", (!collapsed).toString());
    });
  }

  const tabs = section?.querySelectorAll(".tab-btn");
  const panels = {
    "Price Breakdown": document.getElementById("priceBreakdown"),
    "Additional Information": document.getElementById("additionalInfo"),
    "Govt List Price and Limits": document.getElementById("govtLimits"),
  };
  tabs?.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      Object.values(panels).forEach((p) => p?.setAttribute("hidden", "true"));
      const target = panels[tab.textContent?.trim() || ""];
      target?.removeAttribute("hidden");
      target?.classList.remove("collapsed");
      toggle?.setAttribute("aria-expanded", "true");
    });
  });
})();
