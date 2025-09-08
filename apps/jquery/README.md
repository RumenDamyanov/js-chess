# Chess - jQuery Implementation

A classic jQuery implementation of the chess game interface with unified design system.

## Overview

This implementation showcases traditional jQuery patterns for DOM manipulation and event handling, demonstrating how to build interactive chess interfaces using the classic jQuery approach. **Now features the unified UI/UX design system** for consistent appearance across all framework implementations.

## Features

- **Classic jQuery patterns**: Event delegation, DOM traversal, and manipulation
- **Animated interactions**: Smooth transitions and hover effects
- **Familiar API**: Easy-to-understand jQuery selectors and methods
- **Rapid development**: Quick prototyping with minimal setup
- **🎨 Unified Design System**: Consistent layout, spacing, and theming with other apps
- **📱 Responsive Layout**: 300px sidebars, 30px gaps, 1400px max-width (matching other apps)
- **🎯 Unified Icons**: Emoji icons for all panel titles (⚙️ Game Settings, 💾 Save Slots, etc.)

## Getting Started

```bash
# No build process needed - just serve the files
cd apps/jquery
python3 -m http.server 3002
```

Visit `http://localhost:3002`

## Key jQuery Concepts Demonstrated

- **Event delegation** for dynamic board squares
- **Chaining** for efficient DOM operations
- **Animations** for smooth user interactions
- **AJAX** for API communication
- **Plugin architecture** for extensibility

## File Structure

```text
jquery/
├── index.html              # Entry (links scss/dist/app-bundle.css only – tokens included)
├── scss/
│   ├── bundle.scss         # Imports shared main.scss + app-overrides
│   ├── app-overrides.scss  # jQuery-specific tweaks
│   └── dist/
│       └── app-bundle.css  # Compiled stylesheet (generated)
├── js/
│   └── app.js              # Main jQuery application
└── README.md               # This file
```

## Learning Objectives

This implementation teaches:

- Traditional jQuery development patterns
- Event handling and DOM manipulation
- Working with external APIs using jQuery.ajax()
- Creating interactive UI components with jQuery
- Progressive enhancement techniques
