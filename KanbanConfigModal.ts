import { App, Modal, Setting, BasesPropertyId, BasesViewConfig } from "obsidian";
import { KanbanViewSettings } from "./types";

export class KanbanConfigModal extends Modal {
	settings: KanbanViewSettings;
	onSave: (settings: KanbanViewSettings) => void;
	allProperties: BasesPropertyId[];
	config: BasesViewConfig;

	constructor(
		app: App,
		settings: KanbanViewSettings,
		allProperties: BasesPropertyId[],
		config: BasesViewConfig,
		onSave: (settings: KanbanViewSettings) => void
	) {
		super(app);
		this.settings = { ...settings };
		this.allProperties = allProperties;
		this.config = config;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Configuration Kanban" });

		// Sélection de la propriété de statut
		const propertySetting = new Setting(contentEl)
			.setName("Propriété pour les colonnes")
			.setDesc("Sélectionnez la propriété qui servira à générer les colonnes");

		// Créer un dropdown avec toutes les propriétés disponibles
		const propertyOptions: Record<string, string> = {};
		propertyOptions[""] = "Aucune sélectionnée";
		
		this.allProperties.forEach((propId) => {
			const displayName = this.config.getDisplayName(propId);
			propertyOptions[displayName] = displayName;
		});

		propertySetting.addDropdown((dropdown) => {
			dropdown
				.addOptions(propertyOptions)
				.setValue(this.settings.statusProperty || "")
				.onChange((value) => {
					this.settings.statusProperty = value;
				});
		});

		// Configuration des statuts
		new Setting(contentEl)
			.setName("Statuts personnalisés")
			.setDesc(
				"Liste des statuts (un par ligne). Laissez vide pour utiliser les statuts existants dans les données."
			)
			.addTextArea((text) => {
				text.setValue(this.settings.statuses.join("\n"))
					.setPlaceholder("À faire\nEn cours\nTerminé")
					.onChange((value) => {
						this.settings.statuses = value
							.split("\n")
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
					});
				text.inputEl.rows = 5;
				text.inputEl.cols = 30;
			});

		// Boutons
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Enregistrer")
				.setCta()
				.onClick(() => {
					this.onSave(this.settings);
					this.close();
				})
		);

		new Setting(contentEl).addButton((btn) =>
			btn.setButtonText("Annuler").onClick(() => {
				this.close();
			})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

