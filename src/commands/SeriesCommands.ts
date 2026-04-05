import {App, Notice} from "obsidian";
import {SeriesPluginSettings} from "../settings";
import {SeriesMetadataProviderFactory} from "../services/SeriesMetadataProviderFactory";
import {SeriesFileCreator} from "../services/SeriesFileCreator";
import {SeriesInputModal} from "../ui/SeriesInputModal";
import {CacheService} from "../services/cache/CacheService";

/**
 * Handler for TV series–related commands
 */
export class SeriesCommands {
	private providerFactory: SeriesMetadataProviderFactory;
	private fileCreator: SeriesFileCreator;

	constructor(
		private app: App,
		private settings: SeriesPluginSettings,
		private cacheService: CacheService
	) {
		this.providerFactory = new SeriesMetadataProviderFactory(settings, cacheService);
		this.fileCreator = new SeriesFileCreator(app, settings);
	}

	/**
	 * Command: Search for a series and add it
	 */
	async addFromSearch() {
		if (this.settings.seriesOfflineMode) {
			new Notice('Search is not available in offline mode');
			return;
		}

		let provider;
		try {
			provider = this.providerFactory.getProvider();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error';
			new Notice(msg);
			return;
		}

		const modal = new SeriesInputModal(
			this.app,
			provider,
			this.settings.seriesOfflineMode,
			(metadata) => {
				if (metadata) {
					void this.fileCreator.createSeriesFile(metadata);
				}
			},
			'search'
		);
		modal.open();
	}

	/**
	 * Command: Add series from ID (TVMaze, TMDB, IMDb, TVDb)
	 */
	async addFromId() {
		if (this.settings.seriesOfflineMode) {
			new Notice('ID lookup is not available in offline mode');
			return;
		}

		let provider;
		try {
			provider = this.providerFactory.getProvider();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error';
			new Notice(msg);
			return;
		}

		const modal = new SeriesInputModal(
			this.app,
			provider,
			this.settings.seriesOfflineMode,
			(metadata) => {
				if (metadata) {
					void this.fileCreator.createSeriesFile(metadata);
				}
			},
			'id'
		);
		modal.open();
	}

	/**
	 * Command: Add series manually (no API call)
	 */
	async addManually() {
		const modal = new SeriesInputModal(
			this.app,
			null,
			true,
			(metadata) => {
				if (metadata) {
					void this.fileCreator.createSeriesFile(metadata);
				}
			},
			'manual'
		);
		modal.open();
	}
}
