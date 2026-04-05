import {App, Notice, TFile, requestUrl} from "obsidian";
import {TVSeriesMetadata} from "../models/SeriesMetadata";
import {SeriesMarkdownGenerator} from "./SeriesMarkdownGenerator";
import {SeriesPluginSettings} from "../settings";

/**
 * Service for creating TV series markdown files in the vault
 */
export class SeriesFileCreator {
	private markdownGenerator: SeriesMarkdownGenerator;

	constructor(
		private app: App,
		private settings: SeriesPluginSettings
	) {
		this.markdownGenerator = new SeriesMarkdownGenerator(settings);
	}

	/**
	 * Create series file(s) from metadata.
	 * Returns the main series file.
	 */
	async createSeriesFile(metadata: TVSeriesMetadata): Promise<TFile | null> {
		try {
			if (this.settings.seriesCoverStorage === 'local' && metadata.coverUrl) {
				const localPath = await this.downloadCover(metadata.coverUrl, metadata.title);
				if (localPath) {
					metadata.coverLocalPath = localPath;
				}
			}

			if (this.settings.seriesFileMode === 'per-season') {
				return this.createPerSeasonFiles(metadata);
			}
			return this.createSingleFile(metadata);
		} catch (error) {
			console.error('[SeriesFileCreator] Error creating series file:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Failed to create series file: ${errorMessage}`);
			return null;
		}
	}

	/**
	 * Update an existing series file with new metadata
	 */
	async updateSeriesFile(file: TFile, metadata: TVSeriesMetadata): Promise<boolean> {
		try {
			if (this.settings.seriesCoverStorage === 'local' && metadata.coverUrl && !metadata.coverLocalPath) {
				const localPath = await this.downloadCover(metadata.coverUrl, metadata.title);
				if (localPath) {
					metadata.coverLocalPath = localPath;
				}
			}

			const content = this.markdownGenerator.generateMarkdown(metadata);
			await this.app.vault.modify(file, content);
			new Notice(`Updated series file: ${file.name}`);
			return true;
		} catch (error) {
			console.error('[SeriesFileCreator] Error updating series file:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Failed to update series file: ${errorMessage}`);
			return false;
		}
	}

	// ──────────────────────────────────────────────────────────────
	// Private helpers
	// ──────────────────────────────────────────────────────────────

	private async createSingleFile(metadata: TVSeriesMetadata): Promise<TFile | null> {
		const filename = this.markdownGenerator.generateFilename(metadata);
		await this.ensureFolderExists(this.settings.seriesOutputFolder);
		const filepath = `${this.settings.seriesOutputFolder}/${filename}`;

		const existingFile = this.app.vault.getAbstractFileByPath(filepath);
		if (existingFile instanceof TFile) {
			new Notice(`File "${filename}" already exists. Opening instead.`);
			await this.app.workspace.getLeaf().openFile(existingFile);
			return existingFile;
		}

		const content = this.markdownGenerator.generateMarkdown(metadata);
		const file = await this.app.vault.create(filepath, content);
		new Notice(`Created series file: ${filename}`);
		await this.app.workspace.getLeaf().openFile(file);
		return file;
	}

	private async createPerSeasonFiles(metadata: TVSeriesMetadata): Promise<TFile | null> {
		const safeTitle = metadata.title
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();

		// Series subfolder: seriesOutputFolder/SeriesTitle/
		const seriesFolder = `${this.settings.seriesOutputFolder}/${safeTitle}`;
		await this.ensureFolderExists(seriesFolder);

		// Create main series file
		const mainFilename = this.markdownGenerator.generateFilename(metadata);
		const mainPath = `${seriesFolder}/${mainFilename}`;

		let mainFile: TFile | null = null;
		const existingMain = this.app.vault.getAbstractFileByPath(mainPath);
		if (existingMain instanceof TFile) {
			new Notice(`Main file "${mainFilename}" already exists. Opening instead.`);
			mainFile = existingMain;
		} else {
			const content = this.markdownGenerator.generateMarkdown(metadata);
			mainFile = await this.app.vault.create(mainPath, content);
			new Notice(`Created series file: ${mainFilename}`);
		}

		// Create season files
		if (metadata.seasons) {
			for (const season of metadata.seasons) {
				const seasonFilename = this.markdownGenerator.generateSeasonFilename(metadata, season.number);
				const seasonPath = `${seriesFolder}/${seasonFilename}`;

				const existingSeason = this.app.vault.getAbstractFileByPath(seasonPath);
				if (!(existingSeason instanceof TFile)) {
					const content = this.markdownGenerator.generateSeasonMarkdown(season, metadata.title, metadata);
					await this.app.vault.create(seasonPath, content);
				}
			}
			new Notice(`Created ${metadata.seasons.length} season file(s) for "${metadata.title}"`);
		}

		if (mainFile) {
			await this.app.workspace.getLeaf().openFile(mainFile);
		}

		return mainFile;
	}

	private async ensureFolderExists(folderPath: string): Promise<void> {
		const parts = folderPath.split('/');
		let current = '';
		for (const part of parts) {
			if (!part) continue;
			current = current ? `${current}/${part}` : part;
			const existing = this.app.vault.getAbstractFileByPath(current);
			if (!existing) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	private async downloadCover(coverUrl: string, title: string): Promise<string | null> {
		try {
			const safeTitle = title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
			const ext = this.getImageExtension(coverUrl);
			const filename = `${safeTitle}${ext}`;

			const coversFolder = `${this.settings.seriesOutputFolder}/_covers`;
			await this.ensureFolderExists(coversFolder);

			const filepath = `${coversFolder}/${filename}`;
			const existing = this.app.vault.getAbstractFileByPath(filepath);
			if (existing instanceof TFile) return filepath;

			const response = await requestUrl({url: coverUrl, throw: false});
			if (response.status !== 200 || !response.arrayBuffer) return null;

			await this.app.vault.createBinary(filepath, response.arrayBuffer);
			return filepath;
		} catch (error) {
			console.error('[SeriesFileCreator] Error downloading cover:', error);
			return null;
		}
	}

	private getImageExtension(url: string): string {
		const match = url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i);
		return match?.[1] ? `.${match[1].toLowerCase()}` : '.jpg';
	}
}
