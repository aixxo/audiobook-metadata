import {TVSeriesMetadata, SeasonMetadata} from "../models/SeriesMetadata";
import {SeriesPluginSettings, CustomFrontmatterField, CustomFieldsPosition} from "../settings";
import {getSortedCustomFields} from "../utils/TypeGuards";

/**
 * Service for generating markdown files from TV series metadata
 */
export class SeriesMarkdownGenerator {
	constructor(private settings: SeriesPluginSettings) {}

	/**
	 * Generate complete markdown content (frontmatter + body) for a series
	 */
	generateMarkdown(metadata: TVSeriesMetadata): string {
		let content = this.generateFrontmatter(metadata);
		content += '\n';
		content += this.generateBody(metadata);
		return content;
	}

	/**
	 * Generate standalone markdown for a single season (per-season file mode)
	 */
	generateSeasonMarkdown(season: SeasonMetadata, seriesTitle: string, seriesMetadata: TVSeriesMetadata): string {
		const lines: string[] = [];

		// Simple frontmatter for season file
		lines.push('---');
		lines.push(`title: "${this.escapeYaml(seriesTitle)} – Staffel ${season.number}"`);
		lines.push(`series: "${this.escapeYaml(seriesTitle)}"`);
		lines.push(`season: ${season.number}`);
		lines.push(`episode_count: ${season.episodeCount}`);
		if (season.premiereDate) {
			lines.push(`premiere_date: "${season.premiereDate}"`);
		}
		if (season.endDate) {
			lines.push(`end_date: "${season.endDate}"`);
		}
		lines.push('type: "series-season"');
		lines.push(`provider: "${seriesMetadata.provider}"`);
		lines.push(`source_url: "${seriesMetadata.url ?? ''}"`);
		lines.push('---');
		lines.push('');
		lines.push(`# ${seriesTitle} – Staffel ${season.number}`);
		lines.push('');

		if (season.overview) {
			lines.push(season.overview);
			lines.push('');
		}

		if (season.episodes && season.episodes.length > 0) {
			lines.push(this.generateEpisodeTable(season));
		}

		lines.push('## Notizen');
		lines.push('');
		lines.push('<!-- Eigene Notizen hier eintragen -->');
		lines.push('');

		return lines.join('\n');
	}

	/**
	 * Generate a safe filename for a series
	 */
	generateFilename(metadata: TVSeriesMetadata): string {
		const safe = metadata.title
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
		return `${safe}.md`;
	}

