/**
 * PropertyRenderer - Handles rendering of different property types
 * in Kanban cards (dates, checkboxes, tags, lists, etc.)
 */

import { BasesPropertyId, TFile } from "obsidian";

export class PropertyRenderer {
	private propertyTypes: Record<string, string> = {};

	/**
	 * Initializes the property types cache
	 */
	setPropertyTypes(propertyTypes: Record<string, string>) {
		this.propertyTypes = propertyTypes;
	}

	/**
	 * Renders a property value according to its type
	 */
	renderPropertyValue(container: HTMLElement, propertyId: BasesPropertyId, value: any, file: TFile | undefined) {
		// Extract the property name from the ID (format: "note.propertyName" or "file.propertyName")
		const propertyName = propertyId.split('.').slice(1).join('.');
		
		// Get the property type from the cache
		let propertyType: string | null = this.propertyTypes[propertyName] || null;

		// If no type found, try to infer it from the value
		if (!propertyType) {
			propertyType = this.inferPropertyType(value);
		}

		// Render the value according to its type
		switch (propertyType) {
			case 'checkbox':
				this.renderCheckbox(container, value);
				break;
			case 'date':
				this.renderDate(container, value);
				break;
			case 'datetime':
				this.renderDateTime(container, value);
				break;
			case 'tags':
				// For tags, use multitext as type in data-property-type (like in Card view)
				container.setAttribute("data-property-type", "multitext");
				this.renderTags(container, value);
				break;
			case 'multitext':
			case 'list':
				this.renderList(container, value);
				break;
			case 'number':
				this.renderNumber(container, value);
				break;
			default:
				// By default, display as text
				this.renderText(container, value);
		}
	}

	/**
	 * Infers a property type from its structure
	 */
	inferPropertyType(value: any): string | null {
		if (value === null || value === undefined) return null;
		
		// Obsidian Bases values are objects with an 'icon' property that indicates the type
		if (value && typeof value === 'object' && 'icon' in value) {
			const icon = (value as any).icon;
			
			// Detect type from icon
			if (icon === 'lucide-check-square' || icon === 'lucide-square') {
				return 'checkbox';
			}
			if (icon === 'lucide-calendar' || icon === 'lucide-calendar-days') {
				// Simple date (without time)
				if ('date' in value && !(value as any).time) {
					return 'date';
				}
				// DateTime (with time)
				if ('date' in value && (value as any).time) {
					return 'datetime';
				}
				return 'date';
			}
			if (icon === 'lucide-clock') {
				return 'datetime';
			}
			if (icon === 'lucide-tags') {
				return 'tags';
			}
			if (icon === 'lucide-list' || icon === 'lucide-list-ordered') {
				return 'multitext';
			}
			if (icon === 'lucide-binary' || icon === 'lucide-hash') {
				return 'number';
			}
		}
		
		// Check if it's an instance of an Obsidian Value class
		const constructorName = value.constructor?.name || '';
		if (constructorName.includes('Boolean')) return 'checkbox';
		if (constructorName.includes('Date')) {
			if (constructorName.includes('Time') || constructorName.includes('DateTime')) {
				return 'datetime';
			}
			return 'date';
		}
		if (constructorName.includes('Tag')) return 'tags';
		if (constructorName.includes('List') || constructorName.includes('Multitext')) return 'multitext';
		if (constructorName.includes('Number')) return 'number';
		
		// Check the Value object type
		if (typeof value === 'object') {
			if ('type' in value) {
				const type = (value as any).type;
				if (type === 'boolean' || type === 'checkbox') return 'checkbox';
				if (type === 'date') return 'date';
				if (type === 'datetime') return 'datetime';
				if (type === 'tags') return 'tags';
				if (type === 'multitext' || type === 'list') return 'multitext';
				if (type === 'number') return 'number';
			}
			if (Array.isArray(value)) {
				return 'multitext';
			}
		}
		
		if (typeof value === 'boolean') return 'checkbox';
		if (typeof value === 'number') return 'number';
		if (Array.isArray(value)) return 'multitext';
		
		return 'text';
	}

	/**
	 * Renders a checkbox
	 */
	renderCheckbox(container: HTMLElement, value: any) {
		const isChecked = this.getBooleanValue(value);
		// Create a checkbox input like in the native Card view
		const checkbox = container.createEl("input", {
			type: "checkbox",
		});
		checkbox.checked = isChecked;
		checkbox.disabled = true;
	}

