import {TVSeriesMetadata, TVSeriesSearchResult} from "../models/SeriesMetadata";

/**
 * Base interface for TV series metadata providers
 * Allows modular integration of different APIs (TVMaze, TMDB)
 */
export interface ISeriesMetadataProvider {
	/**
	 * Fetch series metadata from a URL
	 * @param url Full URL to the series page
	 * @returns Metadata or null if not found
	 */
	fetchByUrl(url: string): Promise<TVSeriesMetadata | null>;

	/**
	 * Fetch series metadata by provider-specific ID
	 * @param id Provider-specific identifier (TVMaze ID, TMDB ID, IMDb ID, etc.)
	 * @returns Metadata or null if not found
	 */
	fetchById(id: string): Promise<TVSeriesMetadata | null>;

	/**
	 * Search for series by query string
	 * @param query Search terms (title, etc.)
	 * @returns Array of search results
	 */
	search(query: string): Promise<TVSeriesSearchResult[]>;

	/**
	 * Check if this provider supports a given URL
	 * @param url URL to check
	 * @returns true if the provider can handle this URL
	 */
	supportsUrl(url: string): boolean;

	/**
	 * Get the provider identifier for caching
	 * @returns Provider ID string (e.g., "tvmaze", "tmdb")
	 */
	getProviderId(): string;
}
