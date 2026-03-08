import {Plugin, Notice} from 'obsidian';
import {DEFAULT_SETTINGS, AudiobookPluginSettings, AudiobookSettingTab} from "./settings";
import {AudiobookCardRenderer} from "./ui/AudiobookCardRenderer";
import {AudiobookCommands} from "./commands/AudiobookCommands";
import {CacheService} from "./services/cache/CacheService";
import {CacheCleanup} from "./services/cache/CacheCleanup";

export default class AudiobookMetadataPlugin extends Plugin {
	settings: AudiobookPluginSettings;
	private cardRenderer: AudiobookCardRenderer;
	private commands: AudiobookCommands;
	private cacheService: CacheService;
	private cacheCleanup: CacheCleanup;

	async onload() {
		await this.loadSettings();

		// Initialize services
		this.cacheService = new CacheService(
			this.settings.cacheDurationHours,
			async () => {
				const data = await this.loadData() as any;
				return data?.cache || null;
			},
			async (cacheData) => {
				const existingData = await this.loadData() as any || {};
				existingData.cache = cacheData;
				await this.saveData(existingData);
			}
		);
		await this.cacheService.initialize();

		this.cacheCleanup = new CacheCleanup(this.cacheService);
		this.cacheCleanup.start((intervalId) => this.registerInterval(intervalId));

		this.cardRenderer = new AudiobookCardRenderer(this.app);
		this.commands = new AudiobookCommands(this.app, this.settings, this.cacheService);

		// Register markdown code block processor
		this.registerMarkdownCodeBlockProcessor('audiobook', async (source, el, ctx) => {
			const data = this.cardRenderer.parseCodeBlock(source);
			await this.cardRenderer.render(el, data, ctx);
		});

		// Register commands
		this.addCommand({
			id: 'add-audiobook-from-url',
			name: 'Add audiobook from URL',
			callback: async () => {
				try {
					await this.commands.addFromUrl();
				} catch (error) {
					console.error('Error in addFromUrl:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					new Notice(`Failed to open audiobook modal: ${errorMessage}`);
				}
			}
		});

		this.addCommand({
			id: 'add-audiobook-from-search',
			name: 'Search and add audiobook',
			callback: async () => {
				try {
					await this.commands.addFromSearch();
				} catch (error) {
					console.error('Error in addFromSearch:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					new Notice(`Failed to open audiobook modal: ${errorMessage}`);
				}
			}
		});

		this.addCommand({
			id: 'add-audiobook-from-id',
			name: 'Add audiobook from ID (ASIN/ISBN)',
			callback: async () => {
				try {
					await this.commands.addFromId();
				} catch (error) {
					console.error('Error in addFromId:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					new Notice(`Failed to open audiobook modal: ${errorMessage}`);
				}
			}
		});

		this.addCommand({
			id: 'refresh-audiobook-metadata',
			name: 'Refresh audiobook metadata',
			callback: async () => {
				try {
					await this.commands.refreshMetadata();
				} catch (error) {
					console.error('Error in refreshMetadata:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					new Notice(`Failed to refresh metadata: ${errorMessage}`);
				}
			}
		});

		this.addCommand({
			id: 'clear-audiobook-cache',
			name: 'Clear audiobook metadata cache',
			callback: () => {
				try {
					this.commands.clearCache();
				} catch (error) {
					console.error('Error in clearCache:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					new Notice(`Failed to clear cache: ${errorMessage}`);
				}
			}
		});

		// Add settings tab
		this.addSettingTab(new AudiobookSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup handled by registerInterval
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<AudiobookPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update commands with new settings
		if (this.commands) {
			this.commands.updateSettings(this.settings);
		}
	}
}
