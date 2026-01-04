/**
 * Product Configurator JavaScript
 * De Prefabriek - Shopify Theme
 */

(function () {
  "use strict";

  // ================================
  // Configuration
  // ================================
  const CONFIG = {
    currency: "€",
    minDepth: 150,
    maxDepth: 400,
    minLength: 200,
    maxLength: 1500,
    selectors: {
      container: "#vpc-container",
      sidebar: "#vpc-sidebar",
      components: ".vpc-component",
      componentHeader: ".vpc-component-header",
      options: ".vpc-options",
      optionInputs: ".vpc-single-option-wrap input",
      exteriorButton: "#vpc-exterior-button",
      interiorButton: "#vpc-interior-button",
      depthInput: 'input[name="extension-depth"]',
      lengthInput: 'input[name="extension-length"]',
      sizeResult: ".extension-size__result",
      previewContainer: "#vpc-preview-container",
      exteriorImages: ".s-configurator-container__exterior-images",
      interiorImages: ".s-configurator-container__interior-images",
      brickLoader: ".brick-loader",
      savePopup: ".vpc-save-popup",
      step1: ".vpc-step-1",
      step2: "#vpc-step-2",
      step3: "#vpc-step-3",
      quoteForm: "#rqa_form",
    },
  };

  // ================================
  // State Management
  // ================================
  const state = {
    currentStep: 1,
    currentView: "exterior", // 'exterior' or 'interior'
    selectedOptions: {},
    dimensions: {
      depth: 200,
      length: 450,
    },
    totalPrice: 0,
    exteriorPrice: 0,
    interiorPrice: 0,
  };

  // ================================
  // DOM Elements Cache
  // ================================
  let elements = {};

  // ================================
  // Initialization
  // ================================
  function init() {
    cacheElements();
    bindEvents();
    initializeSizeCalculator();
    initializeDefaultSelections();
    updatePreview();
    console.log("Configurator initialized");
  }

  function cacheElements() {
    elements = {
      container: document.querySelector(CONFIG.selectors.container),
      sidebar: document.querySelector(CONFIG.selectors.sidebar),
      components: document.querySelectorAll(CONFIG.selectors.components),
      exteriorButton: document.querySelector(CONFIG.selectors.exteriorButton),
      interiorButton: document.querySelector(CONFIG.selectors.interiorButton),
      depthInput: document.querySelector(CONFIG.selectors.depthInput),
      lengthInput: document.querySelector(CONFIG.selectors.lengthInput),
      sizeResult: document.querySelector(CONFIG.selectors.sizeResult),
      previewContainer: document.querySelector(
        CONFIG.selectors.previewContainer
      ),
      exteriorImages: document.querySelector(CONFIG.selectors.exteriorImages),
      interiorImages: document.querySelector(CONFIG.selectors.interiorImages),
      brickLoader: document.querySelector(CONFIG.selectors.brickLoader),
      savePopup: document.querySelector(CONFIG.selectors.savePopup),
      step1: document.querySelector(CONFIG.selectors.step1),
      step2: document.querySelector(CONFIG.selectors.step2),
      step3: document.querySelector(CONFIG.selectors.step3),
      quoteForm: document.querySelector(CONFIG.selectors.quoteForm),
    };
  }

  function bindEvents() {
    // Component accordion toggle
    elements.components.forEach((component) => {
      const header = component.querySelector(CONFIG.selectors.componentHeader);
      if (header) {
        header.addEventListener("click", () => toggleComponent(component));
      }
    });

    // Option selection
    document
      .querySelectorAll(CONFIG.selectors.optionInputs)
      .forEach((input) => {
        input.addEventListener("change", handleOptionChange);
      });

    // Exterior/Interior toggle
    if (elements.exteriorButton) {
      elements.exteriorButton.addEventListener("change", () =>
        switchView("exterior")
      );
    }
    if (elements.interiorButton) {
      elements.interiorButton.addEventListener("change", () =>
        switchView("interior")
      );
    }

    // Size calculator
    if (elements.depthInput) {
      elements.depthInput.addEventListener("input", handleSizeChange);
      elements.depthInput.addEventListener("blur", validateSize);
    }
    if (elements.lengthInput) {
      elements.lengthInput.addEventListener("input", handleSizeChange);
      elements.lengthInput.addEventListener("blur", validateSize);
    }

    // Help popup
    const helpButton = document.querySelector(".vpc-save-popup__button");
    const closeButton = document.querySelector(".vpc-save-popup__close-button");
    const overlay = document.querySelector(".vpc-save-popup__overlay");
    const startButton = document.querySelector(".vpc-save-popup__start-button");

    if (helpButton) {
      helpButton.addEventListener("click", () => toggleHelpPopup(true));
    }
    if (closeButton) {
      closeButton.addEventListener("click", () => toggleHelpPopup(false));
    }
    if (overlay) {
      overlay.addEventListener("click", () => toggleHelpPopup(false));
    }
    if (startButton) {
      startButton.addEventListener("click", () => toggleHelpPopup(false));
    }

    // Quote form submission
    if (elements.quoteForm) {
      elements.quoteForm.addEventListener("submit", handleQuoteSubmit);
    }

    // Step 2 form (achterom, doorbraak, postcode)
    const step2Form = document.querySelector("#step-2-form");
    if (step2Form) {
      step2Form.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", handleStep2FormChange);
      });
    }
  }

  // ================================
  // Component Accordion
  // ================================
  function toggleComponent(component) {
    const options = component.querySelector(CONFIG.selectors.options);
    const isOpen = component.classList.contains("open");

    // Close all other components
    elements.components.forEach((c) => {
      c.classList.remove("open");
      const opts = c.querySelector(CONFIG.selectors.options);
      if (opts) opts.style.display = "none";
    });

    // Toggle current component
    if (!isOpen) {
      component.classList.add("open");
      if (options) options.style.display = "block";
    }
  }

  // ================================
  // Option Selection
  // ================================
  function handleOptionChange(e) {
    const input = e.target;
    const component = input.closest(".vpc-component");
    const componentId = component?.dataset.component_id || input.name;
    const value = input.value;
    const price = parseFloat(input.dataset.price) || 0;
    const imgUrl = input.dataset.img;
    const imgHtml = input.dataset.imagehtml;
    const optionClass = input.dataset.class;
    const index = input.dataset.index;
    const optionId = input.dataset.oid;

    // Update state
    state.selectedOptions[componentId] = {
      value,
      price,
      imgUrl,
      imgHtml,
      class: optionClass,
      index,
      optionId,
    };

    // Update selected label
    const selectedSpan = component?.querySelector(".vpc-selected-option");
    if (selectedSpan) {
      selectedSpan.textContent = value;
    }

    // Update prices
    calculatePrices();

    // Update preview image - remove old overlay for this component and add new one
    updatePreviewImage(componentId, optionId, imgUrl, optionClass, index);

    // Handle conditional options (e.g., rollaag based on gevelbekleding)
    handleConditionalOptions(input);

    // Keep dropdown open after selection - do not auto-close
  }

  function handleConditionalOptions(selectedInput) {
    // Handle rollaag visibility based on gevelbekleding selection
    const gevelbekleding = selectedInput.closest(
      '[data-component_id="component-5e68ad18fbbc0"]'
    );
    if (gevelbekleding) {
      const value = selectedInput.value.toLowerCase();
      updateRollaagOptions(value);
    }

    // Handle daktrim visibility based on overstek selection
    const overstek =
      selectedInput.closest('[data-component_id*="overstek"]') ||
      selectedInput.name.toLowerCase().includes("overstek");
    if (overstek) {
      updateDaktrimOptions(selectedInput.value);
    }
  }

  function updateRollaagOptions(gevelbekledingValue) {
    const rollaagComponent = document.querySelector("#component-5e68ad185da99");
    if (!rollaagComponent) return;

    const options = rollaagComponent.querySelectorAll(
      ".vpc-single-option-wrap"
    );

    options.forEach((wrap) => {
      const input = wrap.querySelector("input");
      if (!input) return;

      const optionValue = input.value.toLowerCase();

      // Hide all specific rollaag options first
      if (optionValue !== "nee") {
        wrap.style.display = "none";

        // Show matching rollaag options
        if (
          gevelbekledingValue.includes("baksteen") &&
          optionValue.includes("baksteen")
        ) {
          const color = gevelbekledingValue.split(" ").pop();
          if (optionValue.includes(color) || optionValue.includes("rood")) {
            wrap.style.display = "";
          }
        } else if (
          gevelbekledingValue.includes("keralit") &&
          optionValue.includes("keralit")
        ) {
          wrap.style.display = "";
        } else if (
          gevelbekledingValue.includes("frake") &&
          optionValue.includes("frake")
        ) {
          wrap.style.display = "";
        } else if (
          gevelbekledingValue.includes("red cedar") &&
          optionValue.includes("red cedar")
        ) {
          wrap.style.display = "";
        }
      }
    });
  }

  function updateDaktrimOptions(overstekValue) {
    // Handle daktrim hidden component based on overstek selection
    const daktrimHidden = document.querySelector("#component-6049e3e66e18e");
    if (!daktrimHidden) return;

    const hasOverstek =
      overstekValue && !overstekValue.toLowerCase().includes("geen");

    daktrimHidden
      .querySelectorAll(".vpc-single-option-wrap")
      .forEach((wrap) => {
        const input = wrap.querySelector("input");
        if (!input) return;

        const value = input.value.toLowerCase();

        if (hasOverstek) {
          wrap.style.display =
            value.includes("overstek") && !value.includes("zonder")
              ? ""
              : "none";
        } else {
          wrap.style.display =
            value.includes("zonder") || value === "daktrim zonder overstek"
              ? ""
              : "none";
        }
      });
  }

  // ================================
  // Price Calculation
  // ================================
  function calculatePrices() {
    let exteriorTotal = 0;
    let interiorTotal = 0;

    Object.values(state.selectedOptions).forEach((option) => {
      if (option.class === "exterior-element") {
        exteriorTotal += option.price;
      } else if (option.class === "interior-element") {
        interiorTotal += option.price;
      }
    });

    // Add step 2 form prices
    const step2Form = document.querySelector("#step-2-form");
    if (step2Form) {
      step2Form.querySelectorAll("input:checked").forEach((input) => {
        const price = parseFloat(input.dataset.price) || 0;
        exteriorTotal += price;
      });
    }

    state.exteriorPrice = exteriorTotal;
    state.interiorPrice = interiorTotal;
    state.totalPrice = exteriorTotal + interiorTotal;

    updatePriceDisplay();
  }

  function updatePriceDisplay() {
    const exteriorPriceEl = document.querySelector(
      ".vpc-step-2__section-price-value--exterior"
    );
    const interiorPriceEl = document.querySelector(
      ".vpc-step-2__section-price-value--interior"
    );

    if (exteriorPriceEl) {
      exteriorPriceEl.textContent = formatPrice(state.exteriorPrice);
    }
    if (interiorPriceEl) {
      interiorPriceEl.textContent = formatPrice(state.interiorPrice);
    }
  }

  function formatPrice(amount) {
    return CONFIG.currency + amount.toLocaleString("nl-NL");
  }

  // ================================
  // Preview Image Management
  // ================================
  function updatePreviewImage(
    componentId,
    optionId,
    imgUrl,
    optionClass,
    zIndex
  ) {
    const isInterior = optionClass === "interior-element";
    const container = isInterior
      ? elements.interiorImages
      : elements.exteriorImages;

    if (!container) return;

    // Remove all existing images for this component (by component ID prefix)
    const componentPrefix = componentId.replace(/^component-/, "");
    container
      .querySelectorAll(`.c-image[data-component="${componentId}"]`)
      .forEach((el) => {
        el.remove();
      });

    // If imgUrl is empty, just remove the overlay (no new image needed)
    if (!imgUrl || !imgUrl.trim()) return;

    // Create new image container with proper z-index
    const imgContainer = document.createElement("div");
    imgContainer.className = `c-image ${optionClass} ${optionId}`;
    imgContainer.dataset.component = componentId;
    imgContainer.style.zIndex = parseInt(zIndex) + 10 || 10;

    // Create img element
    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = optionId;
    img.loading = "lazy";
    img.className = `c-image__img ${optionId}`;

    imgContainer.appendChild(img);
    container.appendChild(imgContainer);
  }

  function updatePreview() {
    // Update all checked options' images
    document
      .querySelectorAll(CONFIG.selectors.optionInputs + ":checked")
      .forEach((input) => {
        const component = input.closest(".vpc-component");
        const componentId = component?.dataset.component_id || input.name;
        const imgUrl = input.dataset.img;
        const optionClass = input.dataset.class;
        const index = input.dataset.index;
        const optionId = input.dataset.oid;

        if (imgUrl && optionId) {
          updatePreviewImage(componentId, optionId, imgUrl, optionClass, index);
        }
      });
  }

  // ================================
  // View Switching (Exterior/Interior)
  // ================================
  function switchView(view) {
    state.currentView = view;

    const section = document.querySelector(".s-configurator-container");
    const exteriorComponents = document.querySelectorAll(".exterior-element");
    const interiorComponents = document.querySelectorAll(".interior-element");

    if (view === "interior") {
      section?.classList.add("s-configurator-container--interior");
      exteriorComponents.forEach((el) => {
        if (!el.classList.contains("c-image")) {
          el.style.display = "none";
        }
      });
      interiorComponents.forEach((el) => {
        if (
          !el.classList.contains("c-image") &&
          !el.classList.contains("hidden")
        ) {
          el.style.display = "";
        }
      });

      // Update switcher labels
      document
        .querySelector(".vpc-switcher__label--exterior")
        ?.classList.remove("vpc-switcher__label--active");
      document
        .querySelector(".vpc-switcher__label--interior")
        ?.classList.add("vpc-switcher__label--active");
    } else {
      section?.classList.remove("s-configurator-container--interior");
      exteriorComponents.forEach((el) => {
        if (
          !el.classList.contains("c-image") &&
          !el.classList.contains("hidden")
        ) {
          el.style.display = "";
        }
      });
      interiorComponents.forEach((el) => {
        if (!el.classList.contains("c-image")) {
          el.style.display = "none";
        }
      });

      // Update switcher labels
      document
        .querySelector(".vpc-switcher__label--interior")
        ?.classList.remove("vpc-switcher__label--active");
      document
        .querySelector(".vpc-switcher__label--exterior")
        ?.classList.add("vpc-switcher__label--active");
    }
  }

  // ================================
  // Size Calculator
  // ================================
  function initializeSizeCalculator() {
    if (elements.depthInput) {
      elements.depthInput.value = state.dimensions.depth;
    }
    if (elements.lengthInput) {
      elements.lengthInput.value = state.dimensions.length;
    }
    updateSizeResult();
  }

  function handleSizeChange(e) {
    const input = e.target;
    const value = parseInt(input.value) || 0;

    if (input.name === "extension-depth") {
      state.dimensions.depth = value;
    } else if (input.name === "extension-length") {
      state.dimensions.length = value;
    }

    updateSizeResult();
  }

  function validateSize(e) {
    const input = e.target;
    const value = parseInt(input.value) || 0;
    const errorMessage = document.querySelector(".vpc-error-message");
    const depthError = document.querySelector(".vpc-error-message__depth");
    const lengthError = document.querySelector(".vpc-error-message__length");

    let hasError = false;

    if (input.name === "extension-depth") {
      if (value < CONFIG.minDepth || value > CONFIG.maxDepth) {
        hasError = true;
        if (depthError) depthError.style.display = "block";
      } else {
        if (depthError) depthError.style.display = "none";
      }
    }

    if (input.name === "extension-length") {
      if (value < CONFIG.minLength || value > CONFIG.maxLength) {
        hasError = true;
        if (lengthError) lengthError.style.display = "block";
      } else {
        if (lengthError) lengthError.style.display = "none";
      }
    }

    if (errorMessage) {
      errorMessage.classList.toggle("visible", hasError);
    }
  }

  function updateSizeResult() {
    // Calculate area in m²
    const depthM = state.dimensions.depth / 100;
    const lengthM = state.dimensions.length / 100;
    const area = (depthM * lengthM).toFixed(1);

    if (elements.sizeResult) {
      elements.sizeResult.textContent = area;
    }

    // Update hidden input
    const hiddenInput = document.querySelector("#extension-size-hidden");
    if (hiddenInput) {
      hiddenInput.value = area;
    }

    // Update summary table
    updateSummaryTable();
  }

  function updateSummaryTable() {
    const depthValue = document.querySelector(
      ".vpc-table__extension-depth-value"
    );
    const lengthValue = document.querySelector(
      ".vpc-table__extension-length-value"
    );
    const sizeValue = document.querySelector(
      ".vpc-table__extension-size-value"
    );

    if (depthValue) depthValue.textContent = state.dimensions.depth;
    if (lengthValue) lengthValue.textContent = state.dimensions.length;
    if (sizeValue) {
      const area =
        (state.dimensions.depth / 100) * (state.dimensions.length / 100);
      sizeValue.textContent = area.toFixed(1);
    }
  }

  // ================================
  // Step Navigation
  // ================================
  function goToStep(stepNumber) {
    state.currentStep = stepNumber;

    // Update visibility
    [elements.step1, elements.step2, elements.step3].forEach((step, index) => {
      if (step) {
        step.classList.toggle("active-step", index + 1 === stepNumber);
      }
    });

    // Update section visibility attribute
    const section = document.querySelector(".s-configurator-container");
    if (section) {
      section.dataset.visiblestep = stepNumber;
      section.className = section.className.replace(/step-\d-visible/g, "");
      section.classList.add(`step-${stepNumber}-visible`);
    }
  }

  // ================================
  // Help Popup
  // ================================
  function toggleHelpPopup(show) {
    if (elements.savePopup) {
      elements.savePopup.classList.toggle("active", show);
    }
  }

  // ================================
  // Step 2 Form Handling
  // ================================
  function handleStep2FormChange(e) {
    calculatePrices();

    // Handle postcode validation if changed
    if (e.target.name === "postcode") {
      validatePostcode(e.target.value);
    }
  }

  function validatePostcode(postcode) {
    const postcodeRegex = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;
    const errorEl = document.querySelector(".zipcode-error");
    const calculatorEl = document.querySelector(".zipcode-calculator");

    if (postcodeRegex.test(postcode)) {
      if (errorEl) errorEl.classList.remove("visible");
      if (calculatorEl) calculatorEl.style.display = "block";

      // Here you would typically call an API to calculate distance
      // For now, we'll show a placeholder
      calculateDistance(postcode);
    } else {
      if (errorEl) errorEl.classList.add("visible");
      if (calculatorEl) calculatorEl.style.display = "none";
    }
  }

  function calculateDistance(postcode) {
    // Placeholder for distance calculation
    // In production, this would call a geocoding/distance API
    const distanceCount = document.querySelector(".distance-count");
    const distancePrice = document.querySelector(".distance-price");

    // Simulated distance for demo
    const estimatedKm = 50;
    const pricePerKm = 45;

    if (distanceCount) distanceCount.textContent = estimatedKm;
    if (distancePrice)
      distancePrice.textContent = formatPrice(estimatedKm * pricePerKm);

    // Update hidden result field
    const resultField = document.querySelector(".zipcode-result");
    if (resultField) {
      resultField.value = estimatedKm * pricePerKm;
    }
  }

  // ================================
  // Quote Form Submission
  // ================================
  function handleQuoteSubmit(e) {
    e.preventDefault();

    // Show loader
    showLoader();

    // Collect all form data
    const formData = new FormData(elements.quoteForm);

    // Add configuration data
    formData.append("configuration", JSON.stringify(state.selectedOptions));
    formData.append("dimensions", JSON.stringify(state.dimensions));
    formData.append("totalPrice", state.totalPrice);
    formData.append("exteriorPrice", state.exteriorPrice);
    formData.append("interiorPrice", state.interiorPrice);

    // Submit to Shopify or custom endpoint
    // This is a placeholder - implement actual submission logic
    fetch("/cart/add.js", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        hideLoader();
        // Handle success - redirect or show confirmation
        console.log("Quote submitted:", data);
      })
      .catch((error) => {
        hideLoader();
        console.error("Submission error:", error);
        alert("Er is een fout opgetreden. Probeer het opnieuw.");
      });
  }

  // ================================
  // Loader
  // ================================
  function showLoader() {
    if (elements.brickLoader) {
      elements.brickLoader.classList.add("active");
    }
  }

  function hideLoader() {
    if (elements.brickLoader) {
      elements.brickLoader.classList.remove("active");
    }
  }

  // ================================
  // Initialize Default Selections
  // ================================
  function initializeDefaultSelections() {
    document
      .querySelectorAll(CONFIG.selectors.optionInputs + '[data-default="1"]')
      .forEach((input) => {
        input.checked = true;

        // Trigger change to update state
        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
      });
  }

  // ================================
  // Public API
  // ================================
  window.VPCConfigurator = {
    init,
    goToStep,
    getState: () => ({ ...state }),
    switchView,
    calculatePrices,
  };

  // ================================
  // Auto-initialize on DOM ready
  // ================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