	/**
	 * Generate a safe filename for a season file
	 */
	generateSeasonFilename(metadata: TVSeriesMetadata, seasonNumber: number): string {
		const safe = metadata.title
			.replace(/[\\/:*?"<>|]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
		return `${safe} – Staffel ${seasonNumber}.md`;
	}

	// ──────────────────────────────────────────────────────────────
	// Private helpers
	// ──────────────────────────────────────────────────────────────

	private generateFrontmatter(metadata: TVSeriesMetadata): string {
		const lines: string[] = ['---'];

		if (this.settings.seriesCustomFieldsPosition === 'start') {
			const customLines = this.generateCustomFrontmatter();
			if (customLines.length > 0) { lines.push(...customLines); }
		}

		lines.push(`title: "${this.escapeYaml(metadata.title)}"`);

		if (metadata.overview) {
			lines.push(`overview: "${this.escapeYaml(metadata.overview)}"`);
		}

		if (metadata.status) {
			lines.push(`status: "${this.escapeYaml(metadata.status)}"`);
		}

		if (metadata.network) {
			lines.push(`network: "${this.escapeYaml(metadata.network)}"`);
		}

		if (metadata.language) {
			lines.push(`language: "${metadata.language}"`);
		}

		if (metadata.firstAired) {
			lines.push(`first_aired: "${metadata.firstAired}"`);
		}

		if (metadata.lastAired) {
			lines.push(`last_aired: "${metadata.lastAired}"`);
		}

		// Type (for Obsidian Bases filtering)
		lines.push('type: "series"');

		// Genres
		if (metadata.genres && metadata.genres.length > 0) {
			lines.push('genre:');
			metadata.genres.forEach(g => {
				lines.push(`  - "${this.escapeYaml(g)}"`);
			});
		}

		// Season/episode counts
		if (metadata.totalSeasons !== undefined) {
			lines.push(`total_seasons: ${metadata.totalSeasons}`);
		}
		if (metadata.totalEpisodes !== undefined) {
			lines.push(`total_episodes: ${metadata.totalEpisodes}`);
		}

		// Rating
		if (metadata.rating !== undefined) {
			lines.push(`rating: ${metadata.rating}`);
		}
		if (metadata.ratingCount !== undefined) {
			lines.push(`rating_count: ${metadata.ratingCount}`);
		}

		// Creators
		if (metadata.creators && metadata.creators.length > 0) {
			if (metadata.creators.length === 1 && metadata.creators[0]) {
				lines.push(`creator: "${this.escapeYaml(metadata.creators[0])}"`);
			} else {
				lines.push('creator:');
				metadata.creators.forEach(c => {
					lines.push(`  - "${this.escapeYaml(c)}"`);
				});
			}
		}

		// Cover image
		if (metadata.coverLocalPath) {
			lines.push(`cover: "[[${metadata.coverLocalPath}]]"`);
		} else if (metadata.coverUrl) {
			lines.push(`cover: "${metadata.coverUrl}"`);
		}

		// External IDs
		if (metadata.tvmazeId) {
			lines.push(`tvmaze_id: "${metadata.tvmazeId}"`);
		}
		if (metadata.tmdbId) {
			lines.push(`tmdb_id: "${metadata.tmdbId}"`);
		}
		if (metadata.imdbId) {
			lines.push(`imdb_id: "${metadata.imdbId}"`);
		}
		if (metadata.tvdbId) {
			lines.push(`tvdb_id: "${metadata.tvdbId}"`);
		}

		// Provider and URL
		lines.push(`provider: "${metadata.provider}"`);
		if (metadata.url) {
			lines.push(`source_url: "${metadata.url}"`);
		}
		if (metadata.retrievedAt) {
			lines.push(`retrieved_at: "${metadata.retrievedAt}"`);
		}

		if (this.settings.seriesCustomFieldsPosition === 'end') {
			const customLines = this.generateCustomFrontmatter();
			if (customLines.length > 0) { lines.push(...customLines); }
		}

		lines.push('---');
		return lines.join('\n');
	}

	private generateCustomFrontmatter(): string[] {
		const lines: string[] = [];
		const sortedFields = getSortedCustomFields(this.settings.seriesCustomFrontmatterFields);

		/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
		sortedFields.forEach((field: CustomFrontmatterField) => {
			if (!field.key.trim()) { return; }
			const key = field.key.trim();
			const value = field.value;
			let formattedValue: string;
			if (field.type === 'string') {
				formattedValue = `"${this.escapeYaml(value)}"`;
			} else if (field.type === 'number') {
				const numValue = parseFloat(value);
				formattedValue = isNaN(numValue) ? '0' : numValue.toString();
			} else if (field.type === 'boolean') {
				const lowercaseValue = value.toLowerCase().trim();
				const boolValue = lowercaseValue === 'true' || lowercaseValue === 'yes' || lowercaseValue === '1';
				formattedValue = boolValue.toString();
			} else {
				formattedValue = `"${this.escapeYaml(value)}"`;
			}
			lines.push(`${key}: ${formattedValue}`);
		});
		/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */

		return lines;
	}

	private generateBody(metadata: TVSeriesMetadata): string {
		const sections: string[] = [];

		// Title header
		sections.push(`# ${metadata.title}`);
		sections.push('');

		// Series card code block
		sections.push('```series');
		sections.push('# Card renders from frontmatter');
		sections.push('```');
		sections.push('');

		// Overview
		if (metadata.overview) {
			sections.push('## Overview');
			sections.push('');
			sections.push(metadata.overview);
			sections.push('');
		}

		// Info table
		sections.push(this.generateInfoTable(metadata));
		sections.push('');

		// Seasons/episodes section
		const detailLevel = this.settings.seriesEpisodeDetailLevel;
		const fileMode = this.settings.seriesFileMode;

		if (detailLevel !== 'none' && metadata.seasons && metadata.seasons.length > 0) {
			sections.push('## Staffeln');
			sections.push('');

			if (detailLevel === 'seasons-only') {
				sections.push(this.generateSeasonsTable(metadata));
				sections.push('');
			} else if (detailLevel === 'full') {
				if (fileMode === 'per-season') {
					// In per-season mode the body only lists seasons with links
					sections.push(this.generateSeasonsTableWithLinks(metadata));
					sections.push('');
				} else {
					// single-file mode: embed all episodes
					for (const season of metadata.seasons) {
						sections.push(`### Staffel ${season.number}`);
						sections.push('');
						if (season.overview) {
							sections.push(season.overview);
							sections.push('');
						}
						if (season.episodes && season.episodes.length > 0) {
							sections.push(this.generateEpisodeTable(season));
							sections.push('');
						}
					}
				}
			}
		}

		// Notes section
		sections.push('## Notizen');
		sections.push('');
		sections.push('<!-- Eigene Notizen hier eintragen -->');
		sections.push('');

		return sections.join('\n');
	}

	private generateInfoTable(metadata: TVSeriesMetadata): string {
		const rows: string[] = [];

		if (metadata.status) rows.push(`| Status | ${metadata.status} |`);
		if (metadata.network) rows.push(`| Sender | ${metadata.network} |`);
		if (metadata.firstAired) rows.push(`| Erstausstrahlung | ${metadata.firstAired} |`);
		if (metadata.lastAired && metadata.status?.toLowerCase() === 'ended') {
			rows.push(`| Letzte Episode | ${metadata.lastAired} |`);
		}
		if (metadata.totalSeasons !== undefined) rows.push(`| Staffeln | ${metadata.totalSeasons} |`);
		if (metadata.totalEpisodes !== undefined) rows.push(`| Episoden | ${metadata.totalEpisodes} |`);
		if (metadata.language) rows.push(`| Sprache | ${metadata.language} |`);
		if (metadata.rating !== undefined) rows.push(`| Bewertung | ${metadata.rating.toFixed(1)} |`);
		if (metadata.creators && metadata.creators.length > 0) {
			rows.push(`| Erschaffer | ${metadata.creators.join(', ')} |`);
		}

		if (rows.length === 0) return '';

		const lines: string[] = [
			'| Eigenschaft | Wert |',
			'| --- | --- |',
			...rows,
		];
		return lines.join('\n');
	}

	private generateSeasonsTable(metadata: TVSeriesMetadata): string {
		const lines: string[] = [
			'| Staffel | Erstausstrahlung | Episoden |',
			'| --- | --- | --- |',
		];
		for (const season of metadata.seasons!) {
			const premiere = season.premiereDate ?? '–';
			lines.push(`| ${season.number} | ${premiere} | ${season.episodeCount} |`);
		}
		return lines.join('\n');
	}

	private generateSeasonsTableWithLinks(metadata: TVSeriesMetadata): string {
		const lines: string[] = [
			'| Staffel | Erstausstrahlung | Episoden |',
			'| --- | --- | --- |',
		];
		const safeTitle = metadata.title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
		for (const season of metadata.seasons!) {
			const premiere = season.premiereDate ?? '–';
			const link = `[[${safeTitle} – Staffel ${season.number}|Staffel ${season.number}]]`;
			lines.push(`| ${link} | ${premiere} | ${season.episodeCount} |`);
		}
		return lines.join('\n');
	}

	private generateEpisodeTable(season: SeasonMetadata): string {
		const lines: string[] = [
			'| Nr. | Titel | Ausstrahlung | Laufzeit |',
			'| --- | --- | --- | --- |',
		];
		for (const ep of season.episodes!) {
			const runtime = ep.runtime ? `${ep.runtime} min` : '–';
			const airdate = ep.airdate ?? '–';
			lines.push(`| ${ep.number} | ${ep.title} | ${airdate} | ${runtime} |`);
		}
		return lines.join('\n');
	}

	private escapeYaml(value: string): string {
		return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	}
}
