import {requestUrl} from "obsidian";
import {ISeriesMetadataProvider} from "./ISeriesMetadataProvider";
import {TVSeriesMetadata, TVSeriesSearchResult, SeasonMetadata, EpisodeMetadata} from "../models/SeriesMetadata";

/**
 * TMDB API Response Interfaces
 */
interface TMDBSearchResponse {
	results: TMDBSearchResult[];
}

interface TMDBSearchResult {
	id: number;
	name: string;
	overview?: string;
	first_air_date?: string;
	genre_ids?: number[];
	origin_country?: string[];
	original_language?: string;
	vote_average?: number;
	vote_count?: number;
	poster_path?: string | null;
}

interface TMDBTVDetail {
	id: number;
	name: string;
	overview?: string;
	status?: string;
	first_air_date?: string;
	last_air_date?: string;
	number_of_seasons?: number;
	number_of_episodes?: number;
	genres?: TMDBGenre[];
	networks?: TMDBNetwork[];
	original_language?: string;
	vote_average?: number;
	vote_count?: number;
	poster_path?: string | null;
	backdrop_path?: string | null;
	created_by?: TMDBCreator[];
	seasons?: TMDBSeasonSummary[];
	external_ids?: {
		imdb_id?: string | null;
		tvdb_id?: number | null;
	};
}

interface TMDBGenre {
	id: number;
	name: string;
}

interface TMDBNetwork {
	id: number;
	name: string;
	origin_country?: string;
}

interface TMDBCreator {
	id: number;
	name: string;
}

interface TMDBSeasonSummary {
	id: number;
	season_number: number;
	episode_count: number;
	name?: string;
	overview?: string;
	air_date?: string;
	poster_path?: string | null;
}

interface TMDBSeasonDetail {
	id: number;
	season_number: number;
	name?: string;
	overview?: string;
	air_date?: string;
	poster_path?: string | null;
	episodes?: TMDBEpisode[];
}

interface TMDBEpisode {
	id: number;
	episode_number: number;
	name: string;
	overview?: string;
	air_date?: string;
	runtime?: number;
	vote_average?: number;
	still_path?: string | null;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * TMDB (The Movie Database) API Provider for TV series
 * Requires an API key from themoviedb.org
 * API docs: https://developers.themoviedb.org/3
 */
export class TMDBApiService implements ISeriesMetadataProvider {
	private readonly baseUrl = 'https://api.themoviedb.org/3';
	private readonly timeout = 10000;

	constructor(private apiKey: string, private language = 'en-US') {}

	getProviderId(): string {
		return `tmdb-${this.language}`;
	}

	supportsUrl(url: string): boolean {
		return url.includes('themoviedb.org') || url.includes('tmdb.org');
	}

	async fetchByUrl(url: string): Promise<TVSeriesMetadata | null> {
		// Extract show ID from URL like: https://www.themoviedb.org/tv/1396-breaking-bad
		const match = url.match(/themoviedb\.org\/tv\/(\d+)/);
		if (!match || !match[1]) return null;
		return this.fetchById(match[1]);
	}

	async fetchById(id: string): Promise<TVSeriesMetadata | null> {
		try {
			if (!this.apiKey) {
				throw new Error('TMDB API key is not configured. Please add it in the plugin settings.');
			}

			// Support imdb: prefix for cross-provider lookup
			if (id.toLowerCase().startsWith('imdb:')) {
				const imdbId = id.substring(5).trim();
				const findUrl = `${this.baseUrl}/find/${encodeURIComponent(imdbId)}?api_key=${this.apiKey}&external_source=imdb_id`;
				const findResp = await requestUrl({url: findUrl, throw: false});
				if (findResp.status !== 200) return null;
				const findResult = findResp.json as { tv_results?: Array<{ id: number }> };
				const tvResult = findResult.tv_results?.[0];
				if (!tvResult) return null;
				return this.fetchFullShow(String(tvResult.id));
			}

			return this.fetchFullShow(id);
		} catch (error) {
			console.error('[TMDB] Error fetching by ID:', error);
			return null;
		}
	}

	async search(query: string): Promise<TVSeriesSearchResult[]> {
		try {
			if (!this.apiKey) {
				throw new Error('TMDB API key is not configured.');
			}
			const url = `${this.baseUrl}/search/tv?api_key=${this.apiKey}&language=${encodeURIComponent(this.language)}&query=${encodeURIComponent(query)}`;
			const response = await requestUrl({url, throw: false});
			if (response.status !== 200) return [];

			const data = response.json as TMDBSearchResponse;
			return data.results.map(r => ({
				metadata: this.mapSearchResultToMetadata(r),
				relevanceScore: r.vote_count,
			}));
		} catch (error) {
			console.error('[TMDB] Error searching:', error);
			return [];
		}
	}

