import {requestUrl} from "obsidian";
import {ISeriesMetadataProvider} from "./ISeriesMetadataProvider";
import {TVSeriesMetadata, TVSeriesSearchResult, SeasonMetadata, EpisodeMetadata} from "../models/SeriesMetadata";

/**
 * TVMaze API Response Interfaces
 */
interface TVMazeSearchResponse {
	score: number;
	show: TVMazeShow;
}

interface TVMazeShow {
	id: number;
	name: string;
	type?: string;
	language?: string;
	genres?: string[];
	status?: string;
	runtime?: number;
	averageRuntime?: number;
	premiered?: string;
	ended?: string;
	officialSite?: string;
	network?: TVMazeNetwork | null;
	webChannel?: TVMazeNetwork | null;
	rating?: { average?: number | null };
	image?: { medium?: string; original?: string } | null;
	summary?: string;
	_embedded?: TVMazeEmbedded;
	externals?: { imdb?: string | null; thetvdb?: number | null; tvrage?: number | null };
}

interface TVMazeNetwork {
	id: number;
	name: string;
	country?: { name?: string; code?: string };
}

interface TVMazeEmbedded {
	episodes?: TVMazeEpisode[];
	seasons?: TVMazeSeason[];
}

interface TVMazeSeason {
	id: number;
	number: number;
	name?: string;
	episodeOrder?: number;
	premiereDate?: string;
	endDate?: string;
	image?: { medium?: string; original?: string } | null;
	summary?: string;
}

interface TVMazeEpisode {
	id: number;
	season: number;
	number: number;
	name: string;
	airdate?: string;
	runtime?: number;
	rating?: { average?: number | null };
	image?: { medium?: string; original?: string } | null;
	summary?: string;
}

/**
 * TVMaze API Provider
 * Free, no API key required.
 * API docs: https://www.tvmaze.com/api
 */
export class TVMazeApiService implements ISeriesMetadataProvider {
	private readonly baseUrl = 'https://api.tvmaze.com';
	private readonly timeout = 10000;

	getProviderId(): string {
		return 'tvmaze';
	}

	supportsUrl(url: string): boolean {
		return url.includes('tvmaze.com');
	}

	async fetchByUrl(url: string): Promise<TVSeriesMetadata | null> {
		// Extract show ID from URL like: https://www.tvmaze.com/shows/82/game-of-thrones
		const match = url.match(/tvmaze\.com\/shows\/(\d+)/);
		if (!match || !match[1]) return null;
		return this.fetchById(match[1]);
	}

	async fetchById(id: string): Promise<TVSeriesMetadata | null> {
		try {
			// Determine lookup type from prefix
			let apiUrl: string;

			if (id.toLowerCase().startsWith('imdb:')) {
				const imdbId = id.substring(5).trim();
				apiUrl = `${this.baseUrl}/lookup/shows?imdb=${encodeURIComponent(imdbId)}`;
				const response = await requestUrl({url: apiUrl, throw: false});
				if (response.status !== 200) return null;
				const show = response.json as TVMazeShow;
				return this.fetchFullShow(String(show.id));
			}

			if (id.toLowerCase().startsWith('tvdb:')) {
				const tvdbId = id.substring(5).trim();
				apiUrl = `${this.baseUrl}/lookup/shows?thetvdb=${encodeURIComponent(tvdbId)}`;
				const response = await requestUrl({url: apiUrl, throw: false});
				if (response.status !== 200) return null;
				const show = response.json as TVMazeShow;
				return this.fetchFullShow(String(show.id));
			}

			// Plain numeric TVMaze ID
			return this.fetchFullShow(id);
		} catch (error) {
			console.error('[TVMaze] Error fetching by ID:', error);
			return null;
		}
	}

	async search(query: string): Promise<TVSeriesSearchResult[]> {
		try {
			const url = `${this.baseUrl}/search/shows?q=${encodeURIComponent(query)}`;
			const response = await requestUrl({url, throw: false});
			if (response.status !== 200) return [];

			const results = response.json as TVMazeSearchResponse[];
			return results.map(r => ({
				metadata: this.mapShowToMetadata(r.show),
				relevanceScore: r.score
			}));
		} catch (error) {
			console.error('[TVMaze] Error searching:', error);
			return [];
		}
	}

