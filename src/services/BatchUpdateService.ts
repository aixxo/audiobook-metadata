import {App, TFile} from "obsidian";
import {MediaPluginSettings, CustomFrontmatterField, CustomFieldsPosition} from "../settings";
import {getSortedCustomFields} from "../utils/TypeGuards";

/**
 * Result of a batch update operation on a single file
 */
export interface BatchUpdateResult {
	file: TFile;
	success: boolean;
	fieldsAdded: number;
	error?: string;
}

/**
 * Configuration for a batch update run (audiobooks or series)
 */
export interface BatchUpdateConfig {
	fields: CustomFrontmatterField[];
	fieldsPosition: CustomFieldsPosition;
	outputFolder: string;
	/** Frontmatter key/value used to identify target files, e.g. {key:'subtype', value:'audiobook'} */
	typeFilter: { key: string; value: string };
}

/**
 * Service for batch updating existing media files with custom frontmatter fields
 */
export class BatchUpdateService {
	private config: BatchUpdateConfig;

	constructor(
		private app: App,
		settings: MediaPluginSettings,
		config?: BatchUpdateConfig
	) {
		this.config = config ?? {
			fields: settings.customFrontmatterFields,
			fieldsPosition: settings.customFieldsPosition,
			outputFolder: settings.defaultOutputFolder,
			typeFilter: { key: 'subtype', value: 'audiobook' },
		};
	}

	/**
	 * Get all markdown files that match the configured typeFilter frontmatter value
	 */
	async getAllMediaFiles(): Promise<TFile[]> {
		const allFiles = this.app.vault.getMarkdownFiles();
		const filtered: TFile[] = [];

		for (const file of allFiles) {
			const cache = this.app.metadataCache.getFileCache(file);
			const fmValue = cache?.frontmatter?.[this.config.typeFilter.key];
			if (fmValue === this.config.typeFilter.value) {
				filtered.push(file);
			}
		}

		return filtered;
	}

	/**
	 * @deprecated Use getAllMediaFiles() instead
	 */
	async getMediaFiles(): Promise<TFile[]> {
		return this.getAllMediaFiles();
	}

