# Kanban View for Bases

> **Important Note**: This plugin was created with AI assistance and is intended to be a **temporary replacement** while waiting for the official Kanban view developed by the Obsidian team.

An Obsidian plugin that adds a Kanban view for Obsidian Bases with drag-and-drop support and custom configuration.

## Features

- 📋 Kanban view to organize your notes in Bases
- 🎯 Manual selection of the property to generate columns
- 🖱️ Drag-and-drop to change item status (mouse and touch)
- 📱 Full touch support for mobile
- ⚙️ Configuration of statuses/columns via the view interface
- 🔄 Column reordering by drag-and-drop
- 📦 Default "backlog" column for items without status
- 🎨 Modern and responsive interface, aligned with Obsidian's native Card view
- 🏷️ Display of selected properties on cards
- 📅 Native formatting of dates, checkboxes, tags and lists

## Installation

### Development

1. Install dependencies:
```bash
npm install
```

2. Compile the plugin:
```bash
npm run build
```

3. Enable the plugin in Obsidian:
   - Open Obsidian settings
   - Go to "Community plugins"
   - Enable "Kanban View for Bases"

## Usage

1. Create or open a Base in Obsidian
2. Add a new view of type "Kanban"
3. Configure the view:
   - Click the "⚙️ Configure" button
   - Select the property that will be used to generate columns (e.g., "status", "state", "progress")
   - Optionally, define a custom list of statuses
4. Your base items will be organized in columns according to the selected property
5. Move items between columns to change their status

## Configuration

### Status Property

The status property is the name of the frontmatter property that will determine in which column each item appears. For example, if you have a `status` property in your notes, use "status" as the status property.

### Custom Statuses

You can define a custom list of statuses. If you leave this field empty, the plugin will automatically use all unique statuses found in your data.

## Development

### Project Structure

- `main.ts` - Plugin entry point
- `KanbanView.ts` - Main Kanban view class
- `KanbanCard.ts` - Card creation and interaction management
- `PropertyRenderer.ts` - Rendering of different property types (dates, checkboxes, tags, etc.)
- `KanbanConfigModal.ts` - Configuration modal (not currently used)
- `types.ts` - TypeScript definitions
- `styles.css` - CSS styles for the Kanban interface

### Compilation

```bash
# Development mode (watch)
npm run dev

# Production mode
npm run build
```

## Release Management

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions and releases.

### Adding a Changeset

When making changes, add a changeset:

```bash
npm run changeset
```

This will prompt you to:
1. Select the type of change (major, minor, or patch)
2. Write a summary of the change

### Releasing

When ready to release:

1. **Version the changes** (updates version in package.json, manifest.json, versions.json, and creates CHANGELOG.md):
   ```bash
   npm run version
   ```

2. **Commit the changes**:
   ```bash
   git add .
   git commit -m "chore: version bump"
   git push
   ```

3. **Create a GitHub release** with the new version tag

### Checking Status

To see pending changesets:

```bash
npm run changeset:status
```

## Notes

- This plugin requires Obsidian 1.7.2 or higher and the Bases plugin enabled.
- **This plugin is temporary**: it was created with AI assistance while waiting for the official Kanban view developed by the Obsidian team.
- Once the official view is available, this plugin will no longer be necessary and can be disabled.
