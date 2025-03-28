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
    privacyButton.addEventListener("click", togglePrivacyModal);
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
    modalContainer.style.position = "fixed";
    modalContainer.style.top = "0";
    modalContainer.style.left = "0";
    modalContainer.style.right = "0";
    modalContainer.style.bottom = "0";
    modalContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    modalContainer.style.zIndex = "9999";
    modalContainer.style.display = "flex";
    modalContainer.style.justifyContent = "center";
    modalContainer.style.alignItems = "center";
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
    modalContent.className = "cloud-sync-modal";
    modalContent.style.backgroundColor = "white";
    modalContent.style.borderRadius = "8px";
    modalContent.style.padding = "20px";
    modalContent.style.maxWidth = "600px";
    modalContent.style.width = "100%";
    modalContent.style.maxHeight = "80vh";
    modalContent.style.overflowY = "auto";

    // Support dark mode
    modalContent.classList.add("dark:bg-zinc-900");

    // Add content to the modal
    modalContent.innerHTML = `
      <div class="text-gray-800 dark:text-white text-left text-sm">
        <div class="flex justify-center items-center mb-3">
          <h3 class="text-center text-xl font-bold">Privacy Checker Settings</h3>
          <button class="ml-2 text-blue-600 text-lg hint--bottom-left hint--rounded hint--large" aria-label="Configure privacy rules to detect sensitive information in chat messages. The extension will highlight potentially sensitive information with a red border around the chat input.">ⓘ</button>
        </div>

        <div class="space-y-3">
          <div class="mt-4 bg-gray-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-400">Enable Privacy Checker</label>
              <div class="relative inline-block w-10 mr-2 align-middle select-none">
                <input type="checkbox" id="privacy-checker-toggle" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" ${
                  config.enabled ? "checked" : ""
                }>
                <label for="privacy-checker-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
          </div>

          <div class="mt-4 bg-gray-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-400">Privacy Rules</label>
              <button id="add-rule-btn" class="px-2 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Add Rule
              </button>
            </div>
            <div id="privacy-rules-list" class="space-y-2 max-h-[300px] overflow-y-auto">
              <!-- Rules will be populated here -->
            </div>
          </div>

          <div class="flex justify-end space-x-2 mt-4">
            <button id="close-privacy-modal" class="z-1 inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Close
            </button>
          </div>
        </div>
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
    });

    // Prevent click propagation from modal content to container
    modalContent.addEventListener("click", (e) => {
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
      modalContainer.addEventListener("click", (e) => {
        if (e.target === modalContainer) {
          togglePrivacyModal();
        }
      });
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
      ruleElement.className =
        "rule-item bg-white dark:bg-zinc-700 p-2 rounded-md border border-gray-200 dark:border-gray-600";
      ruleElement.dataset.ruleId = rule.id;

      ruleElement.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input type="checkbox" class="rule-toggle mr-2" ${
              rule.active ? "checked" : ""
            }>
            <span class="rule-name font-medium">${rule.name}</span>
          </div>
          <div class="flex space-x-2">
            <button class="edit-rule-btn px-2 py-0.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700">Edit</button>
            <button class="delete-rule-btn px-2 py-0.5 text-xs text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
          </div>
        </div>
        <div class="rule-details mt-1 text-xs text-gray-600 dark:text-gray-400">
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
      toggleCheckbox.addEventListener("change", () => {
        toggleRule(rule.id, toggleCheckbox.checked);
      });

      const editButton = ruleElement.querySelector(".edit-rule-btn");
      editButton.addEventListener("click", () => {
        editRule(rule.id);
      });

      const deleteButton = ruleElement.querySelector(".delete-rule-btn");
      deleteButton.addEventListener("click", () => {
        deleteRule(rule.id);
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
    editorOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    editorOverlay.style.zIndex = "10000";
    editorOverlay.style.display = "flex";
    editorOverlay.style.justifyContent = "center";
    editorOverlay.style.alignItems = "center";

    // Create the editor content
    const editorContent = document.createElement("div");
    editorContent.className =
      "rule-editor-content bg-white dark:bg-zinc-900 rounded-lg p-4 max-w-md w-full";

    editorContent.innerHTML = `
      <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">${
        existingRule ? "Edit Rule" : "Add New Rule"
      }</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
          <input type="text" id="rule-name-input" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-zinc-700 dark:border-gray-600 dark:text-white" value="${
            existingRule ? existingRule.name : ""
          }">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Type</label>
          <select id="rule-type-input" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-zinc-700 dark:border-gray-600 dark:text-white">
            <option value="string" ${
              existingRule && existingRule.type === "string" ? "selected" : ""
            }>String Match</option>
            <option value="regex" ${
              existingRule && existingRule.type === "regex" ? "selected" : ""
            }>Regular Expression</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pattern</label>
          <input type="text" id="rule-pattern-input" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-zinc-700 dark:border-gray-600 dark:text-white" value="${
            existingRule ? existingRule.pattern : ""
          }">
        </div>
        
        <div id="case-sensitive-container" ${
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
            <span class="text-sm text-gray-700 dark:text-gray-300">Case Sensitive</span>
          </label>
        </div>
        
        <div class="flex justify-end space-x-2 pt-4">
          <button id="cancel-rule-edit" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</button>
          <button id="save-rule-edit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
        </div>
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
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(editorOverlay);
    });

    const saveButton = editorContent.querySelector("#save-rule-edit");
    saveButton.addEventListener("click", () => {
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
    });

    // Append to overlay
    editorOverlay.appendChild(editorContent);
    document.body.appendChild(editorOverlay);

    // Prevent click propagation
    editorContent.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Close on overlay click
    editorOverlay.addEventListener("click", () => {
      document.body.removeChild(editorOverlay);
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
      @media (prefers-color-scheme: dark) {
        .cloud-sync-modal {
          background-color: #1f2937;
          color: white;
        }
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
