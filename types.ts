export interface KanbanViewSettings {
	statusProperty: string;
	statuses: string[];
	columnOrder?: string[]; // Ordre des colonnes
}

export interface KanbanItem {
	id: string;
	title: string;
	file?: {
		path: string;
		basename: string;
	};
	properties?: Record<string, any>;
}