	/**
	 * Renders a date
	 */
	renderDate(container: HTMLElement, value: any) {
		const dateValue = this.getDateValue(value);
		if (dateValue) {
			// Create a date input like in the native Card view
			// The browser will automatically format according to system settings
			const dateInput = container.createEl("input", {
				type: "date",
				cls: "metadata-input metadata-input-text mod-date",
			});
			dateInput.setAttribute("step", "any");
			dateInput.setAttribute("disabled", "true");
			// Format the date as YYYY-MM-DD for the date input (ISO format required)
			const year = dateValue.getFullYear();
			const month = String(dateValue.getMonth() + 1).padStart(2, '0');
			const day = String(dateValue.getDate()).padStart(2, '0');
			dateInput.value = `${year}-${month}-${day}`;
		}
	}

	/**
	 * Renders a date with time
	 */
	renderDateTime(container: HTMLElement, value: any) {
		const dateValue = this.getDateValue(value);
		if (dateValue) {
			// Create a datetime-local input like in the native Card view
			// The browser will automatically format according to system settings
			const dateTimeInput = container.createEl("input", {
				type: "datetime-local",
				cls: "metadata-input metadata-input-text mod-datetime",
			});
			dateTimeInput.setAttribute("step", "any");
			dateTimeInput.setAttribute("disabled", "true");
			// Format the date as YYYY-MM-DDTHH:mm for the datetime-local input (ISO format required)
			const year = dateValue.getFullYear();
			const month = String(dateValue.getMonth() + 1).padStart(2, '0');
			const day = String(dateValue.getDate()).padStart(2, '0');
			const hours = String(dateValue.getHours()).padStart(2, '0');
			const minutes = String(dateValue.getMinutes()).padStart(2, '0');
			dateTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
		}
	}

