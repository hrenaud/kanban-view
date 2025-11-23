#!/bin/bash

# Script to create a GitHub release using GitHub API
# Usage: GITHUB_TOKEN=your_token ./scripts/create-release-api.sh v1.0.0

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: GITHUB_TOKEN=your_token $0 <version>"
    echo "Example: GITHUB_TOKEN=your_token $0 v1.0.0"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is required"
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

# Escape JSON
CHANGELOG_JSON=$(echo "$CHANGELOG" | jq -Rs .)

# Create release
echo "Creating GitHub release $VERSION..."
RELEASE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/hrenaud/kanban-view/releases" \
  -d "{
    \"tag_name\": \"$VERSION\",
    \"name\": \"Release $VERSION_NUMBER\",
    \"body\": $CHANGELOG_JSON,
    \"draft\": false,
    \"prerelease\": false
  }")

RELEASE_ID=$(echo "$RELEASE_RESPONSE" | jq -r '.id')

if [ "$RELEASE_ID" = "null" ] || [ -z "$RELEASE_ID" ]; then
    echo "Error creating release:"
    echo "$RELEASE_RESPONSE" | jq .
    exit 1
fi

echo "Release created with ID: $RELEASE_ID"

# Upload assets
for file in main.js styles.css manifest.json; do
    if [ -f "$file" ]; then
        echo "Uploading $file..."
        curl -s -X POST \
          -H "Authorization: token $GITHUB_TOKEN" \
          -H "Content-Type: application/octet-stream" \
          --data-binary "@$file" \
          "https://uploads.github.com/repos/hrenaud/kanban-view/releases/$RELEASE_ID/assets?name=$file" > /dev/null
        echo "✅ $file uploaded"
    else
        echo "⚠️  $file not found, skipping"
    fi
done

echo "✅ Release $VERSION created successfully!"
echo "Visit: https://github.com/hrenaud/kanban-view/releases/tag/$VERSION"

