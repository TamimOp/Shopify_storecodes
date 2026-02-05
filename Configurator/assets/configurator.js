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
    // Tiered pricing based on reference site (deprefabriek.nl/configurator)
    // Tier 1: 0-9m² base rate (€39,950 for 9m²)
    pricePerM2_tier1: 4438.89,
    // Tier 2: 9-12m² additional rate
    pricePerM2_tier2: 925.0,
    // Tier 3: 12-16m² additional rate
    pricePerM2_tier3: 1725.0,
    // Tier 4: 16+m² additional rate
    pricePerM2_tier4: 1425.0,
    // Tier boundaries
    tier1Max: 9.0,
    tier2Max: 12.0,
    tier3Max: 16.0,
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
    valueAppreciation: 0, // Stored value appreciation from popup calculator
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
    updateFloatingBannerButtons(); // Hide Terug button initially
    console.log("Configurator initialized");
  }

  // ================================
  // Image Preloading
  // ================================
  function preloadAllImages() {
    // Collect all unique image URLs from options
    const imageUrls = new Set();
    document
      .querySelectorAll(CONFIG.selectors.optionInputs)
      .forEach((input) => {
        const imgUrl = input.dataset.img;
        if (imgUrl && imgUrl.trim()) {
          imageUrls.add(imgUrl);
        }
      });

    // Preload each image
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

    // Help popup - support both old button and new floating banner button
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

    // Value popup calculator inputs
    const valuePostcode = document.getElementById("value-postcode");
    const valueHousenumber = document.getElementById("value-housenumber");
    const valueAddition = document.getElementById("value-addition");

    if (valuePostcode) {
      valuePostcode.addEventListener("input", handleValuePopupInput);
      valuePostcode.addEventListener("blur", handleValuePopupInput);
    }
    if (valueHousenumber) {
      valueHousenumber.addEventListener("input", handleValuePopupInput);
      valueHousenumber.addEventListener("blur", handleValuePopupInput);
    }
    if (valueAddition) {
      valueAddition.addEventListener("input", handleValuePopupInput);
      valueAddition.addEventListener("blur", handleValuePopupInput);
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
  // List of checkbox-based components that allow multiple selections
  const CHECKBOX_COMPONENTS = [
    "Wandlampen[]",
    "Stopcontacten[]",
    "Verlichting lichtpunt[]",
    "Spotjes[]",
  ];

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

    // Handle checkbox-based components with mutual exclusion
    if (input.type === "checkbox" && CHECKBOX_COMPONENTS.includes(input.name)) {
      handleCheckboxComponent(input);
      // Update all preview images for this checkbox component
      updateCheckboxComponentPreview(component, input.name);
    }

    // Update state (skip for checkbox inputs as they're handled separately)
    if (input.type !== "checkbox") {
      state.selectedOptions[componentId] = {
        value,
        price,
        imgUrl,
        imgHtml,
        class: optionClass,
        index,
        optionId,
      };
    }

    // Update selected label
    const selectedSpan = component?.querySelector(".vpc-selected-option");
    if (selectedSpan) {
      // For checkbox groups, show all selected values
      if (
        input.type === "checkbox" &&
        CHECKBOX_COMPONENTS.includes(input.name)
      ) {
        const checkedInputs = component.querySelectorAll(
          `input[name="${input.name}"]:checked`,
        );
        const values = Array.from(checkedInputs).map((i) => i.value);
        selectedSpan.textContent = values.join(", ");
      } else {
        selectedSpan.textContent = value;
      }

      // Handle checkmark visibility based on value
      // If value contains "geen" or "nee", add no-check-mark-icon class and remove option-selected
      // Otherwise, add option-selected class to show checkmark
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

    // Update preview image - remove old overlay for this component and add new one
    // Skip for checkbox components as they're handled in updateCheckboxComponentPreview
    // Skip for Rollaag as it's handled in handleConditionalOptions to match Gevelbekleding
    if (
      !(
        input.type === "checkbox" && CHECKBOX_COMPONENTS.includes(input.name)
      ) &&
      input.name !== "Rollaag"
    ) {
      updatePreviewImage(componentId, optionId, imgUrl, optionClass, index);
    }

    // Handle conditional options (e.g., rollaag based on gevelbekleding)
    handleConditionalOptions(input);

    // Keep dropdown open after selection - do not auto-close
  }

  function handleCheckboxComponent(input) {
    const component = input.closest(".vpc-component");
    const inputName = input.name;
    const allCheckboxes = component.querySelectorAll(
      `input[name="${inputName}"]`,
    );

    // Find the "geen" option (first option with empty data-img or "geen" in value)
    const geenOption = component.querySelector(
      `input[name="${inputName}"][data-default="1"]`,
    );
    const isGeenOption =
      input.dataset.default === "1" ||
      input.value.toLowerCase().includes("geen");

    if (isGeenOption && input.checked) {
      // If "geen" option is selected, uncheck all other options
      allCheckboxes.forEach((cb) => {
        if (cb !== input) {
          cb.checked = false;
        }
      });
    } else if (!isGeenOption && input.checked) {
      // If any other option is selected, uncheck the "geen" option
      if (geenOption) {
        geenOption.checked = false;
      }
    }

    // If nothing is selected, auto-select the "geen" option
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

    // Use documentFragment for batched DOM updates
    const fragment = document.createDocumentFragment();

    // Add images for all checked options (except "geen" options)
    const checkedInputs = component.querySelectorAll(
      `input[name="${inputName}"]:checked`,
    );
    checkedInputs.forEach((input) => {
      const imgUrl = input.dataset.img;
      const optionId = input.dataset.oid;
      const optionClass = input.dataset.class;
      const index = input.dataset.index;

      // Only add image if it has a valid URL and is not a "geen" option
      if (
        imgUrl &&
        imgUrl.trim() &&
        !input.value.toLowerCase().includes("geen")
      ) {
        const imgContainer = document.createElement("div");
        imgContainer.className = `c-image ${optionClass} ${optionId}`;
        imgContainer.dataset.component = componentId;
        imgContainer.style.zIndex = parseInt(index) + 10 || 10;

        // Use cached image for instant rendering
        const img = getCachedImage(imgUrl);
        img.alt = optionId;
        img.className = `c-image__img ${optionId}`;

        imgContainer.appendChild(img);
        fragment.appendChild(imgContainer);
      }
    });

    // Batch DOM update
    if (fragment.childNodes.length > 0) {
      container.appendChild(fragment);
    }
  }

  // Keep old functions for backwards compatibility (can be removed later)
  function updateWandlampenPreview(component) {
    updateCheckboxComponentPreview(component, "Wandlampen[]");
  }

  function handleWandlampenCheckbox(input) {
    handleCheckboxComponent(input);
  }

  function handleConditionalOptions(selectedInput) {
    // Handle rollaag visibility based on gevelbekleding selection
    const gevelbekleding = selectedInput.closest(
      '[data-component_id="component-gevelbekleding"]',
    );
    if (gevelbekleding) {
      const value = selectedInput.value.toLowerCase();
      updateRollaagOptions(value);
    }

    // Handle Rollaag selection - ensure it matches current Gevelbekleding
    if (selectedInput.name === "Rollaag") {
      updateRollaagPreviewForGevelbekleding(selectedInput);
    }

    // Handle daktrim and spots visibility based on overstek selection
    if (selectedInput.name === "Overstek") {
      updateDaktrimOptions(selectedInput.value);
      updateSpotsOverstekVisibility(selectedInput.value);
    }

    // Handle daktrim preview when Daktrim color changes
    if (selectedInput.name === "Daktrim") {
      updateDaktrimPreview();
    }

    // Handle Spots in overstek type visibility based on Spots in overstek selection
    if (selectedInput.name === "Spots in overstek") {
      updateSpotsOverstekTypeVisibility(selectedInput.value);
    }

    // Handle Buitenlicht type visibility based on Buitenlicht selection
    if (selectedInput.name === "Buitenlicht") {
      updateBuitenlichtTypeVisibility(selectedInput.value);
    }

    // Handle Schilderwerk visibility based on Stucwerk selection
    if (selectedInput.name === "Stucwerk") {
      updateSchilderwerkVisibility(selectedInput.value);
    }

    // Handle Wandlampen type visibility based on Wandlampen selection
    if (selectedInput.name === "Wandlampen[]") {
      updateWandlampenTypeVisibility();
    }

    // Handle Verlichting lichtpunt type visibility based on Verlichting lichtpunt selection
    if (selectedInput.name === "Verlichting lichtpunt[]") {
      updateLichtpuntTypeVisibility();
    }

    // Handle Daklicht selection - update interior preview to match exterior selection
    if (selectedInput.name === "Daklicht") {
      updateDaklichtInteriorPreview(selectedInput.value);
    }
  }

  function updateLichtpuntTypeVisibility() {
    const lichtpuntTypeComponent = document.querySelector(
      "#component-verlichting-lichtpunt-type",
    );
    if (!lichtpuntTypeComponent) return;

    // Check if any lichtpunt option (other than "geen lichtpunt") is selected
    const lichtpuntInputs = document.querySelectorAll(
      'input[name="Verlichting lichtpunt[]"]:checked',
    );
    let hasLichtpuntSelected = false;

    lichtpuntInputs.forEach((input) => {
      if (!input.value.toLowerCase().includes("geen")) {
        hasLichtpuntSelected = true;
      }
    });

    if (hasLichtpuntSelected) {
      lichtpuntTypeComponent.classList.remove("hidden");
      lichtpuntTypeComponent.style.removeProperty("display");
    } else {
      lichtpuntTypeComponent.classList.add("hidden");
      // Reset to default when hidden
      const defaultInput = lichtpuntTypeComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function updateSchilderwerkVisibility(stucwerkValue) {
    const schilderwerkComponent = document.querySelector(
      "#component-schilderwerk",
    );
    if (!schilderwerkComponent) return;

    // Show Schilderwerk only if Stucwerk is "ja" (contains "voorzien van stucwerk")
    const isStucwerkSelected =
      stucwerkValue && stucwerkValue.toLowerCase().includes("ja");

    if (isStucwerkSelected) {
      schilderwerkComponent.classList.remove("hidden");
      schilderwerkComponent.style.removeProperty("display");
    } else {
      schilderwerkComponent.classList.add("hidden");
      // Reset Schilderwerk to default (nee) when hidden
      const defaultInput = schilderwerkComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function updateWandlampenTypeVisibility() {
    const wandlampenTypeComponent = document.querySelector(
      "#component-wandlampen-type",
    );
    if (!wandlampenTypeComponent) return;

    // Check if any Wandlampen option (other than "geen wandlampen") is selected
    const wandlampenInputs = document.querySelectorAll(
      'input[name="Wandlampen[]"]:checked',
    );
    let hasLampSelected = false;

    wandlampenInputs.forEach((input) => {
      if (input.value !== "geen wandlampen") {
        hasLampSelected = true;
      }
    });

    if (hasLampSelected) {
      wandlampenTypeComponent.classList.remove("hidden");
      wandlampenTypeComponent.style.removeProperty("display");
    } else {
      wandlampenTypeComponent.classList.add("hidden");
      // Reset Wandlampen type to default when hidden
      const defaultInput = wandlampenTypeComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  // Show/hide Spots in overstek based on Overstek selection
  function updateSpotsOverstekVisibility(overstekValue) {
    const spotsOverstekComponent = document.querySelector(
      "#component-spots-overstek",
    );
    if (!spotsOverstekComponent) return;

    // Show Spots in overstek only if Overstek is NOT "geen overstek"
    const hasOverstek =
      overstekValue && !overstekValue.toLowerCase().includes("geen");

    if (hasOverstek) {
      spotsOverstekComponent.classList.remove("hidden");
      spotsOverstekComponent.style.removeProperty("display");
    } else {
      spotsOverstekComponent.classList.add("hidden");
      // Reset to default when hidden
      const defaultInput = spotsOverstekComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      // Also hide and reset Spots in overstek type
      updateSpotsOverstekTypeVisibility("geen");
    }
  }

  // Show/hide Spots in overstek type based on Spots in overstek selection
  function updateSpotsOverstekTypeVisibility(spotsValue) {
    const spotsTypeComponent = document.querySelector(
      "#component-spots-overstek-type",
    );
    if (!spotsTypeComponent) return;

    // Show type only if spots != "geen"
    const hasSpots = spotsValue && !spotsValue.toLowerCase().includes("geen");

    if (hasSpots) {
      spotsTypeComponent.classList.remove("hidden");
      spotsTypeComponent.style.removeProperty("display");
    } else {
      spotsTypeComponent.classList.add("hidden");
      // Reset to default when hidden
      const defaultInput = spotsTypeComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  // Show/hide Buitenlicht type based on Buitenlicht selection
  function updateBuitenlichtTypeVisibility(buitenlichtValue) {
    const buitenlichtTypeComponent = document.querySelector(
      "#component-buitenlicht-type",
    );
    if (!buitenlichtTypeComponent) return;

    // Show type only if Buitenlicht != "geen"
    const hasBuitenlicht =
      buitenlichtValue && !buitenlichtValue.toLowerCase().includes("geen");

    if (hasBuitenlicht) {
      buitenlichtTypeComponent.classList.remove("hidden");
      buitenlichtTypeComponent.style.removeProperty("display");
    } else {
      buitenlichtTypeComponent.classList.add("hidden");
      // Reset to default when hidden
      const defaultInput = buitenlichtTypeComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        defaultInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  // Rollaag image mapping based on Gevelbekleding type and color
  const ROLLAAG_IMAGES = {
    // Baksteen
    "baksteen rood":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/11032021_rollaag_rood-2.png",
    "baksteen geel":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/11032021_rollaag_geel-2.png",
    "baksteen zwart":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/11032021_rollaag_zwart-1.png",
    "baksteen wit":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/11032021_rollaag_wit-1.png",
    // Keralit
    "keralit zwart":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Rollaag-zwart2.png",
    "keralit antraciet":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Rollaag-antraciet.png",
    "keralit cremewit":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Rollaag-creme.png",
    "keralit groen":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Rollaag-donkergroen.png",
    // Frake (Hout)
    "frake horizontaal":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Houten_rolllaag_horizontaal.png",
    "frake verticaal":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Houten_rolllaag.png",
    // Red Cedar
    "red cedar horizontaal":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Rollaag-rabat-horizontaal-3.png",
    "red cedar verticaal":
      "https://deprefabriek.nl/wp-content/uploads/2020/03/Rollaag-rabat-verticaal.png",
  };

  // Daklicht interior image mapping based on exterior Daklicht selection
  const DAKLICHT_INTERIOR_IMAGES = {
    "geen daklicht": "",
    "1 vaks lessenaar":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-1-vlak_Interieur.png",
    "2 vaks lessenaar":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-2-vlak_Interieur.png",
    "3 vaks lessenaar":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-3-vlak_Interieur.png",
    "4 vaks lessenaar":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-4-vlak_Interieur.png",
    "4 vaks zadeldak":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-Zadel-4-vlak_Interieur.png",
    "6 vaks zadeldak":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-Zadel-6-vlak_Interieur.png",
    "8 vaks zadeldak":
      "https://deprefabriek.nl/wp-content/uploads/2021/02/20.269_Daklicht-Zadel-8-vlak_Interieur.png",
  };

  /**
   * Get the Rollaag image URL based on Gevelbekleding value
   */
  function getRollaagImageForGevelbekleding(gevelbekledingValue) {
    const value = gevelbekledingValue.toLowerCase();

    // Check each type and extract key
    if (value.includes("baksteen")) {
      const color = value.split(" ").pop();
      return (
        ROLLAAG_IMAGES["baksteen " + color] || ROLLAAG_IMAGES["baksteen rood"]
      );
    } else if (value.includes("keralit")) {
      const color = value.split(" ").pop();
      return (
        ROLLAAG_IMAGES["keralit " + color] || ROLLAAG_IMAGES["keralit zwart"]
      );
    } else if (value.includes("frake")) {
      const orientation = value.includes("horizontaal")
        ? "horizontaal"
        : "verticaal";
      return ROLLAAG_IMAGES["frake " + orientation];
    } else if (value.includes("red cedar")) {
      const orientation = value.includes("horizontaal")
        ? "horizontaal"
        : "verticaal";
      return ROLLAAG_IMAGES["red cedar " + orientation];
    }

    // Default fallback
    return ROLLAAG_IMAGES["baksteen rood"];
  }

  function updateRollaagOptions(gevelbekledingValue) {
    const rollaagComponent = document.querySelector("#component-rollaag");
    if (!rollaagComponent) return;

    // Find the "ja" option input
    const jaInput = rollaagComponent.querySelector('input[value="ja"]');
    if (!jaInput) return;

    // Get the correct Rollaag image for current Gevelbekleding
    const rollaagImgUrl = getRollaagImageForGevelbekleding(gevelbekledingValue);

    // Update the "ja" option's data-img attribute
    jaInput.dataset.img = rollaagImgUrl;

    // Check if Rollaag "ja" is currently selected
    const currentRollaagInput = rollaagComponent.querySelector(
      'input[name="Rollaag"]:checked',
    );
    const isRollaagEnabled =
      currentRollaagInput && currentRollaagInput.value.toLowerCase() !== "nee";

    // If Rollaag is enabled, update the preview image
    if (isRollaagEnabled) {
      const componentId = rollaagComponent.dataset.component_id;
      const optionId = jaInput.dataset.oid;
      const optionClass = jaInput.dataset.class;
      const index = jaInput.dataset.index;

      updatePreviewImage(
        componentId,
        optionId,
        rollaagImgUrl,
        optionClass,
        index,
      );

      // Update state
      state.selectedOptions[componentId] = {
        value: jaInput.value,
        price: parseFloat(jaInput.dataset.price) || 0,
        imgUrl: rollaagImgUrl,
        imgHtml: "",
        class: optionClass,
        index: index,
        optionId: optionId,
      };
    }
  }

  /**
   * Update Rollaag preview when user selects "ja".
   * Uses the dynamically set data-img based on current Gevelbekleding.
   */
  function updateRollaagPreviewForGevelbekleding(selectedRollaagInput) {
    const rollaagComponent = document.querySelector("#component-rollaag");
    if (!rollaagComponent) return;

    const componentId = rollaagComponent.dataset.component_id;

    // If "nee" is selected, just clear the preview and return
    if (selectedRollaagInput.value.toLowerCase() === "nee") {
      updatePreviewImage(componentId, null, "", "", "");
      return;
    }

    // Get the current Gevelbekleding selection
    const gevelbekledingInput = document.querySelector(
      'input[name="Gevelbekleding"]:checked',
    );
    if (!gevelbekledingInput) return;

    // Get the correct Rollaag image for current Gevelbekleding
    const rollaagImgUrl = getRollaagImageForGevelbekleding(
      gevelbekledingInput.value,
    );

    // Update the input's data-img in case it wasn't updated
    selectedRollaagInput.dataset.img = rollaagImgUrl;

    // Update the selected label display
    const selectedSpan = rollaagComponent.querySelector(".vpc-selected-option");
    if (selectedSpan) {
      selectedSpan.textContent = "ja";
      selectedSpan.classList.remove("no-check-mark-icon");
      selectedSpan.classList.add("option-selected");
    }

    // Update preview image
    const optionId = selectedRollaagInput.dataset.oid;
    const optionClass = selectedRollaagInput.dataset.class;
    const index = selectedRollaagInput.dataset.index;

    updatePreviewImage(
      componentId,
      optionId,
      rollaagImgUrl,
      optionClass,
      index,
    );

    // Update state
    state.selectedOptions[componentId] = {
      value: selectedRollaagInput.value,
      price: parseFloat(selectedRollaagInput.dataset.price) || 0,
      imgUrl: rollaagImgUrl,
      imgHtml: "",
      class: optionClass,
      index: index,
      optionId: optionId,
    };
  }

  /**
   * Update Daklicht interior preview when exterior Daklicht selection changes.
   * This syncs the interior view with the exterior Daklicht selection.
   */
  function updateDaklichtInteriorPreview(daklichtValue) {
    const container = elements.interiorImages;
    if (!container) return;

    const componentId = "component-daklicht-interior";

    // Remove any existing Daklicht interior image
    container
      .querySelectorAll(`.c-image[data-component="${componentId}"]`)
      .forEach((el) => {
        el.remove();
      });

    // Get the interior image URL for the selected Daklicht
    const interiorImgUrl = DAKLICHT_INTERIOR_IMAGES[daklichtValue];

    // If no Daklicht selected ("geen daklicht") or no image, just return
    if (!interiorImgUrl || !interiorImgUrl.trim()) {
      return;
    }

    // Create and add the interior Daklicht image
    requestAnimationFrame(() => {
      const imgContainer = document.createElement("div");
      imgContainer.className = `c-image interior-element option-daklicht-interior`;
      imgContainer.dataset.component = componentId;
      imgContainer.style.zIndex = 25; // Above kozijn (15) but below other overlays

      const img = getCachedImage(interiorImgUrl);
      img.alt = "Daklicht interieur";
      img.className = "c-image__img option-daklicht-interior";

      imgContainer.appendChild(img);
      container.appendChild(imgContainer);
    });
  }

  function updateDaktrimOptions(overstekValue) {
    // Handle daktrim hidden component based on overstek selection
    const daktrimHidden = document.querySelector("#component-6049e3e66e18e");
    if (!daktrimHidden) return;

    const hasOverstek =
      overstekValue && !overstekValue.toLowerCase().includes("geen");

    // Check if Daktrim zwart or kraal is selected
    const daktrimInput = document.querySelector(
      'input[name="Daktrim"]:checked',
    );
    const daktrimValue = daktrimInput ? daktrimInput.value.toLowerCase() : "";
    const isZwart = daktrimValue.includes("zwart");
    const isKraal = daktrimValue.includes("kraal");

    // Determine which hidden option should be selected
    let targetValue = "";
    if (isKraal) {
      // Kraal options
      if (hasOverstek) {
        targetValue = "kraal met overstek";
      } else {
        targetValue = "kraal zonder";
      }
    } else if (hasOverstek && isZwart) {
      targetValue = "daktrim overstek zwart";
    } else if (hasOverstek && !isZwart) {
      targetValue = "daktrim overstek";
    } else if (!hasOverstek && isZwart) {
      targetValue = "daktrim zonder overstek zwart";
    } else {
      targetValue = "daktrim zonder overstek";
    }

    daktrimHidden
      .querySelectorAll(".vpc-single-option-wrap")
      .forEach((wrap) => {
        const input = wrap.querySelector("input");
        if (!input) return;

        const value = input.value.toLowerCase();
        const targetLower = targetValue.toLowerCase();

        if (value === targetLower) {
          wrap.style.display = "";
          if (!input.checked) {
            input.checked = true;
            // Trigger change to update preview
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        } else {
          wrap.style.display = "none";
        }
      });
  }

  // Also update daktrim preview when Daktrim color changes
  function updateDaktrimPreview() {
    const overstekInput = document.querySelector(
      'input[name="Overstek"]:checked',
    );
    if (overstekInput) {
      updateDaktrimOptions(overstekInput.value);
    }
  }

  // ================================
  // Price Calculation
  // ================================
  function calculatePrices() {
    let exteriorTotal = 0;
    let interiorTotal = 0;

    // Calculate dynamic base price from dimensions using tiered pricing
    const depthM = state.dimensions.depth / 100;
    const lengthM = state.dimensions.length / 100;
    const area = depthM * lengthM;
    let basePrice = 0;

    // Tiered pricing calculation (matches deprefabriek.nl/configurator)
    if (area <= CONFIG.tier1Max) {
      // Tier 1: 0-9m² at base rate
      basePrice = area * CONFIG.pricePerM2_tier1;
    } else if (area <= CONFIG.tier2Max) {
      // Tier 2: 9-12m² at tier2 rate for additional area
      basePrice = CONFIG.tier1Max * CONFIG.pricePerM2_tier1;
      basePrice += (area - CONFIG.tier1Max) * CONFIG.pricePerM2_tier2;
    } else if (area <= CONFIG.tier3Max) {
      // Tier 3: 12-18m² at tier3 rate for additional area
      basePrice = CONFIG.tier1Max * CONFIG.pricePerM2_tier1;
      basePrice +=
        (CONFIG.tier2Max - CONFIG.tier1Max) * CONFIG.pricePerM2_tier2;
      basePrice += (area - CONFIG.tier2Max) * CONFIG.pricePerM2_tier3;
    } else {
      // Tier 4: 18+m² at tier4 rate for additional area
      basePrice = CONFIG.tier1Max * CONFIG.pricePerM2_tier1;
      basePrice +=
        (CONFIG.tier2Max - CONFIG.tier1Max) * CONFIG.pricePerM2_tier2;
      basePrice +=
        (CONFIG.tier3Max - CONFIG.tier2Max) * CONFIG.pricePerM2_tier3;
      basePrice += (area - CONFIG.tier3Max) * CONFIG.pricePerM2_tier4;
    }
    basePrice = Math.round(basePrice);

    // DEBUG: Log base price
    console.log("[Price Debug] Area:", area, "m² | Base price:", basePrice);

    // Calculate from state for radio-based components
    Object.entries(state.selectedOptions).forEach(([key, option]) => {
      if (option.price > 0) {
        console.log(
          "[Price Debug] Option with price:",
          key,
          option.value,
          "€" + option.price,
        );
      }
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
        if (price > 0) {
          console.log(
            "[Price Debug] Checkbox with price:",
            input.name,
            input.value,
            "€" + price,
          );
        }
        if (optionClass === "exterior-element") {
          exteriorTotal += price;
        } else if (optionClass === "interior-element") {
          interiorTotal += price;
        }
      });
    });

    // Add step 2 form prices
    const step2Form = document.querySelector("#step-2-form");
    if (step2Form) {
      step2Form.querySelectorAll("input:checked").forEach((input) => {
        const price = parseFloat(input.dataset.price) || 0;
        if (price > 0) {
          console.log(
            "[Price Debug] Step2 with price:",
            input.name,
            input.value,
            "€" + price,
          );
        }
        exteriorTotal += price;
      });
    }

    console.log(
      "[Price Debug] Exterior total:",
      exteriorTotal,
      "| Interior total:",
      interiorTotal,
    );
    console.log(
      "[Price Debug] FINAL TOTAL:",
      basePrice,
      "+",
      exteriorTotal,
      "+",
      interiorTotal,
      "=",
      basePrice + exteriorTotal + interiorTotal,
    );

    state.exteriorPrice = exteriorTotal;
    state.interiorPrice = interiorTotal;
    state.totalPrice = basePrice + exteriorTotal + interiorTotal;

    updatePriceDisplay();
  }

  function updatePriceDisplay() {
    const exteriorPriceEl = document.querySelector(
      ".vpc-step-2__section-price-value--exterior",
    );
    const interiorPriceEl = document.querySelector(
      ".vpc-step-2__section-price-value--interior",
    );

    // Update floating price banner
    const floatingPriceEl = document.getElementById("vpc-price");
    const hiddenPriceEl = document.getElementById("vpc-total-price-result");

    if (exteriorPriceEl) {
      exteriorPriceEl.textContent = formatPrice(state.exteriorPrice);
    }
    if (interiorPriceEl) {
      interiorPriceEl.textContent = formatPrice(state.interiorPrice);
    }

    // Update floating price banner with total
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

    // Remove all existing images for this component (by component ID prefix)
    const componentPrefix = componentId.replace(/^component-/, "");
    container
      .querySelectorAll(`.c-image[data-component="${componentId}"]`)
      .forEach((el) => {
        el.remove();
      });

    // If imgUrl is empty, just remove the overlay (no new image needed)
    if (!imgUrl || !imgUrl.trim()) return;

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      // Create new image container with proper z-index
      const imgContainer = document.createElement("div");
      imgContainer.className = `c-image ${optionClass} ${optionId}`;
      imgContainer.dataset.component = componentId;
      imgContainer.style.zIndex = parseInt(zIndex) + 10 || 10;

      // Use cached image for instant rendering
      const img = getCachedImage(imgUrl);
      img.alt = optionId;
      img.className = `c-image__img ${optionId}`;

      imgContainer.appendChild(img);
      container.appendChild(imgContainer);
    });
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
    const exteriorImages = document.querySelector(
      ".s-configurator-container__exterior-images",
    );
    const interiorImages = document.querySelector(
      ".s-configurator-container__interior-images",
    );

    // Get radio buttons
    const exteriorRadio = document.getElementById("vpc-exterior-button");
    const interiorRadio = document.getElementById("vpc-interior-button");

    if (view === "interior") {
      section?.classList.add("s-configurator-container--interior");

      // Toggle preview images
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

      // Update radio button state
      if (exteriorRadio) exteriorRadio.checked = false;
      if (interiorRadio) interiorRadio.checked = true;

      // Update switcher labels
      document
        .querySelector(".vpc-switcher__label--exterior")
        ?.classList.remove("vpc-switcher__label--active");
      document
        .querySelector(".vpc-switcher__label--interior")
        ?.classList.add("vpc-switcher__label--active");

      // Update preview switcher buttons
      document
        .querySelector(".vpc-preview__switcher-btn--exterior")
        ?.classList.remove("active");
      document
        .querySelector(".vpc-preview__switcher-btn--interior")
        ?.classList.add("active");
    } else {
      section?.classList.remove("s-configurator-container--interior");

      // Toggle preview images
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

      // Update radio button state
      if (exteriorRadio) exteriorRadio.checked = true;
      if (interiorRadio) interiorRadio.checked = false;

      // Update switcher labels
      document
        .querySelector(".vpc-switcher__label--interior")
        ?.classList.remove("vpc-switcher__label--active");
      document
        .querySelector(".vpc-switcher__label--exterior")
        ?.classList.add("vpc-switcher__label--active");

      // Update preview switcher buttons
      document
        .querySelector(".vpc-preview__switcher-btn--interior")
        ?.classList.remove("active");
      document
        .querySelector(".vpc-preview__switcher-btn--exterior")
        ?.classList.add("active");
    }

    // Update floating banner buttons after view switch
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

    // Recalculate prices when size changes
    calculatePrices();
  }

  function updateSummaryTable() {
    const depthValue = document.querySelector(
      ".vpc-table__extension-depth-value",
    );
    const lengthValue = document.querySelector(
      ".vpc-table__extension-length-value",
    );
    const sizeValue = document.querySelector(
      ".vpc-table__extension-size-value",
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

    // Update floating banner buttons
    updateFloatingBannerButtons();

    // Populate summary tables when going to step 2
    if (stepNumber === 2) {
      populateSummaryTables();
    }
  }

  function populateSummaryTables() {
    const exteriorTable = document.querySelector(
      ".vpc-table--exterior-summary tbody",
    );
    const interiorTable = document.querySelector(
      ".vpc-table--interior-summary tbody",
    );

    if (!exteriorTable || !interiorTable) return;

    // Clear existing rows
    exteriorTable.innerHTML = "";
    interiorTable.innerHTML = "";

    // Get all selected options from components within #vpc-components
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
        const isExterior = component.classList.contains("exterior-element");
        const isInterior = component.classList.contains("interior-element");

        // Only skip components that have the 'hidden' class (conditionally hidden components)
        // Don't check inline display style - exterior/interior toggle sets that for view switching
        const isConditionallyHidden = component.classList.contains("hidden");

        // Skip hidden components, size calculator, and empty selections
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

        if (isExterior) {
          exteriorTable.appendChild(row);
        } else if (isInterior) {
          interiorTable.appendChild(row);
        }
      });
  }

  function goToNextStep() {
    // If on step 1 and exterior view, switch to interior first
    if (state.currentStep === 1 && state.currentView === "exterior") {
      switchView("interior");
      updateFloatingBannerButtons();
      return;
    }

    // Validate postcode before going to step 3
    if (state.currentStep === 2) {
      const postcodeInput = document.getElementById("postcode");
      const postcodeError = document.querySelector(".zipcode-error");

      if (postcodeInput) {
        const postcode = postcodeInput.value.trim();
        if (!postcode || !validatePostcode(postcode)) {
          postcodeInput.focus();
          if (postcodeError) postcodeError.classList.add("visible");
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
    // If on step 1 and interior view, switch back to exterior
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
    // Update preview floating banner buttons
    const prevBtn = document.querySelector(
      ".vpc-price-container .vpc-prev-step-btn",
    );
    const nextBtn = document.querySelector(
      ".vpc-price-container .vpc-next-step-btn",
    );

    if (prevBtn) {
      // Show back button when on interior view or step 2+
      const showBack =
        state.currentView === "interior" || state.currentStep > 1;
      prevBtn.style.display = showBack ? "inline-block" : "none";
    }

    if (nextBtn) {
      // Update button text based on step
      if (state.currentStep === 3) {
        nextBtn.style.display = "none";
      } else {
        nextBtn.textContent = "Volgende stap";
        nextBtn.style.display = "inline-block";
      }
    }

    // Update sidebar floating banner buttons
    const sidebarPrevBtn = document.querySelector(".vpc-sidebar-prev-btn");
    const sidebarNextBtn = document.querySelector(".vpc-sidebar-next-btn");
    const sidebarSubmitBtn = document.querySelector(".vpc-sidebar-submit-btn");

    if (sidebarPrevBtn) {
      // Show back button when on interior view or step 2+
      const showSidebarBack =
        state.currentView === "interior" || state.currentStep > 1;
      sidebarPrevBtn.style.display = showSidebarBack ? "inline-block" : "none";
    }

    if (sidebarNextBtn) {
      // Hide next button in step 3, show in step 2
      if (state.currentStep === 3) {
        sidebarNextBtn.style.display = "none";
      } else {
        sidebarNextBtn.textContent = "Volgende stap";
        sidebarNextBtn.style.display = "inline-block";
      }
    }

    if (sidebarSubmitBtn) {
      // Show submit button only in step 3
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

    // Handle postcode validation if changed
    if (e.target.name === "postcode") {
      validatePostcode(e.target.value);
    }
  }

  function validatePostcode(postcode) {
    const postcodeRegex = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;
    const errorEl = document.querySelector(".zipcode-error");
    const calculatorEl = document.querySelector(".zipcode-calculator");
    const isValid = postcodeRegex.test(postcode.trim());

    if (isValid) {
      if (errorEl) errorEl.classList.remove("visible");
      if (calculatorEl) calculatorEl.style.display = "block";

      // Here you would typically call an API to calculate distance
      // For now, we'll show a placeholder
      calculateDistance(postcode);
    } else {
      if (errorEl) errorEl.classList.add("visible");
      if (calculatorEl) calculatorEl.style.display = "none";
    }

    return isValid;
  }

  function calculateDistance(postcode) {
    // Placeholder for distance calculation
    // In production, this would call a geocoding/distance API
    const distanceCount = document.querySelector(".distance-count");
    const distancePrice = document.querySelector(".distance-price");

    // Simulated distance calculation based on postcode
    // For demo, we use a simple formula - in production use actual geocoding API
    const postcodeNum = parseInt(postcode.substring(0, 4));

    // Amsterdam area postcodes start with 10xx, calculate relative distance
    // Reference point: 1046 = 1.5 km
    let estimatedKm = 1.5; // Default for demo
    if (postcodeNum >= 1000 && postcodeNum <= 1099) {
      estimatedKm = Math.abs(postcodeNum - 1046) * 0.1 + 1;
    } else {
      // For other areas, simulate larger distances
      estimatedKm = Math.abs(postcodeNum - 1046) * 0.05;
    }

    // Round to 1 decimal
    estimatedKm = Math.round(estimatedKm * 10) / 10;

    const pricePerKm = 45;
    const transportCost = estimatedKm * pricePerKm;

    if (distanceCount)
      distanceCount.textContent = estimatedKm.toString().replace(".", ",");
    if (distancePrice)
      distancePrice.textContent = `€ ${transportCost
        .toFixed(2)
        .replace(".", ",")}`;

    // Update hidden result field (transport + kraanvergunning = total additional cost)
    const resultField = document.querySelector(".zipcode-result");
    if (resultField) {
      resultField.value = transportCost + 2000; // Add kraanvergunning cost
    }

    // Recalculate total prices to include transport costs
    calculatePrices();
  }

  // ================================
  // Value Appreciation Popup
  // ================================

  // Debounce timer for API calls
  let valuePopupDebounceTimer = null;

  function openValuePopup() {
    const popup = document.getElementById("vpc-value-popup");
    if (popup) {
      popup.classList.add("active");
      popup.style.display = "flex";
      // Focus on first input for better UX
      const firstInput = popup.querySelector("#value-postcode");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  function closeValuePopup() {
    const popup = document.getElementById("vpc-value-popup");
    if (popup) {
      popup.classList.remove("active");
      // Keep the inputs - don't reset them so user can see previous values when reopening
    }
  }

  /**
   * Handle input changes in the value popup
   * Debounces API calls to prevent excessive requests
   */
  function handleValuePopupInput() {
    // Clear any existing timer
    if (valuePopupDebounceTimer) {
      clearTimeout(valuePopupDebounceTimer);
    }

    // Set new timer for debounced call
    valuePopupDebounceTimer = setTimeout(() => {
      lookupAddressAndCalculateValue();
    }, 500);
  }

  /**
   * Lookup address using PDOK API and calculate value appreciation
   */
  async function lookupAddressAndCalculateValue() {
    const postcodeInput = document.getElementById("value-postcode");
    const housenumberInput = document.getElementById("value-housenumber");
    const additionInput = document.getElementById("value-addition");
    const addressDisplay = document.querySelector(".vpc-value-popup__address");
    const valueDisplay = document.querySelector(
      ".vpc-value-popup__result-value",
    );

    const postcode = (postcodeInput?.value || "")
      .replace(/\s/g, "")
      .toUpperCase();
    const housenumber = (housenumberInput?.value || "").trim();
    const addition = (additionInput?.value || "").trim();

    // Validate inputs
    if (!postcode || postcode.length < 6 || !housenumber) {
      if (addressDisplay) addressDisplay.textContent = "Straatnaam, Plaats";
      if (valueDisplay) valueDisplay.innerHTML = "€0<sup>?</sup>";
      return;
    }

    // Validate postcode format (1234AB pattern)
    const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
    if (!postcodeRegex.test(postcode)) {
      if (addressDisplay) addressDisplay.textContent = "Ongeldige postcode";
      if (valueDisplay) valueDisplay.innerHTML = "€0<sup>?</sup>";
      return;
    }

    try {
      // Use PDOK API for address lookup
      const searchQuery = `${postcode} ${housenumber}${addition ? " " + addition : ""}`;
      const apiUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(searchQuery)}&rows=1&fq=type:adres`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      if (
        data.response &&
        data.response.docs &&
        data.response.docs.length > 0
      ) {
        const address = data.response.docs[0];
        const street = address.straatnaam || "";
        const city = address.woonplaatsnaam || "";

        // Update address display
        if (addressDisplay) {
          addressDisplay.textContent = `${street}, ${city}`;
        }

        // Ensure postcode is available for fallback province lookup
        if (!address.postcode) {
          address.postcode = postcode;
        }

        // Calculate value appreciation
        calculateValueAppreciation(address, valueDisplay);
      } else {
        // Address not found - try calculating with just the postcode
        if (addressDisplay) addressDisplay.textContent = "Adres niet gevonden";
        // Still calculate with postcode fallback
        calculateValueAppreciation({ postcode: postcode }, valueDisplay);
      }
    } catch (error) {
      console.error("Address lookup error:", error);
      if (addressDisplay) addressDisplay.textContent = "Adres niet gevonden";
      // Still try to calculate with postcode fallback
      const postcodeInput = document.getElementById("value-postcode");
      const postcodeFallback = (postcodeInput?.value || "")
        .replace(/\s/g, "")
        .toUpperCase();
      if (postcodeFallback && postcodeFallback.length >= 4) {
        calculateValueAppreciation(
          { postcode: postcodeFallback },
          valueDisplay,
        );
      } else if (valueDisplay) {
        valueDisplay.innerHTML = "€0<sup>?</sup>";
      }
    }
  }

  /**
   * Get province from postcode (fallback when API doesn't return province)
   * @param {string} postcode - Dutch postcode (e.g., "1017AB")
   * @returns {string|null} Province name or null
   */
  function getProvinceFromPostcode(postcode) {
    if (!postcode || postcode.length < 4) return null;

    const postcodeNum = parseInt(postcode.substring(0, 4), 10);

    // Dutch postcode ranges per province
    if (postcodeNum >= 1000 && postcodeNum <= 1299) return "Noord-Holland"; // Amsterdam
    if (postcodeNum >= 1300 && postcodeNum <= 1424) return "Noord-Holland"; // Almere area actually Flevoland
    if (postcodeNum >= 1425 && postcodeNum <= 1429) return "Noord-Holland";
    if (postcodeNum >= 1430 && postcodeNum <= 1435) return "Noord-Holland";
    if (postcodeNum >= 1436 && postcodeNum <= 1437) return "Noord-Holland";
    if (postcodeNum >= 1438 && postcodeNum <= 1446) return "Noord-Holland";
    if (postcodeNum >= 1447 && postcodeNum <= 1447) return "Noord-Holland";
    if (postcodeNum >= 1448 && postcodeNum <= 1448) return "Noord-Holland";
    if (postcodeNum >= 1449 && postcodeNum <= 1949) return "Noord-Holland";
    if (postcodeNum >= 1950 && postcodeNum <= 1966) return "Noord-Holland";
    if (postcodeNum >= 1967 && postcodeNum <= 1999) return "Noord-Holland";
    if (postcodeNum >= 2000 && postcodeNum <= 2199) return "Zuid-Holland"; // Leiden area
    if (postcodeNum >= 2200 && postcodeNum <= 2299) return "Zuid-Holland";
    if (postcodeNum >= 2300 && postcodeNum <= 2399) return "Zuid-Holland"; // The Hague
    if (postcodeNum >= 2400 && postcodeNum <= 2499) return "Zuid-Holland";
    if (postcodeNum >= 2500 && postcodeNum <= 2599) return "Zuid-Holland";
    if (postcodeNum >= 2600 && postcodeNum <= 2699) return "Zuid-Holland";
    if (postcodeNum >= 2700 && postcodeNum <= 2799) return "Zuid-Holland"; // Zoetermeer
    if (postcodeNum >= 2800 && postcodeNum <= 2899) return "Zuid-Holland"; // Gouda
    if (postcodeNum >= 2900 && postcodeNum <= 2999) return "Zuid-Holland";
    if (postcodeNum >= 3000 && postcodeNum <= 3099) return "Zuid-Holland"; // Rotterdam
    if (postcodeNum >= 3100 && postcodeNum <= 3199) return "Zuid-Holland";
    if (postcodeNum >= 3200 && postcodeNum <= 3299) return "Zuid-Holland";
    if (postcodeNum >= 3300 && postcodeNum <= 3399) return "Zuid-Holland"; // Dordrecht
    if (postcodeNum >= 3400 && postcodeNum <= 3449) return "Utrecht";
    if (postcodeNum >= 3450 && postcodeNum <= 3499) return "Utrecht";
    if (postcodeNum >= 3500 && postcodeNum <= 3599) return "Utrecht"; // Utrecht city
    if (postcodeNum >= 3600 && postcodeNum <= 3649) return "Utrecht";
    if (postcodeNum >= 3650 && postcodeNum <= 3699) return "Utrecht";
    if (postcodeNum >= 3700 && postcodeNum <= 3799) return "Utrecht"; // Zeist
    if (postcodeNum >= 3800 && postcodeNum <= 3899) return "Utrecht"; // Amersfoort
    if (postcodeNum >= 3900 && postcodeNum <= 3999) return "Gelderland"; // Veenendaal
    if (postcodeNum >= 4000 && postcodeNum <= 4099) return "Gelderland";
    if (postcodeNum >= 4100 && postcodeNum <= 4199) return "Gelderland"; // Culemborg
    if (postcodeNum >= 4200 && postcodeNum <= 4299) return "Gelderland"; // Gorinchem
    if (postcodeNum >= 4300 && postcodeNum <= 4399) return "Zeeland";
    if (postcodeNum >= 4400 && postcodeNum <= 4499) return "Zeeland";
    if (postcodeNum >= 4500 && postcodeNum <= 4599) return "Zeeland";
    if (postcodeNum >= 4600 && postcodeNum <= 4699) return "Noord-Brabant"; // Bergen op Zoom
    if (postcodeNum >= 4700 && postcodeNum <= 4799) return "Noord-Brabant"; // Roosendaal
    if (postcodeNum >= 4800 && postcodeNum <= 4899) return "Noord-Brabant"; // Breda
    if (postcodeNum >= 4900 && postcodeNum <= 4999) return "Noord-Brabant"; // Oosterhout
    if (postcodeNum >= 5000 && postcodeNum <= 5099) return "Noord-Brabant"; // Tilburg
    if (postcodeNum >= 5100 && postcodeNum <= 5199) return "Noord-Brabant";
    if (postcodeNum >= 5200 && postcodeNum <= 5299) return "Noord-Brabant"; // 's-Hertogenbosch
    if (postcodeNum >= 5300 && postcodeNum <= 5399) return "Noord-Brabant";
    if (postcodeNum >= 5400 && postcodeNum <= 5499) return "Noord-Brabant";
    if (postcodeNum >= 5500 && postcodeNum <= 5599) return "Noord-Brabant"; // Veldhoven
    if (postcodeNum >= 5600 && postcodeNum <= 5699) return "Noord-Brabant"; // Eindhoven
    if (postcodeNum >= 5700 && postcodeNum <= 5799) return "Noord-Brabant"; // Helmond
    if (postcodeNum >= 5800 && postcodeNum <= 5899) return "Limburg";
    if (postcodeNum >= 5900 && postcodeNum <= 5999) return "Limburg"; // Venlo
    if (postcodeNum >= 6000 && postcodeNum <= 6099) return "Limburg";
    if (postcodeNum >= 6100 && postcodeNum <= 6199) return "Limburg"; // Echt
    if (postcodeNum >= 6200 && postcodeNum <= 6299) return "Limburg"; // Maastricht
    if (postcodeNum >= 6300 && postcodeNum <= 6399) return "Limburg"; // Valkenburg
    if (postcodeNum >= 6400 && postcodeNum <= 6499) return "Limburg"; // Heerlen
    if (postcodeNum >= 6500 && postcodeNum <= 6599) return "Limburg"; // Also some in Gelderland
    if (postcodeNum >= 6600 && postcodeNum <= 6699) return "Gelderland";
    if (postcodeNum >= 6700 && postcodeNum <= 6799) return "Gelderland"; // Wageningen
    if (postcodeNum >= 6800 && postcodeNum <= 6899) return "Gelderland"; // Arnhem
    if (postcodeNum >= 6900 && postcodeNum <= 6999) return "Gelderland"; // Zevenaar
    if (postcodeNum >= 7000 && postcodeNum <= 7099) return "Gelderland"; // Doetinchem
    if (postcodeNum >= 7100 && postcodeNum <= 7199) return "Gelderland"; // Winterswijk
    if (postcodeNum >= 7200 && postcodeNum <= 7299) return "Gelderland"; // Zutphen
    if (postcodeNum >= 7300 && postcodeNum <= 7399) return "Gelderland"; // Apeldoorn
    if (postcodeNum >= 7400 && postcodeNum <= 7499) return "Overijssel"; // Deventer
    if (postcodeNum >= 7500 && postcodeNum <= 7599) return "Overijssel"; // Enschede
    if (postcodeNum >= 7600 && postcodeNum <= 7699) return "Overijssel"; // Almelo
    if (postcodeNum >= 7700 && postcodeNum <= 7799) return "Overijssel";
    if (postcodeNum >= 7800 && postcodeNum <= 7899) return "Overijssel"; // Emmen is Drenthe
    if (postcodeNum >= 7900 && postcodeNum <= 7999) return "Overijssel";
    if (postcodeNum >= 8000 && postcodeNum <= 8099) return "Overijssel"; // Zwolle
    if (postcodeNum >= 8100 && postcodeNum <= 8199) return "Flevoland"; // Lelystad
    if (postcodeNum >= 8200 && postcodeNum <= 8299) return "Flevoland"; // Lelystad
    if (postcodeNum >= 8300 && postcodeNum <= 8399) return "Flevoland"; // Emmeloord
    if (postcodeNum >= 8400 && postcodeNum <= 8499) return "Friesland";
    if (postcodeNum >= 8500 && postcodeNum <= 8599) return "Friesland"; // Joure
    if (postcodeNum >= 8600 && postcodeNum <= 8699) return "Friesland"; // Sneek
    if (postcodeNum >= 8700 && postcodeNum <= 8799) return "Friesland";
    if (postcodeNum >= 8800 && postcodeNum <= 8899) return "Friesland"; // Franeker
    if (postcodeNum >= 8900 && postcodeNum <= 8999) return "Friesland"; // Leeuwarden
    if (postcodeNum >= 9000 && postcodeNum <= 9099) return "Groningen"; // Groningen city
    if (postcodeNum >= 9100 && postcodeNum <= 9199) return "Friesland"; // Dokkum
    if (postcodeNum >= 9200 && postcodeNum <= 9299) return "Friesland"; // Drachten
    if (postcodeNum >= 9300 && postcodeNum <= 9399) return "Drenthe"; // Roden
    if (postcodeNum >= 9400 && postcodeNum <= 9499) return "Drenthe"; // Assen
    if (postcodeNum >= 9500 && postcodeNum <= 9599) return "Groningen"; // Stadskanaal
    if (postcodeNum >= 9600 && postcodeNum <= 9699) return "Groningen"; // Hoogezand
    if (postcodeNum >= 9700 && postcodeNum <= 9799) return "Groningen"; // Groningen
    if (postcodeNum >= 9800 && postcodeNum <= 9899) return "Groningen";
    if (postcodeNum >= 9900 && postcodeNum <= 9999) return "Groningen";

    return null;
  }

  /**
   * Calculate value appreciation based on address data and configured extension size
   * Uses the province from PDOK API response and updated m² price estimates
   * Matches exactly the calculation on deprefabriek.nl/configurator/
   * @param {Object} addressData - Address data from PDOK API (contains provincienaam)
   * @param {Element} valueDisplay - DOM element to display result
   */
  function calculateValueAppreciation(addressData, valueDisplay) {
    // Get current extension size
    const depthM = state.dimensions.depth / 100;
    const lengthM = state.dimensions.length / 100;
    const extensionArea = depthM * lengthM;

    // Updated average m² price per province (2024/2025 market values)
    // Calibrated to exactly match the main deprefabriek.nl calculator
    // Reference: Gelderland (7207RS) = €3,500/m² → €31,500 for 9m²
    const provinceM2Prices = {
      "Noord-Holland": 4750,
      "Zuid-Holland": 4300,
      Utrecht: 4500,
      "Noord-Brabant": 3600,
      Gelderland: 3500,
      Limburg: 2950,
      Overijssel: 3150,
      Flevoland: 3400,
      Drenthe: 2700,
      Groningen: 2825,
      Friesland: 2600,
      Zeeland: 3050,
    };

    // Default average m² price for Netherlands
    const defaultM2Price = 3400;

    // Use province from PDOK API response
    let province = addressData?.provincienaam || null;

    // Fallback: try to get province from postcode if not in API response
    if (!province && addressData?.postcode) {
      province = getProvinceFromPostcode(addressData.postcode);
    }

    // Get m² price for province or use default
    const m2Price =
      province && provinceM2Prices[province]
        ? provinceM2Prices[province]
        : defaultM2Price;

    // Calculate value appreciation (extension area × price per m²)
    const valueIncrease = Math.round(extensionArea * m2Price);

    // Save to state
    state.valueAppreciation = valueIncrease;

    // Format and display the result in popup
    if (valueDisplay) {
      valueDisplay.innerHTML = `€${valueIncrease.toLocaleString("nl-NL")}<sup>*</sup>`;
    }

    // Update the main price container display
    updateValueAppreciationDisplay();
  }

  /**
   * Update the value appreciation display in the main price container
   */
  function updateValueAppreciationDisplay() {
    const valueTextElement = document.querySelector(".vpc-value-text");
    const valueAmountElement = document.querySelector(".vpc-value-amount");

    if (state.valueAppreciation > 0) {
      // Update the text to show "Meerwaarde:"
      if (valueTextElement) {
        valueTextElement.textContent = "Meerwaarde:";
      }
      // Show the calculated value
      if (valueAmountElement) {
        valueAmountElement.textContent = `€${state.valueAppreciation.toLocaleString("nl-NL")}`;
        valueAmountElement.style.display = "inline";
      }
    } else {
      // Reset to default text
      if (valueTextElement) {
        valueTextElement.textContent = "Waardevermeerdering weten?";
      }
      if (valueAmountElement) {
        valueAmountElement.style.display = "none";
      }
    }
  }

  // ================================
  // Quote Form Submission
  // ================================
  function handleQuoteSubmit(e) {
    // Populate hidden fields before submission
    populateFormHiddenFields();

    // Allow the form to submit naturally to Shopify contact form
    // Don't prevent default - let Shopify handle the submission
    showLoader();
  }

  function populateFormHiddenFields() {
    // Dimensions
    const dimensionsField = document.getElementById("form_dimensions");
    if (dimensionsField) {
      dimensionsField.value = `Breedte: ${state.dimensions.length}cm, Diepte: ${
        state.dimensions.depth
      }cm, Oppervlakte: ${(
        (state.dimensions.length * state.dimensions.depth) /
        10000
      ).toFixed(2)}m²`;
    }

    // Total price
    const totalPriceField = document.getElementById("form_total_price");
    if (totalPriceField) {
      totalPriceField.value = formatPrice(state.totalPrice);
    }

    // Exterior selections
    const exteriorSelectionsField = document.getElementById(
      "form_exterior_selections",
    );
    if (exteriorSelectionsField) {
      const exteriorItems = [];
      document
        .querySelectorAll(".vpc-component.exterior-element")
        .forEach((component) => {
          if (component.classList.contains("hidden")) return;
          const nameEl = component.querySelector(".vpc-component-name");
          const selectedEl = component.querySelector(".vpc-selected-option");
          if (nameEl && selectedEl) {
            const name = nameEl.textContent.trim();
            const value = selectedEl.textContent.trim();
            if (value) {
              // Get price from selected option
              const selectedInput = component.querySelector("input:checked");
              const price = selectedInput
                ? parseFloat(selectedInput.dataset.price) || 0
                : 0;
              exteriorItems.push(
                `${name}: ${value}${
                  price > 0 ? ` (+${formatPrice(price)})` : ""
                }`,
              );
            }
          }
        });
      exteriorSelectionsField.value = exteriorItems.join(" | ");
    }

    // Interior selections
    const interiorSelectionsField = document.getElementById(
      "form_interior_selections",
    );
    if (interiorSelectionsField) {
      const interiorItems = [];
      document
        .querySelectorAll(".vpc-component.interior-element")
        .forEach((component) => {
          if (component.classList.contains("hidden")) return;
          const nameEl = component.querySelector(".vpc-component-name");
          const selectedEl = component.querySelector(".vpc-selected-option");
          if (nameEl && selectedEl) {
            const name = nameEl.textContent.trim();
            const value = selectedEl.textContent.trim();
            if (value) {
              // Get price from selected option
              const selectedInput = component.querySelector("input:checked");
              const price = selectedInput
                ? parseFloat(selectedInput.dataset.price) || 0
                : 0;
              interiorItems.push(
                `${name}: ${value}${
                  price > 0 ? ` (+${formatPrice(price)})` : ""
                }`,
              );
            }
          }
        });
      interiorSelectionsField.value = interiorItems.join(" | ");
    }

    // Additional options from step 2 form
    const additionalOptionsField = document.getElementById(
      "form_additional_options",
    );
    if (additionalOptionsField) {
      const additionalItems = [];

      // Achterom option
      const achteromInput = document.querySelector(
        'input[name="achterom"]:checked',
      );
      if (achteromInput) {
        const label =
          achteromInput.nextElementSibling?.querySelector(".radio-label__text")
            ?.textContent || achteromInput.value;
        additionalItems.push(`Achterom: ${label}`);
      }

      // Doorbraak option
      const doorbraakInput = document.querySelector(
        'input[name="doorbraak"]:checked',
      );
      if (doorbraakInput) {
        const label =
          doorbraakInput.nextElementSibling?.querySelector(".radio-label__text")
            ?.textContent || doorbraakInput.value;
        additionalItems.push(`Doorbraak: ${label}`);
      }

      // Postcode
      const postcodeInput = document.querySelector('input[name="postcode"]');
      if (postcodeInput && postcodeInput.value) {
        additionalItems.push(`Postcode: ${postcodeInput.value}`);
      }

      additionalOptionsField.value = additionalItems.join(" | ");
    }

    // Full configuration JSON for backend processing
    const fullConfigField = document.getElementById("form_full_configuration");
    if (fullConfigField) {
      const fullConfig = {
        dimensions: state.dimensions,
        totalPrice: state.totalPrice,
        exteriorPrice: state.exteriorPrice,
        interiorPrice: state.interiorPrice,
        selectedOptions: state.selectedOptions,
        timestamp: new Date().toISOString(),
      };
      fullConfigField.value = JSON.stringify(fullConfig);
    }

    // Populate UTM parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gclidField = document.getElementById("gclid");
    const utmSourceField = document.getElementById("utm_source");
    const utmMediumField = document.getElementById("utm_medium");
    const utmCampaignField = document.getElementById("utm_campaign");

    if (gclidField) gclidField.value = urlParams.get("gclid") || "";
    if (utmSourceField)
      utmSourceField.value = urlParams.get("utm_source") || "";
    if (utmMediumField)
      utmMediumField.value = urlParams.get("utm_medium") || "";
    if (utmCampaignField)
      utmCampaignField.value = urlParams.get("utm_campaign") || "";
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
