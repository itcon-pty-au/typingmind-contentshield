// TypingMind Privacy Checker Extension
// This extension monitors chat input for potentially sensitive information

(function () {
  // Configuration and state
  const config = {
    enabled: true,
    rules: [
      {
        id: 1,
        type: "regex",
        pattern: "\\b(?:\\d[ -]*?){13,16}\\b",
        name: "Credit Card Number",
        active: true,
      },
      {
        id: 2,
        type: "regex",
        pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",
        name: "Email Address",
        active: true,
      },
      {
        id: 3,
        type: "regex",
        pattern: "\\b(?:\\d{3}[-.]?){2}\\d{4}\\b",
        name: "SSN",
        active: true,
      },
      {
        id: 4,
        type: "string",
        pattern: "password",
        name: "Password Reference",
        active: true,
        caseSensitive: false,
      },
      {
        id: 5,
        type: "string",
        pattern: "confidential",
        name: "Confidential Reference",
        active: true,
        caseSensitive: false,
      },
      {
        id: 6,
        type: "string",
        pattern: "secret",
        name: "Secret Reference",
        active: true,
        caseSensitive: false,
      },
    ],
    nextRuleId: 7,
    styles: {
      highlightColor: "#ff0000",
      borderWidth: "2px",
      warningHeaderBg: "#d00000",
    },
  };

  // DOM Elements
  let chatInputElement = null;
  let privacyButton = null;
  let modalContainer = null;
  let rulesList = null;
  let lastActiveMatches = [];

  // Initialize the extension
  function init() {
    loadConfig();
    setupPrivacyButton();
    setupChatMonitoring();
    setupModalContainer();
  }

  // Load configuration from localStorage
  function loadConfig() {
    const savedConfig = localStorage.getItem("typingMindPrivacyCheckerConfig");
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // Merge with default config
        config.enabled = parsedConfig.enabled ?? config.enabled;
        config.rules = parsedConfig.rules ?? config.rules;
        config.nextRuleId = parsedConfig.nextRuleId ?? config.nextRuleId;

        // Load styles with defaults if not present
        if (parsedConfig.styles) {
          config.styles = {
            highlightColor: parsedConfig.styles.highlightColor ?? "#ff0000",
            borderWidth: parsedConfig.styles.borderWidth ?? "2px",
            warningHeaderBg: parsedConfig.styles.warningHeaderBg ?? "#d00000",
          };
        }
      } catch (e) {
        console.error("Failed to parse saved privacy checker config", e);
      }
    }
  }

  // Save configuration to localStorage
  function saveConfig() {
    localStorage.setItem(
      "typingMindPrivacyCheckerConfig",
      JSON.stringify(config)
    );
  }

  // Setup the privacy button in the UI
  function setupPrivacyButton() {
    // Look for the agents button to insert our button before it
    const agentsButton = document.querySelector(
      '[data-element-id="workspace-tab-agents"]'
    );
    if (!agentsButton) {
      console.error("Could not find agents button to position privacy button");
      return;
    }

    // Create the privacy button
    privacyButton = document.createElement("button");
    privacyButton.className =
      "min-w-[58px] sm:min-w-0 sm:aspect-auto aspect-square cursor-default h-12 md:h-[50px] flex-col justify-start items-start inline-flex focus:outline-0 focus:text-white w-full";
    privacyButton.dataset.elementId = "workspace-tab-privacy";
    privacyButton.innerHTML = `
      <span class="text-white/70 hover:bg-white/20 self-stretch h-12 md:h-[50px] px-0.5 py-1.5 rounded-xl flex-col justify-start items-center gap-1.5 flex transition-colors">
        <svg class="w-4 h-4 flex-shrink-0" width="18px" height="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <g fill="currentColor">
            <path d="M9,1L2,4v4c0,4.9,3,9.3,7,10.3c4-1,7-5.4,7-10.3V4L9,1z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
            <path d="M6.5,8.5L8.3,10.3L11.5,7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          </g>
        </svg>
        <span class="font-normal self-stretch text-center text-xs leading-4 md:leading-none">Privacy</span>
      </span>
    `;

    // Insert the button before the agents button
    agentsButton.parentNode.insertBefore(privacyButton, agentsButton);

    // Add click event listener
    privacyButton.addEventListener("click", (e) => {
      togglePrivacyModal();
      // Prevent event propagation to other event handlers
      e.stopPropagation();
    });
  }

  // Setup monitoring for the chat input field
  function setupChatMonitoring() {
    // Find the chat input element
    chatInputElement = document.querySelector(
      '#chat-input-textbox, [data-element-id="chat-input-textbox"]'
    );
    if (!chatInputElement) {
      // Try again in a second - the element might not be loaded yet
      setTimeout(setupChatMonitoring, 1000);
      return;
    }

    // Add input event listener to check content in real-time
    chatInputElement.addEventListener("input", checkForSensitiveInfo);

    // Also check when the page loads
    checkForSensitiveInfo();
  }

  // Check if the text contains sensitive information based on rules
  function checkForSensitiveInfo() {
    if (!config.enabled || !chatInputElement) return;

    const text = chatInputElement.value;
    const activeMatches = [];

    // Check each active rule
    config.rules.forEach((rule) => {
      if (!rule.active) return;

      let matches = [];
      if (rule.type === "regex") {
        try {
          const regex = new RegExp(rule.pattern, "g");
          let match;
          while ((match = regex.exec(text)) !== null) {
            matches.push({
              ruleName: rule.name,
              ruleId: rule.id,
              matchedText: match[0],
              index: match.index,
            });
          }
        } catch (e) {
          console.error(`Invalid regex pattern in rule ${rule.name}:`, e);
        }
      } else if (rule.type === "string") {
        const searchText = rule.caseSensitive ? text : text.toLowerCase();
        const searchPattern = rule.caseSensitive
          ? rule.pattern
          : rule.pattern.toLowerCase();

        // Use indexOf to find all occurrences
        let index = searchText.indexOf(searchPattern);
        while (index !== -1) {
          matches.push({
            ruleName: rule.name,
            ruleId: rule.id,
            matchedText: text.substring(index, index + rule.pattern.length),
            index: index,
          });
          index = searchText.indexOf(searchPattern, index + 1);
        }
      }

      activeMatches.push(...matches);
    });

    // Update UI based on matches
    updateChatInputStyle(activeMatches.length > 0);

    // Only update if matches have changed
    if (!arraysEqual(lastActiveMatches, activeMatches)) {
      lastActiveMatches = activeMatches;
      // If warning is already showing, update it to reflect new matches
      if (document.getElementById("privacy-warning-tooltip")) {
        showPrivacyWarning();
      }
    }
  }

  // Helper function to compare arrays of matches
  function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    // Sort both arrays to ensure consistent comparison
    const sorted1 = [...arr1].sort((a, b) => a.index - b.index);
    const sorted2 = [...arr2].sort((a, b) => a.index - b.index);

    return sorted1.every((match, index) => {
      const match2 = sorted2[index];
      return (
        match.ruleName === match2.ruleName &&
        match.matchedText === match2.matchedText &&
        match.index === match2.index
      );
    });
  }

  // Update the chat input style based on whether sensitive info was detected
  function updateChatInputStyle(hasSensitiveInfo) {
    if (!chatInputElement) return;

    if (hasSensitiveInfo) {
      chatInputElement.style.border = `${config.styles.borderWidth} solid ${config.styles.highlightColor}`;
      chatInputElement.style.boxShadow = `0 0 5px ${config.styles.highlightColor}`;

      // Show tooltip with warning
      showPrivacyWarning();
    } else {
      chatInputElement.style.border = "";
      chatInputElement.style.boxShadow = "";

      // Hide tooltip if it exists
      hidePrivacyWarning();
    }
  }

  // Show privacy warning tooltip
  function showPrivacyWarning() {
    let warningElement = document.getElementById("privacy-warning-tooltip");
    const container = chatInputElement.parentElement;

    if (!warningElement) {
      warningElement = document.createElement("div");
      warningElement.id = "privacy-warning-tooltip";
      warningElement.className = "privacy-warning-tooltip";

      if (container) {
        container.style.position = "relative";
        container.appendChild(warningElement);
      }
    }

    // Organize matches by rule and determine positions
    const matchesByRule = {};
    lastActiveMatches.forEach((match) => {
      if (!matchesByRule[match.ruleName]) {
        matchesByRule[match.ruleName] = [];
      }

      // Calculate line and character position
      const textBeforeMatch = chatInputElement.value.substring(0, match.index);
      const lines = textBeforeMatch.split("\n");
      const lineNumber = lines.length;
      const charPosition = lines[lines.length - 1].length + 1;

      // Add match with position info
      matchesByRule[match.ruleName].push({
        text: match.matchedText,
        position: `Line ${lineNumber}, Char ${charPosition}`,
      });
    });

    // Create header for the warning
    const headerHTML = `
      <div class="privacy-warning-header" style="background-color: ${config.styles.warningHeaderBg};">
        <div class="privacy-warning-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="privacy-warning-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Privacy Alert: Potentially Sensitive Information Detected
        </div>
      </div>
    `;

    // Start building table rows
    let tableRowsHTML = "";
    let hasMatches = false;

    Object.entries(matchesByRule).forEach(([ruleName, matches]) => {
      matches.forEach((match, index) => {
        hasMatches = true;
        // Safely escape HTML to prevent XSS
        const safeText = match.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        tableRowsHTML += `
          <tr class="privacy-warning-row">
            <td class="privacy-warning-cell">${index === 0 ? ruleName : ""}</td>
            <td class="privacy-warning-cell"><code style="background-color: rgba(${hexToRgb(
              config.styles.highlightColor
            )}, 0.3);">${safeText}</code></td>
            <td class="privacy-warning-cell">${match.position}</td>
          </tr>
        `;
      });
    });

    // Build the content area with table
    const contentHTML = `
      <div class="privacy-warning-content">
        <table class="privacy-warning-table">
          <thead>
            <tr class="privacy-warning-header-row">
              <th class="privacy-warning-header-cell">Rule Name</th>
              <th class="privacy-warning-header-cell">Text</th>
              <th class="privacy-warning-header-cell">Position</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
        ${
          !hasMatches
            ? '<p class="privacy-warning-no-matches">No matches found</p>'
            : ""
        }
      </div>
    `;

    // Update the DOM with new content
    warningElement.innerHTML = headerHTML + contentHTML;
  }

  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  }

  // Hide privacy warning tooltip
  function hidePrivacyWarning() {
    const warningElement = document.getElementById("privacy-warning-tooltip");
    if (warningElement) {
      warningElement.remove();
    }
  }

  // Create the modal container
  function setupModalContainer() {
    modalContainer = document.createElement("div");
    modalContainer.id = "privacy-checker-modal-container";
    modalContainer.style.display = "none";

    // Create the modal content
    const modalContent = createModalContent();
    modalContainer.appendChild(modalContent);

    // Add the modal to the body
    document.body.appendChild(modalContainer);
  }

  // Create the modal content
  function createModalContent() {
    const modalContent = document.createElement("div");
    modalContent.className = "privacy-checker-modal";

    // Add content to the modal
    modalContent.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Privacy Checker Settings</h3>
        <button class="ml-2 text-blue-400 text-lg hint--bottom-left hint--rounded hint--large" aria-label="Configure privacy rules to detect sensitive information in chat messages. The extension will highlight potentially sensitive information with a red border around the chat input.">ⓘ</button>
      </div>

      <div class="modal-section">
        <div class="flex items-center justify-between">
          <label class="modal-section-title">Enable Privacy Checker</label>
          <div class="relative inline-block w-10 mr-2 align-middle select-none">
            <input type="checkbox" id="privacy-checker-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${
              config.enabled ? "checked" : ""
            }>
            <label for="privacy-checker-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-500 cursor-pointer"></label>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <div class="flex items-center justify-between mb-2">
          <label class="modal-section-title">Privacy Rules</label>
          <button id="add-rule-btn" class="button button-primary">Add Rule</button>
        </div>
        <div id="privacy-rules-list" class="space-y-2 max-h-[300px] overflow-y-auto">
          <!-- Rules will be populated here -->
        </div>
      </div>

      <div class="modal-section">
        <div class="flex items-center justify-between mb-2">
          <label class="modal-section-title">Appearance Settings</label>
          <button id="toggle-style-settings" class="button button-primary text-xs py-1">
            <span id="toggle-style-text">Show</span> <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1" id="toggle-style-icon"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
        
        <div id="style-settings-content" class="space-y-3" style="display: none;">
          <div class="form-group">
            <label for="highlight-color-input">Highlight Color</label>
            <div class="flex items-center">
              <input type="color" id="highlight-color-input" value="${
                config.styles.highlightColor
              }" 
                style="width: 50px; height: 30px; background: transparent; border: none; padding: 0; margin-right: 10px;">
              <input type="text" id="highlight-color-text" value="${
                config.styles.highlightColor
              }" 
                style="flex: 1;">
            </div>
          </div>
          
          <div class="form-group">
            <label for="border-width-input">Border Width</label>
            <select id="border-width-input" class="w-full">
              <option value="1px" ${
                config.styles.borderWidth === "1px" ? "selected" : ""
              }>Thin (1px)</option>
              <option value="2px" ${
                config.styles.borderWidth === "2px" ? "selected" : ""
              }>Medium (2px)</option>
              <option value="3px" ${
                config.styles.borderWidth === "3px" ? "selected" : ""
              }>Thick (3px)</option>
              <option value="4px" ${
                config.styles.borderWidth === "4px" ? "selected" : ""
              }>Very Thick (4px)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="warning-header-bg-input">Warning Header Color</label>
            <div class="flex items-center">
              <input type="color" id="warning-header-bg-input" value="${
                config.styles.warningHeaderBg
              }" 
                style="width: 50px; height: 30px; background: transparent; border: none; padding: 0; margin-right: 10px;">
              <input type="text" id="warning-header-text" value="${
                config.styles.warningHeaderBg
              }" 
                style="flex: 1;">
            </div>
          </div>
          
          <button id="save-styles-btn" class="button button-primary mt-2">Save Styles</button>
        </div>
      </div>

      <div class="button-group">
        <button id="export-rules-btn" class="button button-primary" title="Export your rules to share or backup">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export
        </button>
        <button id="import-rules-btn" class="button button-primary" title="Import rules from another instance">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Import
        </button>
        <div style="flex-grow: 1;"></div>
        <button id="close-privacy-modal" class="button button-danger">Close</button>
      </div>
    `;

    // Store reference to the rules list
    rulesList = modalContent.querySelector("#privacy-rules-list");

    // Add event listeners
    modalContent.addEventListener("click", (e) => {
      if (e.target.id === "close-privacy-modal") {
        togglePrivacyModal();
      } else if (e.target.id === "add-rule-btn") {
        addNewRule();
      } else if (e.target.id === "privacy-checker-toggle") {
        togglePrivacyChecker();
      } else if (e.target.id === "save-styles-btn") {
        saveStyleSettings();
      } else if (
        e.target.id === "toggle-style-settings" ||
        e.target.closest("#toggle-style-settings")
      ) {
        toggleStyleSettings();
      } else if (
        e.target.id === "export-rules-btn" ||
        e.target.closest("#export-rules-btn")
      ) {
        exportRules();
      } else if (
        e.target.id === "import-rules-btn" ||
        e.target.closest("#import-rules-btn")
      ) {
        importRules();
      }

      // Prevent event propagation to avoid interfering with other modals
      e.stopPropagation();
    });

    // Add event listeners for color inputs to sync
    modalContent.addEventListener("input", (e) => {
      if (e.target.id === "highlight-color-input") {
        document.getElementById("highlight-color-text").value = e.target.value;
        applyStyleChanges();
      } else if (e.target.id === "highlight-color-text") {
        document.getElementById("highlight-color-input").value = e.target.value;
        applyStyleChanges();
      } else if (e.target.id === "warning-header-bg-input") {
        document.getElementById("warning-header-text").value = e.target.value;
        applyStyleChanges();
      } else if (e.target.id === "warning-header-text") {
        document.getElementById("warning-header-bg-input").value =
          e.target.value;
        applyStyleChanges();
      } else if (e.target.id === "border-width-input") {
        applyStyleChanges();
      }
    });

    return modalContent;
  }

  // Toggle the privacy checker
  function togglePrivacyChecker() {
    config.enabled = !config.enabled;
    saveConfig();

    // Update UI
    const toggle = document.getElementById("privacy-checker-toggle");
    if (toggle) {
      toggle.checked = config.enabled;
    }

    // Re-check the current input
    checkForSensitiveInfo();
  }

  // Toggle the privacy modal
  function togglePrivacyModal() {
    if (modalContainer.style.display === "none") {
      // Show modal
      modalContainer.style.display = "flex";

      // Populate rules
      populateRulesList();

      // Make sure the style settings content is hidden initially
      const styleContent = document.getElementById("style-settings-content");
      if (styleContent) {
        styleContent.style.display = "none";
      }

      const toggleText = document.getElementById("toggle-style-text");
      if (toggleText) {
        toggleText.textContent = "Show";
      }

      const toggleIcon = document.getElementById("toggle-style-icon");
      if (toggleIcon) {
        toggleIcon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
      }

      // Add click event to close when clicking outside
      const closeOnOutsideClick = (e) => {
        if (e.target === modalContainer) {
          togglePrivacyModal();
          modalContainer.removeEventListener("click", closeOnOutsideClick);
        }
      };

      modalContainer.addEventListener("click", closeOnOutsideClick);
    } else {
      // Hide modal
      modalContainer.style.display = "none";
    }
  }

  // Populate the rules list in the modal
  function populateRulesList() {
    if (!rulesList) return;

    // Clear existing rules
    rulesList.innerHTML = "";

    // Add each rule
    config.rules.forEach((rule) => {
      const ruleElement = document.createElement("div");
      ruleElement.className = "rule-item";
      ruleElement.dataset.ruleId = rule.id;

      ruleElement.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input type="checkbox" class="rule-toggle mr-2" ${
              rule.active ? "checked" : ""
            }>
            <span class="rule-name font-medium text-white">${rule.name}</span>
          </div>
          <div class="flex space-x-2">
            <button class="edit-rule-btn icon-button edit" title="Edit Rule">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="delete-rule-btn icon-button delete" title="Delete Rule">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="rule-details">
          Type: ${rule.type === "regex" ? "Regular Expression" : "String Match"}
          <br>
          Pattern: <code>${rule.pattern}</code>
          ${
            rule.type === "string"
              ? `<br>Case Sensitive: ${rule.caseSensitive ? "Yes" : "No"}`
              : ""
          }
        </div>
      `;

      // Add event listeners
      const toggleCheckbox = ruleElement.querySelector(".rule-toggle");
      toggleCheckbox.addEventListener("change", (e) => {
        toggleRule(rule.id, toggleCheckbox.checked);
        e.stopPropagation();
      });

      const editButton = ruleElement.querySelector(".edit-rule-btn");
      editButton.addEventListener("click", (e) => {
        editRule(rule.id);
        e.stopPropagation();
      });

      const deleteButton = ruleElement.querySelector(".delete-rule-btn");
      deleteButton.addEventListener("click", (e) => {
        deleteRule(rule.id);
        e.stopPropagation();
      });

      rulesList.appendChild(ruleElement);
    });
  }

  // Toggle a rule's active status
  function toggleRule(ruleId, active) {
    const ruleIndex = config.rules.findIndex((r) => r.id === ruleId);
    if (ruleIndex !== -1) {
      config.rules[ruleIndex].active = active;
      saveConfig();

      // Re-check the current input
      checkForSensitiveInfo();
    }
  }

  // Add a new rule
  function addNewRule() {
    showRuleEditor();
  }

  // Edit an existing rule
  function editRule(ruleId) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (rule) {
      showRuleEditor(rule);
    }
  }

  // Delete a rule
  function deleteRule(ruleId) {
    if (confirm("Are you sure you want to delete this rule?")) {
      config.rules = config.rules.filter((r) => r.id !== ruleId);
      saveConfig();
      populateRulesList();

      // Re-check the current input
      checkForSensitiveInfo();
    }
  }

  // Show the rule editor dialog
  function showRuleEditor(existingRule = null) {
    // Create the editor overlay
    const editorOverlay = document.createElement("div");
    editorOverlay.className = "rule-editor-overlay";
    editorOverlay.style.position = "fixed";
    editorOverlay.style.top = "0";
    editorOverlay.style.left = "0";
    editorOverlay.style.right = "0";
    editorOverlay.style.bottom = "0";
    editorOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
    editorOverlay.style.backdropFilter = "blur(4px)";
    editorOverlay.style.webkitBackdropFilter = "blur(4px)";
    editorOverlay.style.zIndex = "100001";
    editorOverlay.style.display = "flex";
    editorOverlay.style.justifyContent = "center";
    editorOverlay.style.alignItems = "center";
    editorOverlay.style.padding = "1rem";
    editorOverlay.style.animation = "fadeIn 0.2s ease-out";

    // Create the editor content
    const editorContent = document.createElement("div");
    editorContent.className = "privacy-checker-modal"; // Reuse main modal styles
    editorContent.style.animation = "slideIn 0.3s ease-out";

    editorContent.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${
          existingRule ? "Edit Rule" : "Add New Rule"
        }</h3>
      </div>
      
      <div class="modal-section">
        <div class="form-group">
          <label for="rule-name-input">Rule Name</label>
          <input type="text" id="rule-name-input" value="${
            existingRule ? existingRule.name : ""
          }">
        </div>
        
        <div class="form-group">
          <label for="rule-type-input">Rule Type</label>
          <select id="rule-type-input">
            <option value="string" ${
              existingRule && existingRule.type === "string" ? "selected" : ""
            }>String Match</option>
            <option value="regex" ${
              existingRule && existingRule.type === "regex" ? "selected" : ""
            }>Regular Expression</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="rule-pattern-input">Pattern</label>
          <input type="text" id="rule-pattern-input" value="${
            existingRule ? existingRule.pattern : ""
          }">
        </div>
        
        <div id="case-sensitive-container" class="form-group" ${
          existingRule && existingRule.type === "regex"
            ? 'style="display:none;"'
            : ""
        }>
          <label class="flex items-center">
            <input type="checkbox" id="case-sensitive-input" class="mr-2" ${
              existingRule &&
              existingRule.type === "string" &&
              existingRule.caseSensitive
                ? "checked"
                : ""
            }>
            <span>Case Sensitive</span>
          </label>
        </div>
        
        <div id="regex-validation-message" class="validation-message" style="display: none; color: #f87171; font-size: 12px; margin-top: 6px;"></div>
      </div>
      
      <div class="button-group">
        <button id="cancel-rule-edit" class="button button-secondary">Cancel</button>
        <button id="save-rule-edit" class="button button-primary">Save</button>
      </div>
    `;

    // Add event listeners
    const ruleTypeInput = editorContent.querySelector("#rule-type-input");
    const caseSensitiveContainer = editorContent.querySelector(
      "#case-sensitive-container"
    );
    const patternInput = editorContent.querySelector("#rule-pattern-input");
    const validationMessage = editorContent.querySelector(
      "#regex-validation-message"
    );

    ruleTypeInput.addEventListener("change", () => {
      caseSensitiveContainer.style.display =
        ruleTypeInput.value === "string" ? "block" : "none";

      // Clear validation message when switching types
      validationMessage.style.display = "none";

      // Validate regex when switching to regex type
      if (ruleTypeInput.value === "regex" && patternInput.value) {
        validateRegex(patternInput.value);
      }
    });

    // Add validation for regex pattern
    patternInput.addEventListener("input", () => {
      if (ruleTypeInput.value === "regex") {
        validateRegex(patternInput.value);
      } else {
        validationMessage.style.display = "none";
      }
    });

    // Validate regex pattern
    function validateRegex(pattern) {
      try {
        new RegExp(pattern);
        validationMessage.style.display = "none";
        return true;
      } catch (e) {
        validationMessage.textContent = `Invalid regex: ${e.message}`;
        validationMessage.style.display = "block";
        return false;
      }
    }

    const cancelButton = editorContent.querySelector("#cancel-rule-edit");
    cancelButton.addEventListener("click", (e) => {
      document.body.removeChild(editorOverlay);
      e.stopPropagation();
    });

    const saveButton = editorContent.querySelector("#save-rule-edit");
    saveButton.addEventListener("click", (e) => {
      const nameInput = editorContent.querySelector("#rule-name-input");
      const patternInput = editorContent.querySelector("#rule-pattern-input");
      const caseSensitiveInput = editorContent.querySelector(
        "#case-sensitive-input"
      );

      const name = nameInput.value.trim();
      const type = ruleTypeInput.value;
      const pattern = patternInput.value;
      const caseSensitive =
        type === "string" ? caseSensitiveInput.checked : undefined;

      if (!name || !pattern) {
        alert("Name and pattern are required");
        return;
      }

      // Validate regex before saving
      if (type === "regex" && !validateRegex(pattern)) {
        return; // Don't save if regex is invalid
      }

      if (existingRule) {
        // Update existing rule
        const ruleIndex = config.rules.findIndex(
          (r) => r.id === existingRule.id
        );
        if (ruleIndex !== -1) {
          config.rules[ruleIndex] = {
            ...config.rules[ruleIndex],
            name,
            type,
            pattern,
            ...(type === "string" ? { caseSensitive } : {}),
          };
        }
      } else {
        // Add new rule
        config.rules.push({
          id: config.nextRuleId++,
          name,
          type,
          pattern,
          active: true,
          ...(type === "string" ? { caseSensitive } : {}),
        });
      }

      saveConfig();
      populateRulesList();

      // Re-check the current input
      checkForSensitiveInfo();

      document.body.removeChild(editorOverlay);
      e.stopPropagation();
    });

    // Append to overlay
    editorOverlay.appendChild(editorContent);
    document.body.appendChild(editorOverlay);

    // Prevent click propagation
    editorContent.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Close on overlay click
    editorOverlay.addEventListener("click", (e) => {
      document.body.removeChild(editorOverlay);
      e.stopPropagation();
    });
  }

  // Toggle style settings section visibility
  function toggleStyleSettings() {
    const styleContent = document.getElementById("style-settings-content");
    const toggleText = document.getElementById("toggle-style-text");
    const toggleIcon = document.getElementById("toggle-style-icon");

    if (styleContent.style.display === "none") {
      // Show content with fade-in effect
      styleContent.style.display = "block";
      toggleText.textContent = "Hide";
      toggleIcon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
    } else {
      // Hide content
      styleContent.style.display = "none";
      toggleText.textContent = "Show";
      toggleIcon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    }
  }

  // Apply style changes in real-time without saving
  function applyStyleChanges() {
    const highlightColor = document.getElementById(
      "highlight-color-text"
    ).value;
    const borderWidth = document.getElementById("border-width-input").value;
    const warningHeaderBg = document.getElementById(
      "warning-header-text"
    ).value;

    // Apply styles temporarily without saving to config
    if (lastActiveMatches.length > 0) {
      chatInputElement.style.border = `${borderWidth} solid ${highlightColor}`;
      chatInputElement.style.boxShadow = `0 0 5px ${highlightColor}`;

      // Update warning header if visible
      const warningHeader = document.querySelector(".privacy-warning-header");
      if (warningHeader) {
        warningHeader.style.backgroundColor = warningHeaderBg;
      }

      // Update highlighted text color in warnings
      const highlightedTexts = document.querySelectorAll(
        ".privacy-warning-cell code"
      );
      highlightedTexts.forEach((elem) => {
        elem.style.backgroundColor = `rgba(${hexToRgb(highlightColor)}, 0.3)`;
      });
    }
  }

  // Save style settings
  function saveStyleSettings() {
    const highlightColor = document.getElementById(
      "highlight-color-text"
    ).value;
    const borderWidth = document.getElementById("border-width-input").value;
    const warningHeaderBg = document.getElementById(
      "warning-header-text"
    ).value;

    config.styles.highlightColor = highlightColor;
    config.styles.borderWidth = borderWidth;
    config.styles.warningHeaderBg = warningHeaderBg;

    saveConfig();

    // Update UI if there are active matches
    if (lastActiveMatches.length > 0) {
      updateChatInputStyle(true);
    }

    // Show a success message
    const saveBtn = document.getElementById("save-styles-btn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved!";
    saveBtn.disabled = true;

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  }

  // Export rules to JSON
  function exportRules() {
    // Create export data with just the rules
    const exportData = {
      rules: config.rules,
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create a downloadable blob
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "privacy-checker-rules.json";

    // Add to DOM, click it, and remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Import rules from JSON
  function importRules() {
    // Create file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    // Handle file selection
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const importedData = JSON.parse(event.target.result);

          // Validate imported data
          if (!importedData.rules || !Array.isArray(importedData.rules)) {
            throw new Error("Invalid format: No rules array found");
          }

          // Import rules - delta update (add new ones, don't replace existing)
          let addedCount = 0;

          importedData.rules.forEach((importedRule) => {
            // Check if rule exists by checking pattern and type (not just by name)
            const ruleExists = config.rules.some(
              (existingRule) =>
                existingRule.type === importedRule.type &&
                existingRule.pattern === importedRule.pattern
            );

            // Add new rule if it doesn't exist
            if (!ruleExists) {
              // Ensure the rule has a unique ID
              const newId = config.nextRuleId++;
              config.rules.push({
                ...importedRule,
                id: newId,
              });
              addedCount++;
            }
          });

          // Save changes and refresh UI
          saveConfig();
          populateRulesList();

          // Re-check the current input for matches
          checkForSensitiveInfo();

          // Show success message
          alert(`Import complete. Added ${addedCount} new rules.`);
        } catch (error) {
          console.error("Import error:", error);
          alert(`Error importing rules: ${error.message}`);
        }
      };

      reader.readAsText(file);
    });

    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  // Add CSS for the extension
  function addStyles() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .toggle-checkbox:checked {
        right: 0;
        border-color: #68D391;
      }
      .toggle-checkbox:checked + .toggle-label {
        background-color: #68D391;
      }
      .toggle-label {
        transition: background-color 0.2s ease;
      }
      .toggle-checkbox:focus {
        outline: none;
        box-shadow: none;
      }

      /* Privacy warning tooltip */
      .privacy-warning-tooltip {
        position: absolute;
        top: 100%;
        left: 0;
        background-color: #1f1f1f;
        color: white;
        padding: 0;
        border-radius: 6px;
        z-index: 1000;
        margin-top: 50px;
        font-size: 12px;
        max-width: 500px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .privacy-warning-header {
        padding: 8px 12px;
        font-weight: bold;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
      }

      .privacy-warning-title {
        display: flex;
        align-items: center;
      }

      .privacy-warning-icon {
        margin-right: 8px;
      }

      .privacy-warning-content {
        padding: 10px;
      }

      .privacy-warning-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .privacy-warning-header-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        text-align: left;
      }

      .privacy-warning-header-cell {
        padding: 5px;
      }

      .privacy-warning-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .privacy-warning-cell {
        padding: 5px;
      }

      .privacy-warning-cell code {
        padding: 2px 4px;
        border-radius: 3px;
      }

      .privacy-warning-no-matches {
        text-align: center;
        margin: 10px 0;
      }

      /* Modal styles */
      #privacy-checker-modal-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow-y: auto;
        animation: fadeIn 0.2s ease-out;
      }

      .privacy-checker-modal {
        display: inline-block;
        width: 100%;
        background-color: rgb(9, 9, 11);
        border-radius: 0.5rem;
        padding: 1rem;
        text-align: left;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform: translateY(0);
        transition: all 0.3s ease-in-out;
        max-width: 32rem;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        position: relative;
        z-index: 100000;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      /* Icon Buttons */
      .icon-button {
        background: transparent;
        border: none;
        padding: 4px;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: all 0.2s;
      }

      .icon-button:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .icon-button.edit {
        color: #60a5fa;
      }

      .icon-button.delete {
        color: #f87171;
      }

      /* Tooltip styles */
      [class*="hint--"] {
        position: relative;
        display: inline-block;
      }

      [class*="hint--"]::before,
      [class*="hint--"]::after {
        position: absolute;
        transform: translate3d(0, 0, 0);
        visibility: hidden;
        opacity: 0;
        z-index: 100000;
        pointer-events: none;
        transition: 0.3s ease;
        transition-delay: 0ms;
      }

      [class*="hint--"]::before {
        content: '';
        position: absolute;
        background: transparent;
        border: 6px solid transparent;
        z-index: 100000;
      }

      [class*="hint--"]::after {
        content: attr(aria-label);
        background: #383838;
        color: white;
        padding: 8px 10px;
        font-size: 12px;
        line-height: 16px;
        white-space: pre-wrap;
        box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
        max-width: 400px !important;
        min-width: 200px !important;
        width: auto !important;
        border-radius: 4px;
      }

      /* Ensure specific tooltip classes don't override the width */
      .hint--top::after,
      .hint--top-right::after,
      .hint--top-left::after,
      .hint--bottom::after,
      .hint--bottom-right::after,
      .hint--bottom-left::after {
        max-width: 400px !important;
        min-width: 200px !important;
        width: auto !important;
      }

      [class*="hint--"]:hover::before,
      [class*="hint--"]:hover::after {
        visibility: visible;
        opacity: 1;
      }

      .hint--top::before {
        border-top-color: #383838;
        margin-bottom: -12px;
      }

      .hint--top::after {
        margin-bottom: -6px;
      }

      .hint--top::before,
      .hint--top::after {
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
      }

      .hint--top-right::before {
        border-top-color: #383838;
        margin-bottom: -12px;
      }

      .hint--top-right::after {
        margin-bottom: -6px;
      }

      .hint--top-right::before,
      .hint--top-right::after {
        bottom: 100%;
        left: 0;
      }

      .hint--top-left::before {
        border-top-color: #383838;
        margin-bottom: -12px;
      }

      .hint--top-left::after {
        margin-bottom: -6px;
      }

      .hint--top-left::before,
      .hint--top-left::after {
        bottom: 100%;
        right: 0;
      }

      .hint--bottom::before {
        border-bottom-color: #383838;
        margin-top: -12px;
      }

      .hint--bottom::after {
        margin-top: -6px;
      }

      .hint--bottom::before,
      .hint--bottom::after {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
      }

      .hint--bottom-right::before {
        border-bottom-color: #383838;
        margin-top: -12px;
      }

      .hint--bottom-right::after {
        margin-top: -6px;
      }

      .hint--bottom-right::before,
      .hint--bottom-right::after {
        top: 100%;
        left: 0;
      }

      .hint--bottom-left::before {
        border-bottom-color: #383838;
        margin-top: -12px;
      }

      .hint--bottom-left::after {
        margin-top: -6px;
      }

      .hint--bottom-left::before,
      .hint--bottom-left::after {
        top: 100%;
        right: 0;
      }

      /* Animation keyframes */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(-20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }

      .modal-header {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .modal-title {
        font-size: 1.25rem;
        font-weight: bold;
        text-align: center;
        color: white;
      }

      .modal-section {
        margin-top: 1rem;
        background-color: rgb(39, 39, 42);
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid rgb(63, 63, 70);
      }

      .modal-section-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: rgb(161, 161, 170);
        margin-bottom: 0.25rem;
      }

      .form-group {
        margin-bottom: 0.75rem;
      }

      .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: rgb(161, 161, 170);
        margin-bottom: 0.25rem;
      }

      .form-group input,
      .form-group select {
        width: 100%;
        padding: 0.375rem 0.5rem;
        border: 1px solid rgb(63, 63, 70);
        border-radius: 0.375rem;
        background-color: rgb(39, 39, 42);
        color: white;
        font-size: 0.875rem;
        line-height: 1.25rem;
        outline: none;
      }

      .form-group input:focus,
      .form-group select:focus {
        border-color: rgb(59, 130, 246);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .button {
        display: inline-flex;
        align-items: center;
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .button-primary {
        background-color: rgb(37, 99, 235);
        color: white;
      }

      .button-primary:hover {
        background-color: rgb(29, 78, 216);
      }

      .button-secondary {
        background-color: rgb(82, 82, 91);
        color: white;
      }

      .button-secondary:hover {
        background-color: rgb(63, 63, 70);
      }

      .button-danger {
        background-color: rgb(220, 38, 38);
        color: white;
      }

      .button-danger:hover {
        background-color: rgb(185, 28, 28);
      }

      .button:disabled {
        background-color: rgb(82, 82, 91);
        cursor: not-allowed;
        opacity: 0.5;
      }

      .rule-item {
        background-color: #1d1d21;
        border: 1px solid rgb(63, 63, 70);
        border-radius: 0.375rem;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .rule-details {
        color: rgb(161, 161, 170);
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }

      .rule-details code {
        background-color: rgb(24, 24, 27);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
      }

      /* Style content transitions */
      #style-settings-content {
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      /* Icon animation */
      #toggle-style-icon {
        transition: transform 0.3s ease;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Initialize when the DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      addStyles();
      init();
    });
  } else {
    addStyles();
    init();
  }
})();
