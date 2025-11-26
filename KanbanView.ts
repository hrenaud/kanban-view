/**
 * KanbanView - Kanban view for Bases
 * 
 * This plugin was created with AI assistance and is intended to be a temporary replacement
 * while waiting for the official Kanban view developed by the product team.
 */

import { BasesPropertyId, BasesView, QueryController } from "obsidian";

import { KanbanCard } from "./KanbanCard";
import { KanbanViewSettings } from "./types";
import { PropertyRenderer } from "./PropertyRenderer";

export class KanbanView extends BasesView {
	settings: KanbanViewSettings = {
		statusProperty: "",
		statuses: [],
	};

	type = "kanban" as const;
	containerEl: HTMLElement;
	controller: QueryController;
	statusPropertyId: BasesPropertyId | null = null;
	propertyTypes: Record<string, string> = {}; // Cache of property types
	propertyRenderer: PropertyRenderer;
	kanbanCard: KanbanCard;

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller);
		this.controller = controller;
		this.containerEl = containerEl;
	}

	async onload() {
		super.onload();
		await this.loadPropertyTypes();
		
		// Initialize the property renderer
		this.propertyRenderer = new PropertyRenderer();
		this.propertyRenderer.setPropertyTypes(this.propertyTypes);
		
		// Initialize the card manager
		this.kanbanCard = new KanbanCard(
			this.propertyRenderer,
			this.propertyTypes,
			this.config,
			this.settings,
			this.app,
			(itemId: string, newStatus: string) => this.moveItemToStatus(itemId, newStatus)
		);
		
		this.loadSettings();
		this.render();
	}

	/**
	 * Loads property types from .obsidian/types.json
	 */
	async loadPropertyTypes() {
		try {
			const typesFile = this.app.vault.getAbstractFileByPath('.obsidian/types.json');
			if (typesFile) {
				const typesContent = await this.app.vault.read(typesFile as any);
				const types = JSON.parse(typesContent);
				this.propertyTypes = types.types || {};
				
				// Update the renderer if already initialized
				if (this.propertyRenderer) {
					this.propertyRenderer.setPropertyTypes(this.propertyTypes);
				}
			}
		} catch (e) {
			this.propertyTypes = {};
		}
	}

	/**
	 * Loads settings from the view configuration
	 */
	loadSettings() {
		// Load settings from the view configuration
		if (!this.config) {
			return;
		}
		
		// Get the status property (can be a BasesPropertyId or a string)
		this.statusPropertyId = this.config.getAsPropertyId("statusProperty");
		if (this.statusPropertyId) {
			// Get the property name from the ID
			this.settings.statusProperty = this.config.getDisplayName(this.statusPropertyId);
		} else {
			// Fallback: try to retrieve as string
			const statusProperty = this.config.get("statusProperty");
			if (statusProperty && typeof statusProperty === "string") {
				this.settings.statusProperty = statusProperty;
				// Try to find the corresponding ID
				this.statusPropertyId = this.allProperties.find(
					(propId) => this.config.getDisplayName(propId) === statusProperty
				) || null;
				// Property loaded from string
			}
		}
		
		// Get custom statuses
		const statuses = this.config.get("statuses");
		if (statuses && Array.isArray(statuses)) {
			this.settings.statuses = statuses as string[];
		}
		
		// Get column order
		const columnOrder = this.config.get("columnOrder");
		if (columnOrder && Array.isArray(columnOrder)) {
			this.settings.columnOrder = columnOrder as string[];
		}
	}

	/**
	 * Saves settings to the view configuration
	 */
	saveSettings() {
		// Save settings to the view configuration
		if (!this.config) return;
		
		// If we already have a statusPropertyId, use it
		if (this.statusPropertyId) {
			this.config.set("statusProperty", this.statusPropertyId);
		} else {
			// Otherwise, find the BasesPropertyId corresponding to the property name
			const propertyId = this.allProperties.find(
				(propId) => this.config.getDisplayName(propId) === this.settings.statusProperty
			);
			
			if (propertyId) {
				// Save the property ID (format expected by Obsidian)
				this.config.set("statusProperty", propertyId);
				this.statusPropertyId = propertyId;
			} else {
				// Fallback: save as string if ID is not found
				this.config.set("statusProperty", this.settings.statusProperty);
			}
		}
		
		this.config.set("statuses", this.settings.statuses);
		if (this.settings.columnOrder) {
			this.config.set("columnOrder", this.settings.columnOrder);
		}
	}

	/**
	 * Called when the base data is updated
	 */
	onDataUpdated() {
		// Reload settings as they may have changed via native options
		this.loadSettings();
		this.render();
	}

	/**
	 * Renders the complete Kanban view with all columns and cards
	 */
	render() {
		const container = this.containerEl;
		container.empty();
		container.addClass("kanban-view-container");

		// Get data from the base
		const data = this.data;
		if (!data || !data.data || data.data.length === 0) {
			container.createEl("div", {
				text: "No data available. Configure the view to get started.",
				cls: "kanban-empty",
			});
			return;
		}


		// Get configured statuses or from data
		const statuses = this.getStatuses(data);

		// Always display at least the backlog column
		if (statuses.length === 0) {
			statuses.push("backlog");
		}

		// Create the main container
		const kanbanContainer = container.createDiv("kanban-container");
		kanbanContainer.classList.add("kanban-columns-container");
		
		// Read the computed gap after rendering and calculate drop zone widths
		// Use requestAnimationFrame to ensure the style is applied
		requestAnimationFrame(() => {
			const computedGap = getComputedStyle(kanbanContainer).gap;
			if (computedGap) {
				// Extract the numeric value (remove "px")
				const gapValue = parseFloat(computedGap);
				if (!isNaN(gapValue)) {
					// Calculate 3 times the gap (which is already divided by 2) for drop zones
					const dropZoneWidth = gapValue * 3;
					const dropZoneActiveWidth = gapValue * 3.6;
					kanbanContainer.style.setProperty("--kanban-drop-zone-width", `${dropZoneWidth}px`);
					kanbanContainer.style.setProperty("--kanban-drop-zone-active-width", `${dropZoneActiveWidth}px`);
				}
			}
		});
		
		this.setupContainerDragEvents(kanbanContainer);

		// Create columns with drop zones between them
		statuses.forEach((status, index) => {
			// Add a drop zone before each column (except the first)
			if (index > 0) {
				const dropZone = this.createColumnDropZone(statuses[index - 1], status);
				kanbanContainer.appendChild(dropZone);
			}
			
			const column = this.createColumn(status, data);
			kanbanContainer.appendChild(column);
		});
		
		// Add a drop zone at the end
		if (statuses.length > 0) {
			const lastDropZone = this.createColumnDropZone(statuses[statuses.length - 1], null);
			kanbanContainer.appendChild(lastDropZone);
		}
	}
	
	/**
	 * Creates a drop zone for reordering columns
	 * @param beforeStatus - The status of the column before this zone
	 * @param afterStatus - The status of the column after this zone (null if it's the last one)
	 */
	createColumnDropZone(beforeStatus: string, afterStatus: string | null): HTMLElement {
		const dropZone = document.createElement("div");
		dropZone.className = "kanban-column-drop-zone";
		dropZone.setAttribute("data-before", beforeStatus);
		if (afterStatus) {
			dropZone.setAttribute("data-after", afterStatus);
		}
		
		// Event handlers for the drop zone
		dropZone.addEventListener("dragenter", (e) => {
			// Check if the container has the column-dragging class (indicates a column is being dragged)
			const container = dropZone.closest(".kanban-container");
			if (container && container.classList.contains("column-dragging")) {
				e.preventDefault();
				e.stopPropagation();
				dropZone.classList.add("drop-zone-active");
			}
		});
		
		dropZone.addEventListener("dragover", (e) => {
			// Check if the container has the column-dragging class (indicates a column is being dragged)
			const container = dropZone.closest(".kanban-container");
			if (container && container.classList.contains("column-dragging")) {
				e.preventDefault();
				e.stopPropagation();
				e.dataTransfer!.dropEffect = "move";
				dropZone.classList.add("drop-zone-active");
			}
		});

		dropZone.addEventListener("dragleave", (e) => {
			// Don't remove the class if entering a child element
			const rect = dropZone.getBoundingClientRect();
			const x = e.clientX;
			const y = e.clientY;
			if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
				dropZone.classList.remove("drop-zone-active");
			}
		});

		dropZone.addEventListener("drop", (e) => {
			e.preventDefault();
			e.stopPropagation();
			dropZone.classList.remove("drop-zone-active");

			const draggedStatus = e.dataTransfer!.getData("text/plain");
			if (draggedStatus && draggedStatus !== "backlog") {
				const afterStatusValue = dropZone.getAttribute("data-after");
				if (afterStatusValue) {
					// Insert before the next column
					this.reorderColumns(draggedStatus, afterStatusValue);
				} else {
					// Insert at the end
					const currentStatuses = this.getStatuses(this.data);
					const lastStatus = currentStatuses[currentStatuses.length - 1];
					if (lastStatus && lastStatus !== draggedStatus) {
						// Move after the last column
						const draggedIndex = currentStatuses.indexOf(draggedStatus);
						const newOrder = [...currentStatuses];
						newOrder.splice(draggedIndex, 1);
						newOrder.push(draggedStatus);
						
						this.settings.columnOrder = newOrder;
						this.saveSettings();
						this.render();
					}
				}
			}
		});
		
		return dropZone;
	}

	/**
	 * Gets the list of statuses to display (backlog + configured or extracted statuses)
	 * @param data - The base data
	 * @returns List of statuses in the configured order
	 */
	getStatuses(data: any): string[] {
		const allStatuses: string[] = [];
		
		// Always add "backlog" first
		allStatuses.push("backlog");

		// If statuses are configured, use them
		if (this.settings.statuses && this.settings.statuses.length > 0) {
			allStatuses.push(...this.settings.statuses);
		} else {
			// Otherwise, extract unique statuses from data
			if (this.settings.statusProperty && data.data) {
				const statusSet = new Set<string>();
				data.data.forEach((entry: any) => {
					const statusValue = this.getPropertyValue(entry, this.settings.statusProperty);
					if (statusValue) {
						statusSet.add(String(statusValue));
					}
				});
				allStatuses.push(...Array.from(statusSet).sort());
			}
		}

		// If an order is saved, use it
		if (this.settings.columnOrder && this.settings.columnOrder.length > 0) {
			// Filter to keep only columns that still exist
			const orderedStatuses = this.settings.columnOrder.filter(status => 
				allStatuses.includes(status)
			);
			// Add new columns at the end
			const newStatuses = allStatuses.filter(status => 
				!this.settings.columnOrder!.includes(status)
			);
			return [...orderedStatuses, ...newStatuses];
		}

		return allStatuses;
	}

	/**
	 * Gets a property value from an entry
	 * @param entry - The base entry
	 * @param propertyName - The property name
	 * @returns The property value or null
	 */
	getPropertyValue(entry: any, propertyName: string): any {
		if (!entry) return null;

		// Use statusPropertyId if available (recommended method)
		if (this.statusPropertyId && entry.getValue) {
			try {
				const value = entry.getValue(this.statusPropertyId);
				if (value === null) return null;
				
				// Convert Value to string
				// Value types can be StringValue, NumberValue, etc.
				if (value && typeof value === 'object') {
					// Try to access the value property or toString
					if ('value' in value) {
						return String((value as any).value);
					}
					if (typeof (value as any).toString === 'function') {
						return String((value as any).toString());
					}
				}
				return String(value);
			} catch (e) {
				// Error retrieving the value
			}
		}

		// Fallback: search by property name in entry properties
		if (propertyName && entry.properties && entry.properties[propertyName] !== undefined) {
			const val = entry.properties[propertyName];
			return val !== null && val !== undefined ? String(val) : null;
		}

		return null;
	}

	/**
	 * Creates a Kanban column for a given status
	 * @param status - The column status
	 * @param data - The base data
	 * @returns The HTML element of the column
	 */
	createColumn(status: string, data: any): HTMLElement {
		const column = document.createElement("div");
		column.className = "kanban-column";
		column.setAttribute("data-status", status);
		
		// Backlog is not movable
		if (status !== "backlog") {
			column.setAttribute("draggable", "true");
			column.classList.add("kanban-column-draggable");
		} else {
			column.classList.add("kanban-column-fixed");
		}

		// Column header
		const header = column.createDiv("kanban-column-header");
		header.createEl("h3", { text: status, cls: "kanban-column-title" });
		const count = this.getItemsForStatus(status, data).length;
		header.createEl("span", {
			text: `${count}`,
			cls: "kanban-column-count",
		});

		// Column body (drop zone)
		const body = column.createDiv("kanban-column-body");
		body.setAttribute("data-status", status);

		// Add items
		const items = this.getItemsForStatus(status, data);
		items.forEach((item) => {
			const card = this.kanbanCard.createCard(item);
			body.appendChild(card);
		});

		// Configure drag and drop for cards
		this.setupDragAndDrop(column, body);

		// Configure drag and drop for the column itself
		this.setupColumnDragAndDrop(column);

		return column;
	}

	/**
	 * Filters items for a given status
	 * @param status - The status to search for
	 * @param data - The base data
	 * @returns List of items matching the status
	 */
	getItemsForStatus(status: string, data: any): any[] {
		if (!data.data) {
			return [];
		}

		// Backlog column: items without property or with unrecognized value
		if (status === "backlog") {
			if (!this.settings.statusProperty) {
				// If no property configured, all items go to backlog
				return data.data;
			}

			// Get the list of valid statuses (without backlog)
			const validStatuses = this.getValidStatuses();
			
			return data.data.filter((entry: any) => {
				const statusValue = this.getPropertyValue(entry, this.settings.statusProperty);
				// Item without value or with unrecognized value
				return !statusValue || !validStatuses.includes(String(statusValue));
			});
		}

		// Other columns: items with the corresponding value
		if (!this.settings.statusProperty) {
			return [];
		}

		return data.data.filter((entry: any) => {
			const statusValue = this.getPropertyValue(entry, this.settings.statusProperty);
			return String(statusValue) === status;
		});
	}

	getValidStatuses(): string[] {
		// Return the list of valid statuses (without backlog)
		if (this.settings.statuses && this.settings.statuses.length > 0) {
			return this.settings.statuses;
		}
		
		// If no custom statuses, extract from data
		if (!this.data || !this.data.data || !this.settings.statusProperty) {
			return [];
		}

		const statusSet = new Set<string>();
		this.data.data.forEach((entry: any) => {
			const statusValue = this.getPropertyValue(entry, this.settings.statusProperty);
			if (statusValue) {
				statusSet.add(String(statusValue));
			}
		});

		return Array.from(statusSet);
	}


	/**
	 * Formats a date in Obsidian format (not currently used)
	 */
	formatDate(date: Date): string {
		// Use Obsidian date format
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	}

	formatDateTime(date: Date): string {
		// Use Obsidian date and time format
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	/**
	 * Configures drag and drop for cards in a column
	 * @param column - The column element
	 * @param body - The column body (drop zone)
	 */
	setupDragAndDrop(column: HTMLElement, body: HTMLElement) {
		// Mouse support
		body.addEventListener("dragover", (e) => {
			e.preventDefault();
			e.dataTransfer!.dropEffect = "move";
			body.classList.add("drag-over");
		});

		body.addEventListener("dragleave", () => {
			body.classList.remove("drag-over");
		});

		body.addEventListener("drop", async (e) => {
			e.preventDefault();
			body.classList.remove("drag-over");

			const itemId = e.dataTransfer!.getData("text/plain");
			const newStatus = body.getAttribute("data-status");

			if (itemId && newStatus) {
				await this.moveItemToStatus(itemId, newStatus);
			}
		});

		// Touch support for drops
		body.addEventListener("touchmove", (e) => {
			// Check if a card is being dragged
			const draggingCard = document.querySelector(".kanban-card.dragging");
			if (draggingCard) {
				const touch = e.touches[0];
				const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
				if (elementBelow?.closest(".kanban-column-body") === body) {
					body.classList.add("drag-over");
				} else {
					body.classList.remove("drag-over");
				}
			}
		}, { passive: true });
	}

	/**
	 * Moves an item to a new status by updating its frontmatter
	 * @param itemId - The file path
	 * @param newStatus - The new status (or "backlog" to clear the property)
	 */
	async moveItemToStatus(itemId: string, newStatus: string) {
		if (!this.settings.statusProperty || !itemId) return;

		// Update the status property
		try {
			const file = this.app.vault.getAbstractFileByPath(itemId);
			if (!file || !("stat" in file)) return;

			// If moving to backlog, clear the property
			if (newStatus === "backlog") {
				await this.app.fileManager.processFrontMatter(
					file as any,
					(frontmatter) => {
						if (frontmatter && frontmatter[this.settings.statusProperty] !== undefined) {
							delete frontmatter[this.settings.statusProperty];
							// If frontmatter is empty after deletion, we can leave it empty
						}
					}
				);
			} else {
				// Otherwise, update with the new value
				await this.app.fileManager.processFrontMatter(
					file as any,
					(frontmatter) => {
						if (!frontmatter) {
							frontmatter = {};
						}
						frontmatter[this.settings.statusProperty] = newStatus;
					}
				);
			}

			// The view will be automatically updated via onDataUpdated()
		} catch (error) {
			// Error moving the item
		}
	}

	/**
	 * Configures drag events at the container level to handle column dragging
	 * @param container - The main container of columns
	 */
	setupContainerDragEvents(container: HTMLElement) {
		// Store the container reference for handlers
		const self = this;
		
		// Listen to drag events at the document level to capture all drags
		const handleDragStart = (e: DragEvent) => {
			const target = e.target as HTMLElement;
			// Check if it's a draggable column (not a card)
			const column = target.closest(".kanban-column-draggable");
			if (column && !target.closest(".kanban-card")) {
				// It's a column drag, show drop zones
				container.classList.add("column-dragging");
			}
		};

		const handleDragEnd = () => {
			container.classList.remove("column-dragging");
			// Clean up all active drop zones
			container.querySelectorAll(".drop-zone-active").forEach(el => {
				el.classList.remove("drop-zone-active");
			});
		};

		// Use capture to ensure we capture the event
		document.addEventListener("dragstart", handleDragStart, true);
		document.addEventListener("dragend", handleDragEnd, true);

		// Clean up listeners when the view is destroyed
		this.register(() => {
			document.removeEventListener("dragstart", handleDragStart, true);
			document.removeEventListener("dragend", handleDragEnd, true);
		});
	}

	/**
	 * Configures drag and drop for reordering columns
	 * @param column - The column element to make draggable
	 */
	setupColumnDragAndDrop(column: HTMLElement) {
		const status = column.getAttribute("data-status");
		
		// Backlog is not movable
		if (status === "backlog") {
			return;
		}
		
		const header = column.querySelector(".kanban-column-header");
		if (!header) return;

		let isColumnDragging = false;
		let touchStartX = 0;
		let touchStartY = 0;
		let draggedColumn: HTMLElement | null = null;
		const DRAG_THRESHOLD = 5;

		// Mouse support
		column.addEventListener("dragstart", (e) => {
			// Check if dragging from header (to reorder) or from a card
			const target = e.target as HTMLElement;
			if (target.closest(".kanban-card")) {
				// If it's a card, let default behavior handle it
				return;
			}
			
			// Check if dragging from header
			if (!target.closest(".kanban-column-header")) {
				return;
			}
			
			// Otherwise, it's a column drag
			e.stopPropagation();
			column.classList.add("column-dragging");
			e.dataTransfer!.effectAllowed = "move";
			e.dataTransfer!.setData("text/plain", status || "");
			
			// Add class to container to show drop zones
			const container = column.closest(".kanban-container");
			if (container) {
				container.classList.add("column-dragging");
			}
		});

		column.addEventListener("dragend", () => {
			column.classList.remove("column-dragging");
			// Remove class from container
			const container = column.closest(".kanban-container");
			if (container) {
				container.classList.remove("column-dragging");
				// Clean up all active drop zones
				container.querySelectorAll(".drop-zone-active").forEach(el => {
					el.classList.remove("drop-zone-active");
				});
			}
		});

		// Touch support for columns
		header.addEventListener("touchstart", (e: TouchEvent) => {
			const touch = e.touches[0];
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
			isColumnDragging = false;
			draggedColumn = column;
		}, { passive: true });

		header.addEventListener("touchmove", (e: TouchEvent) => {
			if (!draggedColumn || draggedColumn !== column) return;
			
			const touch = e.touches[0];
			const deltaX = Math.abs(touch.clientX - touchStartX);
			const deltaY = Math.abs(touch.clientY - touchStartY);
			
			// If movement exceeds threshold, start drag
			if ((deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) && !isColumnDragging) {
				isColumnDragging = true;
				column.classList.add("column-dragging");
				
				// Add class to container to show drop zones
				const container = column.closest(".kanban-container");
				if (container) {
					container.classList.add("column-dragging");
				}
				
				e.preventDefault();
			} else if (isColumnDragging) {
				// Update active drop zones
				const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
				const dropZone = elementBelow?.closest(".kanban-column-drop-zone");
				if (dropZone) {
					// Remove all active zones
					document.querySelectorAll(".kanban-column-drop-zone.drop-zone-active").forEach(el => {
						el.classList.remove("drop-zone-active");
					});
					// Activate zone under finger
					dropZone.classList.add("drop-zone-active");
				}
				e.preventDefault();
			}
		}, { passive: false });

		header.addEventListener("touchend", async (e: TouchEvent) => {
			if (!draggedColumn || draggedColumn !== column) return;
			
			if (isColumnDragging) {
				// Find the drop zone
				const touch = e.changedTouches[0];
				const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
				const dropZone = elementBelow?.closest(".kanban-column-drop-zone");
				
				if (dropZone && status) {
					const beforeStatus = dropZone.getAttribute("data-before");
					const afterStatus = dropZone.getAttribute("data-after");
					
					if (afterStatus && afterStatus !== status) {
						await this.reorderColumns(status, afterStatus);
					} else if (!afterStatus && beforeStatus && beforeStatus !== status) {
						// Insert at the end
						const currentStatuses = this.getStatuses(this.data);
						const lastStatus = currentStatuses[currentStatuses.length - 1];
						if (lastStatus && lastStatus !== status) {
							await this.reorderColumns(status, lastStatus);
						}
					}
				}
				
				// Reset
				column.classList.remove("column-dragging");
				const container = column.closest(".kanban-container");
				if (container) {
					container.classList.remove("column-dragging");
					container.querySelectorAll(".drop-zone-active").forEach(el => {
						el.classList.remove("drop-zone-active");
					});
				}
				isColumnDragging = false;
				draggedColumn = null;
			}
		}, { passive: true });
	}

	/**
	 * Reorders columns by moving one column before another
	 * @param draggedStatus - The status of the dragged column
	 * @param dropStatus - The status of the column before which to insert
	 */
	reorderColumns(draggedStatus: string, dropStatus: string) {
		const currentStatuses = this.getStatuses(this.data);
		const draggedIndex = currentStatuses.indexOf(draggedStatus);
		const dropIndex = currentStatuses.indexOf(dropStatus);

		if (draggedIndex === -1 || dropIndex === -1) return;

		// Reorder the array
		const newOrder = [...currentStatuses];
		newOrder.splice(draggedIndex, 1);
		newOrder.splice(dropIndex, 0, draggedStatus);

		// Save the new order
		this.settings.columnOrder = newOrder;
		this.saveSettings();

		// Re-render the view
		this.render();
	}

}

