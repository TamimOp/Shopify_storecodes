/**
 * Product Configurator JavaScript - Woonserre
 * De Prefabriek - Shopify Theme
 */

(function () {
  "use strict";

  // ================================
  // Configuration
  // ================================
  const CONFIG = {
    currency: "€",
    basePrice: 49950, // Base price for woonserre
    pricePerM2_1: 5550.0, // up to 9m² (slightly higher than aanbouw)
    pricePerM2_2: 4995.0, // above 9m²
    areaThreshold: 9.0,
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
  // Image Preload Cache
  // ================================
  const imageCache = new Map();

  // ================================
  // Initialization
  // ================================
  function init() {
    cacheElements();
    preloadAllImages();
    bindEvents();
    initializeSizeCalculator();
    initializeDefaultSelections();
    updatePreview();
    updateFloatingBannerButtons();
    console.log("Woonserre Configurator initialized");
  }

  // ================================
  // Image Preloading
  // ================================
  function preloadAllImages() {
    const imageUrls = new Set();
    document
      .querySelectorAll(CONFIG.selectors.optionInputs)
      .forEach((input) => {
        const imgUrl = input.dataset.img;
        if (imgUrl && imgUrl.trim()) {
          imageUrls.add(imgUrl);
        }
      });

    imageUrls.forEach((url) => {
      if (!imageCache.has(url)) {
        const img = new Image();
        img.src = url;
        imageCache.set(url, img);
      }
    });
  }

  function getCachedImage(url) {
    if (imageCache.has(url)) {
      return imageCache.get(url).cloneNode();
    }
    const img = new Image();
    img.src = url;
    imageCache.set(url, img);
    return img.cloneNode();
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
        CONFIG.selectors.previewContainer,
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
        switchView("exterior"),
      );
    }
    if (elements.interiorButton) {
      elements.interiorButton.addEventListener("change", () =>
        switchView("interior"),
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
    const floatingHelpButton = document.querySelector(".vpc-help-button");
    const closeButton = document.querySelector(".vpc-save-popup__close-button");
    const overlay = document.querySelector(".vpc-save-popup__overlay");
    const startButton = document.querySelector(".vpc-save-popup__start-button");

    if (helpButton) {
      helpButton.addEventListener("click", () => toggleHelpPopup(true));
    }
    if (floatingHelpButton) {
      floatingHelpButton.addEventListener("click", () => toggleHelpPopup(true));
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

    // Value popup overlay click to close
    const valuePopupOverlay = document.querySelector(
      ".vpc-value-popup__overlay",
    );
    if (valuePopupOverlay) {
      valuePopupOverlay.addEventListener("click", closeValuePopup);
    }

    // Quote form submission
    if (elements.quoteForm) {
      elements.quoteForm.addEventListener("submit", handleQuoteSubmit);
    }

    // Step 2 form (achterom, doorbraak, postcode)
    const step2RadioInputs = document.querySelectorAll(
      '.vpc-step-2__radio-options input[type="radio"]',
    );
    step2RadioInputs.forEach((input) => {
      input.addEventListener("change", handleStep2FormChange);
    });

    // Postcode input
    const postcodeInput = document.getElementById("postcode-input");
    if (postcodeInput) {
      postcodeInput.addEventListener(
        "input",
        debounce(handlePostcodeChange, 500),
      );
      postcodeInput.addEventListener("blur", handlePostcodeChange);
    }
  }

  // ================================
  // Utility Functions
  // ================================
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
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
  const CHECKBOX_COMPONENTS = [
    "VerlichtingLichtpunt",
    "Spotjes",
    "Stopcontacten",
  ];

  function handleOptionChange(e) {
    const input = e.target;
    const component = input.closest(".vpc-component");
    const componentId = component?.dataset.component_id || input.name;
    const value = input.value;
    const price = parseFloat(input.dataset.price) || 0;
    const imgUrl = input.dataset.img;
    const optionClass = input.dataset.class;
    const index = input.dataset.index;
    const optionId = input.dataset.oid;

    // Handle checkbox-based components with mutual exclusion
    if (input.type === "checkbox" && CHECKBOX_COMPONENTS.includes(input.name)) {
      handleCheckboxComponent(input);
      updateCheckboxComponentPreview(component, input.name);
    }

    // Update state (skip for checkbox inputs as they're handled separately)
    if (input.type !== "checkbox") {
      state.selectedOptions[componentId] = {
        value,
        price,
        imgUrl,
        class: optionClass,
        index,
        optionId,
      };
    }

    // Update selected label
    const selectedSpan = component?.querySelector(".vpc-selected-option");
    if (selectedSpan) {
      if (
        input.type === "checkbox" &&
        CHECKBOX_COMPONENTS.includes(input.name)
      ) {
        const checkedInputs = component.querySelectorAll(
          `input[name="${input.name}"]:checked`,
        );
        const values = Array.from(checkedInputs).map((i) => i.value);
        selectedSpan.textContent = values.join(", ") || "geen";
      } else {
        selectedSpan.textContent = value;
      }

      // Handle checkmark visibility
      const valueLower = value.toLowerCase();
      const isNegativeOption =
        valueLower.includes("geen") || valueLower === "nee";

      if (isNegativeOption) {
        selectedSpan.classList.add("no-check-mark-icon");
        selectedSpan.classList.remove("option-selected");
      } else {
        selectedSpan.classList.remove("no-check-mark-icon");
        selectedSpan.classList.add("option-selected");
      }
    }

    // Update prices
    calculatePrices();

    // Update preview image
    if (
      !(input.type === "checkbox" && CHECKBOX_COMPONENTS.includes(input.name))
    ) {
      updatePreviewImage(componentId, optionId, imgUrl, optionClass, index);
    }

    // Handle conditional options
    handleConditionalOptions(input);
  }

  function handleCheckboxComponent(input) {
    const component = input.closest(".vpc-component");
    const inputName = input.name;
    const allCheckboxes = component.querySelectorAll(
      `input[name="${inputName}"]`,
    );

    const geenOption = component.querySelector(
      `input[name="${inputName}"][data-default="1"]`,
    );
    const isGeenOption =
      input.dataset.default === "1" ||
      input.value.toLowerCase().includes("geen");

    if (isGeenOption && input.checked) {
      allCheckboxes.forEach((cb) => {
        if (cb !== input) {
          cb.checked = false;
        }
      });
    } else if (!isGeenOption && input.checked) {
      if (geenOption) {
        geenOption.checked = false;
      }
    }

    const anyChecked = Array.from(allCheckboxes).some((cb) => cb.checked);
    if (!anyChecked && geenOption) {
      geenOption.checked = true;
    }
  }

  function updateCheckboxComponentPreview(component, inputName) {
    if (!component) return;

    const container = elements.interiorImages;
    if (!container) return;

    const componentId = component.dataset.component_id;

    // Remove all existing images for this component
    container
      .querySelectorAll(`.c-image[data-component="${componentId}"]`)
      .forEach((el) => {
        el.remove();
      });

    const fragment = document.createDocumentFragment();

    const checkedInputs = component.querySelectorAll(
      `input[name="${inputName}"]:checked`,
    );
    checkedInputs.forEach((input) => {
      const imgUrl = input.dataset.img;
      const optionId = input.dataset.oid;
      const optionClass = input.dataset.class;
      const index = input.dataset.index;

      if (
        imgUrl &&
        imgUrl.trim() &&
        !input.value.toLowerCase().includes("geen")
      ) {
        const imgContainer = document.createElement("div");
        imgContainer.className = `c-image ${optionClass} ${optionId}`;
        imgContainer.dataset.component = componentId;
        imgContainer.style.zIndex = parseInt(index) + 10 || 10;

        const img = getCachedImage(imgUrl);
        img.alt = optionId;
        img.className = `c-image__img ${optionId}`;

        imgContainer.appendChild(img);
        fragment.appendChild(imgContainer);
      }
    });

    if (fragment.childNodes.length > 0) {
      container.appendChild(fragment);
    }
  }

  function handleConditionalOptions(selectedInput) {
    // Handle Rechterzijde - show/hide glazen zijwandtype based on selection
    if (selectedInput.name === "Rechterzijde") {
      updateRechterGlazenTypeVisibility(selectedInput.value);
    }

    // Handle Linkerzijde - show/hide glazen zijwandtype based on selection
    if (selectedInput.name === "Linkerzijde") {
      updateLinkerGlazenTypeVisibility(selectedInput.value);
    }

    // Handle Verlichting lichtpunt type visibility
    if (selectedInput.name === "VerlichtingLichtpunt") {
      updateLichtpuntTypeVisibility();
    }

    // Handle Spotjes type visibility
    if (selectedInput.name === "Spotjes") {
      updateSpotjesTypeVisibility();
    }
  }

  function updateRechterGlazenTypeVisibility(rechterzijdeValue) {
    const rechterGlazenComponent = document.querySelector(
      "#component-rechter-glazen-type",
    );
    if (!rechterGlazenComponent) return;

    // Show glazen type only if rechterzijde = "glazen wand"
    const isGlazenWand =
      rechterzijdeValue && rechterzijdeValue.toLowerCase().includes("glazen");

    if (isGlazenWand) {
      rechterGlazenComponent.classList.remove("hidden");
      rechterGlazenComponent.style.removeProperty("display");
    } else {
      rechterGlazenComponent.classList.add("hidden");
      const defaultInput = rechterGlazenComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function updateLinkerGlazenTypeVisibility(linkerzijdeValue) {
    const linkerGlazenComponent = document.querySelector(
      "#component-linker-glazen-type",
    );
    if (!linkerGlazenComponent) return;

    // Show glazen type only if linkerzijde = "glazen wand"
    const isGlazenWand =
      linkerzijdeValue && linkerzijdeValue.toLowerCase().includes("glazen");

    if (isGlazenWand) {
      linkerGlazenComponent.classList.remove("hidden");
      linkerGlazenComponent.style.removeProperty("display");
    } else {
      linkerGlazenComponent.classList.add("hidden");
      const defaultInput = linkerGlazenComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function updateLichtpuntTypeVisibility() {
    const lichtpuntInputs = document.querySelectorAll(
      'input[name="VerlichtingLichtpunt"]:checked',
    );
    let hasLichtpuntSelected = false;

    lichtpuntInputs.forEach((input) => {
      if (!input.value.toLowerCase().includes("geen")) {
        hasLichtpuntSelected = true;
      }
    });

    // Could show/hide a type selector if needed
  }

  function updateSpotjesTypeVisibility() {
    const spotjesInputs = document.querySelectorAll(
      'input[name="Spotjes"]:checked',
    );
    let hasSpotjesSelected = false;

    spotjesInputs.forEach((input) => {
      if (!input.value.toLowerCase().includes("geen")) {
        hasSpotjesSelected = true;
      }
    });

    // Could show/hide a type selector if needed
  }

  // ================================
  // Price Calculation
  // ================================
  function calculatePrices() {
    let exteriorTotal = 0;
    let interiorTotal = 0;

    // Calculate dynamic base price from dimensions
    const depthM = state.dimensions.depth / 100;
    const lengthM = state.dimensions.length / 100;
    const area = depthM * lengthM;
    let basePrice = 0;
    if (area <= CONFIG.areaThreshold) {
      basePrice = Math.round(area * CONFIG.pricePerM2_1);
    } else {
      basePrice = Math.round(
        CONFIG.areaThreshold * CONFIG.pricePerM2_1 +
          (area - CONFIG.areaThreshold) * CONFIG.pricePerM2_2,
      );
    }

    // Calculate from state for radio-based components
    Object.values(state.selectedOptions).forEach((option) => {
      if (option.class === "exterior-element") {
        exteriorTotal += option.price;
      } else if (option.class === "interior-element") {
        interiorTotal += option.price;
      }
    });

    // Handle all checkbox-based components separately
    CHECKBOX_COMPONENTS.forEach((componentName) => {
      const checkedInputs = document.querySelectorAll(
        `input[name="${componentName}"]:checked`,
      );
      checkedInputs.forEach((input) => {
        const price = parseFloat(input.dataset.price) || 0;
        const optionClass = input.dataset.class;
        if (optionClass === "exterior-element") {
          exteriorTotal += price;
        } else if (optionClass === "interior-element") {
          interiorTotal += price;
        }
      });
    });

    // Add step 2 form prices
    const achteromInput = document.querySelector(
      'input[name="achterom"]:checked',
    );
    if (achteromInput) {
      exteriorTotal += parseFloat(achteromInput.dataset.price) || 0;
    }

    const doorbraakInput = document.querySelector(
      'input[name="doorbraak"]:checked',
    );
    if (doorbraakInput) {
      exteriorTotal += parseFloat(doorbraakInput.dataset.price) || 0;
    }

    state.exteriorPrice = exteriorTotal;
    state.interiorPrice = interiorTotal;
    state.totalPrice = basePrice + exteriorTotal + interiorTotal;

    updatePriceDisplay();
  }

  function updatePriceDisplay() {
    // Update floating price banner
    const floatingPriceEl = document.getElementById("vpc-price");
    const hiddenPriceEl = document.getElementById("vpc-total-price-result");

    if (floatingPriceEl) {
      floatingPriceEl.textContent = formatPrice(state.totalPrice);
    }
    if (hiddenPriceEl) {
      hiddenPriceEl.value = formatPrice(state.totalPrice);
    }

    // Update sidebar price display
    const sidebarPriceEl = document.querySelector(".vpc-sidebar-price");
    if (sidebarPriceEl) {
      sidebarPriceEl.textContent = formatPrice(state.totalPrice);
    }

    // Update step 2 base price
    const basePriceEl = document.getElementById("vpc-summary-base-price");
    if (basePriceEl) {
      const depthM = state.dimensions.depth / 100;
      const lengthM = state.dimensions.length / 100;
      const area = depthM * lengthM;
      let basePrice = 0;
      if (area <= CONFIG.areaThreshold) {
        basePrice = Math.round(area * CONFIG.pricePerM2_1);
      } else {
        basePrice = Math.round(
          CONFIG.areaThreshold * CONFIG.pricePerM2_1 +
            (area - CONFIG.areaThreshold) * CONFIG.pricePerM2_2,
        );
      }
      basePriceEl.textContent = formatPrice(basePrice);
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
    zIndex,
  ) {
    const isInterior = optionClass === "interior-element";
    const container = isInterior
      ? elements.interiorImages
      : elements.exteriorImages;

    if (!container) return;

    // Remove all existing images for this component
    container
      .querySelectorAll(`.c-image[data-component="${componentId}"]`)
      .forEach((el) => {
        el.remove();
      });

    // If imgUrl is empty, just remove the overlay
    if (!imgUrl || !imgUrl.trim()) return;

    requestAnimationFrame(() => {
      const imgContainer = document.createElement("div");
      imgContainer.className = `c-image ${optionClass} ${optionId}`;
      imgContainer.dataset.component = componentId;
      imgContainer.style.zIndex = parseInt(zIndex) + 10 || 10;

      const img = getCachedImage(imgUrl);
      img.alt = optionId;
      img.className = `c-image__img ${optionId}`;

      imgContainer.appendChild(img);
      container.appendChild(imgContainer);
    });
  }

  function updatePreview() {
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
    const exteriorImages = document.querySelector(
      ".s-configurator-container__exterior-images",
    );
    const interiorImages = document.querySelector(
      ".s-configurator-container__interior-images",
    );

    const exteriorRadio = document.getElementById("vpc-exterior-button");
    const interiorRadio = document.getElementById("vpc-interior-button");

    if (view === "interior") {
      section?.classList.add("s-configurator-container--interior");

      if (exteriorImages) exteriorImages.style.display = "none";
      if (interiorImages) interiorImages.style.display = "block";

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

      if (exteriorRadio) exteriorRadio.checked = false;
      if (interiorRadio) interiorRadio.checked = true;

      document
        .querySelector(".vpc-switcher__label--exterior")
        ?.classList.remove("vpc-switcher__label--active");
      document
        .querySelector(".vpc-switcher__label--interior")
        ?.classList.add("vpc-switcher__label--active");

      document
        .querySelector(".vpc-preview__switcher-btn--exterior")
        ?.classList.remove("active");
      document
        .querySelector(".vpc-preview__switcher-btn--interior")
        ?.classList.add("active");
    } else {
      section?.classList.remove("s-configurator-container--interior");

      if (exteriorImages) exteriorImages.style.display = "block";
      if (interiorImages) interiorImages.style.display = "none";

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

      if (exteriorRadio) exteriorRadio.checked = true;
      if (interiorRadio) interiorRadio.checked = false;

      document
        .querySelector(".vpc-switcher__label--interior")
        ?.classList.remove("vpc-switcher__label--active");
      document
        .querySelector(".vpc-switcher__label--exterior")
        ?.classList.add("vpc-switcher__label--active");

      document
        .querySelector(".vpc-preview__switcher-btn--interior")
        ?.classList.remove("active");
      document
        .querySelector(".vpc-preview__switcher-btn--exterior")
        ?.classList.add("active");
    }

    updateFloatingBannerButtons();
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
    const depthM = state.dimensions.depth / 100;
    const lengthM = state.dimensions.length / 100;
    const area = (depthM * lengthM).toFixed(1);

    if (elements.sizeResult) {
      elements.sizeResult.textContent = area;
    }

    const hiddenInput = document.querySelector("#extension-size-hidden");
    if (hiddenInput) {
      hiddenInput.value = area;
    }

    // Update summary dimensions
    const summaryDimensions = document.getElementById("summary-dimensions");
    if (summaryDimensions) {
      summaryDimensions.textContent = `${state.dimensions.depth} x ${state.dimensions.length} cm (${area} m²)`;
    }

    calculatePrices();
  }

  // ================================
  // Step Navigation
  // ================================
  function goToStep(stepNumber) {
    state.currentStep = stepNumber;

    [elements.step1, elements.step2, elements.step3].forEach((step, index) => {
      if (step) {
        step.classList.toggle("active-step", index + 1 === stepNumber);
      }
    });

    const section = document.querySelector(".s-configurator-container");
    if (section) {
      section.dataset.visiblestep = stepNumber;
      section.className = section.className.replace(/step-\d-visible/g, "");
      section.classList.add(`step-${stepNumber}-visible`);
    }

    updateFloatingBannerButtons();

    if (stepNumber === 2) {
      populateSummaryTables();
    }
  }

  function populateSummaryTables() {
    const summaryTable = document.querySelector("#vpc-summary-table tbody");
    if (!summaryTable) return;

    // Clear existing rows (except dimensions which is in HTML)
    const existingRows = summaryTable.querySelectorAll("tr:not(:first-child)");
    existingRows.forEach((row) => row.remove());

    // Get all selected options
    const componentsContainer = document.querySelector("#vpc-components");
    if (!componentsContainer) return;

    componentsContainer
      .querySelectorAll(".vpc-component")
      .forEach((component) => {
        const componentName =
          component.querySelector(".vpc-component-name")?.textContent?.trim() ||
          "";
        const selectedOptionEl = component.querySelector(
          ".vpc-selected-option",
        );
        const selectedOption = selectedOptionEl?.textContent?.trim() || "";

        const isConditionallyHidden = component.classList.contains("hidden");

        if (
          isConditionallyHidden ||
          component.classList.contains("vpc-size-calculator") ||
          !componentName ||
          !selectedOption
        )
          return;

        const row = document.createElement("tr");
        row.innerHTML = `
          <th class="vpc-table__heading">${componentName}</th>
          <td class="vpc-table__value">${selectedOption}</td>
        `;

        summaryTable.appendChild(row);
      });
  }

  function goToNextStep() {
    if (state.currentStep === 1 && state.currentView === "exterior") {
      switchView("interior");
      updateFloatingBannerButtons();
      return;
    }

    if (state.currentStep === 2) {
      const postcodeInput = document.getElementById("postcode-input");
      const postcodeError = document.getElementById("zipcode-error");

      if (postcodeInput) {
        const postcode = postcodeInput.value.trim();
        if (!postcode || !validatePostcode(postcode)) {
          postcodeInput.focus();
          if (postcodeError) {
            postcodeError.textContent = "Voer een geldige postcode in";
            postcodeError.classList.add("visible");
          }
          return;
        }
        if (postcodeError) postcodeError.classList.remove("visible");
      }
    }

    if (state.currentStep < 3) {
      goToStep(state.currentStep + 1);
    }
  }

  function goToPreviousStep() {
    if (state.currentStep === 1 && state.currentView === "interior") {
      switchView("exterior");
      updateFloatingBannerButtons();
      return;
    }

    if (state.currentStep > 1) {
      goToStep(state.currentStep - 1);
    }
  }

  function updateFloatingBannerButtons() {
    const prevBtn = document.querySelector(
      ".vpc-price-container .vpc-prev-step-btn",
    );
    const nextBtn = document.querySelector(
      ".vpc-price-container .vpc-next-step-btn",
    );

    if (prevBtn) {
      const showBack =
        state.currentView === "interior" || state.currentStep > 1;
      prevBtn.style.display = showBack ? "inline-block" : "none";
    }

    if (nextBtn) {
      if (state.currentStep === 3) {
        nextBtn.style.display = "none";
      } else {
        nextBtn.textContent = "Volgende stap";
        nextBtn.style.display = "inline-block";
      }
    }

    const sidebarPrevBtn = document.querySelector(".vpc-sidebar-prev-btn");
    const sidebarNextBtn = document.querySelector(".vpc-sidebar-next-btn");
    const sidebarSubmitBtn = document.querySelector(".vpc-sidebar-submit-btn");

    if (sidebarPrevBtn) {
      const showSidebarBack =
        state.currentView === "interior" || state.currentStep > 1;
      sidebarPrevBtn.style.display = showSidebarBack ? "inline-block" : "none";
    }

    if (sidebarNextBtn) {
      if (state.currentStep === 3) {
        sidebarNextBtn.style.display = "none";
      } else {
        sidebarNextBtn.textContent = "Volgende stap";
        sidebarNextBtn.style.display = "inline-block";
      }
    }

    if (sidebarSubmitBtn) {
      sidebarSubmitBtn.style.display =
        state.currentStep === 3 ? "inline-block" : "none";
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
  }

  function handlePostcodeChange(e) {
    const postcode = e.target.value.trim();
    if (postcode.length >= 6) {
      validatePostcode(postcode);
    }
  }

  function validatePostcode(postcode) {
    const postcodeRegex = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;
    const errorEl = document.getElementById("zipcode-error");
    const calculatorEl = document.querySelector(".zipcode-calculator");
    const isValid = postcodeRegex.test(postcode.trim());

    if (isValid) {
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.remove("visible");
      }
      if (calculatorEl) calculatorEl.style.display = "block";
      calculateDistance(postcode);
    } else {
      if (errorEl) {
        errorEl.textContent = "Voer een geldige postcode in (bijv. 1234AB)";
        errorEl.classList.add("visible");
      }
      if (calculatorEl) calculatorEl.style.display = "none";
    }

    return isValid;
  }

  function calculateDistance(postcode) {
    const distanceEl = document.getElementById("zipcode-distance");
    const costEl = document.getElementById("zipcode-cost");

    const postcodeNum = parseInt(postcode.substring(0, 4));

    // Reference point: Amsterdam area
    let estimatedKm = 1.5;
    if (postcodeNum >= 1000 && postcodeNum <= 1099) {
      estimatedKm = Math.abs(postcodeNum - 1046) * 0.1 + 1;
    } else {
      estimatedKm = Math.abs(postcodeNum - 1046) * 0.05;
    }

    estimatedKm = Math.round(estimatedKm * 10) / 10;

    const pricePerKm = 45;
    const transportCost = estimatedKm * pricePerKm;

    if (distanceEl) {
      distanceEl.textContent = estimatedKm.toString().replace(".", ",") + " km";
    }
    if (costEl) {
      costEl.textContent = formatPrice(Math.round(transportCost));
    }

    calculatePrices();
  }

  // ================================
  // Value Appreciation Popup
  // ================================
  function openValuePopup() {
    const popup = document.getElementById("vpc-value-popup");
    if (popup) {
      popup.classList.add("active");
    }
  }

  function closeValuePopup() {
    const popup = document.getElementById("vpc-value-popup");
    if (popup) {
      popup.classList.remove("active");
    }
  }

  // ================================
  // Quote Form Submission
  // ================================
  function handleQuoteSubmit(e) {
    populateFormHiddenFields();
    showLoader();
  }

  function populateFormHiddenFields() {
    // Configuration field
    const configField = document.getElementById("rqa_configuration");
    if (configField) {
      const configItems = [];

      // Add dimensions
      const depthM = state.dimensions.depth / 100;
      const lengthM = state.dimensions.length / 100;
      const area = (depthM * lengthM).toFixed(1);
      configItems.push(
        `Afmetingen: ${state.dimensions.depth} x ${state.dimensions.length} cm (${area} m²)`,
      );

      // Add all selected options
      document
        .querySelectorAll(".vpc-component:not(.vpc-size-calculator)")
        .forEach((component) => {
          if (component.classList.contains("hidden")) return;
          const nameEl = component.querySelector(".vpc-component-name");
          const selectedEl = component.querySelector(".vpc-selected-option");
          if (nameEl && selectedEl) {
            const name = nameEl.textContent.trim();
            const value = selectedEl.textContent.trim();
            if (value) {
              configItems.push(`${name}: ${value}`);
            }
          }
        });

      // Add step 2 options
      const achteromInput = document.querySelector(
        'input[name="achterom"]:checked',
      );
      if (achteromInput) {
        configItems.push(`Achterom: ${achteromInput.value}`);
      }

      const doorbraakInput = document.querySelector(
        'input[name="doorbraak"]:checked',
      );
      if (doorbraakInput) {
        configItems.push(`Doorbraak: ${doorbraakInput.value}`);
      }

      const postcodeInput = document.getElementById("postcode-input");
      if (postcodeInput && postcodeInput.value) {
        configItems.push(`Postcode: ${postcodeInput.value}`);
      }

      configField.value = configItems.join(" | ");
    }

    // Total price field
    const totalPriceField = document.getElementById("rqa_total_price");
    if (totalPriceField) {
      totalPriceField.value = formatPrice(state.totalPrice);
    }
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

        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
      });
  }

  // ================================
  // Public API
  // ================================
  window.VPCWoonserreConfigurator = {
    init,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    getState: () => ({ ...state }),
    switchView,
    calculatePrices,
    openValuePopup,
    closeValuePopup,
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
