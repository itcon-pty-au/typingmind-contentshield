# TypingMind Privacy Checker

<br/><div align="center">💗 <a href="https://buymeacoffee.com/itcon">If you found this useful, please consider buying me a coffee</a> 💗</div>

## Features

- Real-time monitoring of chat input for potentially sensitive information
- Customizable privacy rules with both string matching and regular expression support
- Visual highlighting of detected sensitive information in the chat input
- Intelligent masking of sensitive information with multiple masking modes:
  - Direct Text Masking: Replace sensitive content with customizable mask characters
  - Variable Value Masking: Specifically mask values in variable assignments
- Masking configuration options:
  - Custom masking character (default: \*)
  - Preserve original text length
  - Preserve text format (spaces and special characters)
  - Preserve specific number of characters at start/end
  - Fixed-length masking for variables
- Visual feedback for masked content:
  - Green border indicates successfully masked content
  - Red border indicates detected but unmasked sensitive content
- Detailed warning tooltip showing:
  - Rule that detected the content
  - Original sensitive text
  - Masked version of the text
  - Position of the detected content
- Built-in default rules for common sensitive data types:
  - Credit Card Numbers
  - Email Addresses
  - Social Security Numbers (SSN)
  - Password references
  - Confidential information references
  - Secret references
- Complete rule management system:
  - Add, edit, delete rules
  - Enable/disable individual rules
  - Regex validation to ensure rules work correctly
- Customizable appearance settings:
  - Highlight color for detected content
  - Border width options
  - Warning header color
  - Menu button visibility toggle
  - Customizable keyboard shortcut (default: Shift+Alt+P)
  - Menu icon placement options
- Import/export functionality to share rule sets with others
- Local storage of configurations with reasonable defaults
- Non-intrusive UI that integrates seamlessly with the TypingMind interface

## Using this extension

1. Load `https://itcon-pty-au.github.io/typingmind-privacy-checker/privacy-checker.js` into Menu > Preferences > Extension in TypingMind.
2. A new "Privacy" button will appear in the TypingMind sidebar.
3. Click on the Privacy button to access the configuration panel where you can:
   - Enable/disable the privacy checker
   - Manage privacy rules
   - Customize appearance settings
   - Import/export rule configurations
4. Alternatively, you can use the keyboard shortcut (default: Shift+Alt+P) to open the configuration panel.

## Default Rules

The extension comes with several predefined rules to detect common types of sensitive information:

1. **Credit Card Number** - Detects sequences of 13-16 digits that could be credit card numbers
2. **Email Address** - Detects standard email address formats
3. **SSN** - Detects Social Security Number patterns (xxx-xx-xxxx format)
4. **Password Reference** - Flags when the word "password" is used
5. **Confidential Reference** - Flags when the word "confidential" is used
6. **Secret Reference** - Flags when the word "secret" is used

## Managing Rules

### Adding a new rule

1. Open the Privacy configuration panel
2. Click "Add Rule"
3. Provide the following details:
   - Rule Name - A descriptive name for the rule
   - Rule Type - Choose between "String Match", "Regular Expression", or "Variable Assignment"
   - Pattern - The text pattern to detect
   - Case Sensitive (for String Match only) - Toggle if the match should be case-sensitive
   - Masking Options:
     - Enable Masking - Toggle to enable automatic masking of matched content
     - Masking Mode - Choose between "Mask Entire Text" or "Mask Variable Value"
     - Masking Character - Custom character to use for masking (default: \*)
     - Additional options based on selected mode:
       - For Direct Text: preserve length, format, start/end characters
       - For Variable Values: fixed mask length

### Editing a rule

1. Click the edit (pencil) icon next to any rule
2. Modify the rule details in the editor
3. Click "Save" to apply changes

### Deleting a rule

1. Click the delete (trash) icon next to any rule
2. Confirm the deletion when prompted

### Enabling/disabling rules

Toggle the checkbox next to any rule to enable or disable it without deleting it.

## Customizing Appearance

1. Open the Privacy configuration panel
2. Click "Show" in the Appearance section
3. Adjust:
   - Highlight Color - The color used to highlight sensitive content
   - Border Width - Choose from Thin (1px) to Very Thick (4px)
   - Warning Header Color - The background color for the warning header
   - Menu & Keyboard Controls:
     - Hide extension from menu - Option to remove the Privacy button from the sidebar
     - Keyboard Shortcut - Set a custom keyboard combination to open the panel (required if extension is hidden from menu)
   - Menu Icon Placement - Choose where to position the Privacy button in the sidebar (before or after other menu items)
4. Click "Save Styles" to apply changes

## Setting Keyboard Shortcuts

1. Open the Privacy configuration panel and go to Appearance settings
2. In the Menu & Keyboard Controls section, click the "Record" button next to the shortcut input
3. Press your desired key combination (e.g., Shift+Alt+P)
4. The shortcut will be recorded and displayed in the input field
5. Click "Save Styles" to apply the new shortcut

## Importing and Exporting Rules

### Exporting rules

1. Click the "Export" button in the Privacy configuration panel
2. A JSON file containing your rules will be downloaded

### Importing rules

1. Click the "Import" button in the Privacy configuration panel
2. Select the JSON file with the new rules
3. The system will add any new rules that don't already exist in your configuration

## How It Works

The extension monitors chat input in real-time, scanning for patterns defined in your active rules. When sensitive information is detected:

1. The chat input field is highlighted with a colored border:
   - Red border: Sensitive information detected (unmasked)
   - Green border: Sensitive information detected and masked
2. A detailed tooltip appears showing:
   - Which rules were triggered
   - The original sensitive text
   - The masked version of the text
   - The location (line and character position) of each match
3. If masking is enabled for the matched rule:
   - The sensitive text is automatically replaced with masked characters
   - The masking preserves the specified format and length settings
   - The original text remains visible in the warning tooltip for verification

This visual feedback helps you identify sensitive information and verify that it's being properly masked before sending your messages.

## Privacy and Security

- All processing is done entirely client-side
- No data is sent to any server
- Your configurations are stored only in your browser's local storage
- The extension has no external dependencies

## About me

I am a passionate developer dedicated to creating useful tools that can benefit the community. My goal is to distribute all of my projects as open source, enabling others to learn, contribute, and innovate together. If you appreciate my work and want to support my efforts, feel free to buy me a coffee ❤️!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
