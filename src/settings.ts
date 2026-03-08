import {App, PluginSettingTab, Setting} from "obsidian";
import AudiobookMetadataPlugin from "./main";

export type ApiProvider = "audible" | "googlebooks" | "openlibrary" | "itunes";
export type AudibleCountry = "de" | "uk" | "us";
export type CoverStorage = "local" | "url";

export interface AudiobookPluginSettings {
	defaultOutputFolder: string;
	apiProvider: ApiProvider;
	audibleCountry: AudibleCountry;
	offlineMode: boolean;
	coverStorage: CoverStorage;
	rateLimitEnabled: boolean;
	rateLimitRequestsPerMinute: number;
	cacheEnabled: boolean;
	cacheDurationHours: number;
	templateFormat: string;
}

export const DEFAULT_SETTINGS: AudiobookPluginSettings = {
	defaultOutputFolder: 'Audiobooks',
	apiProvider: 'audible',
	audibleCountry: 'de',
	offlineMode: false,
	coverStorage: 'local',
	rateLimitEnabled: true,
	rateLimitRequestsPerMinute: 5,
	cacheEnabled: true,
	cacheDurationHours: 24,
	templateFormat: ''
}

export class AudiobookSettingTab extends PluginSettingTab {
	plugin: AudiobookMetadataPlugin;

	constructor(app: App, plugin: AudiobookMetadataPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Audiobook Metadata Settings'});

		// Output Folder
		new Setting(containerEl)
			.setName('Output Folder')
			.setDesc('Default folder for audiobook metadata files')
			.addText(text => text
				.setPlaceholder('Audiobooks')
				.setValue(this.plugin.settings.defaultOutputFolder)
				.onChange(async (value) => {
					this.plugin.settings.defaultOutputFolder = value;
					await this.plugin.saveSettings();
				}));

		// Offline Mode
		new Setting(containerEl)
			.setName('Offline Mode')
			.setDesc('Disable all API calls. All metadata must be entered manually.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.offlineMode)
				.onChange(async (value) => {
					this.plugin.settings.offlineMode = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide API-related settings
				}));

		if (!this.plugin.settings.offlineMode) {
			containerEl.createEl('h3', {text: 'API Settings'});

			// API Provider
			new Setting(containerEl)
				.setName('API Provider')
				.setDesc('Select which service to use for fetching metadata')
				.addDropdown(dropdown => dropdown
					.addOption('audible', 'Audible')
					.addOption('googlebooks', 'Google Books')
					.addOption('openlibrary', 'Open Library')
					.addOption('itunes', 'iTunes')
					.setValue(this.plugin.settings.apiProvider)
					.onChange(async (value: ApiProvider) => {
						this.plugin.settings.apiProvider = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide country setting
					}));

			// Audible Country (only shown when Audible is selected)
			if (this.plugin.settings.apiProvider === 'audible') {
				new Setting(containerEl)
					.setName('Audible Country')
					.setDesc('Select Audible marketplace')
					.addDropdown(dropdown => dropdown
						.addOption('de', 'Germany (audible.de)')
						.addOption('uk', 'United Kingdom (audible.co.uk)')
						.addOption('us', 'United States (audible.com)')
						.setValue(this.plugin.settings.audibleCountry)
						.onChange(async (value: AudibleCountry) => {
							this.plugin.settings.audibleCountry = value;
							await this.plugin.saveSettings();
						}));
			}

			// Rate Limiting
			containerEl.createEl('h3', {text: 'Rate Limiting'});

			new Setting(containerEl)
				.setName('Enable Rate Limiting')
				.setDesc('Limit API requests to avoid being blocked')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.rateLimitEnabled)
					.onChange(async (value) => {
						this.plugin.settings.rateLimitEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					}));

			if (this.plugin.settings.rateLimitEnabled) {
				new Setting(containerEl)
					.setName('Requests per Minute')
					.setDesc('Maximum number of API requests per minute (1-20)')
					.addSlider(slider => slider
						.setLimits(1, 20, 1)
						.setValue(this.plugin.settings.rateLimitRequestsPerMinute)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.rateLimitRequestsPerMinute = value;
							await this.plugin.saveSettings();
						}));
			}

			// Caching
			containerEl.createEl('h3', {text: 'Caching'});

			new Setting(containerEl)
				.setName('Enable Caching')
				.setDesc('Cache metadata to reduce API calls and improve performance')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.cacheEnabled)
					.onChange(async (value) => {
						this.plugin.settings.cacheEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					}));

			if (this.plugin.settings.cacheEnabled) {
				new Setting(containerEl)
					.setName('Cache Duration (hours)')
					.setDesc('How long to keep cached metadata (1-168 hours = 1 week)')
					.addSlider(slider => slider
						.setLimits(1, 168, 1)
						.setValue(this.plugin.settings.cacheDurationHours)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.cacheDurationHours = value;
							await this.plugin.saveSettings();
						}));
			}
		}

		// Cover Storage
		containerEl.createEl('h3', {text: 'Cover Images'});

		new Setting(containerEl)
			.setName('Cover Storage')
			.setDesc('Choose how to store cover images')
			.addDropdown(dropdown => dropdown
				.addOption('local', 'Local (download and store in plugin folder)')
				.addOption('url', 'URL (reference external image URL)')
				.setValue(this.plugin.settings.coverStorage)
				.onChange(async (value: CoverStorage) => {
					this.plugin.settings.coverStorage = value;
					await this.plugin.saveSettings();
				}));
	}
}
