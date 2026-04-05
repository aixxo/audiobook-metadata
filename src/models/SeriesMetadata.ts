/**
 * Central interfaces for TV series metadata
 * Supports data from multiple providers (TVMaze, TMDB)
 */

export interface EpisodeMetadata {
	id: string;                   // Provider-specific ID
	number: number;               // Episode number within season
	title: string;
	airdate?: string;             // ISO format YYYY-MM-DD
	runtime?: number;             // Runtime in minutes
	overview?: string;
	rating?: number;              // Average rating (0-10)
	imageUrl?: string;
}

export interface SeasonMetadata {
	id: string;                   // Provider-specific ID
	number: number;               // Season number
	episodeCount: number;
	premiereDate?: string;        // ISO format YYYY-MM-DD
	endDate?: string;             // ISO format YYYY-MM-DD
	overview?: string;
	imageUrl?: string;
	episodes?: EpisodeMetadata[];
}

export interface TVSeriesMetadata {
	// Core identifiers
	id: string;                   // Provider-specific ID
	provider: string;             // Source provider ("tvmaze", "tmdb", "manual")

	// Basic information
	title: string;
	overview?: string;

	// Status & network
	status?: string;              // e.g. "Ended", "Running"
	network?: string;             // e.g. "HBO", "Netflix"
	language?: string;            // ISO language code

	// Dates
	firstAired?: string;          // ISO format YYYY-MM-DD
	lastAired?: string;           // ISO format YYYY-MM-DD

	// Classification
	genres?: string[];

	// Ratings
	rating?: number;              // Average rating (0-10)
	ratingCount?: number;

	// Creators / producers
	creators?: string[];

	// Season/episode data
	seasons?: SeasonMetadata[];
	totalSeasons?: number;
	totalEpisodes?: number;

	// Cover image
	coverUrl?: string;            // URL to poster/cover
	coverLocalPath?: string;      // Local vault path if downloaded

	// External identifiers
	tvmazeId?: string;
	tmdbId?: string;
	imdbId?: string;
	tvdbId?: string;

	// Metadata
	url?: string;                 // URL to the series page on the provider's site
	retrievedAt?: string;         // ISO timestamp when data was fetched
}

export interface TVSeriesSearchResult {
	metadata: TVSeriesMetadata;
	relevanceScore?: number;
}