	/**
	 * Update a single file with custom frontmatter fields
	 * Only adds missing fields, does not overwrite existing ones
	 */
	async updateFile(file: TFile): Promise<BatchUpdateResult> {
		try {
			const content = await this.app.vault.read(file);
			const { frontmatter, body, hasFrontmatter } = this.parseFrontmatter(content);

			if (!hasFrontmatter) {
				return {
					file,
					success: false,
					fieldsAdded: 0,
					error: 'No frontmatter found'
				};
			}

			let fieldsAdded = 0;
			const sortedFields = getSortedCustomFields(this.config.fields);

			// Check which fields need to be added
			sortedFields.forEach((field: CustomFrontmatterField) => {
				const key = field.key.trim();
				if (!key) return;

				// Only add if field doesn't exist
				if (!(key in frontmatter)) {
					frontmatter[key] = this.formatFieldValue(field.value, field.type);
					fieldsAdded++;
				}
			});

			if (fieldsAdded === 0) {
				return {
					file,
					success: true,
					fieldsAdded: 0
				};
			}

			// Rebuild file content with updated frontmatter
			const newContent = this.rebuildContent(frontmatter, body);
			await this.app.vault.modify(file, newContent);

			return {
				file,
				success: true,
				fieldsAdded
			};
		} catch (error) {
			return {
				file,
				success: false,
				fieldsAdded: 0,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * Update multiple files with progress callback
	 */
	async updateFiles(
		files: TFile[],
		onProgress?: (current: number, total: number, filename: string) => void
	): Promise<BatchUpdateResult[]> {
		const results: BatchUpdateResult[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			
			if (!file) continue;
			
			if (onProgress) {
				onProgress(i + 1, files.length, file.name);
			}

			const result = await this.updateFile(file);
			results.push(result);
		}

		return results;
	}

	/**
	 * Parse frontmatter from file content
	 */
	private parseFrontmatter(content: string): {
		frontmatter: Record<string, unknown>;
		body: string;
		hasFrontmatter: boolean;
	} {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
		const match = content.match(frontmatterRegex);

		if (!match || !match[1] || match[2] === undefined) {
			return {
				frontmatter: {},
				body: content,
				hasFrontmatter: false
			};
		}

		const frontmatterText = match[1];
		const body = match[2];
		const frontmatter: Record<string, unknown> = {};

		// Simple YAML parsing (key: value pairs)
		const lines = frontmatterText.split('\n');
		for (const line of lines) {
			const colonIndex = line.indexOf(':');
			if (colonIndex === -1) continue;

			const key = line.substring(0, colonIndex).trim();
			let value: string | number | boolean = line.substring(colonIndex + 1).trim();

			// Remove quotes if present
			if (value.startsWith('"') && value.endsWith('"')) {
				value = value.substring(1, value.length - 1);
			}

			// Try to parse as number or boolean
			if (value === 'true') {
				value = true;
			} else if (value === 'false') {
				value = false;
			} else if (!isNaN(Number(value)) && value !== '') {
				value = Number(value);
			}

			frontmatter[key] = value;
		}

		return {
			frontmatter,
			body,
			hasFrontmatter: true
		};
	}

	/**
	 * Rebuild file content with updated frontmatter
	 */
	private rebuildContent(frontmatter: Record<string, unknown>, body: string): string {
		const lines: string[] = ['---'];

		// Determine position for custom fields
		const customFieldKeys = new Set(
			getSortedCustomFields(this.config.fields).map((f: CustomFrontmatterField) => f.key.trim())
		);

		// Add fields at start if configured
		if (this.config.fieldsPosition === 'start') {
			getSortedCustomFields(this.config.fields).forEach((field: CustomFrontmatterField) => {
				const key = field.key.trim();
				if (key && key in frontmatter) {
					lines.push(this.formatFrontmatterLine(key, frontmatter[key]));
					delete frontmatter[key]; // Remove so we don't add it again
				}
			});
		}

		// Add all other fields
		for (const [key, value] of Object.entries(frontmatter)) {
			if (!customFieldKeys.has(key)) {
				lines.push(this.formatFrontmatterLine(key, value));
			}
		}

		if (this.config.fieldsPosition === 'end') {
			getSortedCustomFields(this.config.fields).forEach((field: CustomFrontmatterField) => {
				const key = field.key.trim();
				if (key && key in frontmatter) {
					lines.push(this.formatFrontmatterLine(key, frontmatter[key]));
				}
			});
		}

		lines.push('---');
		return lines.join('\n') + '\n' + body;
	}

	/**
	 * Format a frontmatter line (key: value)
	 */
	private formatFrontmatterLine(key: string, value: unknown): string {
		if (typeof value === 'string') {
			// Escape and quote strings
			const escaped = value.replace(/"/g, '\\"');
			return `${key}: "${escaped}"`;
		} else if (typeof value === 'number' || typeof value === 'boolean') {
			return `${key}: ${value}`;
		} else if (Array.isArray(value)) {
			// Handle arrays (keep simplified for now)
			return `${key}: [${value.join(', ')}]`;
		} else {
			return `${key}: "${String(value)}"`;
		}
	}

	/**
	 * Format field value based on type
	 */
	private formatFieldValue(value: string, type: string): string | number | boolean {
		if (type === 'number') {
			const numValue = parseFloat(value);
			return isNaN(numValue) ? 0 : numValue;
		} else if (type === 'boolean') {
			const lowercaseValue = value.toLowerCase().trim();
			return lowercaseValue === 'true' || 
				   lowercaseValue === 'yes' || 
				   lowercaseValue === '1';
		}
		return value;
	}
}
