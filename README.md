# Kanban View for Bases

> **Important Note**: This plugin was created with AI assistance and is intended to be a **temporary replacement** while waiting for the official Kanban view developed by the product team.
> 
> **As this is a temporary plugin, bug reports will not be addressed.** This plugin will be deprecated once the official Kanban view is available.

An Obsidian plugin that adds a Kanban view for Bases with drag-and-drop support and custom configuration.

## Features

- 📋 **Kanban view** to organize your notes in Bases
- 🎯 **Dynamic columns** based on a property you select
- 🖱️ **Drag-and-drop** to change item status (mouse and touch)
- 📱 **Full touch support** for mobile with improved drag and drop UX (250ms delay to prevent conflicts with horizontal swipe)
- ⚙️ **Custom statuses** configuration via the view interface
- 🔄 **Column reordering** by drag-and-drop
- 📦 **Default "backlog" column** for items without status
- 🎨 **Modern and responsive interface**, aligned with Obsidian's native Card view
- 🏷️ **Property display** on cards with native formatting
- 📅 **Native formatting** for dates, checkboxes, tags and lists

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to "Community plugins"
3. Search for "Kanban View for Bases"
4. Click "Install" and then "Enable"

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/hrenaud/kanban-view/releases)
2. Extract the files to your vault's `.obsidian/plugins/kanban-view/` folder
3. Restart Obsidian
4. Go to Settings → Community plugins → Enable "Kanban View for Bases"

## Usage

### Getting Started

1. Create or open a Base in Obsidian
2. Click the "+" button to add a new view
3. Select "Kanban" as the view type
4. Configure the view (see Configuration below)

### Configuration

#### Status Property

The status property is the name of the frontmatter property that will determine which column each item appears in. For example, if you have a `status` property in your notes, use "status" as the status property.

**To configure:**
1. Click the "⚙️ Configure" button in the view header
2. Select the property that will be used to generate columns (e.g., "status", "state", "progress")
3. Save the configuration

#### Custom Statuses

You can define a custom list of statuses to control which columns appear in your Kanban board.

**To configure:**
1. Click the "⚙️ Configure" button
2. In the "Custom statuses" field, enter your statuses (one per line or comma-separated)
3. If left empty, the plugin will automatically use all unique statuses found in your data

**Example:**
```
To Do
In Progress
Review
Done
```

### Working with Cards

#### Moving Cards Between Columns

- **Mouse**: Click and drag a card to another column
- **Touch**: Press and hold a card for 250ms, then drag it to another column (this delay prevents conflicts with horizontal scrolling)

#### Opening Cards

- **Mouse**: Click on a card to open the corresponding file
- **Touch**: Tap on a card to open the corresponding file

#### Reordering Columns

- **Mouse**: Click and drag a column header to reorder it
- **Touch**: Press and hold a column header, then drag it to a new position
- **Note**: The "backlog" column is fixed and cannot be moved

### Backlog Column

The "backlog" column automatically contains:
- Items that don't have the status property
- Items with a status value that doesn't match any configured column

When you move an item from the backlog to another column, the status property is automatically added to the item's frontmatter.

## Examples

### Project Management

Use a `status` property with values like:
- `Backlog`
- `To Do`
- `In Progress`
- `Review`
- `Done`

### Task Tracking

Use a `state` property with values like:
- `Not Started`
- `Active`
- `Blocked`
- `Completed`

### Content Workflow

Use a `stage` property with values like:
- `Draft`
- `Editing`
- `Published`

## Troubleshooting

### Cards not appearing in columns

- Make sure the status property name matches exactly (case-sensitive)
- Check that the property exists in your note's frontmatter
- Verify the property value matches one of your configured statuses

### Drag and drop not working on mobile

- Make sure you press and hold for at least 250ms before dragging
- Try dragging vertically (up/down) rather than horizontally
- Ensure you're not scrolling the page while trying to drag

### Columns not reordering

- Make sure you're dragging from the column header, not the card
- The "backlog" column cannot be moved
- Try refreshing the view

## Notes

- This plugin requires **Obsidian 1.7.2 or higher** and the **Bases plugin** enabled
- **This plugin is temporary**: it was created with AI assistance while waiting for the official Kanban view developed by the product team
- Once the official view is available, this plugin will no longer be necessary and can be disabled

## Support

- **Releases**: Check [GitHub Releases](https://github.com/hrenaud/kanban-view/releases) for the latest version

> **Note**: As this is a temporary plugin, bug reports will not be addressed. This plugin was created as a stopgap solution while waiting for the official Kanban view from the product team. Once the official view is available, this plugin will be deprecated.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

**Renaud HÉLUIN**

- GitHub: [@hrenaud](https://github.com/hrenaud)
