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
      } else if (rule.type === "string") {
        const searchText = rule.caseSensitive ? text : text.toLowerCase();
        const searchPattern = rule.caseSensitive
          ? rule.pattern
          : rule.pattern.toLowerCase();
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
    lastActiveMatches = activeMatches;
  }

  // Update the chat input style based on whether sensitive info was detected
  function updateChatInputStyle(hasSensitiveInfo) {
    if (!chatInputElement) return;

    if (hasSensitiveInfo) {
      chatInputElement.style.border = "2px solid #ff0000";
      chatInputElement.style.boxShadow = "0 0 5px #ff0000";

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

    if (!warningElement) {
      warningElement = document.createElement("div");
      warningElement.id = "privacy-warning-tooltip";
      warningElement.style.position = "absolute";
      warningElement.style.top = "100%";
      warningElement.style.left = "0";
      warningElement.style.backgroundColor = "#ff0000";
      warningElement.style.color = "white";
      warningElement.style.padding = "8px";
      warningElement.style.borderRadius = "4px";
      warningElement.style.zIndex = "1000";
      warningElement.style.marginTop = "8px";
      warningElement.style.fontSize = "12px";
      warningElement.style.maxWidth = "400px";

      const container = chatInputElement.parentElement;
      if (container) {
        container.style.position = "relative";
        container.appendChild(warningElement);
      }
    }

    // Organize matches by rule
    const matchesByRule = {};
    lastActiveMatches.forEach((match) => {
      if (!matchesByRule[match.ruleName]) {
        matchesByRule[match.ruleName] = [];
      }
      // Only add unique matched text for each rule
      if (!matchesByRule[match.ruleName].includes(match.matchedText)) {
        matchesByRule[match.ruleName].push(match.matchedText);
      }
    });

    // Populate the warning with details about the matches
    let warningText = "Potential privacy concerns detected:";

    Object.entries(matchesByRule).forEach(([ruleName, matchedTexts]) => {
      warningText += `<br><span class="font-bold">• ${ruleName}:</span>`;

      // Show each unique matched text for this rule (limit to 3 per rule)
      const limitedMatches = matchedTexts.slice(0, 3);
      limitedMatches.forEach((text) => {
        // Safely escape HTML to prevent XSS
        const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        warningText += `<br>&nbsp;&nbsp;&nbsp;"<code class="bg-red-800 px-1 rounded">${safeText}</code>"`;
      });

      // Show ellipsis if there are more matches
      if (matchedTexts.length > 3) {
        warningText += `<br>&nbsp;&nbsp;&nbsp;(${
          matchedTexts.length - 3
        } more match${matchedTexts.length - 3 > 1 ? "es" : ""})`;
      }
    });

    warningElement.innerHTML = warningText;
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

      <div class="button-group">
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
      }

      // Prevent event propagation to avoid interfering with other modals
      e.stopPropagation();
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
            <button class="edit-rule-btn button button-secondary py-0.5 px-2 text-xs">Edit</button>
            <button class="delete-rule-btn button button-danger py-0.5 px-2 text-xs">Delete</button>
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

    ruleTypeInput.addEventListener("change", () => {
      caseSensitiveContainer.style.display =
        ruleTypeInput.value === "string" ? "block" : "none";
    });

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
      .privacy-warning {
        position: absolute;
        top: 100%;
        left: 0;
        background-color: #ff0000;
        color: white;
        padding: 8px;
        border-radius: 4px;
        z-index: 1000;
        margin-top: 8px;
        font-size: 12px;
        max-width: 300px;
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
        background-color: rgb(39, 39, 42);
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