	/**
	 * Fetch full show details including seasons and episodes
	 */
	private async fetchFullShow(id: string): Promise<TVSeriesMetadata | null> {
		try {
			const url = `${this.baseUrl}/shows/${encodeURIComponent(id)}?embed[]=episodes&embed[]=seasons`;
			const response = await requestUrl({url, throw: false});
			if (response.status !== 200) return null;

			const show = response.json as TVMazeShow;
			return this.mapShowToMetadata(show);
		} catch (error) {
			console.error('[TVMaze] Error fetching show:', error);
			return null;
		}
	}

	/**
	 * Map TVMaze show to TVSeriesMetadata
	 */
	private mapShowToMetadata(show: TVMazeShow): TVSeriesMetadata {
		const embedded = show._embedded;
		const seasons = this.buildSeasons(embedded?.seasons, embedded?.episodes);

		const network = show.network?.name ?? show.webChannel?.name;

		// Strip HTML tags from summary
		const summary = show.summary
			? show.summary.replace(/<[^>]+>/g, '').trim()
			: undefined;

		return {
			id: String(show.id),
			provider: 'tvmaze',
			title: show.name,
			overview: summary,
			status: show.status,
			network: network,
			language: show.language ?? undefined,
			firstAired: show.premiered ?? undefined,
			lastAired: show.ended ?? undefined,
			genres: show.genres && show.genres.length > 0 ? show.genres : undefined,
			rating: show.rating?.average ?? undefined,
			seasons: seasons.length > 0 ? seasons : undefined,
			totalSeasons: seasons.length > 0 ? seasons.length : undefined,
			totalEpisodes: embedded?.episodes?.length,
			coverUrl: show.image?.original ?? show.image?.medium ?? undefined,
			url: `https://www.tvmaze.com/shows/${show.id}`,
			tvmazeId: String(show.id),
			imdbId: show.externals?.imdb ?? undefined,
			tvdbId: show.externals?.thetvdb != null ? String(show.externals.thetvdb) : undefined,
			retrievedAt: new Date().toISOString(),
		};
	}

	/**
	 * Build SeasonMetadata array from embedded TVMaze data
	 */
	private buildSeasons(
		rawSeasons?: TVMazeSeason[],
		rawEpisodes?: TVMazeEpisode[]
	): SeasonMetadata[] {
		if (!rawSeasons || rawSeasons.length === 0) return [];

		// Group episodes by season
		const episodesBySeason = new Map<number, TVMazeEpisode[]>();
		if (rawEpisodes) {
			for (const ep of rawEpisodes) {
				if (!episodesBySeason.has(ep.season)) {
					episodesBySeason.set(ep.season, []);
				}
				episodesBySeason.get(ep.season)!.push(ep);
			}
		}

		return rawSeasons.map(s => {
			const eps = episodesBySeason.get(s.number) ?? [];
			const episodes: EpisodeMetadata[] = eps.map(ep => ({
				id: String(ep.id),
				number: ep.number,
				title: ep.name,
				airdate: ep.airdate || undefined,
				runtime: ep.runtime ?? undefined,
				overview: ep.summary ? ep.summary.replace(/<[^>]+>/g, '').trim() : undefined,
				rating: ep.rating?.average ?? undefined,
				imageUrl: ep.image?.original ?? ep.image?.medium ?? undefined,
			}));

			return {
				id: String(s.id),
				number: s.number,
				episodeCount: s.episodeOrder ?? eps.length,
				premiereDate: s.premiereDate ?? undefined,
				endDate: s.endDate ?? undefined,
				overview: s.summary ? s.summary.replace(/<[^>]+>/g, '').trim() : undefined,
				imageUrl: s.image?.original ?? s.image?.medium ?? undefined,
				episodes: episodes.length > 0 ? episodes : undefined,
			};
		});
	}
}
