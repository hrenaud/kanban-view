/**
 * Version bump script for Obsidian plugin
 * Updates manifest.json and versions.json after changeset version
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const manifestPath = join(process.cwd(), 'manifest.json');
const versionsPath = join(process.cwd(), 'versions.json');
const packageJsonPath = join(process.cwd(), 'package.json');

try {
	// Read package.json to get the new version (updated by changeset version)
	const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
	const newVersion = packageJson.version;
	
	if (!newVersion) {
		throw new Error('No version found in package.json');
	}
	
	// Update manifest.json
	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	const oldVersion = manifest.version;
	manifest.version = newVersion;
	writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
	
	// Update versions.json
	let versions = {};
	try {
		versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
	} catch (e) {
		// If versions.json doesn't exist or is invalid, create it
		versions = {};
	}
	
	if (!versions[newVersion]) {
		versions[newVersion] = manifest.minAppVersion || "1.7.2";
	}
	writeFileSync(versionsPath, JSON.stringify(versions, null, '\t') + '\n');
	
	console.log(`✅ Updated manifest.json from ${oldVersion} to ${newVersion}`);
	console.log(`✅ Updated versions.json with version ${newVersion}`);
} catch (error) {
	console.error('❌ Error updating version files:', error);
	process.exit(1);
}

