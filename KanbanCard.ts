/**
 * KanbanCard - Handles creation and interactions of Kanban cards
 * (drag and drop, clicks, touch support)
 */

import { BasesPropertyId, TFile } from "obsidian";
import { PropertyRenderer } from "./PropertyRenderer";

export class KanbanCard {
	private propertyRenderer: PropertyRenderer;
	private propertyTypes: Record<string, string>;
	private config: any;
	private settings: any;
	private app: any;
	private moveItemToStatus: (itemId: string, newStatus: string) => Promise<void>;

	constructor(
		propertyRenderer: PropertyRenderer,
		propertyTypes: Record<string, string>,
		config: any,
		settings: any,
		app: any,
		moveItemToStatus: (itemId: string, newStatus: string) => Promise<void>
	) {
		this.propertyRenderer = propertyRenderer;
		this.propertyTypes = propertyTypes;
		this.config = config;
		this.settings = settings;
		this.app = app;
		this.moveItemToStatus = moveItemToStatus;
	}

	/**
	 * Creates a Kanban card for an entry
	 */
	createCard(entry: any): HTMLElement {
		// Simple flexbox structure for the Kanban card
		const card = document.createElement("div");
		card.className = "kanban-card";
		card.setAttribute("draggable", "true");
		const itemId = entry.file?.path || entry.path || "";
		card.setAttribute("data-item-id", itemId);

		// Card title
		const title = card.createDiv("kanban-card-title");
		title.textContent = entry.file?.basename || entry.name || "Untitled";

		// Container for properties
		const propertiesContainer = card.createDiv("kanban-card-properties");

		// Display selected properties via config.getOrder()
		const visibleProperties = this.config.getOrder();
		
		visibleProperties.forEach((propertyId: BasesPropertyId) => {
			// Don't display the status property (it's already represented by the column)
			const propertyName = this.config.getDisplayName(propertyId);
			if (propertyName === this.settings.statusProperty) {
				return;
			}

			// Get the property value
			const value = entry.getValue ? entry.getValue(propertyId) : null;
			
			// Create the property element (always create, even if empty)
			const prop = propertiesContainer.createDiv("kanban-card-property");
			prop.setAttribute("data-property", propertyId);
			
			// Property label
			const label = prop.createDiv("kanban-property-label");
			label.textContent = propertyName;

			// Check if the value is really empty
			const isEmpty = this.propertyRenderer.isValueEmpty(value);
			
			// Create the container for the value
			const valueContainer = prop.createDiv("kanban-property-value");
			
			// Determine the property type for the data-property-type attribute
			let propertyType = this.propertyTypes[propertyName] || null;
			if (!propertyType && value && !isEmpty) {
				propertyType = this.propertyRenderer.inferPropertyType(value) || "text";
			}
			// For tags, use "multitext" instead of "tags"
			if (propertyType === 'tags') {
				propertyType = 'multitext';
			}
			// If still no type, use "text" by default
			valueContainer.setAttribute("data-property-type", propertyType || "text");
			
			if (!isEmpty) {
				// Format the value according to its type
				try {
					this.propertyRenderer.renderPropertyValue(valueContainer, propertyId, value, entry.file);
				} catch (e) {
					// Fallback: display as text on error
					this.propertyRenderer.renderText(valueContainer, value);
				}
			}
			// If empty, the container remains empty and CSS will display the dash
		});

		// Configure drag and drop and click events
		this.setupCardEvents(card, entry);

		return card;
	}

	/**
	 * Configures drag and drop and click events for a card
	 */
	private setupCardEvents(card: HTMLElement, entry: any) {
		// Variables to manage drag and drop
		let isDragging = false;
		let mouseDownX = 0;
		let mouseDownY = 0;
		let touchStartX = 0;
		let touchStartY = 0;
		let touchStartTime = 0;
		let draggedCard: HTMLElement | null = null;
		let dragDelayTimeout: NodeJS.Timeout | null = null;
		let isDragReady = false; // Whether the delay has passed and drag can start
		const DRAG_THRESHOLD = 5; // Distance in pixels to consider a drag
		const DRAG_DELAY = 250; // Delay in ms before drag can start (like Trello)
		const VERTICAL_DRAG_RATIO = 1.2; // Movement must be at least 1.2x more vertical than horizontal

		// ========== Mouse support ==========
		
		card.addEventListener("mousedown", (e) => {
			mouseDownX = e.clientX;
			mouseDownY = e.clientY;
			isDragging = false;
		});

		card.addEventListener("dragstart", (e) => {
			isDragging = true;
			e.dataTransfer!.effectAllowed = "move";
			e.dataTransfer!.setData("text/plain", card.getAttribute("data-item-id") || "");
			card.classList.add("dragging");
			card.classList.add("drag-start"); // For grab cursor
		});

		card.addEventListener("dragend", () => {
			card.classList.remove("dragging");
			card.classList.remove("drag-start");
			// Reset the flag after a short delay
			setTimeout(() => {
				isDragging = false;
			}, 100);
		});

		// Click handler to open the file (mouse)
		card.addEventListener("click", (e) => {
			// Don't open if we just did a drag
			if (isDragging) {
				return;
			}

			// Check if the mouse moved (drag)
			const mouseMoveX = Math.abs(e.clientX - mouseDownX);
			const mouseMoveY = Math.abs(e.clientY - mouseDownY);
			if (mouseMoveX > DRAG_THRESHOLD || mouseMoveY > DRAG_THRESHOLD) {
				return;
			}

			// Don't open if clicking on an interactive element (input, checkbox, etc.)
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "A" || target.closest("input") || target.closest("a")) {
				return;
			}

			// Open the file
			const filePath = card.getAttribute("data-item-id");
			if (filePath && entry.file) {
				this.app.workspace.openLinkText(filePath, "", false);
			}
		});