	/**
	 * Fetch full show details with external IDs
	 */
	private async fetchFullShow(id: string): Promise<TVSeriesMetadata | null> {
		try {
			const url = `${this.baseUrl}/tv/${encodeURIComponent(id)}?api_key=${this.apiKey}&language=${encodeURIComponent(this.language)}&append_to_response=external_ids`;
			const response = await requestUrl({url, throw: false});
			if (response.status !== 200) return null;

			const show = response.json as TMDBTVDetail;
			const seasons = await this.fetchSeasons(show);

			return this.mapShowToMetadata(show, seasons);
		} catch (error) {
			console.error('[TMDB] Error fetching show:', error);
			return null;
		}
	}

	/**
	 * Fetch all season details (with episodes) for a show
	 */
	private async fetchSeasons(show: TMDBTVDetail): Promise<SeasonMetadata[]> {
		if (!show.seasons || show.seasons.length === 0) return [];

		// Filter out specials season (season 0)
		const regularSeasons = show.seasons.filter(s => s.season_number > 0);

		const seasonDetails = await Promise.all(
			regularSeasons.map(s => this.fetchSeasonDetail(show.id, s.season_number))
		);

		return seasonDetails.filter((s): s is SeasonMetadata => s !== null);
	}

	/**
	 * Fetch a single season's details including episodes
	 */
	private async fetchSeasonDetail(showId: number, seasonNumber: number): Promise<SeasonMetadata | null> {
		try {
			const url = `${this.baseUrl}/tv/${showId}/season/${seasonNumber}?api_key=${this.apiKey}&language=${encodeURIComponent(this.language)}`;
			const response = await requestUrl({url, throw: false});
			if (response.status !== 200) return null;

			const season = response.json as TMDBSeasonDetail;

			const episodes: EpisodeMetadata[] = (season.episodes ?? []).map(ep => ({
				id: String(ep.id),
				number: ep.episode_number,
				title: ep.name,
				airdate: ep.air_date || undefined,
				runtime: ep.runtime ?? undefined,
				overview: ep.overview || undefined,
				rating: ep.vote_average || undefined,
				imageUrl: ep.still_path ? `${TMDB_IMAGE_BASE}/w300${ep.still_path}` : undefined,
			}));

			return {
				id: String(season.id),
				number: seasonNumber,
				episodeCount: season.episodes?.length ?? 0,
				premiereDate: season.air_date || undefined,
				overview: season.overview || undefined,
				imageUrl: season.poster_path ? `${TMDB_IMAGE_BASE}/w342${season.poster_path}` : undefined,
				episodes: episodes.length > 0 ? episodes : undefined,
			};
		} catch (error) {
			console.error(`[TMDB] Error fetching season ${seasonNumber}:`, error);
			return null;
		}
	}

	/**
	 * Map TMDB TV detail to TVSeriesMetadata
	 */
	private mapShowToMetadata(show: TMDBTVDetail, seasons: SeasonMetadata[]): TVSeriesMetadata {
		const network = show.networks?.[0]?.name;
		const creators = show.created_by?.map(c => c.name) ?? [];

		return {
			id: String(show.id),
			provider: 'tmdb',
			title: show.name,
			overview: show.overview || undefined,
			status: show.status,
			network: network,
			language: show.original_language ?? undefined,
			firstAired: show.first_air_date || undefined,
			lastAired: show.last_air_date || undefined,
			genres: show.genres?.map(g => g.name),
			rating: show.vote_average || undefined,
			ratingCount: show.vote_count || undefined,
			creators: creators.length > 0 ? creators : undefined,
			seasons: seasons.length > 0 ? seasons : undefined,
			totalSeasons: show.number_of_seasons,
			totalEpisodes: show.number_of_episodes,
			coverUrl: show.poster_path ? `${TMDB_IMAGE_BASE}/w500${show.poster_path}` : undefined,
			url: `https://www.themoviedb.org/tv/${show.id}`,
			tmdbId: String(show.id),
			imdbId: show.external_ids?.imdb_id ?? undefined,
			tvdbId: show.external_ids?.tvdb_id != null ? String(show.external_ids.tvdb_id) : undefined,
			retrievedAt: new Date().toISOString(),
		};
	}

	/**
	 * Map a TMDB search result (minimal data) to TVSeriesMetadata
	 */
	private mapSearchResultToMetadata(result: TMDBSearchResult): TVSeriesMetadata {
		return {
			id: String(result.id),
			provider: 'tmdb',
			title: result.name,
			overview: result.overview || undefined,
			firstAired: result.first_air_date || undefined,
			language: result.original_language || undefined,
			rating: result.vote_average || undefined,
			ratingCount: result.vote_count || undefined,
			coverUrl: result.poster_path ? `${TMDB_IMAGE_BASE}/w500${result.poster_path}` : undefined,
			url: `https://www.themoviedb.org/tv/${result.id}`,
			tmdbId: String(result.id),
			retrievedAt: new Date().toISOString(),
		};
	}
}
