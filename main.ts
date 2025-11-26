/**
 * Kanban View Plugin for Bases
 * 
 * This plugin was created with AI assistance and is intended to be a temporary replacement
 * while waiting for the official Kanban view developed by the product team.
 */

import { KanbanView } from "./KanbanView";
import { Plugin } from "obsidian";

export default class KanbanViewPlugin extends Plugin {
	/**
	 * Loads the plugin and registers the Kanban view
	 */
	async onload() {
		// Register the Kanban view with configuration options
		this.registerBasesView("kanban", {
			name: "Kanban",
			icon: "lucide-columns-2",
			factory: (controller, containerEl) => {
				return new KanbanView(controller, containerEl);
			},
			options: () => [
				{
					type: "property",
					key: "statusProperty",
					displayName: "Property for columns",
					placeholder: "Select a property",
				},
				{
					type: "multitext",
					key: "statuses",
					displayName: "Custom statuses (optional)",
					default: [],
				},
			],
		});
	}

	onunload() {}
}