		// ========== Touch support ==========
		
		card.addEventListener("touchstart", (e: TouchEvent) => {
			const touch = e.touches[0];
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
			touchStartTime = Date.now();
			isDragging = false;
			isDragReady = false;
			draggedCard = card;
			
			// Clear any existing timeout
			if (dragDelayTimeout) {
				clearTimeout(dragDelayTimeout);
				dragDelayTimeout = null;
			}
			
			// Start delay timer - after delay, allow drag to start
			dragDelayTimeout = setTimeout(() => {
				isDragReady = true;
				// Add visual feedback that drag is ready (like Trello's lift effect)
				card.classList.add("drag-ready");
			}, DRAG_DELAY);
		}, { passive: true });

		card.addEventListener("touchmove", (e: TouchEvent) => {
			if (!draggedCard || draggedCard !== card) return;
			
			const touch = e.touches[0];
			const deltaX = Math.abs(touch.clientX - touchStartX);
			const deltaY = Math.abs(touch.clientY - touchStartY);
			
			// Cancel drag if movement is primarily horizontal (swipe) - allow horizontal scrolling
			if (deltaX > deltaY * VERTICAL_DRAG_RATIO && !isDragging) {
				// This is a horizontal swipe, cancel drag preparation
				if (dragDelayTimeout) {
					clearTimeout(dragDelayTimeout);
					dragDelayTimeout = null;
				}
				card.classList.remove("drag-ready");
				isDragReady = false;
				return; // Don't prevent default, allow scrolling
			}
			
			// Only start drag if:
			// 1. Delay has passed (isDragReady)
			// 2. Movement exceeds threshold
			// 3. Movement is primarily vertical (not horizontal swipe)
			if (isDragReady && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) && !isDragging) {
				// Movement must be more vertical than horizontal to start drag
				if (deltaY >= deltaX) {
					isDragging = true;
					card.classList.add("dragging");
					card.classList.remove("drag-ready");
					
					// Clear timeout if still pending
					if (dragDelayTimeout) {
						clearTimeout(dragDelayTimeout);
						dragDelayTimeout = null;
					}
					
					// Save original width before changing position
					const rect = card.getBoundingClientRect();
					card.style.width = `${rect.width}px`;
					card.style.position = "fixed";
					card.style.zIndex = "10000";
					card.style.pointerEvents = "none";
					card.style.left = `${rect.left}px`;
					card.style.top = `${rect.top}px`;
					card.style.transform = `translate(${touch.clientX - touchStartX}px, ${touch.clientY - touchStartY}px)`;
					
					e.preventDefault();
				}
			} else if (isDragging) {
				// Update position during drag
				card.style.transform = `translate(${touch.clientX - touchStartX}px, ${touch.clientY - touchStartY}px)`;
				
				// Update active drop zone
				const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
				const targetColumn = elementBelow?.closest(".kanban-column-body");
				
				// Remove all drag-over classes
				document.querySelectorAll(".kanban-column-body.drag-over").forEach(el => {
					el.classList.remove("drag-over");
				});
				
				// Add drag-over to target column
				if (targetColumn) {
					targetColumn.classList.add("drag-over");
				}
				
				e.preventDefault();
			}
		}, { passive: false });

		card.addEventListener("touchend", async (e: TouchEvent) => {
			if (!draggedCard || draggedCard !== card) return;
			
			// Clear drag delay timeout
			if (dragDelayTimeout) {
				clearTimeout(dragDelayTimeout);
				dragDelayTimeout = null;
			}
			
			// Remove drag-ready class
			card.classList.remove("drag-ready");
			
			if (isDragging) {
				// Find the destination column
				const touch = e.changedTouches[0];
				const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
				const targetColumn = elementBelow?.closest(".kanban-column-body");
				
				if (targetColumn) {
					const newStatus = targetColumn.getAttribute("data-status");
					const itemId = card.getAttribute("data-item-id");
					
					if (newStatus && itemId) {
						await this.moveItemToStatus(itemId, newStatus);
					}
				}
				
				// Remove all drag-over classes
				document.querySelectorAll(".kanban-column-body.drag-over").forEach(el => {
					el.classList.remove("drag-over");
				});
				
				// Reset
				card.classList.remove("dragging");
				card.style.position = "";
				card.style.zIndex = "";
				card.style.pointerEvents = "";
				card.style.width = "";
				card.style.left = "";
				card.style.top = "";
				card.style.transform = "";
				isDragging = false;
				isDragReady = false;
				draggedCard = null;
			} else {
				// It's a tap, not a drag
				const touchDuration = Date.now() - touchStartTime;
				const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
				const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
				
				// If it's a short tap without movement, open the file
				if (touchDuration < 300 && deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
					const target = e.target as HTMLElement;
					if (target.tagName !== "INPUT" && target.tagName !== "A" && !target.closest("input") && !target.closest("a")) {
						const filePath = card.getAttribute("data-item-id");
						if (filePath && entry.file) {
							this.app.workspace.openLinkText(filePath, "", false);
						}
					}
				}
			}
			
			draggedCard = null;
		}, { passive: true });
		
		// Handle touchcancel (e.g., when user scrolls or system interrupts)
		card.addEventListener("touchcancel", () => {
			if (dragDelayTimeout) {
				clearTimeout(dragDelayTimeout);
				dragDelayTimeout = null;
			}
			card.classList.remove("drag-ready");
			isDragReady = false;
			draggedCard = null;
		}, { passive: true });
	}
}


