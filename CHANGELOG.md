# kanban-view

## 1.1.2

### Patch Changes

- Align CSS styles with native Obsidian Card view

  - Updated `.kanban-property-label` to match `.bases-cards-label` styles
  - Updated `.kanban-property-value` to match `.bases-rendered-value` styles
  - Improved display handling for different property types (text, number, lists, tags, checkboxes, dates)

- Update documentation and scripts

  - Update description references: "Obsidian Bases" → "Bases" and "Obsidian team" → "product team"
  - Update tag naming convention: remove 'v' prefix from tags (use 1.1.1 instead of v1.1.1)
  - Update GitHub Actions workflow and release scripts to match new tag format

## 1.1.1

### Patch Changes

- Align CSS styles with native Obsidian Card view

  - Updated `.kanban-property-label` to match `.bases-cards-label` styles
  - Updated `.kanban-property-value` to match `.bases-rendered-value` styles
  - Improved display handling for different property types (text, number, lists, tags, checkboxes, dates)

## 1.1.0

### Minor Changes

- Improved touch drag and drop UX

  - Added 250ms delay before drag starts (like Trello) to prevent conflicts with horizontal swipe
  - Drag only triggers for primarily vertical movements
  - Added visual feedback (card lift effect) when drag is ready
  - Better handling of touch events to distinguish taps from drags

## 1.0.0

### Initial Release

Initial release of Kanban View for Obsidian Bases.

#### Features

- Kanban view to organize notes in Bases with drag-and-drop support
- Manual selection of property to generate columns
- Full touch support for mobile devices
- Column reordering by drag-and-drop
- Default "backlog" column for items without status
- Modern and responsive interface aligned with Obsidian's native Card view
- Display of selected properties on cards
- Native formatting of dates, checkboxes, tags and lists
- Support for all Obsidian Bases property types

This plugin was created with AI assistance as a temporary replacement while waiting for the official Kanban view developed by the product team.
