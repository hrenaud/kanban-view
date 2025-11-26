# Contributing to Kanban View for Bases

> **Important**: This is a **temporary plugin** created while waiting for the official Kanban view from the Obsidian team. As such, **bug reports will not be addressed** and the plugin will be deprecated once the official view is available. However, contributions are still welcome if you want to improve the plugin for your own use.

This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Release Process](#release-process)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Obsidian 1.7.2 or higher
- Git
- A basic understanding of TypeScript and Obsidian plugin development

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone git@github.com:YOUR_USERNAME/kanban-view.git
   cd kanban-view
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream git@github.com:hrenaud/kanban-view.git
   ```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Plugin

```bash
# Development mode (watch for changes)
npm run dev

# Production build
npm run build
```

### Link to Obsidian

1. Build the plugin: `npm run build`
2. Create a symlink or copy the plugin folder to your Obsidian vault:
   ```bash
   # On macOS/Linux
   ln -s /path/to/kanban-view /path/to/vault/.obsidian/plugins/kanban-view
   
   # Or copy the files
   cp -r . /path/to/vault/.obsidian/plugins/kanban-view/
   ```
3. Enable the plugin in Obsidian Settings → Community plugins

### Development Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test your changes in Obsidian
4. Build the plugin: `npm run build`
5. Commit your changes (see [Coding Standards](#coding-standards))
6. Push to your fork and create a Pull Request

## Project Structure

```
kanban-view/
├── .changeset/          # Changesets for version management
│   ├── config.json      # Changesets configuration
│   └── version-bump.mjs # Script to update manifest.json and versions.json
├── .github/
│   └── workflows/
│       └── release.yml  # GitHub Actions workflow for releases
├── scripts/             # Utility scripts
│   ├── create-release.sh        # Release creation script (GitHub CLI)
│   └── create-release-api.sh    # Release creation script (API)
├── main.ts              # Plugin entry point
├── KanbanView.ts        # Main Kanban view class
├── KanbanCard.ts        # Card creation and interaction management
├── PropertyRenderer.ts  # Rendering of different property types
├── KanbanConfigModal.ts # Configuration modal (not currently used)
├── types.ts             # TypeScript type definitions
├── styles.css           # CSS styles for the Kanban interface
├── manifest.json        # Plugin manifest
├── package.json         # NPM package configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # User documentation
```

### Key Files

- **`main.ts`**: Registers the Kanban view with Obsidian
- **`KanbanView.ts`**: Main view class that extends `BasesView`, handles rendering, drag & drop, and settings
- **`KanbanCard.ts`**: Manages card creation, drag & drop events (mouse and touch), and click handlers
- **`PropertyRenderer.ts`**: Handles rendering of different property types (dates, checkboxes, tags, lists, etc.)
- **`styles.css`**: All CSS styles, aligned with Obsidian's native Card view

## Development Workflow

### Making Changes

1. **Create a changeset** for your changes:
   ```bash
   npm run changeset
   ```
   This will prompt you to:
   - Select the type of change (major, minor, or patch)
   - Write a summary of the change

2. **Make your code changes**

3. **Test your changes** in Obsidian

4. **Build the plugin**:
   ```bash
   npm run build
   ```

5. **Check changeset status**:
   ```bash
   npm run changeset:status
   ```

### Code Organization

- **Separation of Concerns**: 
  - `KanbanView.ts` handles view-level logic (columns, settings, data)
  - `KanbanCard.ts` handles card-level logic (creation, events)
  - `PropertyRenderer.ts` handles property rendering logic

- **Event Handling**:
  - Mouse events for desktop drag & drop
  - Touch events for mobile drag & drop (with 250ms delay to prevent conflicts with horizontal swipe)
  - Distinction between clicks and drags based on movement threshold

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Add JSDoc comments for public methods and classes
- Use meaningful variable and function names
- Follow existing code style and patterns

### CSS

- Use Obsidian CSS variables (e.g., `var(--text-normal)`, `var(--background-primary)`)
- Match native Obsidian Card view styles where possible
- Use semantic class names (e.g., `.kanban-card`, `.kanban-column`)

### Git Commits

Follow conventional commit messages:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(card): add visual feedback during drag delay
fix(touch): prevent drag on horizontal swipe
docs(readme): update installation instructions
```

### Code Comments

- Write comments in English
- Use JSDoc for public APIs
- Explain "why" not "what" in complex logic
- Keep comments up to date with code changes

## Testing

### Manual Testing

1. Test on desktop (mouse drag & drop)
2. Test on mobile/touch device (touch drag & drop)
3. Test with different property types (text, number, date, checkbox, tags, lists)
4. Test column reordering
5. Test with empty data
6. Test with various status configurations

### Testing Checklist

- [ ] Cards can be dragged between columns
- [ ] Cards can be clicked to open files
- [ ] Columns can be reordered (except backlog)
- [ ] Touch drag & drop works with 250ms delay
- [ ] Horizontal swipe doesn't trigger drag
- [ ] All property types render correctly
- [ ] Empty values show dash (—)
- [ ] Backlog column contains items without status

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

### Version Bumping

1. **Add a changeset** when making changes:
   ```bash
   npm run changeset
   ```

2. **Version the changes** when ready to release:
   ```bash
   npm run version
   ```
   This will:
   - Update `package.json` version
   - Update `manifest.json` version
   - Update `versions.json`
   - Create/update `CHANGELOG.md`
   - Delete used changesets

3. **Commit the version bump**:
   ```bash
   git add .
   git commit -m "chore: version bump to X.Y.Z"
   ```

4. **Create and push a tag**:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin main
   git push origin vX.Y.Z
   ```

5. **GitHub Action** will automatically create the release with assets

### Release Types

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

## Submitting Changes

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit them following the [coding standards](#coding-standards)

4. **Add a changeset**:
   ```bash
   npm run changeset
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub:
   - Provide a clear title and description
   - Reference any related issues
   - Ensure all checks pass

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add a changeset for your changes
- Test your changes thoroughly
- Ensure the build passes: `npm run build`

### Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, a maintainer will merge your PR

## Common Tasks

### Adding a New Property Type

1. Update `PropertyRenderer.ts`:
   - Add a new `render*` method
   - Add type inference logic in `inferPropertyType`
   - Add value extraction logic if needed

2. Update `styles.css` if needed for styling

3. Test with the new property type

4. Update documentation if needed

### Fixing a Bug

1. Reproduce the bug
2. Identify the root cause
3. Write a fix
4. Test the fix
5. Add a changeset (patch)
6. Submit a PR

### Adding a Feature

1. Discuss the feature in an issue first (if major)
2. Create a feature branch
3. Implement the feature
4. Add tests/documentation
5. Add a changeset (minor or major)
6. Submit a PR

## Getting Help

- **Documentation**: Check the README and code comments
- **Note**: As this is a temporary plugin, bug reports and feature requests will not be addressed. This plugin will be deprecated once the official Kanban view is available.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

