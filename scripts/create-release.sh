#!/bin/bash

# Script to create a GitHub release from a tag
# Usage: ./scripts/create-release.sh v1.0.0

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 v1.0.0"
    exit 1
fi

# Remove 'v' prefix if present
VERSION_NUMBER=${VERSION#v}

# Extract changelog for this version
CHANGELOG=$(awk "/^## $VERSION_NUMBER/,/^## /" CHANGELOG.md | sed '$d' | sed '1d')

if [ -z "$CHANGELOG" ]; then
    echo "Warning: No changelog found for version $VERSION_NUMBER"
    CHANGELOG="Release $VERSION_NUMBER"
fi

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "Creating GitHub release using GitHub CLI..."
    gh release create "$VERSION" \
        --title "Release $VERSION_NUMBER" \
        --notes "$CHANGELOG" \
        main.js \
        styles.css \
        manifest.json
else
    echo "GitHub CLI not found. Please install it or create the release manually:"
    echo ""
    echo "1. Go to https://github.com/hrenaud/kanban-view/releases/new"
    echo "2. Select tag: $VERSION"
    echo "3. Title: Release $VERSION_NUMBER"
    echo "4. Description:"
    echo "$CHANGELOG"
    echo ""
    echo "5. Attach files: main.js, styles.css, manifest.json"
    echo "6. Click 'Publish release'"
fi

