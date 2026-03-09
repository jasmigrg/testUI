(() => {
  document.querySelectorAll(".input-date").forEach((wrap) => {
    const display = wrap.querySelector(".date-display");
    const hidden = wrap.querySelector(".date-hidden");
    const btn = wrap.querySelector(".calendar-btn");
    const sync = (val) => {
      if (!val) {
        display.value = "";
        return;
      }
      const parts = val.split("-");
      if (parts.length !== 3) return;
      display.value = parts[1] + "/" + parts[2] + "/" + parts[0];
    };
    btn.addEventListener("click", () => (hidden.showPicker ? hidden.showPicker() : hidden.click()));
    hidden.addEventListener("change", (e) => sync(e.target.value));
  });

  const equalizeHeights = (selector) => {
    const items = Array.from(document.querySelectorAll(selector)).filter((el) => {
      if (el.closest("[hidden]") || el.closest(".collapsed")) return false;
      return el.offsetParent !== null;
    });
    if (!items.length) return;
    items.forEach((el) => (el.style.height = "auto"));
    const max = Math.max(...items.map((el) => el.offsetHeight));
    items.forEach((el) => (el.style.height = max + "px"));
  };

  const runLayout = () => {
    equalizeHeights(".inputs-card, .customer-card, .item-card");
    equalizeHeights(".pricing-info-card, .price-rule-card, .uom-card");
  };

  const runStabilized = () => {
    runLayout();
    requestAnimationFrame(runLayout);
  };

  const section = document.getElementById("priceSection");
  const toggle = section?.querySelector(".collapse-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const activePanel = section.querySelector(".tab-panel:not([hidden])");
      if (!activePanel) return;
      const collapsed = activePanel.classList.toggle("collapsed");
      toggle.setAttribute("aria-expanded", (!collapsed).toString());
      requestAnimationFrame(runStabilized);
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
      requestAnimationFrame(runStabilized);
    });
  });

  const init = async () => {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore font readiness errors
      }
    }
    runStabilized();
  };

  const getByPath = (obj, path) => {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const applyData = (data, prefixes = null) => {
    if (!data) return;
    document.querySelectorAll("[data-field]").forEach((el) => {
      const key = el.getAttribute("data-field");
      if (!key) return;
      if (prefixes && !prefixes.some((p) => key.startsWith(p))) return;
      const val = getByPath(data, key);
      if (typeof val === "undefined") return;
      if (el.type === "checkbox") {
        el.checked = Boolean(val);
        return;
      }
      if (el.type === "radio") {
        el.checked = String(el.value) === String(val);
        return;
      }
      el.value = val;
    });
  };

  const clearDataFields = (keepKeys = []) => {
    document.querySelectorAll("[data-field]").forEach((el) => {
      const key = el.getAttribute("data-field");
      if (keepKeys.includes(key)) return;
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = false;
        return;
      }
      el.value = "";
    });
  };

  const fetchPricingData = async (customer, itemNumber, catNumber, priceDate) => {
    const ctx = window.__ctx || "";
    const params = new URLSearchParams();
    params.set("customer", customer || "");
    params.set("itemNumber", itemNumber || "");
    params.set("catNumber", catNumber || "");
    if (priceDate) {
      params.set("priceDate", priceDate);
    }
    const url = `${ctx}/api/pricing-inquiry?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Mock API failed");
    return res.json();
  };

  const outputScope = ["customer.", "item.", "priceBreakdown.", "additionalInfo.", "govtLimits."];
  let cachedData = null;

  const VALIDATION_MESSAGES = {
    customer: "Error Message - Invalid Customer/Ship-To Account",
    itemNumber: "Error Message - Invalid Item Number",
    catNumber: "Error Message - Item Master Record Not Found",
    priceDate: "Error Message - Date Changed is Invalid",
  };
  const REQUIRED_MESSAGES = {
    customer: "Error Message - Customer is required field",
    itemNumber: "Error Message - Item Number is required field",
    priceDate: "Error Message - Price Date is required",
  };

  const itemInput = document.querySelector('[data-field="inputs.itemNumber"]');
  const customerInput = document.querySelector('[data-field="inputs.customer"]');
  const catInput = document.querySelector('[data-field="inputs.catNumber"]');
  const priceDateDisplayInput = document.querySelector('[data-field="inputs.priceDate"]');
  const getPriceBtn = document.querySelector(".inputs-card .primary");
  const clearBtn = document.querySelector('[data-action="clear"]');
  const itemError = document.querySelector('[data-role="item-error"]');
  const priceDateInput = document.querySelector('[data-field="inputs.priceDateIso"]');
  const inputsCard = document.querySelector(".inputs-card");
  const defaultErrorText = itemError ? itemError.textContent : "";
  const makeKey = (item, date, customer, catNumber) =>
    `${item}|${date || ""}|${customer || ""}|${catNumber || ""}`;
  let lastKey = "";

  const clearFieldErrors = () => {
    inputsCard?.querySelectorAll(".field-invalid").forEach((el) => el.classList.remove("field-invalid"));
  };

  const showValidationError = (field, element, message = null) => {
    clearFieldErrors();
    if (element) {
      element.classList.add("field-invalid");
      element.focus?.();
    }
    if (itemError) {
      itemError.textContent = message || VALIDATION_MESSAGES[field] || defaultErrorText;
      itemError.hidden = false;
    }
  };

  const clearValidationError = () => {
    clearFieldErrors();
    if (itemError) {
      itemError.hidden = true;
      itemError.textContent = defaultErrorText;
    }
  };

  customerInput?.addEventListener("input", () => {
    clearValidationError();
    cachedData = null;
    lastKey = "";
  });
  catInput?.addEventListener("input", () => {
    clearValidationError();
    cachedData = null;
    lastKey = "";
  });
  priceDateDisplayInput?.addEventListener("input", clearValidationError);

  const parseMmDdYyyyToIso = (value) => {
    const text = String(value || "").trim();
    if (!text) return null;
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const mm = Number(match[1]);
    const dd = Number(match[2]);
    const yyyy = Number(match[3]);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 9999) return null;
    const dt = new Date(yyyy, mm - 1, dd);
    if (
      dt.getFullYear() !== yyyy ||
      dt.getMonth() + 1 !== mm ||
      dt.getDate() !== dd
    ) {
      return null;
    }
    return `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  };

  const normalizeDateInputs = ({ required } = { required: true }) => {
    const displayVal = priceDateDisplayInput?.value?.trim() || "";
    const hiddenVal = priceDateInput?.value?.trim() || "";
    if (!displayVal && !hiddenVal) {
      if (required) {
        showValidationError(
          "priceDate",
          priceDateDisplayInput,
          REQUIRED_MESSAGES.priceDate
        );
      }
      return false;
    }
    if (displayVal) {
      const parsedIso = parseMmDdYyyyToIso(displayVal);
      if (!parsedIso) {
        if (priceDateInput) {
          priceDateInput.value = "";
        }
        showValidationError("priceDate", priceDateDisplayInput);
        return false;
      }
      if (priceDateInput) {
        priceDateInput.value = parsedIso;
      }
      return true;
    }
    if (hiddenVal) {
      return true;
    }
    if (required) {
      showValidationError(
        "priceDate",
        priceDateDisplayInput,
        REQUIRED_MESSAGES.priceDate
      );
    }
    return false;
  };

  const validateMandatoryInputs = () => {
    const customer = customerInput?.value?.trim() || "";
    const itemNumber = itemInput?.value?.trim() || "";
    if (!customer) {
      showValidationError("customer", customerInput, REQUIRED_MESSAGES.customer);
      return false;
    }
    if (!itemNumber) {
      showValidationError("itemNumber", itemInput, REQUIRED_MESSAGES.itemNumber);
      return false;
    }
    if (!normalizeDateInputs({ required: true })) {
      return false;
    }
    clearValidationError();
    return true;
  };

  const resolveApiError = (data, fallbackField = "itemNumber") => {
    if (!data || !data.error) return null;
    const field = (data.field && VALIDATION_MESSAGES[data.field]) ? data.field : fallbackField;
    return {
      field,
      message: data.error || VALIDATION_MESSAGES[field] || defaultErrorText,
    };
  };

  const showApiError = (errorInfo) => {
    if (!errorInfo) return;
    const fieldToElement = {
      customer: customerInput,
      itemNumber: itemInput,
      catNumber: catInput,
      priceDate: priceDateDisplayInput,
    };
    clearFieldErrors();
    const el = fieldToElement[errorInfo.field];
    if (el) {
      el.classList.add("field-invalid");
      el.focus?.();
    }
    if (itemError) {
      itemError.textContent = errorInfo.message;
      itemError.hidden = false;
    }
  };

  itemInput?.addEventListener("input", () => {
    clearValidationError();
    cachedData = null;
    lastKey = "";
  });

  priceDateInput?.addEventListener("change", () => {
    clearValidationError();
    cachedData = null;
    lastKey = "";
  });

  if (getPriceBtn) {
    getPriceBtn.addEventListener("click", async () => {
      if (!validateMandatoryInputs()) {
        return;
      }
      const customer = customerInput?.value?.trim() || "";
      const itemNumber = itemInput?.value?.trim() || "";
      const catNumber = catInput?.value?.trim() || "";
      const key = makeKey(itemNumber, priceDateInput?.value, customer, catNumber);
      try {
        const data = cachedData && lastKey === key
          ? cachedData
          : await fetchPricingData(
              customer,
              itemNumber,
              catNumber,
              priceDateInput?.value
            );
        const apiError = resolveApiError(data, "itemNumber");
        if (apiError) {
          showApiError(apiError);
          clearDataFields(["inputs.itemNumber", "inputs.priceDate", "inputs.priceDateIso"]);
          cachedData = null;
          lastKey = "";
          return;
        }
        clearValidationError();
        cachedData = data;
        applyData(data, outputScope);
        lastKey = key;
      } catch (e) {
        // ignore for mock failures
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      cachedData = null;
      clearValidationError();
      document.querySelectorAll("[data-field]").forEach((el) => {
        if (el.type === "checkbox" || el.type === "radio") {
          el.checked = false;
          return;
        }
        el.value = "";
      });
      document.querySelectorAll(".input-date").forEach((wrap) => {
        const display = wrap.querySelector(".date-display");
        const hidden = wrap.querySelector(".date-hidden");
        if (display) display.value = "";
        if (hidden) hidden.value = "";
      });
    });
  }

  window.addEventListener("load", init);
  window.addEventListener("resize", () => {
    clearTimeout(window.__piResize);
    window.__piResize = setTimeout(runStabilized, 100);
  });

  if (window.ResizeObserver) {
    let rafId = 0;
    const ro = new ResizeObserver(() => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        runStabilized();
      });
    });
    document
      .querySelectorAll(".card-grid, .price-grid, .additional-grid")
      .forEach((el) => ro.observe(el));
  }
})();
