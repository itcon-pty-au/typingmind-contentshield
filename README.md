# TypingMind Privacy Checker

<div align="center">💗 <a href="https://buymeacoffee.com/itcon">If you found this useful, please consider buying me a coffee</a> 💗</div>

## Features

- Real-time monitoring of chat input for potentially sensitive information
- Customizable privacy rules with both string matching and regular expression support
- Visual highlighting of detected sensitive information in the chat input
- Detailed warning tooltip showing exactly what sensitive content was detected and where
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
   - Rule Type - Choose between "String Match" or "Regular Expression"
   - Pattern - The text pattern to detect
   - Case Sensitive (for String Match only) - Toggle if the match should be case-sensitive

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
4. Click "Save Styles" to apply changes

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

1. The chat input field is highlighted with a colored border
2. A detailed tooltip appears showing:
   - Which rules were triggered
   - The exact text that matched
   - The location (line and character position) of each match

This visual feedback helps you identify and avoid sharing sensitive information in your conversations.

## Privacy and Security

- All processing is done entirely client-side
- No data is sent to any server
- Your configurations are stored only in your browser's local storage
- The extension has no external dependencies

## About me

I am a passionate developer dedicated to creating useful tools that can benefit the community. My goal is to distribute all of my projects as open source, enabling others to learn, contribute, and innovate together. If you appreciate my work and want to support my efforts, feel free to buy me a coffee ❤️!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