	/**
	 * Renders tags
	 */
	renderTags(container: HTMLElement, value: any) {
		const tags = this.getArrayValue(value);
		if (tags && tags.length > 0) {
			// Create the structure like in the native Card view
			const listContainer = container.createDiv("value-list-container");
			tags.forEach((tag, index) => {
				if (index > 0) {
					// Add a gap between elements (with line breaks like in Card view)
					const gap = listContainer.createSpan("value-list-gap");
					gap.innerHTML = "\n\n";
				}
				const element = listContainer.createSpan("value-list-element");
				// Create a link with the tag class like in the native Card view
				const tagLink = element.createEl("a", { cls: "tag" });
				// Remove # if present
				const tagName = tag.replace(/^#/, '');
				tagLink.textContent = tagName;
			});
		}
	}

	/**
	 * Renders a list
	 */
	renderList(container: HTMLElement, value: any) {
		const items = this.getArrayValue(value);
		if (items && items.length > 0) {
			// Create the structure like in the native Card view
			const listContainer = container.createDiv("value-list-container");
			items.forEach((item, index) => {
				if (index > 0) {
					// Add a gap between elements (with line breaks like in Card view)
					const gap = listContainer.createSpan("value-list-gap");
					gap.innerHTML = "\n\n";
				}
				const element = listContainer.createSpan("value-list-element");
				element.textContent = item;
			});
		}
	}

	/**
	 * Renders a number
	 */
	renderNumber(container: HTMLElement, value: any) {
		const numValue = this.getNumberValue(value);
		if (numValue !== null && numValue !== undefined) {
			container.textContent = String(numValue);
		}
	}

	/**
	 * Renders text
	 */
	renderText(container: HTMLElement, value: any) {
		const textValue = this.getStringValue(value);
		container.textContent = textValue || "";
	}

	// ========== Utility functions to extract values ==========

	/**
	 * Extracts a boolean value from a Value object
	 */
	getBooleanValue(value: any): boolean {
		if (typeof value === 'boolean') return value;
		if (value && typeof value === 'object') {
			// Obsidian Bases values have data in 'data'
			if ('data' in value) {
				const data = (value as any).data;
				if (typeof data === 'boolean') return data;
				if (typeof data === 'string') return data.toLowerCase() === 'true';
				if (typeof data === 'number') return data !== 0;
			}
			if ('value' in value) {
				const val = (value as any).value;
				if (typeof val === 'boolean') return val;
				if (typeof val === 'string') return val.toLowerCase() === 'true';
			}
			if ('checked' in value) return Boolean((value as any).checked);
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true' || value === '1';
		}
		if (value && typeof value === 'object' && 'icon' in value) {
			return false;
		}
		return false;
	}

	/**
	 * Extracts a date value from a Value object
	 */
	getDateValue(value: any): Date | null {
		// If it's already a Date
		if (value instanceof Date) return value;
		
		// Obsidian Bases values have the date in 'date'
		if (value && typeof value === 'object') {
			if ('date' in value) {
				const date = (value as any).date;
				if (date instanceof Date) return date;
				if (typeof date === 'string') {
					const parsed = new Date(date);
					if (!isNaN(parsed.getTime())) return parsed;
				}
			}
			if (typeof (value as any).toString === 'function') {
				const str = (value as any).toString();
				const date = new Date(str);
				if (!isNaN(date.getTime())) return date;
			}
			if ('value' in value) {
				return this.getDateValue((value as any).value);
			}
		}
		
		// If it's a string
		if (typeof value === 'string') {
			const date = new Date(value);
			if (!isNaN(date.getTime())) return date;
		}
		
		return null;
	}

	/**
	 * Extracts an array value from a Value object
	 */
	getArrayValue(value: any): string[] | null {
		// Obsidian Bases values have data in 'data'
		if (value && typeof value === 'object' && 'data' in value) {
			const data = (value as any).data;
			if (Array.isArray(data)) {
				return data.map(v => {
					if (v && typeof v === 'object' && 'value' in v) {
						return this.getStringValue((v as any).value);
					}
					return this.getStringValue(v);
				});
			}
		}
		
		if (Array.isArray(value)) {
			return value.map(v => {
				if (v && typeof v === 'object' && 'value' in v) {
					return this.getStringValue((v as any).value);
				}
				return this.getStringValue(v);
			});
		}
		if (value && typeof value === 'object') {
			if ('value' in value) {
				return this.getArrayValue((value as any).value);
			}
			if ('items' in value && Array.isArray((value as any).items)) {
				return this.getArrayValue((value as any).items);
			}
		}
		return null;
	}

	/**
	 * Extracts a numeric value from a Value object
	 */
	getNumberValue(value: any): number | null {
		// Obsidian Bases values have data in 'data'
		if (value && typeof value === 'object' && 'data' in value) {
			const data = (value as any).data;
			if (typeof data === 'number') return data;
			if (typeof data === 'string') {
				const num = parseFloat(data);
				if (!isNaN(num)) return num;
			}
		}
		
		if (typeof value === 'number') return value;
		if (typeof value === 'string') {
			const num = parseFloat(value);
			if (!isNaN(num)) return num;
		}
		if (value && typeof value === 'object' && 'value' in value) {
			return this.getNumberValue((value as any).value);
		}
		return null;
	}

	/**
	 * Extracts a string value from a Value object
	 */
	getStringValue(value: any): string {
		if (value === null || value === undefined) return "";
		if (typeof value === 'string') return value;
		if (typeof value === 'number' || typeof value === 'boolean') return String(value);
		if (value && typeof value === 'object') {
			// Obsidian Bases values have data in 'data'
			if ('data' in value) {
				return this.getStringValue((value as any).data);
			}
			if ('value' in value) {
				return this.getStringValue((value as any).value);
			}
			if ('text' in value) {
				return String((value as any).text);
			}
			if ('name' in value) {
				return String((value as any).name);
			}
			if (typeof (value as any).toString === 'function') {
				return String((value as any).toString());
			}
		}
		return String(value);
	}

	/**
	 * Checks if a value is empty
	 */
	isValueEmpty(value: any): boolean {
		if (value === null || value === undefined) {
			return true;
		}
		
		// For objects with icon, check if data exists
		if (value && typeof value === 'object' && 'icon' in value) {
			const icon = (value as any).icon;
			
			// If it's a checkbox with lucide-file-question and no data, it's empty
			if (icon === 'lucide-file-question') {
				if (!('data' in value) || (value as any).data === null || (value as any).data === undefined) {
					return true;
				}
				return false;
			}
			
			// If it's a normal checkbox, it's never really empty
			if (icon === 'lucide-check-square' || icon === 'lucide-square') {
				return false; // Checkboxes can always be displayed
			}
			
			// For other types, check if data exists
			if ('data' in value) {
				const data = (value as any).data;
				if (data === null || data === undefined) {
					return true;
				}
				if (Array.isArray(data) && data.length === 0) {
					return true;
				}
				return false; // There is data
			}
			
			if ('date' in value) {
				const date = (value as any).date;
				if (date === null || date === undefined) {
					return true;
				}
				return false; // There is a date
			}
			
			// If no data or date, it's empty
			return true;
		}
		
		// For other types, check directly
		if (Array.isArray(value) && value.length === 0) {
			return true;
		}
		
		return false;
	}
}


