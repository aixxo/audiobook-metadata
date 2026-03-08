import {IMetadataProvider} from "./IMetadataProvider";
import {AudiobookMetadata, AudiobookSearchResult} from "../models/AudiobookMetadata";

/**
 * Google Books API Provider
 * Uses Google Books API v1 (https://developers.google.com/books)
 */
export class GoogleBooksApiService implements IMetadataProvider {
	private readonly apiBaseUrl = 'https://www.googleapis.com/books/v1/volumes';

	getProviderId(): string {
		return 'googlebooks';
	}

	supportsUrl(url: string): boolean {
		return url.includes('books.google.') || url.includes('play.google.com/store/books');
	}

	async fetchByUrl(url: string): Promise<AudiobookMetadata | null> {
		// Extract book ID from Google Books URL
		const idMatch = url.match(/id=([^&]+)/);
		if (!idMatch || !idMatch[1]) {
			console.error('[GoogleBooks] Could not extract ID from URL:', url);
			return null;
		}

		return this.fetchById(idMatch[1]);
	}

	async fetchById(id: string): Promise<AudiobookMetadata | null> {
		try {
			const response = await fetch(`${this.apiBaseUrl}/${id}`);
			
			if (!response.ok) {
				console.error('[GoogleBooks] API error:', response.status, response.statusText);
				return null;
			}

			const data = await response.json();
			return this.mapToAudiobookMetadata(data);
		} catch (error) {
			console.error('[GoogleBooks] Fetch error:', error);
			return null;
		}
	}

	async search(query: string): Promise<AudiobookSearchResult[]> {
		try {
			const encodedQuery = encodeURIComponent(query);
			const response = await fetch(`${this.apiBaseUrl}?q=${encodedQuery}&maxResults=10`);
			
			if (!response.ok) {
				console.error('[GoogleBooks] Search API error:', response.status);
				return [];
			}

			const data = await response.json();
			
			if (!data.items || data.items.length === 0) {
				return [];
			}

			return data.items.map((item: any) => ({
				metadata: this.mapToAudiobookMetadata(item),
				relevanceScore: undefined
			}));
		} catch (error) {
			console.error('[GoogleBooks] Search error:', error);
			return [];
		}
	}

	/**
	 * Map Google Books API response to AudiobookMetadata
	 */
	private mapToAudiobookMetadata(data: any): AudiobookMetadata {
		const volumeInfo = data.volumeInfo || {};
		const saleInfo = data.saleInfo || {};

		return {
			id: data.id,
			provider: 'googlebooks',
			title: volumeInfo.title || 'Unknown Title',
			subtitle: volumeInfo.subtitle,
			author: volumeInfo.authors || [],
			publisher: volumeInfo.publisher,
			publishedDate: volumeInfo.publishedDate,
			language: volumeInfo.language,
			description: volumeInfo.description,
			genre: volumeInfo.categories,
			rating: volumeInfo.averageRating,
			ratingCount: volumeInfo.ratingsCount,
			coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
			isbn: this.extractIsbn(volumeInfo.industryIdentifiers, '10'),
			isbn13: this.extractIsbn(volumeInfo.industryIdentifiers, '13'),
			retrievedAt: new Date().toISOString(),
			url: volumeInfo.infoLink || saleInfo.buyLink
		};
	}

	/**
	 * Extract ISBN from industry identifiers
	 */
	private extractIsbn(identifiers: any[] | undefined, type: '10' | '13'): string | undefined {
		if (!identifiers) return undefined;
		
		const targetType = type === '10' ? 'ISBN_10' : 'ISBN_13';
		const identifier = identifiers.find(id => id.type === targetType);
		return identifier?.identifier;
	}
}
