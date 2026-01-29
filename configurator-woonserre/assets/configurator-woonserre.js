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
  // Image Layer Data - Generated dynamically to avoid Shopify 256KB template limit
  // ================================
  const IMAGE_LAYERS_DATA = [
    // Base renders
    {
      cls: "simple active",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/03/PDF-glass-extension-001-1800x1350.png",
      layer: "Buitenzijde main",
      choice: "default render exterior",
      layer_id: 39,
      choice_id: 1,
    },
    {
      cls: "simple active",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/01/PASS-PDF-glass-extension-osnovni-render-1800x1350.png",
      layer: "Binnenzijde main",
      choice: "default render interior",
      layer_id: 40,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/hoofdaanzicht-wit-nieuw-1800x1350.png",
      layer: "Main render white (hidden)",
      choice: "hoofdaanzicht wit",
      layer_id: 18,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "",
      layer: "Main render interior white (hidden)",
      choice: "Binnenzijde wit",
      layer_id: 37,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "",
      layer: "Main render interior white (hidden)",
      choice: "Binnenzijde wit met roedes",
      layer_id: 37,
      choice_id: 2,
    },
    // Kozijn interior (hidden) - synced with exterior Kozijn selection
    // Kunststof options
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren wit (kunststof)",
      layer_id: 32,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren antraciet (kunststof)",
      layer_id: 32,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-met-roedes-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren met roedes wit (kunststof)",
      layer_id: 32,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-met-roedes-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren met roedes antraciet (kunststof)",
      layer_id: 32,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-2-delige-schuifpui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "2 delige schuifpui wit (kunststof)",
      layer_id: 32,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-2-delige-schuifpui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "2 delige schuifpui antraciet (kunststof)",
      layer_id: 32,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-4-delige-schuifpui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "4 delige schuifpui wit (kunststof)",
      layer_id: 32,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-4-delige-schuifpui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "4 delige schuifpui antraciet (kunststof)",
      layer_id: 32,
      choice_id: 8,
    },
    // Aluminium options
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren wit (aluminium)",
      layer_id: 32,
      choice_id: 9,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren antraciet (aluminium)",
      layer_id: 32,
      choice_id: 10,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-met-roedes-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren met roedes wit (aluminium)",
      layer_id: 32,
      choice_id: 11,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-met-roedes-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren met roedes antraciet (aluminium)",
      layer_id: 32,
      choice_id: 12,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-2-delige-schuifpui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "2 delige schuifpui wit (aluminium)",
      layer_id: 32,
      choice_id: 13,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-2-delige-schuifpui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "2 delige schuifpui antraciet (aluminium)",
      layer_id: 32,
      choice_id: 14,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-4-delige-schuifpui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "4 delige schuifpui wit (aluminium)",
      layer_id: 32,
      choice_id: 15,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-4-delige-schuifpui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "4 delige schuifpui antraciet (aluminium)",
      layer_id: 32,
      choice_id: 16,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-harmonicapui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "harmonicapui wit (aluminium)",
      layer_id: 32,
      choice_id: 17,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-harmonicapui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "harmonicapui antraciet (aluminium)",
      layer_id: 32,
      choice_id: 18,
    },
    // Hout options
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren wit gegrond (hout)",
      layer_id: 32,
      choice_id: 19,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren antraciet gegrond (hout)",
      layer_id: 32,
      choice_id: 20,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-met-roedes-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren met roedes wit gegrond (hout)",
      layer_id: 32,
      choice_id: 21,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-openslaande-deuren-met-roedes-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "openslaande deuren met roedes antraciet gegrond (hout)",
      layer_id: 32,
      choice_id: 22,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-2-delige-schuifpui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "2 delige schuifpui wit gegrond (hout)",
      layer_id: 32,
      choice_id: 23,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-2-delige-schuifpui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "2 delige schuifpui antraciet gegrond (hout)",
      layer_id: 32,
      choice_id: 24,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-4-delige-schuifpui-wit-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "4 delige schuifpui wit gegrond (hout)",
      layer_id: 32,
      choice_id: 25,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Binnenzijde-4-delige-schuifpui-antraciet-1800x1350.png",
      layer: "Kozijn interior (hidden)",
      choice: "4 delige schuifpui antraciet gegrond (hout)",
      layer_id: 32,
      choice_id: 26,
    },
    // Kozijn (28 options)
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-wit-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren wit (kunststof)",
      layer_id: 1,
      choice_id: 1,
    },
    {
      cls: "simple active",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-antraciet-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren antraciet (kunststof)",
      layer_id: 1,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-met-roedes-wit-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren met roedes wit (kunststof)",
      layer_id: 1,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-met-roedes-antraciet-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren met roedes antraciet (kunststof)",
      layer_id: 1,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-delige-schuifpui-wit-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "2 delige schuifpui wit (kunststof)",
      layer_id: 1,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-delige-schuifpui-antraciet-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "2 delige schuifpui antraciet (kunststof)",
      layer_id: 1,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-delige-schuifpui-wit-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "4 delige schuifpui wit (kunststof)",
      layer_id: 1,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-delige-schuifpui-antraciet-kunststof-1800x1350.png",
      layer: "Kozijn",
      choice: "4 delige schuifpui antraciet (kunststof)",
      layer_id: 1,
      choice_id: 8,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-wit-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren wit (aluminium)",
      layer_id: 1,
      choice_id: 10,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-antraciet-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren antraciet (aluminium)",
      layer_id: 1,
      choice_id: 11,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-met-roedes-wit-aluminium-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren met roedes wit (aluminium)",
      layer_id: 1,
      choice_id: 12,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-met-roedes-antraciet-aluminium-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren met roedes antraciet (aluminium)",
      layer_id: 1,
      choice_id: 13,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-delige-schuifpui-wit-aluminium-1800x1350.png",
      layer: "Kozijn",
      choice: "2 delige schuifpui wit (aluminium)",
      layer_id: 1,
      choice_id: 14,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-delige-schuifpui-antraciet-aluminium-1800x1350.png",
      layer: "Kozijn",
      choice: "2 delige schuifpui antraciet (aluminium)",
      layer_id: 1,
      choice_id: 15,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-delige-schuifpui-wit-aluminium-1800x1350.png",
      layer: "Kozijn",
      choice: "4 delige schuifpui wit (aluminium)",
      layer_id: 1,
      choice_id: 16,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-delige-schuifpui-antraciet-aluminium-1800x1350.png",
      layer: "Kozijn",
      choice: "4 delige schuifpui antraciet (aluminium)",
      layer_id: 1,
      choice_id: 17,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/harmonicapui-wit-aluminium-nieuw-1800x1350.png",
      layer: "Kozijn",
      choice: "harmonicapui wit (aluminium)",
      layer_id: 1,
      choice_id: 18,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/harmonicapui-antraciet-aluminium-nieuw-1800x1350.png",
      layer: "Kozijn",
      choice: "harmonicapui antraciet (aluminium)",
      layer_id: 1,
      choice_id: 19,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-wit-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren wit gegrond (hout)",
      layer_id: 1,
      choice_id: 21,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-antraciet-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren antraciet gegrond (hout)",
      layer_id: 1,
      choice_id: 22,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-met-roedes-wit-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren met roedes wit gegrond (hout)",
      layer_id: 1,
      choice_id: 23,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/openslaande-deuren-met-roedes-antraciet-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "openslaande deuren met roedes antraciet gegrond (hout)",
      layer_id: 1,
      choice_id: 24,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-delige-schuifpui-wit-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "2 delige schuifpui wit gegrond (hout)",
      layer_id: 1,
      choice_id: 25,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-delige-schuifpui-antraciet-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "2 delige schuifpui antraciet gegrond (hout)",
      layer_id: 1,
      choice_id: 26,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-delige-schuifpui-wit-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "4 delige schuifpui wit gegrond (hout)",
      layer_id: 1,
      choice_id: 27,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-delige-schuifpui-antraciet-gegrond-hout-1800x1350.png",
      layer: "Kozijn",
      choice: "4 delige schuifpui antraciet gegrond (hout)",
      layer_id: 1,
      choice_id: 28,
    },
    // Rechterzijde - Wall textures (circle class)
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-rood-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "baksteen rood",
      layer_id: 2,
      choice_id: 2,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-geel-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "baksteen geel",
      layer_id: 2,
      choice_id: 3,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-zwart-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "baksteen zwart",
      layer_id: 2,
      choice_id: 4,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-wit-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "baksteen wit",
      layer_id: 2,
      choice_id: 5,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-zwart-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "kunststof rabat (keralit) zwart",
      layer_id: 2,
      choice_id: 7,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-antraciet-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "kunststof rabat (keralit) antraciet",
      layer_id: 2,
      choice_id: 8,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-cremewit-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "kunststof rabat (keralit) cremewit",
      layer_id: 2,
      choice_id: 9,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-groen-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "kunststof rabat (keralit) groen",
      layer_id: 2,
      choice_id: 10,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/red-cedar-rabat-hout-horizontaal-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "red cedar rabat (hout) horizontaal",
      layer_id: 2,
      choice_id: 12,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/red-cedar-rabat-hout-verticaal-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "red cedar rabat (hout) verticaal",
      layer_id: 2,
      choice_id: 13,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/open-gevelbekleding-frake-hout-horizontaal-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "open gevelbekleding frake (hout) horizontaal",
      layer_id: 2,
      choice_id: 14,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/open-gevelbekleding-frake-hout-verticaal-nieuw-1800x1350.png",
      layer: "Rechterzijde",
      choice: "open gevelbekleding frake (hout) verticaal",
      layer_id: 2,
      choice_id: 15,
    },
    // Rechter glazen zijwandtype
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-met-roedes-wit-1800x1350.png",
      layer: "Rechter glazen zijwandtype (hidden)",
      choice: "vast raam met roedes wit",
      layer_id: 60,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-met-roedes-zwart-1800x1350.png",
      layer: "Rechter glazen zijwandtype (hidden)",
      choice: "vast raam met roedes zwart",
      layer_id: 60,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-wit-1800x1350.png",
      layer: "Rechter glazen zijwandtype (hidden)",
      choice: "vast raam wit",
      layer_id: 60,
      choice_id: 3,
    },
    {
      cls: "simple active",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-zwart-1800x1350.png",
      layer: "Rechter glazen zijwandtype (hidden)",
      choice: "vast raam zwart",
      layer_id: 60,
      choice_id: 4,
    },
    // Rechter glazen schuifpui options
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/schuifpui-wit-1800x1350.png",
      layer: "Rechter glazen zijwandtype (hidden)",
      choice: "schuifpui wit",
      layer_id: 60,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/schuifpui-zwart-1800x1350.png",
      layer: "Rechter glazen zijwandtype (hidden)",
      choice: "schuifpui zwart",
      layer_id: 60,
      choice_id: 6,
    },
    // Linkerzijde - Wall textures (circle class)
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-rood-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "baksteen rood",
      layer_id: 3,
      choice_id: 2,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-geel-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "baksteen geel",
      layer_id: 3,
      choice_id: 3,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-zwart-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "baksteen zwart",
      layer_id: 3,
      choice_id: 4,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/baksteen-wit-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "baksteen wit",
      layer_id: 3,
      choice_id: 5,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-zwart-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "kunststof rabat (keralit) zwart",
      layer_id: 3,
      choice_id: 7,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-antraciet-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "kunststof rabat (keralit) antraciet",
      layer_id: 3,
      choice_id: 8,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-cremewit-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "kunststof rabat (keralit) cremewit",
      layer_id: 3,
      choice_id: 9,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/kunststof-rabat-keralit-groen-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "kunststof rabat (keralit) groen",
      layer_id: 3,
      choice_id: 10,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/red-cedar-rabat-hout-horizontaal-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "red cedar rabat (hout) horizontaal",
      layer_id: 3,
      choice_id: 12,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/red-cedar-rabat-hout-verticaal-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "red cedar rabat (hout) verticaal",
      layer_id: 3,
      choice_id: 13,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/open-gevelbekleding-frake-hout-horizontaal-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "open gevelbekleding frake (hout) horizontaal",
      layer_id: 3,
      choice_id: 14,
    },
    {
      cls: "simple circle",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/open-gevelbekleding-frake-hout-verticaal-links-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "open gevelbekleding frake (hout) verticaal",
      layer_id: 3,
      choice_id: 15,
    },
    // Linkerzijde kozijn overlays - show door frame based on Kozijn type when wall texture is selected
    // 2 delig schuifpui kozijn variants (6 material/color combinations)
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-2-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 2 delig kozijn – aluminium antraciet",
      layer_id: 19,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-2-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 2 delig kozijn – aluminium wit",
      layer_id: 19,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-2-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 2 delig kozijn – hout antraciet",
      layer_id: 19,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-2-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 2 delig kozijn – hout wit",
      layer_id: 19,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-2-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 2 delig kozijn – kunststof antraciet",
      layer_id: 19,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-2-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 2 delig kozijn – kunststof wit",
      layer_id: 19,
      choice_id: 6,
    },
    // 4 delig schuifpui kozijn variants (6 material/color combinations)
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-4-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 4 delig kozijn – aluminium antraciet",
      layer_id: 19,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-4-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 4 delig kozijn – aluminium wit",
      layer_id: 19,
      choice_id: 8,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-4-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 4 delig kozijn – hout antraciet",
      layer_id: 19,
      choice_id: 9,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-4-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 4 delig kozijn – hout wit",
      layer_id: 19,
      choice_id: 10,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-4-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 4 delig kozijn – kunststof antraciet",
      layer_id: 19,
      choice_id: 11,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-4-delig-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand 4 delig kozijn – kunststof wit",
      layer_id: 19,
      choice_id: 12,
    },
    // Harmonicapui kozijn variants (2 - only aluminium)
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-harmonicapui-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand harmonicapui kozijn – aluminium antraciet",
      layer_id: 19,
      choice_id: 13,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-harmonicapui-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand harmonicapui kozijn – aluminium wit",
      layer_id: 19,
      choice_id: 14,
    },
    // Openslaande deuren kozijn variants (6 material/color combinations)
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren kozijn – aluminium antraciet",
      layer_id: 19,
      choice_id: 15,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren kozijn – aluminium wit",
      layer_id: 19,
      choice_id: 16,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren kozijn – hout antraciet",
      layer_id: 19,
      choice_id: 17,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren kozijn – hout wit",
      layer_id: 19,
      choice_id: 18,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren kozijn – kunststof antraciet",
      layer_id: 19,
      choice_id: 19,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren kozijn – kunststof wit",
      layer_id: 19,
      choice_id: 20,
    },
    // Openslaande deuren met roedes kozijn variants (6 material/color combinations)
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-met-roedes-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice:
        "linker zijwand openslaande deuren met roedes kozijn – aluminium antraciet",
      layer_id: 19,
      choice_id: 21,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-met-roedes-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice:
        "linker zijwand openslaande deuren met roedes kozijn – aluminium wit",
      layer_id: 19,
      choice_id: 22,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-met-roedes-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice:
        "linker zijwand openslaande deuren met roedes kozijn – hout antraciet",
      layer_id: 19,
      choice_id: 23,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-met-roedes-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice: "linker zijwand openslaande deuren met roedes kozijn – hout wit",
      layer_id: 19,
      choice_id: 24,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-met-roedes-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice:
        "linker zijwand openslaande deuren met roedes kozijn – kunststof antraciet",
      layer_id: 19,
      choice_id: 25,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-met-roedes-kozijn-nieuw-1800x1350.png",
      layer: "Linkerzijde (hidden)",
      choice:
        "linker zijwand openslaande deuren met roedes kozijn – kunststof wit",
      layer_id: 19,
      choice_id: 26,
    },
    // Linker glazen zijwandtype interior - synced with exterior LinkerGlazenType
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-met-roedes-wit-links-1800x1350.png",
      layer: "Linker glazen zijwandtype interior (hidden)",
      choice: "Binnenzijde - Linker - vast raam met roedes wit",
      layer_id: 61,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-wit-links-1800x1350.png",
      layer: "Linker glazen zijwandtype interior (hidden)",
      choice: "Binnenzijde - Linker - vast raam wit",
      layer_id: 61,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-zwart-links-1800x1350.png",
      layer: "Linker glazen zijwandtype interior (hidden)",
      choice: "Binnenzijde - Linker - vast raam zwart",
      layer_id: 61,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/vast-raam-met-roedes-zwart-links-1800x1350.png",
      layer: "Linker glazen zijwandtype interior (hidden)",
      choice: "Binnenzijde - Linker - vast raam met roedes zwart",
      layer_id: 61,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/schuifpui-wit-links-1800x1350.png",
      layer: "Linker glazen zijwandtype interior (hidden)",
      choice: "Binnenzijde - Linker - schuifpui wit",
      layer_id: 61,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/schuifpui-zwart-links-1800x1350.png",
      layer: "Linker glazen zijwandtype interior (hidden)",
      choice: "Binnenzijde - Linker - schuifpui zwart",
      layer_id: 61,
      choice_id: 6,
    },
    // Daklicht interior (hidden) - synced with exterior Daklicht selection
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "1 vaks lessenaar",
      layer_id: 33,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "2 vaks lessenaar",
      layer_id: 33,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "3 vaks lessenaar",
      layer_id: 33,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "4 vaks lessenaar",
      layer_id: 33,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "5 vaks lessenaar",
      layer_id: 33,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "4 vaks zadeldak",
      layer_id: 33,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "6 vaks zadeldak",
      layer_id: 33,
      choice_id: 8,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "8 vaks zadeldak",
      layer_id: 33,
      choice_id: 9,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht interior (hidden)",
      choice: "10 vaks zadeldak",
      layer_id: 33,
      choice_id: 10,
    },
    // Daklicht zonwering interior (hidden)
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "1 vaks lessenaar zonwering interior",
      layer_id: 34,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "2 vaks lessenaar zonwering interior",
      layer_id: 34,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "3 vaks lessenaar zonwering interior",
      layer_id: 34,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "4 vaks lessenaar zonwering interior",
      layer_id: 34,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "5 vaks lessenaar zonwering interior",
      layer_id: 34,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "4 vaks zadeldak zonwering interior",
      layer_id: 34,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "6 vaks zadeldak zonwering interior",
      layer_id: 34,
      choice_id: 8,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "8 vaks zadeldak zonwering interior",
      layer_id: 34,
      choice_id: 9,
    },
    {
      cls: "simple",
      src: "",
      layer: "Daklicht zonwering interior (hidden)",
      choice: "10 vaks zadeldak zonwering interior",
      layer_id: 34,
      choice_id: 10,
    },
    // Regenpijp
    {
      cls: "simple active",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Regenpijp-PVC-links-nieuw-1800x1350.png",
      layer: "Regenpijp",
      choice: "PVC links",
      layer_id: 15,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Regenpijp-PVC-rechts-nieuw-1800x1350.png",
      layer: "Regenpijp",
      choice: "PVC rechts",
      layer_id: 15,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Regenpijp-PVC-links-rechts-nieuw-1800x1350.png",
      layer: "Regenpijp",
      choice: "PVC links & rechts",
      layer_id: 15,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Regenpijp-zink-links-1800x1350.png",
      layer: "Regenpijp",
      choice: "zink links",
      layer_id: 15,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Regenpijp-zink-rechts-1800x1350.png",
      layer: "Regenpijp",
      choice: "zink rechts",
      layer_id: 15,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Regenpijp-zink-links-rechts-1800x1350.png",
      layer: "Regenpijp",
      choice: "zink links & rechts",
      layer_id: 15,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Regenpijp-PVC-zwart-links-nieuw-1800x1350.png",
      layer: "Regenpijp",
      choice: "PVC zwart links",
      layer_id: 15,
      choice_id: 9,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Regenpijp-PVC-zwart-rechts-nieuw-1800x1350.png",
      layer: "Regenpijp",
      choice: "PVC zwart rechts",
      layer_id: 15,
      choice_id: 10,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Regenpijp-PVC-zwart-links-rechts-nieuw-1800x1350.png",
      layer: "Regenpijp",
      choice: "PVC zwart links & rechts",
      layer_id: 15,
      choice_id: 11,
    },
    // Overstek
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Overstek-wit-nieuw-1800x1350.png",
      layer: "Overstek",
      choice: "overstek wit, geen zijkant (kunststof)",
      layer_id: 8,
      choice_id: 20,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Overstek-wit-met-zijkant-nieuw-1800x1350.png",
      layer: "Overstek",
      choice: "overstek wit met zijkant (kunststof)",
      layer_id: 8,
      choice_id: 21,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Overstek-antraciet-1800x1350.png",
      layer: "Overstek",
      choice: "overstek antraciet, geen zijkant (kunststof)",
      layer_id: 8,
      choice_id: 22,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Overstek-antraciet-met-zijkant-1800x1350.png",
      layer: "Overstek",
      choice: "overstek antraciet met zijkant (kunststof)",
      layer_id: 8,
      choice_id: 23,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Overstek-wit-nieuw-1800x1350.png",
      layer: "Overstek",
      choice: "overstek wit gegrond, geen zijkant",
      layer_id: 8,
      choice_id: 25,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Overstek-wit-met-zijkant-nieuw-1800x1350.png",
      layer: "Overstek",
      choice: "overstek wit gegrond met zijkant",
      layer_id: 8,
      choice_id: 26,
    },
    // Groen dak - must be rendered BEFORE Daklicht so Daklicht appears on top
    // Different variants based on Overstek selection
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Groen-dak-1800x1350.png",
      layer: "Groen dak (hidden)",
      choice: "Groen dak",
      layer_id: 20,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      layer: "Groen dak (hidden)",
      choice: "Groen dak voorkant",
      layer_id: 20,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Groen-dak-voor-en-zijkant-1800x1350.png",
      layer: "Groen dak (hidden)",
      choice: "Groen dak voor- en zijkant",
      layer_id: 20,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Groen-dak-voorkant-kunststof-wit-1800x1350.png",
      layer: "Groen dak (hidden)",
      choice: "Groen dak voorkant kunststof wit",
      layer_id: 20,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Groen-dak-voor-en-zijkant-kunststof-wit-1800x1350.png",
      layer: "Groen dak (hidden)",
      choice: "Groen dak voor- en zijkant kunststof wit",
      layer_id: 20,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Groen-dak-voorkant-kunststof-antraciet-1800x1350.png",
      layer: "Groen dak (hidden)",
      choice: "Groen dak voorkant kunststof antraciet",
      layer_id: 20,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Groen-dak-voor-en-zijkant-kunststof-antraciet-1800x1350.png",
      layer: "Groen dak (hidden)",
      choice: "Groen dak voor- en zijkant kunststof antraciet",
      layer_id: 20,
      choice_id: 7,
    },
    // Daklicht - rendered after Groen dak to appear on top
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/1-vaks-lessenaar-1800x1350.png",
      layer: "Daklicht",
      choice: "1 vaks lessenaar",
      layer_id: 4,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-vaks-lessenaar-1800x1350.png",
      layer: "Daklicht",
      choice: "2 vaks lessenaar",
      layer_id: 4,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/3-vaks-lessenaar-1800x1350.png",
      layer: "Daklicht",
      choice: "3 vaks lessenaar",
      layer_id: 4,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-vaks-lessenaar-1800x1350.png",
      layer: "Daklicht",
      choice: "4 vaks lessenaar",
      layer_id: 4,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/5-vaks-lessenaar-1800x1350.png",
      layer: "Daklicht",
      choice: "5 vaks lessenaar",
      layer_id: 4,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/2-vaks-zadeldak-1800x1350.png",
      layer: "Daklicht",
      choice: "2 vaks zadeldak",
      layer_id: 4,
      choice_id: 11,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/4-vaks-zadeldak-1800x1350.png",
      layer: "Daklicht",
      choice: "4 vaks zadeldak",
      layer_id: 4,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/6-vaks-zadeldak-1800x1350.png",
      layer: "Daklicht",
      choice: "6 vaks zadeldak",
      layer_id: 4,
      choice_id: 8,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/8-vaks-zadeldak-1800x1350.png",
      layer: "Daklicht",
      choice: "8 vaks zadeldak",
      layer_id: 4,
      choice_id: 9,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/10-vaks-zadeldak-1800x1350.png",
      layer: "Daklicht",
      choice: "10 vaks zadeldak",
      layer_id: 4,
      choice_id: 10,
    },
    // Daklicht zonwering - overlay images when zonwering = ja
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/1-vaks-lessenaar-zonwering-1800x1350.png",
      layer: "Daklicht zonwering (hidden)",
      choice: "1 vaks lessenaar zonwering",
      layer_id: 5,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/2-vaks-lessenaar-zonwering-1800x1350.png",
      layer: "Daklicht zonwering (hidden)",
      choice: "2 vaks lessenaar zonwering",
      layer_id: 5,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/3-vaks-lessenaar-zonwering-1800x1350.png",
      layer: "Daklicht zonwering (hidden)",
      choice: "3 vaks lessenaar zonwering",
      layer_id: 5,
      choice_id: 3,
    },
    // Linker zijwand kozijn overlay - shows door frame when wall texture is selected
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/linker-zijwand-openslaande-deuren-kozijn-nieuw-1800x1350.png",
      layer: "Linker zijwand kozijn (hidden)",
      choice: "linker zijwand kozijn",
      layer_id: 3,
      choice_id: 100,
    },
    // Daktrim Aluminium (hidden) - layer_id 65 - different images for overstek variations
    {
      cls: "simple active",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/aluminium-daktrim-overstek-met-zijkant-1800x1350.png",
      layer: "Daktrim aluminium (hidden)",
      choice: "daktrim aluminium geen overstek",
      layer_id: 65,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/aluminium-daktrim-geen-overstek-1800x1350.png",
      layer: "Daktrim aluminium (hidden)",
      choice: "daktrim aluminium overstek geen zijkant",
      layer_id: 65,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/aliminium-daktrim-overstek-geen-zijkant-1800x1350.png",
      layer: "Daktrim aluminium (hidden)",
      choice: "daktrim aluminium overstek met zijkant",
      layer_id: 65,
      choice_id: 3,
    },
    // Daktrim Aluminium Zwart (hidden) - layer_id 66 - different images for overstek variations
    {
      cls: "simple",
      src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      layer: "Daktrim aluminium zwart (hidden)",
      choice: "daktrim aluminium zwart geen overstek",
      layer_id: 66,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/daktrim-aluminium-zwart-overstek-geen-zijkant-1800x1350.png",
      layer: "Daktrim aluminium zwart (hidden)",
      choice: "daktrim aluminium zwart overstek geen zijkant",
      layer_id: 66,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/daktrim-aluminium-zwart-overstek-met-zijkant-1800x1350.png",
      layer: "Daktrim aluminium zwart (hidden)",
      choice: "daktrim aluminium zwart overstek met zijkant",
      layer_id: 66,
      choice_id: 4,
    },
    // Daktrim Zinken kraal (hidden) - layer_id 16 - different images for overstek/kozijn
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Zinken-kraal-nieuw-1800x1350.png",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal",
      layer_id: 16,
      choice_id: 8,
    },
    {
      cls: "simple",
      src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal voorkant",
      layer_id: 16,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Zinken-kraal-voor-en-zijkant-nieuw-1800x1350.png",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal voor- en zijkant",
      layer_id: 16,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Zinken-kraal-voorkant-nieuw-1800x1350.png",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal voorkant kunststof wit",
      layer_id: 16,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Zinken-kraal-voor-en-zijkant-nieuw-1800x1350.png",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal voor- en zijkant kunststof wit",
      layer_id: 16,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Zinken-kraal-voorkant-nieuw-1800x1350.png",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal voorkant kunststof antraciet",
      layer_id: 16,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Zinken-kraal-voor-en-zijkant-nieuw-1800x1350.png",
      layer: "Daktrim (hidden)",
      choice: "Zinken kraal voor- en zijkant kunststof antraciet",
      layer_id: 16,
      choice_id: 6,
    },
    // Buitenlicht
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/buitenlicht-links-1800x1350.png",
      layer: "Buitenlicht",
      choice: "buitenlicht links",
      layer_id: 11,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/buitenlicht-rechts-1800x1350.png",
      layer: "Buitenlicht",
      choice: "buitenlicht rechts",
      layer_id: 11,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/buitenlicht-links-rechts-1800x1350.png",
      layer: "Buitenlicht",
      choice: "buitenlicht links en rechts",
      layer_id: 11,
      choice_id: 4,
    },
    // Buitenstopcontact
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Buitenstopcontact-enkel-links-1800x1350.png",
      layer: "Buitenstopcontact",
      choice: "enkel links",
      layer_id: 13,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Buitenstopcontact-enkel-rechts-1800x1350.png",
      layer: "Buitenstopcontact",
      choice: "enkel rechts",
      layer_id: 13,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Buitenstopcontact-enkel-links-rechts-1800x1350.png",
      layer: "Buitenstopcontact",
      choice: "enkel links & rechts",
      layer_id: 13,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Buitenstopcontact-dubbel-links-1800x1350.png",
      layer: "Buitenstopcontact",
      choice: "dubbel links",
      layer_id: 13,
      choice_id: 5,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Buitenstopcontact-dubbel-rechts-1800x1350.png",
      layer: "Buitenstopcontact",
      choice: "dubbel rechts",
      layer_id: 13,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/Buitenstopcontact-dubbel-links-rechts-1800x1350.png",
      layer: "Buitenstopcontact",
      choice: "dubbel links & rechts",
      layer_id: 13,
      choice_id: 7,
    },
    // Buitenkraan
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/buitenkraan-links-1800x1350.png",
      layer: "Buitenkraan",
      choice: "buitenkraan links",
      layer_id: 14,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/buitenkraan-rechts-1800x1350.png",
      layer: "Buitenkraan",
      choice: "buitenkraan rechts",
      layer_id: 14,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/buitenkraan-links-rechts-1800x1350.png",
      layer: "Buitenkraan",
      choice: "buitenkraan links & rechts",
      layer_id: 14,
      choice_id: 4,
    },
    // Interior elements - Stucwerk / Geen stucwerk
    {
      cls: "simple",
      src: "",
      layer: "Geen stucwerk (hidden)",
      choice: "geen stucwerk plafond",
      layer_id: 35,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/geen-stucwerk-linker-muur-plafond-1800x1350.png",
      layer: "Geen stucwerk (hidden)",
      choice: "geen stucwerk linker muur plafond",
      layer_id: 35,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/geen-stucwerk-rechter-muur-plafond-1800x1350.png",
      layer: "Geen stucwerk (hidden)",
      choice: "geen stucwerk rechter muur plafond",
      layer_id: 35,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/geen-stucwerk-1800x1350.png",
      layer: "Geen stucwerk (hidden)",
      choice: "geen stucwerk",
      layer_id: 35,
      choice_id: 4,
    },
    {
      cls: "simple",
      src: "",
      layer: "Stucwerk (hidden)",
      choice: "stucwerk plafond",
      layer_id: 36,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stucwerk-linker-muur-plafond-1800x1350.png",
      layer: "Stucwerk (hidden)",
      choice: "stucwerk linker muur plafond",
      layer_id: 36,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stucwerk-rechter-muur-plafond-1800x1350.png",
      layer: "Stucwerk (hidden)",
      choice: "stucwerk rechter muur plafond",
      layer_id: 36,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stucwerk-1800x1350.png",
      layer: "Stucwerk (hidden)",
      choice: "stucwerk",
      layer_id: 36,
      choice_id: 4,
    },
    // Interior elements - Schilderwerk
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/schilderwerk-linker-muur-1800x1350.png",
      layer: "Schilderwerk (hidden)",
      choice: "schilderwerk linker muur",
      layer_id: 38,
      choice_id: 6,
    },
    {
      cls: "simple",
      src: "",
      layer: "Schilderwerk (hidden)",
      choice: "schilderwerk rechter muur",
      layer_id: 38,
      choice_id: 7,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/schilderwerk-1800x1350.png",
      layer: "Schilderwerk (hidden)",
      choice: "schilderwerk linker rechter muur",
      layer_id: 38,
      choice_id: 8,
    },
    // Interior elements - Radiator
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/radiator-links-1800x1350.png",
      layer: "Radiator(en)",
      choice: "radiator links",
      layer_id: 23,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/radiator-rechts-1800x1350.png",
      layer: "Radiator(en)",
      choice: "radiator rechts",
      layer_id: 23,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/radiator-links-rechts-1800x1350.png",
      layer: "Radiator(en)",
      choice: "radiator links & rechts",
      layer_id: 23,
      choice_id: 4,
    },
    // Verlichting lichtpunt (multiple)
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-links-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt",
      choice: "lichtpunt links",
      layer_id: 25,
      choice_id: 3,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-midden-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt",
      choice: "lichtpunt midden",
      layer_id: 25,
      choice_id: 4,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-rechts-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt",
      choice: "lichtpunt rechts",
      layer_id: 25,
      choice_id: 5,
    },
    // Spotjes (multiple)
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-1-rij-1-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 1",
      layer_id: 27,
      choice_id: 3,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-2-rij-1-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 2",
      layer_id: 27,
      choice_id: 4,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-3-rij-1-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 3",
      layer_id: 27,
      choice_id: 5,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-4-rij-1-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 4",
      layer_id: 27,
      choice_id: 6,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-5-rij-1-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 5",
      layer_id: 27,
      choice_id: 7,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-1-rij-2-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 6",
      layer_id: 27,
      choice_id: 9,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-2-rij-2-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 7",
      layer_id: 27,
      choice_id: 10,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-3-rij-2-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 8",
      layer_id: 27,
      choice_id: 11,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-4-rij-2-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 9",
      layer_id: 27,
      choice_id: 12,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-5-rij-2-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 10",
      layer_id: 27,
      choice_id: 13,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-1-rij-3-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 11",
      layer_id: 27,
      choice_id: 15,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-2-rij-3-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 12",
      layer_id: 27,
      choice_id: 16,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-3-rij-3-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 13",
      layer_id: 27,
      choice_id: 17,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-4-rij-3-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 14",
      layer_id: 27,
      choice_id: 18,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-spot-5-rij-3-nieuw-1800x1350.png",
      layer: "Spotjes",
      choice: "spot 15",
      layer_id: 27,
      choice_id: 19,
    },
    // Wandlampen (multiple)
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/wandlampen-links-L1-1800x1350.png",
      layer: "Wandlampen",
      choice: "L1 (lamp & armatuur niet inbegrepen)",
      layer_id: 29,
      choice_id: 3,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/wandlampen-links-L2-1800x1350.png",
      layer: "Wandlampen",
      choice: "L2 (lamp & armatuur niet inbegrepen)",
      layer_id: 29,
      choice_id: 4,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/wandlampen-links-L3-1800x1350.png",
      layer: "Wandlampen",
      choice: "L3 (lamp & armatuur niet inbegrepen)",
      layer_id: 29,
      choice_id: 5,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/wandlampen-rechts-R1-1800x1350.png",
      layer: "Wandlampen",
      choice: "R1 (lamp & armatuur niet inbegrepen)",
      layer_id: 29,
      choice_id: 7,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/wandlampen-rechts-R2-1800x1350.png",
      layer: "Wandlampen",
      choice: "R2 (lamp & armatuur niet inbegrepen)",
      layer_id: 29,
      choice_id: 8,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/wandlampen-rechts-R3-1800x1350.png",
      layer: "Wandlampen",
      choice: "R3 (lamp & armatuur niet inbegrepen)",
      layer_id: 29,
      choice_id: 9,
    },
    // Stopcontacten muur (multiple)
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stopcontacten-links-L1-1800x1350.png",
      layer: "Stopcontacten muur (hidden)",
      choice: "L1",
      layer_id: 64,
      choice_id: 3,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stopcontacten-links-L2-1800x1350.png",
      layer: "Stopcontacten muur (hidden)",
      choice: "L2",
      layer_id: 64,
      choice_id: 4,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stopcontacten-links-L3-1800x1350.png",
      layer: "Stopcontacten muur (hidden)",
      choice: "L3",
      layer_id: 64,
      choice_id: 5,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stopcontacten-rechts-R1-1800x1350.png",
      layer: "Stopcontacten muur (hidden)",
      choice: "R1",
      layer_id: 64,
      choice_id: 7,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stopcontacten-rechts-R2-1800x1350.png",
      layer: "Stopcontacten muur (hidden)",
      choice: "R2",
      layer_id: 64,
      choice_id: 8,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/05/stopcontacten-rechts-R3-1800x1350.png",
      layer: "Stopcontacten muur (hidden)",
      choice: "R3",
      layer_id: 64,
      choice_id: 9,
    },
    // Stopcontacten vloer (multiple)
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Stopcontact-vloer-L1-1800x1350.png",
      layer: "Stopcontacten vloer (hidden)",
      choice: "L1 glas",
      layer_id: 63,
      choice_id: 1,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Stopcontact-vloer-L2-1800x1350.png",
      layer: "Stopcontacten vloer (hidden)",
      choice: "L2 glas",
      layer_id: 63,
      choice_id: 2,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Stopcontact-vloer-L3-1800x1350.png",
      layer: "Stopcontacten vloer (hidden)",
      choice: "L3 glas",
      layer_id: 63,
      choice_id: 3,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Stopcontact-vloer-R1-1800x1350.png",
      layer: "Stopcontacten vloer (hidden)",
      choice: "R1 glas",
      layer_id: 63,
      choice_id: 4,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Stopcontact-vloer-R2-1800x1350.png",
      layer: "Stopcontacten vloer (hidden)",
      choice: "R2 glas",
      layer_id: 63,
      choice_id: 5,
    },
    {
      cls: "multiple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Stopcontact-vloer-R3-1800x1350.png",
      layer: "Stopcontacten vloer (hidden)",
      choice: "R3 glas",
      layer_id: 63,
      choice_id: 6,
    },
    // Verlichting lichtpunt type
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-type-geschakeld-links-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt type",
      choice: "geschakeld links",
      layer_id: 26,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-type-geschakeld-rechts-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt type",
      choice: "geschakeld rechts",
      layer_id: 26,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-type-gedimd-links-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt type",
      choice: "gedimd links",
      layer_id: 26,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Verlichting-lichtpunt-type-gedimd-rechts-nieuw-1800x1350.png",
      layer: "Verlichting lichtpunt type",
      choice: "gedimd rechts",
      layer_id: 26,
      choice_id: 4,
    },
    // Spotjes type
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-type-geschakeld-links-nieuw-1800x1350.png",
      layer: "Spotjes type",
      choice: "geschakeld links",
      layer_id: 28,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-type-geschakeld-rechts-nieuw-1800x1350.png",
      layer: "Spotjes type",
      choice: "geschakeld rechts",
      layer_id: 28,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-type-gedimd-links-nieuw-1800x1350.png",
      layer: "Spotjes type",
      choice: "gedimd links",
      layer_id: 28,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Spotjes-type-gedimd-rechts-nieuw-1800x1350.png",
      layer: "Spotjes type",
      choice: "gedimd rechts",
      layer_id: 28,
      choice_id: 4,
    },
    // Wandlampen type
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Wandlampen-type-geschakeld-links-nieuw-1800x1350.png",
      layer: "Wandlampen type",
      choice: "geschakeld links",
      layer_id: 30,
      choice_id: 1,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Wandlampen-type-geschakeld-rechts-nieuw-1800x1350.png",
      layer: "Wandlampen type",
      choice: "geschakeld rechts",
      layer_id: 30,
      choice_id: 2,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Wandlampen-type-gedimd-links-nieuw-1800x1350.png",
      layer: "Wandlampen type",
      choice: "gedimd links",
      layer_id: 30,
      choice_id: 3,
    },
    {
      cls: "simple",
      src: "https://deprefabriek.nl/wp-content/uploads/2025/10/Wandlampen-type-gedimd-rechts-nieuw-1800x1350.png",
      layer: "Wandlampen type",
      choice: "gedimd rechts",
      layer_id: 30,
      choice_id: 4,
    },
  ];

  // Placeholder for empty images
  const EMPTY_IMG =
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

  /**
   * Generate image layer elements dynamically
   */
  function generateImageLayers() {
    const mklLayers = document.querySelector(".mkl_pc_layers");
    if (!mklLayers) {
      console.error("ERROR: .mkl_pc_layers container not found!");
      return;
    }

    console.log("Found .mkl_pc_layers container, generating images...");

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    IMAGE_LAYERS_DATA.forEach((data) => {
      const img = document.createElement("img");
      img.className = data.cls;
      img.src = data.src || EMPTY_IMG;
      img.setAttribute("aria-hidden", "true");
      img.setAttribute("data-layer", data.layer);
      img.setAttribute("data-choice", data.choice);
      img.setAttribute("data-layer_id", data.layer_id);
      img.setAttribute("data-choice_id", data.choice_id);
      fragment.appendChild(img);
    });

    // Insert before the loading element
    const loadingEl = mklLayers.querySelector(".images-loading");
    if (loadingEl) {
      mklLayers.insertBefore(fragment, loadingEl);
    } else {
      mklLayers.appendChild(fragment);
    }

    console.log("Generated", IMAGE_LAYERS_DATA.length, "image layers");

    // Verify images were added
    const addedImages = mklLayers.querySelectorAll("img");
    console.log("Total images in .mkl_pc_layers:", addedImages.length);
    const activeImages = mklLayers.querySelectorAll("img.active");
    console.log("Active images:", activeImages.length);
  }

  /**
   * Generate the Wandlampen component dynamically to save template space
   */
  function generateWandlampenComponent() {
    const container = document.getElementById("component-wandlampen-container");
    if (!container) return;

    const wandlampenPositions = [
      {
        id: "l1",
        value: "L1 (lamp & armatuur niet inbegrepen)",
        icon: "wall-lamp-position-1-icon",
        group: "links",
        index: 1,
      },
      {
        id: "l2",
        value: "L2 (lamp & armatuur niet inbegrepen)",
        icon: "wall-lamp-position-2-icon",
        group: "links",
        index: 2,
      },
      {
        id: "l3",
        value: "L3 (lamp & armatuur niet inbegrepen)",
        icon: "wall-lamp-position-3-icon",
        group: "links",
        index: 3,
      },
      {
        id: "r1",
        value: "R1 (lamp & armatuur niet inbegrepen)",
        icon: "wall-lamp-position-4-icon",
        group: "rechts",
        index: 4,
      },
      {
        id: "r2",
        value: "R2 (lamp & armatuur niet inbegrepen)",
        icon: "wall-lamp-position-5-icon",
        group: "rechts",
        index: 5,
      },
      {
        id: "r3",
        value: "R3 (lamp & armatuur niet inbegrepen)",
        icon: "wall-lamp-position-6-icon",
        group: "rechts",
        index: 6,
      },
    ];

    const wandlampenTypeOptions = [
      {
        id: "geschakeld-links",
        value: "geschakeld links",
        icon: "left-standard-light-switch-icon",
        price: 0,
        index: 1,
        default: true,
      },
      {
        id: "geschakeld-rechts",
        value: "geschakeld rechts",
        icon: "right-standard-light-switch-icon",
        price: 0,
        index: 2,
      },
      {
        id: "gedimd-links",
        value: "gedimd links",
        icon: "left-dimmer-light-switch-icon",
        price: 70,
        index: 3,
      },
      {
        id: "gedimd-rechts",
        value: "gedimd rechts",
        icon: "right-dimmer-light-switch-icon",
        price: 70,
        index: 4,
      },
    ];

    const iconBase = "https://deprefabriek.nl/wp-content/uploads/2025/05/";

    // Create Wandlampen component
    let wandlampenHtml = `
      <div id="component-wandlampen" class="vpc-component interior-element" data-component_id="component-wandlampen" style="display: none;">
        <div class="vpc-component-header">
          <div class="vpc-component-title">
            <span class="vpc-component-name">Wandlampen</span>
            <span class="vpc-selected vpc-selected-option">geen</span>
          </div>
          <div class="vpc-component-arrow"></div>
        </div>
        <div class="vpc-options" style="display: none">
          <div class="vpc-group">
            <div class="vpc-group-name">Wandlampen links</div>`;

    // Add left positions
    wandlampenPositions
      .filter((p) => p.group === "links")
      .forEach((pos) => {
        wandlampenHtml += `
            <div class="vpc-single-option-wrap" data-oid="option-wandlamp-${pos.id}">
              <input id="option-wandlamp-${pos.id}"
                     type="checkbox"
                     name="Wandlampen[]"
                     value="${pos.value}"
                     data-component-id="component-wandlampen"
                     data-class="interior-element"
                     data-img=""
                     data-icon="${iconBase}${pos.icon}-150x150.png"
                     data-price="209"
                     data-oid="option-wandlamp-${pos.id}"
                     data-index="${pos.index}">
              <label id="cboption-wandlamp-${pos.id}"
                     for="option-wandlamp-${pos.id}"
                     data-oriontip="${pos.value} +€209"
                     class="custom"
                     style="background-image: url('${iconBase}${pos.icon}-150x150.png')"></label>
            </div>`;
      });

    wandlampenHtml += `
          </div>
          <div class="vpc-group">
            <div class="vpc-group-name">Wandlampen rechts</div>`;

    // Add right positions
    wandlampenPositions
      .filter((p) => p.group === "rechts")
      .forEach((pos) => {
        wandlampenHtml += `
            <div class="vpc-single-option-wrap" data-oid="option-wandlamp-${pos.id}">
              <input id="option-wandlamp-${pos.id}"
                     type="checkbox"
                     name="Wandlampen[]"
                     value="${pos.value}"
                     data-component-id="component-wandlampen"
                     data-class="interior-element"
                     data-img=""
                     data-icon="${iconBase}${pos.icon}-150x150.png"
                     data-price="209"
                     data-oid="option-wandlamp-${pos.id}"
                     data-index="${pos.index}">
              <label id="cboption-wandlamp-${pos.id}"
                     for="option-wandlamp-${pos.id}"
                     data-oriontip="${pos.value} +€209"
                     class="custom"
                     style="background-image: url('${iconBase}${pos.icon}-150x150.png')"></label>
            </div>`;
      });

    wandlampenHtml += `
          </div>
        </div>
      </div>`;

    // Create Wandlampen type component
    wandlampenHtml += `
      <div id="component-wandlampen-type" class="vpc-component interior-element hidden conditional-wandlampen" data-component_id="component-wandlampen-type" data-condition="wandlampen:any" style="display: none;">
        <div class="vpc-component-header">
          <div class="vpc-component-title">
            <span class="vpc-component-name">Wandlampen type</span>
            <span class="vpc-selected vpc-selected-option option-selected">geschakeld links</span>
          </div>
          <div class="vpc-component-arrow"></div>
        </div>
        <div class="vpc-options" style="display: none">
          <div class="vpc-group">`;

    wandlampenTypeOptions.forEach((opt) => {
      const priceText = opt.price > 0 ? ` +€${opt.price}` : "";
      wandlampenHtml += `
            <div class="vpc-single-option-wrap" data-oid="option-wandlamp-type-${opt.id}">
              <input id="option-wandlamp-type-${opt.id}"
                     type="radio"
                     name="WandlampenType"
                     value="${opt.value}"
                     data-component-id="component-wandlampen-type"
                     data-class="interior-element"
                     data-img=""
                     data-icon="${iconBase}${opt.icon}-150x150.png"
                     data-price="${opt.price}"
                     data-oid="option-wandlamp-type-${opt.id}"
                     data-index="${opt.index}"
                     ${opt.default ? 'checked data-default="1"' : ""}
                     required>
              <label id="cboption-wandlamp-type-${opt.id}"
                     for="option-wandlamp-type-${opt.id}"
                     data-oriontip="${opt.value}${priceText}"
                     class="custom"
                     style="background-image: url('${iconBase}${opt.icon}-150x150.png')"></label>
            </div>`;
    });

    wandlampenHtml += `
          </div>
        </div>
      </div>`;

    container.innerHTML = wandlampenHtml;
    console.log("Generated Wandlampen components dynamically");
  }

  // ================================
  // Initialization
  // ================================
  function init() {
    generateImageLayers(); // Generate image layers first
    generateWandlampenComponent(); // Generate Wandlampen components dynamically
    cacheElements();
    preloadAllImages();
    bindEvents();
    initializeSizeCalculator();
    initializeDefaultSelections();
    switchView("exterior"); // Set default view to exterior
    updatePreview();
    updateWhiteRenderVisibility(); // Check white kozijn on init
    hideAllLinkerzijdeKozijnOverlays(); // Ensure kozijn overlays are hidden when Linkerzijde is glas (default)
    initializeDaktrimAndGroenDak(); // Sync Daktrim and Groen dak with default Overstek
    updateFloatingBannerButtons();
    console.log("Woonserre Configurator initialized");
  }

  /**
   * Initialize Daktrim and Groen dak based on default Overstek selection
   */
  function initializeDaktrimAndGroenDak() {
    const overstekInput = document.querySelector(
      'input[name="Overstek"]:checked',
    );
    if (overstekInput) {
      updateDaktrimImage(); // Use updateDaktrimImage instead of updateDaktrimForOverstek
      updateGroenDakForOverstek(overstekInput.value);
    }
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
    "VerlichtingLichtpunt[]",
    "Spotjes",
    "Spotjes[]",
    "Stopcontacten",
    "Stopcontacten[]",
    "Wandlampen",
    "Wandlampen[]",
  ];

  /**
   * Check if input name matches a checkbox component (handles both with and without [])
   */
  function isCheckboxComponent(inputName) {
    const baseName = inputName.replace("[]", "");
    return (
      CHECKBOX_COMPONENTS.includes(inputName) ||
      CHECKBOX_COMPONENTS.includes(baseName)
    );
  }

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
    if (input.type === "checkbox" && isCheckboxComponent(input.name)) {
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
      if (input.type === "checkbox" && isCheckboxComponent(input.name)) {
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
    if (!(input.type === "checkbox" && isCheckboxComponent(input.name))) {
      updatePreviewImage(componentId, optionId, imgUrl, optionClass, index);
    }

    // Handle conditional options
    handleConditionalOptions(input);

    // Update white render visibility based on kozijn selection
    updateWhiteRenderVisibility();
  }

  // ================================
  // White Render Layer Control
  // ================================
  function updateWhiteRenderVisibility() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Check if a white kozijn option is selected
    const kozijnInput = document.querySelector('input[name="Kozijn"]:checked');
    if (!kozijnInput) {
      const whiteRenderImg = mklLayers.querySelector(
        'img[data-layer="Main render white (hidden)"]',
      );
      if (whiteRenderImg) {
        whiteRenderImg.classList.remove("active");
      }
      return;
    }

    const value = kozijnInput.value.toLowerCase();
    // Show white render for white kozijn options
    const isWhiteKozijn =
      value.includes("wit") &&
      !value.includes("antraciet") &&
      !value.includes("zwart");

    const whiteRenderImg = mklLayers.querySelector(
      'img[data-layer="Main render white (hidden)"]',
    );
    if (whiteRenderImg) {
      if (isWhiteKozijn) {
        whiteRenderImg.classList.add("active");
      } else {
        whiteRenderImg.classList.remove("active");
      }
    }
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

  /**
   * Convert Spotjes input value (e.g., "spot 1 rij 2") to layer data-choice (e.g., "spot 6")
   * Row 1: spot 1-5 → data-choice spot 1-5
   * Row 2: spot 1-5 rij 2 → data-choice spot 6-10
   * Row 3: spot 1-5 rij 3 → data-choice spot 11-15
   */
  function convertSpotjesToDataChoice(value) {
    const valueLower = value.toLowerCase().trim();

    // Parse "spot X rij Y" format
    const match = valueLower.match(/spot\s*(\d+)\s*(?:rij\s*(\d+))?/);
    if (!match) return null;

    const spotNum = parseInt(match[1], 10);
    const rowNum = match[2] ? parseInt(match[2], 10) : 1;

    // Calculate the actual spot number based on row
    // Each row has 5 spots, so row 2 adds 5, row 3 adds 10
    const actualSpot = spotNum + (rowNum - 1) * 5;

    return `spot ${actualSpot}`;
  }

  function updateCheckboxComponentPreview(component, inputName) {
    if (!component) return;

    // Use mkl_pc_layers system for interior checkbox components
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    const componentId = component.dataset.component_id;

    // Get the layer name for this component
    const inputNameLower = inputName.replace("[]", "").toLowerCase();
    const layerName =
      LAYER_MAP[inputNameLower] || LAYER_MAP[inputName.toLowerCase()];

    if (!layerName) {
      console.log("No layer mapping for checkbox component:", inputName);
      return;
    }

    // Get all images for this layer
    const layerImages = mklLayers.querySelectorAll(
      `img[data-layer="${layerName}"]`,
    );

    // Deactivate all images for this layer first
    layerImages.forEach((img) => {
      img.classList.remove("active");
    });

    // Get all checked inputs (excluding "geen" options)
    const checkedInputs = component.querySelectorAll(
      `input[name="${inputName}"]:checked`,
    );

    checkedInputs.forEach((input) => {
      const value = input.value;

      // Skip "geen" options
      if (value.toLowerCase().includes("geen")) {
        return;
      }

      let matchingImage = null;

      // Special handling for Spotjes - convert "spot X rij Y" to "spot N"
      if (layerName === "Spotjes") {
        const dataChoice = convertSpotjesToDataChoice(value);
        if (dataChoice) {
          matchingImage = mklLayers.querySelector(
            `img[data-layer="${layerName}"][data-choice="${dataChoice}"]`,
          );
        }
      }

      // If not Spotjes or no match found, try exact match
      if (!matchingImage) {
        matchingImage = mklLayers.querySelector(
          `img[data-layer="${layerName}"][data-choice="${value}"]`,
        );
      }

      // Try partial match if exact match failed
      if (!matchingImage) {
        const layerImagesArray = Array.from(layerImages);
        matchingImage = layerImagesArray.find((img) => {
          const choice = img.getAttribute("data-choice") || "";
          return (
            choice.toLowerCase() === value.toLowerCase() ||
            choice.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(choice.toLowerCase())
          );
        });
      }

      if (matchingImage) {
        matchingImage.classList.add("active");
        console.log(
          "Activated multiple layer:",
          layerName,
          "choice:",
          matchingImage.getAttribute("data-choice"),
        );
      } else {
        console.log("No matching image found for:", layerName, "value:", value);
      }
    });
  }

  function handleConditionalOptions(selectedInput) {
    // Handle Rechterzijde - show/hide glazen zijwandtype based on selection
    if (selectedInput.name === "Rechterzijde") {
      updateRechterGlazenTypeVisibility(selectedInput.value);
    }

    // Handle Linkerzijde - show/hide glazen zijwandtype based on selection
    if (selectedInput.name === "Linkerzijde") {
      updateLinkerGlazenTypeVisibility(selectedInput.value);
      updateLinkerZijwandKozijnVisibility(selectedInput.value);
    }

    // Handle Daklicht - show/hide Daklicht zonwering based on selection
    if (selectedInput.name === "Daklicht") {
      updateDaklichtZonweringVisibility(selectedInput.value);
    }

    // Handle DaklichtZonwering - show/hide zonwering images
    if (selectedInput.name === "DaklichtZonwering") {
      updateZonweringImage(selectedInput.value);
    }

    // Handle Buitenlicht - show/hide Buitenlicht type based on selection
    if (selectedInput.name === "Buitenlicht") {
      updateBuitenlichtTypeVisibility(selectedInput.value);
    }

    // Handle Overstek - show/hide Spots in overstek based on selection
    if (selectedInput.name === "Overstek") {
      updateSpotsOverstekVisibility(selectedInput.value);
      updateDaktrimImage(); // Update daktrim based on overstek
    }

    // Handle Daktrim - update daktrim image based on overstek
    if (selectedInput.name === "Daktrim") {
      updateDaktrimImage();
    }

    // Handle SpotsOverstek - show/hide Spots in overstek type based on selection
    if (selectedInput.name === "SpotsOverstek") {
      updateSpotsOverstekTypeVisibility(selectedInput.value);
    }

    // Handle Verlichting lichtpunt type visibility
    if (selectedInput.name === "VerlichtingLichtpunt") {
      updateLichtpuntTypeVisibility();
    }

    // Handle Spotjes type visibility
    if (
      selectedInput.name === "Spotjes" ||
      selectedInput.name === "Spotjes[]"
    ) {
      updateSpotjesTypeVisibility();
    }

    // Handle Wandlampen type visibility
    if (
      selectedInput.name === "Wandlampen" ||
      selectedInput.name === "Wandlampen[]"
    ) {
      updateWandlampenTypeVisibility();
    }
  }

  function updateBuitenlichtTypeVisibility(buitenlichtValue) {
    const typeComponent = document.querySelector("#component-buitenlicht-type");
    if (!typeComponent) return;

    // Show type only if buitenlicht is not "geen"
    const hasBuitenlicht =
      buitenlichtValue && buitenlichtValue.toLowerCase() !== "geen";

    if (hasBuitenlicht) {
      typeComponent.classList.remove("hidden");
      typeComponent.style.removeProperty("display");
    } else {
      typeComponent.classList.add("hidden");
      // Reset to default when hiding
      const defaultInput = typeComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        const selectedSpan = typeComponent.querySelector(".vpc-selected");
        if (selectedSpan) {
          selectedSpan.textContent = defaultInput.value;
        }
      }
    }
  }

  function updateDaklichtZonweringVisibility(daklichtValue) {
    const zonweringComponent = document.querySelector(
      "#component-daklicht-zonwering",
    );
    if (!zonweringComponent) return;

    // Show zonwering only for EXACTLY 1, 2, or 3 vaks lessenaar (not 4, 5 vaks or zadeldak)
    const valueLower = daklichtValue ? daklichtValue.toLowerCase() : "";
    const isValidLessenaar =
      valueLower === "1 vaks lessenaar" ||
      valueLower === "2 vaks lessenaar" ||
      valueLower === "3 vaks lessenaar";

    if (isValidLessenaar) {
      zonweringComponent.classList.remove("hidden");
      zonweringComponent.style.removeProperty("display");

      // Update zonwering price based on daklicht selection
      updateZonweringPrice(daklichtValue);
    } else {
      zonweringComponent.classList.add("hidden");
      // Reset to "nee" when hiding
      const defaultInput = zonweringComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        // Update the selected display text
        const selectedSpan = zonweringComponent.querySelector(".vpc-selected");
        if (selectedSpan) {
          selectedSpan.textContent = defaultInput.value;
        }
      }
      // Recalculate prices since zonwering is now hidden
      calculatePrices();
    }
  }

  function updateZonweringPrice(daklichtValue) {
    const zonweringJaInput = document.querySelector(
      'input[name="DaklichtZonwering"][value="ja"]',
    );
    if (!zonweringJaInput) return;

    let price = 0;
    const valueLower = daklichtValue.toLowerCase();

    // Set price based on daklicht type
    // Reference site: 1 vaks = €850, 2 vaks = €1050, 3 vaks = €1250
    if (valueLower.includes("1 vaks lessenaar")) {
      price = 850;
    } else if (valueLower.includes("2 vaks lessenaar")) {
      price = 1050;
    } else if (valueLower.includes("3 vaks lessenaar")) {
      price = 1250;
    }

    // Update the data-price attribute
    zonweringJaInput.dataset.price = price.toString();

    // Update tooltip to show price
    const label = zonweringJaInput.nextElementSibling;
    if (label && price > 0) {
      label.dataset.oriontip = `ja +€${price.toLocaleString("nl-NL")}`;
    }

    // Recalculate total price if zonwering is selected
    if (zonweringJaInput.checked) {
      calculatePrices();
    }
  }

  function updateZonweringImage(zonweringValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Get the currently selected daklicht value
    const daklichtInput = document.querySelector(
      'input[name="Daklicht"]:checked',
    );
    if (!daklichtInput) return;

    const daklichtValue = daklichtInput.value.toLowerCase();

    // Deactivate all zonwering images first
    const zonweringImages = mklLayers.querySelectorAll(
      'img[data-layer="Daklicht zonwering (hidden)"]',
    );
    zonweringImages.forEach((img) => img.classList.remove("active"));

    // If zonwering = "ja", activate the corresponding image
    if (zonweringValue.toLowerCase() === "ja") {
      let choice = "";
      if (daklichtValue === "1 vaks lessenaar") {
        choice = "1 vaks lessenaar zonwering";
      } else if (daklichtValue === "2 vaks lessenaar") {
        choice = "2 vaks lessenaar zonwering";
      } else if (daklichtValue === "3 vaks lessenaar") {
        choice = "3 vaks lessenaar zonwering";
      }

      if (choice) {
        const matchingImage = mklLayers.querySelector(
          `img[data-layer="Daklicht zonwering (hidden)"][data-choice="${choice}"]`,
        );
        if (matchingImage) {
          matchingImage.classList.add("active");
        }
      }
    }
  }

  function updateLinkerZijwandKozijnVisibility(linkerzijdeValue) {
    const valueLower = linkerzijdeValue.toLowerCase();

    // When a wall texture is selected (not "glas"), show the kozijn overlay matching current Kozijn
    // When "glas" is selected, hide all kozijn overlays
    if (valueLower !== "glas") {
      const kozijnInput = document.querySelector(
        'input[name="Kozijn"]:checked',
      );
      if (kozijnInput) {
        updateLinkerzijdeKozijnOverlay(kozijnInput.value);
      }
    } else {
      hideAllLinkerzijdeKozijnOverlays();
    }
  }

  function updateSpotsOverstekVisibility(overstekValue) {
    const spotsComponent = document.querySelector("#component-spots-overstek");
    if (!spotsComponent) return;

    // Show spots only if overstek is not the default "geen overstek" option
    const valueLower = overstekValue ? overstekValue.toLowerCase() : "";
    const hasOverstek = valueLower && !valueLower.startsWith("geen overstek");

    if (hasOverstek) {
      spotsComponent.classList.remove("hidden");
      spotsComponent.style.removeProperty("display");
    } else {
      spotsComponent.classList.add("hidden");
      // Reset to default when hiding
      const defaultInput = spotsComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        const selectedSpan = spotsComponent.querySelector(".vpc-selected");
        if (selectedSpan) {
          selectedSpan.textContent = defaultInput.value;
        }
      }
      // Also hide spots type when hiding spots
      updateSpotsOverstekTypeVisibility("geen spots");
    }
  }

  function updateSpotsOverstekTypeVisibility(spotsValue) {
    const typeComponent = document.querySelector(
      "#component-spots-overstek-type",
    );
    if (!typeComponent) return;

    // Show type only if spots is not "geen spots"
    const hasSpots = spotsValue && !spotsValue.toLowerCase().includes("geen");

    if (hasSpots) {
      typeComponent.classList.remove("hidden");
      typeComponent.style.removeProperty("display");
    } else {
      typeComponent.classList.add("hidden");
      // Reset to default when hiding
      const defaultInput = typeComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        const selectedSpan = typeComponent.querySelector(".vpc-selected");
        if (selectedSpan) {
          selectedSpan.textContent = defaultInput.value;
        }
      }
    }
  }

  // Update Daktrim image based on both Daktrim type and Overstek selection
  function updateDaktrimImage() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) {
      console.log("updateDaktrimImage: mklLayers not found");
      return;
    }

    // Get current Daktrim selection
    const daktrimInput = document.querySelector(
      'input[name="Daktrim"]:checked',
    );
    if (!daktrimInput) {
      console.log("updateDaktrimImage: no daktrim input checked");
      return;
    }
    const daktrimValue = daktrimInput.value.toLowerCase();
    console.log("updateDaktrimImage: daktrimValue =", daktrimValue);

    // Get current Overstek selection
    const overstekInput = document.querySelector(
      'input[name="Overstek"]:checked',
    );
    const overstekValue = overstekInput
      ? overstekInput.value.toLowerCase()
      : "geen overstek, geen zijkant";
    console.log("updateDaktrimImage: overstekValue =", overstekValue);

    // Deactivate ALL daktrim images from all three layers
    const allDaktrimImages = mklLayers.querySelectorAll(
      'img[data-layer="Daktrim (hidden)"], img[data-layer="Daktrim aluminium (hidden)"], img[data-layer="Daktrim aluminium zwart (hidden)"]',
    );
    console.log(
      "updateDaktrimImage: found",
      allDaktrimImages.length,
      "daktrim images to deactivate",
    );
    allDaktrimImages.forEach((img) => img.classList.remove("active"));

    // Determine which layer and choice to use based on daktrim type and overstek
    let layer = "";
    let choice = "";

    // Determine overstek variant
    let overstekVariant = "geen overstek";
    if (overstekValue.includes("met zijkant")) {
      overstekVariant = "overstek met zijkant";
    } else if (
      overstekValue.includes("geen zijkant") &&
      !overstekValue.startsWith("geen overstek")
    ) {
      overstekVariant = "overstek geen zijkant";
    }

    // Set layer and choice based on daktrim type
    if (daktrimValue === "aluminium" || daktrimValue === "aluminium daktrim") {
      layer = "Daktrim aluminium (hidden)";
      if (overstekVariant === "overstek met zijkant") {
        choice = "daktrim aluminium overstek met zijkant";
      } else if (overstekVariant === "overstek geen zijkant") {
        choice = "daktrim aluminium overstek geen zijkant";
      } else {
        choice = "daktrim aluminium geen overstek";
      }
    } else if (
      daktrimValue === "aluminium zwart" ||
      daktrimValue === "aluminium daktrim zwart"
    ) {
      layer = "Daktrim aluminium zwart (hidden)";
      if (overstekVariant === "overstek met zijkant") {
        choice = "daktrim aluminium zwart overstek met zijkant";
      } else if (overstekVariant === "overstek geen zijkant") {
        choice = "daktrim aluminium zwart overstek geen zijkant";
      } else {
        choice = "daktrim aluminium zwart geen overstek";
      }
    } else if (daktrimValue === "zinken kraal") {
      layer = "Daktrim (hidden)";
      // Zinken kraal has different choice names based on overstek
      if (overstekVariant === "overstek met zijkant") {
        // Check if it's kunststof wit or antraciet - for now use the base version
        if (overstekValue.includes("wit")) {
          choice = "Zinken kraal voor- en zijkant kunststof wit";
        } else if (overstekValue.includes("antraciet")) {
          choice = "Zinken kraal voor- en zijkant kunststof antraciet";
        } else {
          choice = "Zinken kraal voor- en zijkant";
        }
      } else if (overstekVariant === "overstek geen zijkant") {
        if (overstekValue.includes("wit")) {
          choice = "Zinken kraal voorkant kunststof wit";
        } else if (overstekValue.includes("antraciet")) {
          choice = "Zinken kraal voorkant kunststof antraciet";
        } else {
          choice = "Zinken kraal voorkant";
        }
      } else {
        choice = "Zinken kraal";
      }
    }

    console.log("updateDaktrimImage: layer =", layer, "choice =", choice);

    // Activate the matching daktrim image
    if (layer && choice) {
      const matchingImage = mklLayers.querySelector(
        `img[data-layer="${layer}"][data-choice="${choice}"]`,
      );
      console.log(
        "updateDaktrimImage: matchingImage =",
        matchingImage ? "found" : "NOT FOUND",
      );
      if (matchingImage) {
        matchingImage.classList.add("active");
        console.log("updateDaktrimImage: activated image");
      }
    }
  }

  function updateRechterGlazenTypeVisibility(rechterzijdeValue) {
    const rechterGlazenComponent = document.querySelector(
      "#component-rechter-glazen-type",
    );
    if (!rechterGlazenComponent) return;

    // Show glazen type only if rechterzijde = "glas" or contains "glazen"
    const isGlazenWand =
      rechterzijdeValue &&
      (rechterzijdeValue.toLowerCase().includes("glazen") ||
        rechterzijdeValue.toLowerCase() === "glas");

    if (isGlazenWand) {
      rechterGlazenComponent.classList.remove("hidden");
      rechterGlazenComponent.style.removeProperty("display");
    } else {
      rechterGlazenComponent.classList.add("hidden");
      // Remove the preview image for this component when hiding
      const container = elements.exteriorImages;
      if (container) {
        container
          .querySelectorAll(
            '.c-image[data-component="component-rechter-glazen-type"]',
          )
          .forEach((el) => el.remove());
      }
      const defaultInput = rechterGlazenComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        // Don't dispatch change event to avoid adding image back
      }
    }
  }

  /**
   * Update Radiator option visibility based on wall configuration
   * Radiator options (left/right/both) should only be visible when walls are selected
   * Reference site uses cshow-hidden class for conditional visibility
   *
   * IMPORTANT: Exterior and Interior are MIRRORED!
   * - Exterior RIGHT wall (Rechterzijde) = Interior LEFT wall
   * - Exterior LEFT wall (Linkerzijde) = Interior RIGHT wall
   *
   * So:
   * - "radiator links" (interior left) requires EXTERIOR RIGHT wall
   * - "radiator rechts" (interior right) requires EXTERIOR LEFT wall
   * - "radiator links & rechts" requires both exterior walls
   */
  function updateRadiatorOptionsVisibility() {
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior wall selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall; // Exterior right = Interior left
    const interiorRightIsWall = exteriorLeftIsWall; // Exterior left = Interior right

    // Get radiator options
    const radiatorLinksOption = document.querySelector(
      '[data-oid="option-radiator-links"]',
    );
    const radiatorRechtsOption = document.querySelector(
      '[data-oid="option-radiator-rechts"]',
    );
    const radiatorBeideOption = document.querySelector(
      '[data-oid="option-radiator-beide"]',
    );

    // Show/hide interior left radiator option based on interior left wall (from exterior right)
    if (radiatorLinksOption) {
      radiatorLinksOption.style.display = interiorLeftIsWall ? "" : "none";
    }

    // Show/hide interior right radiator option based on interior right wall (from exterior left)
    if (radiatorRechtsOption) {
      radiatorRechtsOption.style.display = interiorRightIsWall ? "" : "none";
    }

    // Show both option only if both interior walls exist
    if (radiatorBeideOption) {
      radiatorBeideOption.style.display =
        interiorLeftIsWall && interiorRightIsWall ? "" : "none";
    }

    // If currently selected option becomes hidden, reset to "geen"
    const currentRadiator = document.querySelector(
      'input[name="Radiator"]:checked',
    );
    if (currentRadiator) {
      const currentValue = currentRadiator.value.toLowerCase();
      const shouldReset =
        (currentValue.includes("links") &&
          !currentValue.includes("rechts") &&
          !interiorLeftIsWall) ||
        (currentValue.includes("rechts") &&
          !currentValue.includes("links") &&
          !interiorRightIsWall) ||
        (currentValue.includes("links") &&
          currentValue.includes("rechts") &&
          !(interiorLeftIsWall && interiorRightIsWall));

      if (shouldReset) {
        const geenOption = document.querySelector("#option-radiator-geen");
        if (geenOption) {
          geenOption.checked = true;
          geenOption.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }

    // Also update the Radiator layer in preview to match wall configuration
    syncRadiatorLayer();
  }

  /**
   * Update visibility of Wandlampen checkbox options based on wall configuration
   *
   * IMPORTANT: Exterior and Interior are MIRRORED!
   * - L1-L3 (interior LEFT) require EXTERIOR RIGHT wall (Rechterzijde != glas)
   * - R1-R3 (interior RIGHT) require EXTERIOR LEFT wall (Linkerzijde != glas)
   */
  function updateWandlampenOptionsVisibility() {
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior wall selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall; // Exterior right = Interior left
    const interiorRightIsWall = exteriorLeftIsWall; // Exterior left = Interior right

    // Get the group containers for left and right wandlampen
    const leftGroup = document.querySelector(
      "#component-wandlampen .vpc-group:first-of-type",
    );
    const rightGroup = document.querySelector(
      "#component-wandlampen .vpc-group:last-of-type",
    );

    // Hide/show left wandlampen options (L1, L2, L3)
    const leftOptions = [
      document.querySelector('[data-oid="option-wandlamp-l1"]'),
      document.querySelector('[data-oid="option-wandlamp-l2"]'),
      document.querySelector('[data-oid="option-wandlamp-l3"]'),
    ];
    leftOptions.forEach((opt) => {
      if (opt) {
        opt.style.display = interiorLeftIsWall ? "" : "none";
      }
    });

    // Hide/show right wandlampen options (R1, R2, R3)
    const rightOptions = [
      document.querySelector('[data-oid="option-wandlamp-r1"]'),
      document.querySelector('[data-oid="option-wandlamp-r2"]'),
      document.querySelector('[data-oid="option-wandlamp-r3"]'),
    ];
    rightOptions.forEach((opt) => {
      if (opt) {
        opt.style.display = interiorRightIsWall ? "" : "none";
      }
    });

    // Hide entire left group if no left wall
    if (leftGroup) {
      leftGroup.style.display = interiorLeftIsWall ? "" : "none";
    }
    // Hide entire right group if no right wall
    if (rightGroup) {
      rightGroup.style.display = interiorRightIsWall ? "" : "none";
    }

    // If any selected wandlampen become hidden, uncheck them
    const wandlampenInputs = document.querySelectorAll(
      'input[name="Wandlampen[]"]:checked',
    );
    wandlampenInputs.forEach((input) => {
      const value = input.value.toLowerCase();
      const isLeft =
        value.startsWith("l1") ||
        value.startsWith("l2") ||
        value.startsWith("l3");
      const isRight =
        value.startsWith("r1") ||
        value.startsWith("r2") ||
        value.startsWith("r3");

      if (
        (isLeft && !interiorLeftIsWall) ||
        (isRight && !interiorRightIsWall)
      ) {
        input.checked = false;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Update the wandlampen type visibility
    updateWandlampenTypeVisibility();
  }

  /**
   * Update visibility of Stopcontacten muur checkbox options based on wall configuration
   *
   * IMPORTANT: Exterior and Interior are MIRRORED!
   * - L1-L3 muur (interior LEFT) require EXTERIOR RIGHT wall (Rechterzijde != glas)
   * - R1-R3 muur (interior RIGHT) require EXTERIOR LEFT wall (Linkerzijde != glas)
   */
  function updateStopcontactenOptionsVisibility() {
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior wall selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall;
    const interiorRightIsWall = exteriorLeftIsWall;

    // Get the group containers for left and right stopcontacten
    const leftMuurOptions = [
      document.querySelector('[data-oid="option-stopcontact-muur-l1"]'),
      document.querySelector('[data-oid="option-stopcontact-muur-l2"]'),
      document.querySelector('[data-oid="option-stopcontact-muur-l3"]'),
    ];
    const rightMuurOptions = [
      document.querySelector('[data-oid="option-stopcontact-muur-r1"]'),
      document.querySelector('[data-oid="option-stopcontact-muur-r2"]'),
      document.querySelector('[data-oid="option-stopcontact-muur-r3"]'),
    ];
    const leftVloerOptions = [
      document.querySelector('[data-oid="option-stopcontact-vloer-l1"]'),
      document.querySelector('[data-oid="option-stopcontact-vloer-l2"]'),
      document.querySelector('[data-oid="option-stopcontact-vloer-l3"]'),
    ];
    const rightVloerOptions = [
      document.querySelector('[data-oid="option-stopcontact-vloer-r1"]'),
      document.querySelector('[data-oid="option-stopcontact-vloer-r2"]'),
      document.querySelector('[data-oid="option-stopcontact-vloer-r3"]'),
    ];

    // Muur options: only show when wall exists
    leftMuurOptions.forEach((opt) => {
      if (opt) {
        opt.style.display = interiorLeftIsWall ? "" : "none";
      }
    });
    rightMuurOptions.forEach((opt) => {
      if (opt) {
        opt.style.display = interiorRightIsWall ? "" : "none";
      }
    });

    // Vloer options: only show when there's NO wall (glass)
    leftVloerOptions.forEach((opt) => {
      if (opt) {
        opt.style.display = !interiorLeftIsWall ? "" : "none";
      }
    });
    rightVloerOptions.forEach((opt) => {
      if (opt) {
        opt.style.display = !interiorRightIsWall ? "" : "none";
      }
    });

    // Uncheck any selected muur options that became hidden
    const muurInputs = document.querySelectorAll(
      'input[name="StopcontactenMuur[]"]:checked',
    );
    muurInputs.forEach((input) => {
      const value = input.value.toLowerCase();
      const isLeft = value === "l1" || value === "l2" || value === "l3";
      const isRight = value === "r1" || value === "r2" || value === "r3";

      if (
        (isLeft && !interiorLeftIsWall) ||
        (isRight && !interiorRightIsWall)
      ) {
        input.checked = false;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Uncheck any selected vloer options that became hidden
    const vloerInputs = document.querySelectorAll(
      'input[name="StopcontactenVloer[]"]:checked',
    );
    vloerInputs.forEach((input) => {
      const value = input.value.toLowerCase();
      const isLeft =
        value.includes("l1") || value.includes("l2") || value.includes("l3");
      const isRight =
        value.includes("r1") || value.includes("r2") || value.includes("r3");

      if ((isLeft && interiorLeftIsWall) || (isRight && interiorRightIsWall)) {
        input.checked = false;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  /**
   * Sync Radiator layer in preview based on current selection and wall configuration
   *
   * IMPORTANT: Exterior and Interior are MIRRORED!
   * - "radiator links" (interior left) requires EXTERIOR RIGHT wall
   * - "radiator rechts" (interior right) requires EXTERIOR LEFT wall
   */
  function syncRadiatorLayer() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Get wall configuration
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior wall selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall;
    const interiorRightIsWall = exteriorLeftIsWall;

    // Deactivate all radiator images first
    const radiatorImages = mklLayers.querySelectorAll(
      'img[data-layer="Radiator(en)"]',
    );
    radiatorImages.forEach((img) => img.classList.remove("active"));

    // Get current radiator selection
    const radiatorInput = document.querySelector(
      'input[name="Radiator"]:checked',
    );
    if (!radiatorInput) return;

    const radiatorValue = radiatorInput.value.toLowerCase();

    // Don't show radiator if "geen" selected
    if (radiatorValue.includes("geen")) {
      return;
    }

    // Validate selection against INTERIOR wall configuration (mirrored)
    // "radiator links" = interior left wall = exterior right wall
    // "radiator rechts" = interior right wall = exterior left wall
    const isLinksSelected =
      radiatorValue.includes("links") && !radiatorValue.includes("rechts");
    const isRechtsSelected =
      radiatorValue.includes("rechts") && !radiatorValue.includes("links");
    const isBothSelected =
      radiatorValue.includes("links") && radiatorValue.includes("rechts");

    // Only show if interior walls support it (using mirrored logic)
    if (isLinksSelected && !interiorLeftIsWall) return;
    if (isRechtsSelected && !interiorRightIsWall) return;
    if (isBothSelected && !(interiorLeftIsWall && interiorRightIsWall)) return;

    // Find and activate matching radiator image
    const matchingImg = mklLayers.querySelector(
      `img[data-layer="Radiator(en)"][data-choice="${radiatorInput.value}"]`,
    );

    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Radiator layer:", radiatorInput.value);
    }
  }

  function updateLinkerGlazenTypeVisibility(linkerzijdeValue) {
    const linkerGlazenComponent = document.querySelector(
      "#component-linker-glazen-type",
    );
    if (!linkerGlazenComponent) return;

    // Show glazen type only if linkerzijde = "glas" or contains "glazen"
    const isGlazenWand =
      linkerzijdeValue &&
      (linkerzijdeValue.toLowerCase().includes("glazen") ||
        linkerzijdeValue.toLowerCase() === "glas");

    if (isGlazenWand) {
      linkerGlazenComponent.classList.remove("hidden");
      linkerGlazenComponent.style.removeProperty("display");
    } else {
      linkerGlazenComponent.classList.add("hidden");
      // Remove the preview image for this component when hiding
      const container = elements.exteriorImages;
      if (container) {
        container
          .querySelectorAll(
            '.c-image[data-component="component-linker-glazen-type"]',
          )
          .forEach((el) => el.remove());
      }
      const defaultInput = linkerGlazenComponent.querySelector(
        'input[data-default="1"]',
      );
      if (defaultInput && !defaultInput.checked) {
        defaultInput.checked = true;
        // Don't dispatch change event to avoid adding image back
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
      'input[name="Spotjes[]"]:checked',
    );
    let hasSpotjesSelected = false;

    spotjesInputs.forEach((input) => {
      if (!input.value.toLowerCase().includes("geen")) {
        hasSpotjesSelected = true;
      }
    });

    // Show/hide the spotjes type selector based on selection
    const spotjesTypeComponent = document.getElementById(
      "component-spotjes-type",
    );
    if (spotjesTypeComponent) {
      if (hasSpotjesSelected) {
        spotjesTypeComponent.classList.remove("hidden");
      } else {
        spotjesTypeComponent.classList.add("hidden");
      }
    }
  }

  function updateWandlampenTypeVisibility() {
    const wandlampenInputs = document.querySelectorAll(
      'input[name="Wandlampen[]"]:checked',
    );
    let hasWandlampenSelected = false;

    wandlampenInputs.forEach((input) => {
      if (!input.value.toLowerCase().includes("geen")) {
        hasWandlampenSelected = true;
      }
    });

    // Show/hide the wandlampen type selector based on selection
    const wandlampenTypeComponent = document.getElementById(
      "component-wandlampen-type",
    );
    if (wandlampenTypeComponent) {
      if (hasWandlampenSelected) {
        wandlampenTypeComponent.classList.remove("hidden");
      } else {
        wandlampenTypeComponent.classList.add("hidden");
      }
    }
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
  // Preview Layer System - Class Toggling Approach
  // Following reference site pattern: toggle 'active' class on pre-rendered images
  // ================================

  // Get the mkl_pc_layers container
  function getMklPcLayers() {
    return document.querySelector(".mkl_pc_layers");
  }

  // Map component names to layer names in mkl_pc_layers
  // Keys are lowercase versions of input name attribute values
  const LAYER_MAP = {
    // Exterior components
    kozijn: "Kozijn",
    rechterzijde: "Rechterzijde",
    linkerzijde: "Linkerzijde (hidden)",
    rechterglazentype: "Rechter glazen zijwandtype (hidden)",
    // Note: linkerglazentype uses data-img for exterior, not hidden layers
    // Interior sync is handled separately via updateLinkerGlazenInterior()
    daklicht: "Daklicht",
    daklichtzonwering: "Daklicht zonwering (hidden)",
    regenpijp: "Regenpijp",
    overstek: "Overstek",
    daktrim: "Daktrim (hidden)",
    groendak: "Groen dak (hidden)",
    buitenlicht: "Buitenlicht",
    buitenstopcontact: "Buitenstopcontact",
    buitenkraan: "Buitenkraan",
    // Interior components
    stucwerk: "Stucwerk (hidden)",
    schilderwerk: "Schilderwerk (hidden)",
    radiator: "Radiator(en)",
    verlichtinglichtpunt: "Verlichting lichtpunt",
    "verlichtinglichtpunt[]": "Verlichting lichtpunt",
    verlichtingtype: "Verlichting lichtpunt type",
    "verlichting type": "Verlichting lichtpunt type",
    spotjes: "Spotjes",
    "spotjes[]": "Spotjes",
    spotjestype: "Spotjes type",
    "spotjes type": "Spotjes type",
    spotsoverstek: "Spots overstek (hidden)",
    wandlampen: "Wandlampen",
    "wandlampen[]": "Wandlampen",
    wandlampentype: "Wandlampen type",
    "wandlampen type": "Wandlampen type",
    stopcontacten: "Stopcontacten muur (hidden)",
    "stopcontacten[]": "Stopcontacten muur (hidden)",
    vloerverwarming: "Vloerverwarming",
  };

  /**
   * Activate an image layer for the given option
   * This is the core function - toggles 'active' class on pre-rendered images
   */
  function activateImageForOption(input) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) {
      console.error(
        "ERROR: .mkl_pc_layers not found in activateImageForOption",
      );
      return;
    }

    // Use input.name directly as it matches layer names (e.g., "Kozijn", "Rechterzijde")
    // Fallback to component_id for legacy support
    const inputName = input.name;
    const componentId = input.closest(".vpc-component")?.dataset.component_id;
    const value = input.value;
    const dataImg = input.dataset.img;

    // Try input name first (matches layer names), then component_id without 'component-' prefix
    const nameLower = inputName?.toLowerCase() || "";
    const componentIdClean =
      componentId?.toLowerCase().replace("component-", "") || "";
    const lookupKey = nameLower || componentIdClean;

    console.log("activateImageForOption:", {
      inputName,
      value,
      lookupKey,
      dataImg,
    });

    // Get the layer name for this component
    const layerName = LAYER_MAP[lookupKey];

    if (!layerName) {
      console.log("No layer mapping found for:", lookupKey);
    }

    if (layerName) {
      // Find all images for this layer
      const layerImages = mklLayers.querySelectorAll(
        `img[data-layer="${layerName}"]`,
      );

      console.log(`Found ${layerImages.length} images for layer: ${layerName}`);

      // Deactivate all images for this layer first
      layerImages.forEach((img) => {
        img.classList.remove("active");
      });

      // Try to find matching image by data-choice
      // The data-choice value should match the option value
      let matchingImage = null;

      // First try exact match on data-choice
      matchingImage = mklLayers.querySelector(
        `img[data-layer="${layerName}"][data-choice="${value}"]`,
      );

      // If no match and value is 'geen' or 'glas' or 'nee', don't activate anything
      if (!matchingImage) {
        const valueLower = value.toLowerCase();
        if (
          valueLower === "geen" ||
          valueLower === "nee" ||
          valueLower === "glas"
        ) {
          // For "geen" options, just leave all deactivated
          return;
        }
      }

      // Try to find by partial match if exact match failed
      if (!matchingImage) {
        const layerImagesArray = Array.from(layerImages);
        matchingImage = layerImagesArray.find((img) => {
          const choice = img.getAttribute("data-choice") || "";
          return (
            choice.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(choice.toLowerCase())
          );
        });
      }

      // Try to find by image URL if we have dataImg
      if (!matchingImage && dataImg) {
        const imgFilename = dataImg.split("/").pop().split("?")[0];
        const layerImagesArray = Array.from(layerImages);
        matchingImage = layerImagesArray.find((img) => {
          return img.src && img.src.includes(imgFilename);
        });
      }

      if (matchingImage) {
        matchingImage.classList.add("active");
        console.log(
          "Activated layer:",
          layerName,
          "choice:",
          matchingImage.getAttribute("data-choice"),
        );
      } else if (
        value.toLowerCase() !== "geen" &&
        value.toLowerCase() !== "nee"
      ) {
        console.log("No matching image found for:", lookupKey, value);
      }
    }

    // Handle special cases - pass the clean lookup key
    handleSpecialLayerCases(lookupKey, value, input);
  }

  /**
   * Handle special layer cases like white render, interior kozijn, etc.
   */
  function handleSpecialLayerCases(componentId, value, input) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    const componentIdLower = componentId.toLowerCase();
    const valueLower = value.toLowerCase();

    // White render visibility - show when white kozijn options are selected
    if (componentIdLower === "kozijn") {
      const isWhite =
        valueLower.includes("wit") &&
        !valueLower.includes("antraciet") &&
        !valueLower.includes("zwart");
      const whiteRenderImg = mklLayers.querySelector(
        'img[data-layer="Main render white (hidden)"]',
      );

      if (whiteRenderImg) {
        if (isWhite) {
          whiteRenderImg.classList.add("active");
        } else {
          whiteRenderImg.classList.remove("active");
        }
      }

      // Sync interior kozijn layer with exterior selection
      syncKozijnInterior(value);

      // Sync Linkerzijde kozijn overlay when Kozijn changes
      updateLinkerzijdeKozijnOverlay(value);
    }

    // Rechterzijde/Linkerzijde - handle glass vs wall texture
    if (componentIdLower === "rechterzijde") {
      const glazenType = document.querySelector(
        'input[name="RechterGlazenType"]:checked',
      );
      if (valueLower === "glas" && glazenType) {
        activateImageForOption(glazenType);
      } else {
        // Hide glazen type images if wall texture is selected
        const glazenImages = mklLayers.querySelectorAll(
          'img[data-layer="Rechter glazen zijwandtype (hidden)"]',
        );
        if (valueLower !== "glas") {
          glazenImages.forEach((img) => img.classList.remove("active"));
        }
      }
      // Re-sync interior layers based on new wall configuration (mirrored)
      const stucwerkInput = document.querySelector(
        'input[name="Stucwerk"]:checked',
      );
      if (stucwerkInput) {
        syncStucwerkLayers(stucwerkInput.value);
      }
      const schilderwerkInput = document.querySelector(
        'input[name="Schilderwerk"]:checked',
      );
      if (schilderwerkInput) {
        syncSchilderwerkLayer(schilderwerkInput.value);
      }
      // Sync Wandlampen and Stopcontacten based on wall configuration
      syncWandlampenLayers();
      syncStopcontactenLayers();
      // Update Radiator options visibility based on wall configuration
      updateRadiatorOptionsVisibility();
      // Update Wandlampen and Stopcontacten options visibility based on wall configuration
      updateWandlampenOptionsVisibility();
      updateStopcontactenOptionsVisibility();
    }

    if (componentIdLower === "linkerzijde") {
      const glazenType = document.querySelector(
        'input[name="LinkerGlazenType"]:checked',
      );
      if (valueLower === "glas" && glazenType) {
        // For exterior, images are handled via data-img system in handleOptionChange
        // Hide kozijn overlay when glass is selected
        hideAllLinkerzijdeKozijnOverlays();
        // Sync interior layer if applicable
        updateLinkerGlazenInterior(glazenType.value);
      } else {
        // Wall texture selected
        // Hide interior Linker glazen layer (only affects interior view)
        const glazenInteriorImages = mklLayers.querySelectorAll(
          'img[data-layer="Linker glazen zijwandtype interior (hidden)"]',
        );
        glazenInteriorImages.forEach((img) => img.classList.remove("active"));
        // Show kozijn overlay matching current Kozijn selection
        const kozijnInput = document.querySelector(
          'input[name="Kozijn"]:checked',
        );
        if (kozijnInput) {
          updateLinkerzijdeKozijnOverlay(kozijnInput.value);
        }
      }
      // Re-sync interior layers based on new wall configuration (mirrored)
      const stucwerkInput = document.querySelector(
        'input[name="Stucwerk"]:checked',
      );
      if (stucwerkInput) {
        syncStucwerkLayers(stucwerkInput.value);
      }
      const schilderwerkInput = document.querySelector(
        'input[name="Schilderwerk"]:checked',
      );
      if (schilderwerkInput) {
        syncSchilderwerkLayer(schilderwerkInput.value);
      }
      // Sync Wandlampen and Stopcontacten based on wall configuration
      syncWandlampenLayers();
      syncStopcontactenLayers();
      // Update Radiator options visibility based on wall configuration
      updateRadiatorOptionsVisibility();
      // Update Wandlampen and Stopcontacten options visibility based on wall configuration
      updateWandlampenOptionsVisibility();
      updateStopcontactenOptionsVisibility();
    }

    // LinkerGlazenType - sync interior layer when exterior selection changes
    if (componentIdLower === "linkerglazentype") {
      updateLinkerGlazenInterior(value);
    }

    // Daklicht - sync interior layer when exterior selection changes
    if (componentIdLower === "daklicht") {
      syncDaklichtInterior(value);
      // Also update zonwering interior if zonwering is enabled
      const zonweringInput = document.querySelector(
        'input[name="DaklichtZonwering"]:checked',
      );
      if (zonweringInput) {
        syncDaklichtZonweringInterior(zonweringInput.value, value);
      }
    }

    // DaklichtZonwering - sync interior layer when zonwering changes
    if (componentIdLower === "daklichtzonwering") {
      const daklichtInput = document.querySelector(
        'input[name="Daklicht"]:checked',
      );
      if (daklichtInput) {
        syncDaklichtZonweringInterior(value, daklichtInput.value);
      }
    }

    // Overstek - sync Daktrim and Groen dak layers based on Overstek selection
    if (componentIdLower === "overstek") {
      // Note: updateDaktrimImage() is called separately in handleOptionChange
      updateGroenDakForOverstek(value);
    }

    // Groen dak - update based on current Overstek selection
    if (componentIdLower === "groendak") {
      const overstekInput = document.querySelector(
        'input[name="Overstek"]:checked',
      );
      if (overstekInput) {
        updateGroenDakForOverstek(overstekInput.value);
      }
    }

    // Stucwerk - switch between Stucwerk and Geen stucwerk layers
    if (componentIdLower === "stucwerk") {
      syncStucwerkLayers(value);
    }

    // Schilderwerk - sync layer
    if (componentIdLower === "schilderwerk") {
      syncSchilderwerkLayer(value);
    }

    // Radiator - sync layer based on selection and wall configuration
    if (componentIdLower === "radiator") {
      syncRadiatorLayer();
    }

    // Wandlampen - sync after selection to filter based on wall configuration
    if (
      componentIdLower === "wandlampen" ||
      componentIdLower === "wandlampen[]"
    ) {
      syncWandlampenLayers();
    }

    // WandlampenType - sync layer based on wall configuration and selected type
    if (componentIdLower === "wandlampentype") {
      syncWandlampenTypeLayers();
    }

    // Stopcontacten - sync after selection to filter based on wall configuration
    if (
      componentIdLower === "stopcontacten" ||
      componentIdLower === "stopcontacten[]"
    ) {
      syncStopcontactenLayers();
    }
  }

  /**
   * Update Linker glazen zijwandtype interior layer based on exterior selection
   * Only shows when Linkerzijde is "glas" and we're in interior view
   */
  function updateLinkerGlazenInterior(glazenTypeValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Check if Linkerzijde is set to "glas"
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const linkerzijdeValue = linkerzijdeInput
      ? linkerzijdeInput.value.toLowerCase()
      : "";

    // Deactivate all Linker glazen interior images first
    const glazenInteriorImages = mklLayers.querySelectorAll(
      'img[data-layer="Linker glazen zijwandtype interior (hidden)"]',
    );
    glazenInteriorImages.forEach((img) => img.classList.remove("active"));

    // Only show if Linkerzijde is glas
    if (linkerzijdeValue !== "glas") {
      return;
    }

    // Build interior choice from exterior glazen type
    // Exterior: "vast raam wit", "vast raam zwart", "schuifpui wit", etc.
    // Interior: "Binnenzijde - Linker - vast raam wit", etc.
    const interiorChoice = `Binnenzijde - Linker - ${glazenTypeValue}`;

    // First try exact match with interior naming pattern
    let matchingImg = mklLayers.querySelector(
      `img[data-layer="Linker glazen zijwandtype interior (hidden)"][data-choice="${interiorChoice}"]`,
    );

    // If no match, try direct match (for backwards compatibility)
    if (!matchingImg) {
      matchingImg = mklLayers.querySelector(
        `img[data-layer="Linker glazen zijwandtype interior (hidden)"][data-choice="${glazenTypeValue}"]`,
      );
    }

    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log(
        "Activated Linker glazen interior:",
        matchingImg.getAttribute("data-choice"),
      );
    }
  }

  /**
   * Sync Kozijn interior layer with exterior Kozijn selection
   * Called when Kozijn changes to update the interior view
   */
  function syncKozijnInterior(kozijnValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Deactivate all Kozijn interior images first
    const kozijnInteriorImages = mklLayers.querySelectorAll(
      'img[data-layer="Kozijn interior (hidden)"]',
    );
    kozijnInteriorImages.forEach((img) => img.classList.remove("active"));

    // Find and activate the matching interior kozijn image
    const matchingImg = mklLayers.querySelector(
      `img[data-layer="Kozijn interior (hidden)"][data-choice="${kozijnValue}"]`,
    );

    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Kozijn interior:", kozijnValue);
    } else {
      console.log("No matching Kozijn interior image found for:", kozijnValue);
    }
  }

  /**
   * Sync Daklicht interior layer with exterior Daklicht selection
   */
  function syncDaklichtInterior(daklichtValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Deactivate all Daklicht interior images first
    const daklichtInteriorImages = mklLayers.querySelectorAll(
      'img[data-layer="Daklicht interior (hidden)"]',
    );
    daklichtInteriorImages.forEach((img) => img.classList.remove("active"));

    // Find and activate the matching interior daklicht image
    const matchingImg = mklLayers.querySelector(
      `img[data-layer="Daklicht interior (hidden)"][data-choice="${daklichtValue}"]`,
    );

    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Daklicht interior:", daklichtValue);
    }
  }

  /**
   * Sync Daklicht zonwering interior layer with exterior selection
   */
  function syncDaklichtZonweringInterior(zonweringValue, daklichtValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Deactivate all Daklicht zonwering interior images first
    const zonweringInteriorImages = mklLayers.querySelectorAll(
      'img[data-layer="Daklicht zonwering interior (hidden)"]',
    );
    zonweringInteriorImages.forEach((img) => img.classList.remove("active"));

    // Only show if zonwering is "ja"
    if (zonweringValue.toLowerCase() !== "ja") {
      return;
    }

    // Build interior choice from daklicht value
    // E.g., "1 vaks lessenaar" -> "1 vaks lessenaar zonwering interior"
    const interiorChoice = `${daklichtValue} zonwering interior`;

    const matchingImg = mklLayers.querySelector(
      `img[data-layer="Daklicht zonwering interior (hidden)"][data-choice="${interiorChoice}"]`,
    );

    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Daklicht zonwering interior:", interiorChoice);
    }
  }

  /**
   * Sync Stucwerk layers based on selection and wall configuration
   * When "geen stucwerk" is selected → show "Geen stucwerk (hidden)" layer
   * When "ja voorzien van stucwerk" → show "Stucwerk (hidden)" layer
   *
   * IMPORTANT: Exterior and Interior are MIRRORED!
   * - Exterior RIGHT wall (Rechterzijde) = Interior LEFT wall
   * - Exterior LEFT wall (Linkerzijde) = Interior RIGHT wall
   *
   * The layer choice depends on which sides have walls (in INTERIOR view):
   * - Both sides glass → "plafond" only
   * - Interior left wall only → "linker muur plafond"
   * - Interior right wall only → "rechter muur plafond"
   * - Both walls → base name (geen stucwerk / stucwerk)
   */
  function syncStucwerkLayers(stucwerkValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Deactivate all stucwerk-related images first
    const stucwerkImages = mklLayers.querySelectorAll(
      'img[data-layer="Stucwerk (hidden)"]',
    );
    const geenStucwerkImages = mklLayers.querySelectorAll(
      'img[data-layer="Geen stucwerk (hidden)"]',
    );
    stucwerkImages.forEach((img) => img.classList.remove("active"));
    geenStucwerkImages.forEach((img) => img.classList.remove("active"));

    // Check wall configuration (EXTERIOR sides)
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    // Exterior right = Interior left, Exterior left = Interior right
    const interiorLeftIsWall = exteriorRightIsWall;
    const interiorRightIsWall = exteriorLeftIsWall;

    // Determine which layer to activate based on stucwerk value
    const valueLower = stucwerkValue.toLowerCase();
    let layerName;
    let baseChoice;

    if (valueLower.includes("geen") || valueLower === "nee") {
      layerName = "Geen stucwerk (hidden)";
      baseChoice = "geen stucwerk";
    } else if (valueLower.includes("ja") || valueLower.includes("stucwerk")) {
      layerName = "Stucwerk (hidden)";
      baseChoice = "stucwerk";
    }

    if (!layerName || !baseChoice) return;

    // Determine specific choice based on INTERIOR wall configuration (mirrored from exterior)
    let choiceValue;
    if (interiorLeftIsWall && interiorRightIsWall) {
      // Both interior walls - use base choice (shows both walls)
      choiceValue = baseChoice;
    } else if (interiorLeftIsWall && !interiorRightIsWall) {
      // Only interior left wall (from exterior right)
      choiceValue = baseChoice + " linker muur plafond";
    } else if (!interiorLeftIsWall && interiorRightIsWall) {
      // Only interior right wall (from exterior left)
      choiceValue = baseChoice + " rechter muur plafond";
    } else {
      // Both sides glass - just ceiling
      choiceValue = baseChoice + " plafond";
    }

    const matchingImg = mklLayers.querySelector(
      `img[data-layer="${layerName}"][data-choice="${choiceValue}"]`,
    );
    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Stucwerk layer:", layerName, choiceValue);
    } else {
      // Fallback to base choice if specific one not found
      const fallbackImg = mklLayers.querySelector(
        `img[data-layer="${layerName}"][data-choice="${baseChoice}"]`,
      );
      if (fallbackImg) {
        fallbackImg.classList.add("active");
        console.log(
          "Activated Stucwerk layer (fallback):",
          layerName,
          baseChoice,
        );
      }
    }
  }

  /**
   * Sync Schilderwerk layer based on selection
   * Shows appropriate schilderwerk layer based on selected value and wall configuration
   *
   * IMPORTANT: Exterior and Interior are MIRRORED!
   * - Exterior RIGHT wall (Rechterzijde) = Interior LEFT wall
   * - Exterior LEFT wall (Linkerzijde) = Interior RIGHT wall
   */
  function syncSchilderwerkLayer(schilderwerkValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Deactivate all schilderwerk images first
    const schilderwerkImages = mklLayers.querySelectorAll(
      'img[data-layer="Schilderwerk (hidden)"]',
    );
    schilderwerkImages.forEach((img) => img.classList.remove("active"));

    const valueLower = schilderwerkValue.toLowerCase();

    // If "geen" or "nee", leave all deactivated
    if (valueLower.includes("geen") || valueLower === "nee") {
      return;
    }

    // If "ja" is selected, show schilderwerk based on wall configuration
    if (valueLower.includes("ja") || valueLower.includes("schilderwerk")) {
      // Check wall configuration (EXTERIOR sides)
      const linkerzijdeInput = document.querySelector(
        'input[name="Linkerzijde"]:checked',
      );
      const rechterzijdeInput = document.querySelector(
        'input[name="Rechterzijde"]:checked',
      );

      // Exterior selections
      const exteriorLeftIsWall =
        linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
      const exteriorRightIsWall =
        rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

      // Interior is MIRRORED from exterior
      const interiorLeftIsWall = exteriorRightIsWall;
      const interiorRightIsWall = exteriorLeftIsWall;

      // Determine which schilderwerk layer to show
      let choiceValue;
      if (interiorLeftIsWall && interiorRightIsWall) {
        choiceValue = "schilderwerk linker rechter muur";
      } else if (interiorLeftIsWall && !interiorRightIsWall) {
        choiceValue = "schilderwerk linker muur";
      } else if (!interiorLeftIsWall && interiorRightIsWall) {
        choiceValue = "schilderwerk rechter muur";
      } else {
        // No walls, no schilderwerk needed
        return;
      }

      const matchingImg = mklLayers.querySelector(
        `img[data-layer="Schilderwerk (hidden)"][data-choice="${choiceValue}"]`,
      );
      if (matchingImg) {
        matchingImg.classList.add("active");
        console.log("Activated Schilderwerk layer:", choiceValue);
      }
    }
  }

  /**
   * Sync Wandlampen layers based on wall configuration
   * Wandlampen are mounted on walls, so:
   * - L1-L3 show when interior LEFT wall exists (exterior RIGHT = wall)
   * - R1-R3 show when interior RIGHT wall exists (exterior LEFT = wall)
   * Only affects active state - doesn't change selections
   */
  function syncWandlampenLayers() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Check wall configuration (EXTERIOR sides)
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall;
    const interiorRightIsWall = exteriorLeftIsWall;

    // Get all Wandlampen images
    const wandlampenImages = mklLayers.querySelectorAll(
      'img[data-layer="Wandlampen"]',
    );

    wandlampenImages.forEach((img) => {
      const choice = img.getAttribute("data-choice") || "";
      const isLeftLamp = choice.startsWith("L");
      const isRightLamp = choice.startsWith("R");

      // Check if this lamp should be visible based on wall configuration
      // Only show lamps if they're on a wall AND they were selected (have active class already from selection)
      if (isLeftLamp && !interiorLeftIsWall) {
        // No left interior wall (glass), hide left lamps
        img.classList.remove("active");
      }
      if (isRightLamp && !interiorRightIsWall) {
        // No right interior wall (glass), hide right lamps
        img.classList.remove("active");
      }
    });

    console.log("Synced Wandlampen layers:", {
      interiorLeftIsWall,
      interiorRightIsWall,
    });

    // Also sync Wandlampen type layer based on wall configuration
    syncWandlampenTypeLayers();
  }

  /**
   * Sync Wandlampen type layer based on wall configuration and selected type
   * The type (geschakeld/gedimd) can be "links" or "rechts" based on which wall has lamps
   * - Interior LEFT wall (from exterior RIGHT) → "links" type
   * - Interior RIGHT wall (from exterior LEFT) → "rechts" type
   */
  function syncWandlampenTypeLayers() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Check wall configuration (EXTERIOR sides)
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall;
    const interiorRightIsWall = exteriorLeftIsWall;

    // Deactivate all Wandlampen type images first
    const wandlampenTypeImages = mklLayers.querySelectorAll(
      'img[data-layer="Wandlampen type"]',
    );
    wandlampenTypeImages.forEach((img) => img.classList.remove("active"));

    // Check if any wandlampen are selected (not "geen")
    const wandlampenInputs = document.querySelectorAll(
      'input[name="Wandlampen[]"]:checked',
    );
    let hasWandlampenSelected = false;
    wandlampenInputs.forEach((input) => {
      if (!input.value.toLowerCase().includes("geen")) {
        hasWandlampenSelected = true;
      }
    });

    if (!hasWandlampenSelected) {
      return; // No wandlampen selected, leave all deactivated
    }

    // Get the selected Wandlampen type
    const wandlampenTypeInput = document.querySelector(
      'input[name="WandlampenType"]:checked',
    );
    if (!wandlampenTypeInput) return;

    const typeValue = wandlampenTypeInput.value.toLowerCase();

    // Determine the type (geschakeld or gedimd)
    let typePrefix = "";
    if (typeValue.includes("geschakeld")) {
      typePrefix = "geschakeld";
    } else if (typeValue.includes("gedimd")) {
      typePrefix = "gedimd";
    }

    if (!typePrefix) return;

    // Determine which side to show based on wall configuration
    // Preference: show "rechts" if only right wall, "links" if only left wall,
    // or the selected side if both walls exist
    let sideSuffix = "";
    if (interiorLeftIsWall && !interiorRightIsWall) {
      sideSuffix = "links";
    } else if (!interiorLeftIsWall && interiorRightIsWall) {
      sideSuffix = "rechts";
    } else if (interiorLeftIsWall && interiorRightIsWall) {
      // Both walls exist - use the selected side from the input
      if (typeValue.includes("links")) {
        sideSuffix = "links";
      } else if (typeValue.includes("rechts")) {
        sideSuffix = "rechts";
      } else {
        sideSuffix = "rechts"; // Default fallback
      }
    } else {
      // No walls - no wandlampen visible
      return;
    }

    const choice = `${typePrefix} ${sideSuffix}`;
    const matchingImg = mklLayers.querySelector(
      `img[data-layer="Wandlampen type"][data-choice="${choice}"]`,
    );
    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Wandlampen type:", choice);
    }
  }

  /**
   * Sync Stopcontacten layers based on wall configuration
   *
   * Stopcontacten muur: mounted on walls
   * - L1-L3 show when interior LEFT wall exists (exterior RIGHT = wall)
   * - R1-R3 show when interior RIGHT wall exists (exterior LEFT = wall)
   *
   * Stopcontacten vloer: used when there's NO wall (glass side)
   * - L1-L3 show when interior LEFT is GLASS (exterior RIGHT = glas)
   * - R1-R3 show when interior RIGHT is GLASS (exterior LEFT = glas)
   */
  function syncStopcontactenLayers() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Check wall configuration (EXTERIOR sides)
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );

    // Exterior selections
    const exteriorLeftIsWall =
      linkerzijdeInput && linkerzijdeInput.value.toLowerCase() !== "glas";
    const exteriorRightIsWall =
      rechterzijdeInput && rechterzijdeInput.value.toLowerCase() !== "glas";

    // Interior is MIRRORED from exterior
    const interiorLeftIsWall = exteriorRightIsWall;
    const interiorRightIsWall = exteriorLeftIsWall;

    // Sync Stopcontacten muur (wall-mounted outlets)
    const stopcontactenMuurImages = mklLayers.querySelectorAll(
      'img[data-layer="Stopcontacten muur (hidden)"]',
    );

    stopcontactenMuurImages.forEach((img) => {
      const choice = img.getAttribute("data-choice") || "";
      const isLeftOutlet = choice.startsWith("L");
      const isRightOutlet = choice.startsWith("R");

      // Wall outlets only show on walls
      if (isLeftOutlet && !interiorLeftIsWall) {
        img.classList.remove("active");
      }
      if (isRightOutlet && !interiorRightIsWall) {
        img.classList.remove("active");
      }
    });

    // Sync Stopcontacten vloer (floor outlets for glass sides)
    const stopcontactenVloerImages = mklLayers.querySelectorAll(
      'img[data-layer="Stopcontacten vloer (hidden)"]',
    );

    stopcontactenVloerImages.forEach((img) => {
      const choice = img.getAttribute("data-choice") || "";
      const isLeftOutlet = choice.startsWith("L");
      const isRightOutlet = choice.startsWith("R");

      // Floor outlets only show on glass sides (NOT walls)
      if (isLeftOutlet && interiorLeftIsWall) {
        // Left is wall, hide left floor outlets
        img.classList.remove("active");
      }
      if (isRightOutlet && interiorRightIsWall) {
        // Right is wall, hide right floor outlets
        img.classList.remove("active");
      }
    });

    console.log("Synced Stopcontacten layers:", {
      interiorLeftIsWall,
      interiorRightIsWall,
    });
  }

  /**
   * Update Linkerzijde kozijn overlay based on current Kozijn selection
   * Only shows overlay when Linkerzijde is not "glas"
   */
  function updateLinkerzijdeKozijnOverlay(kozijnValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Check if Linkerzijde is set to "glas" - don't show kozijn overlay
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    const linkerzijdeValue = linkerzijdeInput
      ? linkerzijdeInput.value.toLowerCase()
      : "glas";

    if (linkerzijdeValue === "glas") {
      hideAllLinkerzijdeKozijnOverlays();
      return;
    }

    // Build the choice string for the kozijn overlay
    // Format: "linker zijwand [door type] kozijn – [material] [color]"
    const kozijnLower = kozijnValue.toLowerCase();
    let doorType = "";
    let material = "";
    let color = "";

    // Determine door type from kozijn value
    if (kozijnLower.includes("harmonicapui")) {
      doorType = "harmonicapui";
    } else if (kozijnLower.includes("openslaande deuren met roedes")) {
      doorType = "openslaande deuren met roedes";
    } else if (kozijnLower.includes("openslaande deuren")) {
      doorType = "openslaande deuren";
    } else if (
      kozijnLower.includes("4 delig") ||
      kozijnLower.includes("4-delig")
    ) {
      doorType = "4 delig";
    } else if (
      kozijnLower.includes("2 delig") ||
      kozijnLower.includes("2-delig")
    ) {
      doorType = "2 delig";
    }

    // Determine material from kozijn value
    if (kozijnLower.includes("aluminium")) {
      material = "aluminium";
    } else if (kozijnLower.includes("kunststof")) {
      material = "kunststof";
    } else if (kozijnLower.includes("hout")) {
      material = "hout";
    }

    // Determine color from kozijn value
    if (kozijnLower.includes("antraciet")) {
      color = "antraciet";
    } else if (kozijnLower.includes("wit")) {
      color = "wit";
    }

    if (!doorType || !material || !color) {
      console.log(
        "updateLinkerzijdeKozijnOverlay: Could not determine door type, material, or color from:",
        kozijnValue,
      );
      return;
    }

    // Build the choice string matching the data-choice attribute
    const choiceString = `linker zijwand ${doorType} kozijn – ${material} ${color}`;
    console.log(
      "updateLinkerzijdeKozijnOverlay: Looking for choice:",
      choiceString,
    );

    // Hide all Linkerzijde kozijn overlays first
    hideAllLinkerzijdeKozijnOverlays();

    // Find and activate the matching kozijn overlay
    const matchingImage = mklLayers.querySelector(
      `img[data-layer="Linkerzijde (hidden)"][data-choice="${choiceString}"]`,
    );

    if (matchingImage) {
      matchingImage.classList.add("active");
      console.log("updateLinkerzijdeKozijnOverlay: Activated:", choiceString);
    } else {
      console.log(
        "updateLinkerzijdeKozijnOverlay: No matching image found for:",
        choiceString,
      );
    }
  }

  /**
   * Hide all Linkerzijde kozijn overlay images
   */
  function hideAllLinkerzijdeKozijnOverlays() {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Hide all kozijn overlay images from "Linkerzijde (hidden)" layer (layer_id 19)
    const kozijnOverlays = mklLayers.querySelectorAll(
      'img[data-layer="Linkerzijde (hidden)"]',
    );
    kozijnOverlays.forEach((img) => {
      const choice = img.getAttribute("data-choice") || "";
      if (choice.startsWith("linker zijwand") && choice.includes("kozijn")) {
        img.classList.remove("active");
      }
    });

    // Also hide the legacy "Linker zijwand kozijn (hidden)" layer
    const legacyOverlay = mklLayers.querySelector(
      'img[data-layer="Linker zijwand kozijn (hidden)"]',
    );
    if (legacyOverlay) {
      legacyOverlay.classList.remove("active");
    }
  }

  /**
   * Update Daktrim layers based on Overstek selection
   * When overstek is selected, show transparent images for Daktrim
   * When geen overstek, show the actual Daktrim images
   */
  function updateDaktrimForOverstek(overstekValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    const overstekLower = overstekValue.toLowerCase();
    const isGeenOverstek = overstekLower.includes("geen");
    const hasZijkant = overstekLower.includes("met zijkant");
    const isKunststofWit =
      overstekLower.includes("wit") && overstekLower.includes("kunststof");
    const isKunststofAntraciet =
      overstekLower.includes("antraciet") &&
      overstekLower.includes("kunststof");

    // Get current Daktrim selection
    const daktrimInput = document.querySelector(
      'input[name="Daktrim"]:checked',
    );
    if (!daktrimInput) return;

    const daktrimValue = daktrimInput.value.toLowerCase();

    console.log("updateDaktrimForOverstek:", {
      overstekValue,
      daktrimValue,
      isGeenOverstek,
      hasZijkant,
    });

    // Handle Daktrim aluminium (hidden) - layer_id 65
    const daktrimAluminiumImages = mklLayers.querySelectorAll(
      'img[data-layer="Daktrim aluminium (hidden)"]',
    );
    daktrimAluminiumImages.forEach((img) => img.classList.remove("active"));

    // Handle Daktrim aluminium zwart (hidden) - layer_id 66
    const daktrimZwartImages = mklLayers.querySelectorAll(
      'img[data-layer="Daktrim aluminium zwart (hidden)"]',
    );
    daktrimZwartImages.forEach((img) => img.classList.remove("active"));

    // Handle Daktrim (hidden) / Zinken kraal - layer_id 16
    const daktrimZinkenImages = mklLayers.querySelectorAll(
      'img[data-layer="Daktrim (hidden)"]',
    );
    daktrimZinkenImages.forEach((img) => img.classList.remove("active"));

    // Determine which Daktrim choice to activate based on Daktrim selection and Overstek
    if (daktrimValue === "aluminium") {
      let choiceToActivate;
      if (isGeenOverstek) {
        choiceToActivate = "daktrim aluminium geen overstek";
      } else if (hasZijkant) {
        choiceToActivate = "daktrim aluminium overstek met zijkant";
      } else {
        choiceToActivate = "daktrim aluminium overstek geen zijkant";
      }
      const matchingImg = mklLayers.querySelector(
        `img[data-layer="Daktrim aluminium (hidden)"][data-choice="${choiceToActivate}"]`,
      );
      if (matchingImg) {
        matchingImg.classList.add("active");
        console.log("Activated Daktrim aluminium:", choiceToActivate);
      }
    } else if (daktrimValue === "aluminium zwart") {
      let choiceToActivate;
      if (isGeenOverstek) {
        choiceToActivate = "daktrim aluminium zwart geen overstek";
      } else if (hasZijkant) {
        choiceToActivate = "daktrim aluminium zwart overstek met zijkant";
      } else {
        choiceToActivate = "daktrim aluminium zwart overstek geen zijkant";
      }
      const matchingImg = mklLayers.querySelector(
        `img[data-layer="Daktrim aluminium zwart (hidden)"][data-choice="${choiceToActivate}"]`,
      );
      if (matchingImg) {
        matchingImg.classList.add("active");
        console.log("Activated Daktrim aluminium zwart:", choiceToActivate);
      }
    } else if (daktrimValue === "zinken kraal") {
      let choiceToActivate;
      if (isGeenOverstek) {
        // No overstek - show full Zinken kraal
        choiceToActivate = "Zinken kraal";
      } else if (isKunststofWit) {
        choiceToActivate = hasZijkant
          ? "Zinken kraal voor- en zijkant kunststof wit"
          : "Zinken kraal voorkant kunststof wit";
      } else if (isKunststofAntraciet) {
        choiceToActivate = hasZijkant
          ? "Zinken kraal voor- en zijkant kunststof antraciet"
          : "Zinken kraal voorkant kunststof antraciet";
      } else {
        // Default overstek (gegrond hout)
        choiceToActivate = hasZijkant
          ? "Zinken kraal voor- en zijkant"
          : "Zinken kraal voorkant";
      }
      const matchingImg = mklLayers.querySelector(
        `img[data-layer="Daktrim (hidden)"][data-choice="${choiceToActivate}"]`,
      );
      if (matchingImg) {
        matchingImg.classList.add("active");
        console.log("Activated Daktrim Zinken kraal:", choiceToActivate);
      }
    }
  }

  /**
   * Update Groen dak layer based on Overstek selection
   * Different images for different Overstek configurations
   */
  function updateGroenDakForOverstek(overstekValue) {
    const mklLayers = getMklPcLayers();
    if (!mklLayers) return;

    // Get current Groen dak selection
    const groendakInput = document.querySelector(
      'input[name="GroenDak"]:checked',
    );
    if (!groendakInput) return;

    const groendakValue = groendakInput.value.toLowerCase();

    // If no green roof is selected, deactivate all
    if (groendakValue === "nee" || groendakValue === "geen") {
      const groendakImages = mklLayers.querySelectorAll(
        'img[data-layer="Groen dak (hidden)"]',
      );
      groendakImages.forEach((img) => img.classList.remove("active"));
      return;
    }

    const overstekLower = overstekValue.toLowerCase();
    const isGeenOverstek = overstekLower.includes("geen");
    const hasZijkant = overstekLower.includes("met zijkant");
    const isKunststofWit =
      overstekLower.includes("wit") && overstekLower.includes("kunststof");
    const isKunststofAntraciet =
      overstekLower.includes("antraciet") &&
      overstekLower.includes("kunststof");

    console.log("updateGroenDakForOverstek:", {
      overstekValue,
      groendakValue,
      isGeenOverstek,
      hasZijkant,
    });

    // Deactivate all Groen dak images first
    const groendakImages = mklLayers.querySelectorAll(
      'img[data-layer="Groen dak (hidden)"]',
    );
    groendakImages.forEach((img) => img.classList.remove("active"));

    // Determine which Groen dak choice to activate based on Overstek
    let choiceToActivate;
    if (isGeenOverstek) {
      // No overstek - show full Groen dak
      choiceToActivate = "Groen dak";
    } else if (isKunststofWit) {
      choiceToActivate = hasZijkant
        ? "Groen dak voor- en zijkant kunststof wit"
        : "Groen dak voorkant kunststof wit";
    } else if (isKunststofAntraciet) {
      choiceToActivate = hasZijkant
        ? "Groen dak voor- en zijkant kunststof antraciet"
        : "Groen dak voorkant kunststof antraciet";
    } else {
      // Default overstek (gegrond hout)
      choiceToActivate = hasZijkant
        ? "Groen dak voor- en zijkant"
        : "Groen dak voorkant";
    }

    const matchingImg = mklLayers.querySelector(
      `img[data-layer="Groen dak (hidden)"][data-choice="${choiceToActivate}"]`,
    );
    if (matchingImg) {
      matchingImg.classList.add("active");
      console.log("Activated Groen dak:", choiceToActivate);
    } else {
      console.log("No matching Groen dak image found for:", choiceToActivate);
    }
  }

  // Legacy function - now just calls activateImageForOption
  function updatePreviewImage(
    componentId,
    optionId,
    imgUrl,
    optionClass,
    zIndex,
  ) {
    // Find the input that was changed
    const input =
      document.querySelector(`input[data-oid="${optionId}"]:checked`) ||
      document.querySelector(`input[name="${componentId}"]:checked`);

    if (input) {
      activateImageForOption(input);
    }
  }

  function updatePreview() {
    document
      .querySelectorAll(CONFIG.selectors.optionInputs + ":checked")
      .forEach((input) => {
        activateImageForOption(input);
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
    const mklLayers = getMklPcLayers();

    const exteriorRadio = document.getElementById("vpc-exterior-button");
    const interiorRadio = document.getElementById("vpc-interior-button");

    if (view === "interior") {
      section?.classList.add("s-configurator-container--interior");

      // Toggle main render images
      if (mklLayers) {
        const exteriorMain = mklLayers.querySelector(
          'img[data-layer="Buitenzijde main"]',
        );
        const interiorMain = mklLayers.querySelector(
          'img[data-layer="Binnenzijde main"]',
        );
        if (exteriorMain) exteriorMain.classList.remove("active");
        if (interiorMain) interiorMain.classList.add("active");
      }

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

      // Toggle main render images
      if (mklLayers) {
        const exteriorMain = mklLayers.querySelector(
          'img[data-layer="Buitenzijde main"]',
        );
        const interiorMain = mklLayers.querySelector(
          'img[data-layer="Binnenzijde main"]',
        );
        if (exteriorMain) exteriorMain.classList.add("active");
        if (interiorMain) interiorMain.classList.remove("active");
      }

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

    // Initialize conditional visibility for glazen type components
    const rechterzijdeInput = document.querySelector(
      'input[name="Rechterzijde"]:checked',
    );
    if (rechterzijdeInput) {
      updateRechterGlazenTypeVisibility(rechterzijdeInput.value);
    }
    const linkerzijdeInput = document.querySelector(
      'input[name="Linkerzijde"]:checked',
    );
    if (linkerzijdeInput) {
      updateLinkerGlazenTypeVisibility(linkerzijdeInput.value);
      updateLinkerZijwandKozijnVisibility(linkerzijdeInput.value);
    }
    // Initialize Daklicht zonwering visibility
    const daklichtInput = document.querySelector(
      'input[name="Daklicht"]:checked',
    );
    if (daklichtInput) {
      updateDaklichtZonweringVisibility(daklichtInput.value);
    }
    // Initialize Daklicht zonwering image
    const zonweringInput = document.querySelector(
      'input[name="DaklichtZonwering"]:checked',
    );
    if (zonweringInput) {
      updateZonweringImage(zonweringInput.value);
    }
    // Initialize Buitenlicht type visibility
    const buitenlichtInput = document.querySelector(
      'input[name="Buitenlicht"]:checked',
    );
    if (buitenlichtInput) {
      updateBuitenlichtTypeVisibility(buitenlichtInput.value);
    }
    // Initialize Spots in overstek visibility
    const overstekInput = document.querySelector(
      'input[name="Overstek"]:checked',
    );
    if (overstekInput) {
      updateSpotsOverstekVisibility(overstekInput.value);
    }
    // Initialize Daktrim image based on current overstek and daktrim selection
    updateDaktrimImage();
    // Initialize Spots in overstek type visibility
    const spotsOverstekInput = document.querySelector(
      'input[name="SpotsOverstek"]:checked',
    );
    if (spotsOverstekInput) {
      updateSpotsOverstekTypeVisibility(spotsOverstekInput.value);
    }

    // Initialize interior layers based on current exterior selections
    const kozijnInput = document.querySelector('input[name="Kozijn"]:checked');
    if (kozijnInput) {
      syncKozijnInterior(kozijnInput.value);
    }
    const linkerGlazenInput = document.querySelector(
      'input[name="LinkerGlazenType"]:checked',
    );
    if (
      linkerGlazenInput &&
      linkerzijdeInput &&
      linkerzijdeInput.value.toLowerCase() === "glas"
    ) {
      updateLinkerGlazenInterior(linkerGlazenInput.value);
    }
    // Initialize Daklicht interior
    const daklichtInputInit = document.querySelector(
      'input[name="Daklicht"]:checked',
    );
    if (daklichtInputInit) {
      syncDaklichtInterior(daklichtInputInit.value);
      const zonweringInputInit = document.querySelector(
        'input[name="DaklichtZonwering"]:checked',
      );
      if (zonweringInputInit) {
        syncDaklichtZonweringInterior(
          zonweringInputInit.value,
          daklichtInputInit.value,
        );
      }
    }

    // Initialize Stucwerk interior layer
    const stucwerkInput = document.querySelector(
      'input[name="Stucwerk"]:checked',
    );
    if (stucwerkInput) {
      syncStucwerkLayers(stucwerkInput.value);
    }

    // Initialize Schilderwerk interior layer
    const schilderwerkInput = document.querySelector(
      'input[name="Schilderwerk"]:checked',
    );
    if (schilderwerkInput) {
      syncSchilderwerkLayer(schilderwerkInput.value);
    }

    // Initialize Wandlampen and Stopcontacten layers based on wall configuration
    syncWandlampenLayers();
    syncStopcontactenLayers();

    // Initialize Wandlampen type layer
    syncWandlampenTypeLayers();

    // Initialize Radiator options visibility based on wall configuration
    updateRadiatorOptionsVisibility();

    // Initialize Wandlampen and Stopcontacten options visibility based on wall configuration
    updateWandlampenOptionsVisibility();
    updateStopcontactenOptionsVisibility();

    // Initialize Wandlampen type component visibility
    updateWandlampenTypeVisibility();
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
