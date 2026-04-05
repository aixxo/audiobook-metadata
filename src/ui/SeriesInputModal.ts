import {App, Modal, Notice, Setting} from "obsidian";
import {TVSeriesMetadata} from "../models/SeriesMetadata";
import {ISeriesMetadataProvider} from "../services/ISeriesMetadataProvider";

type SeriesTab = 'search' | 'id' | 'manual';

/**
 * Modal for TV series input with multiple tabs
 */
export class SeriesInputModal extends Modal {
	private activeTab: SeriesTab;
	private tabContentContainer: HTMLElement;

	private searchTabContent: HTMLElement;
	private idTabContent: HTMLElement;
	private manualTabContent: HTMLElement;

	private searchTabEl: HTMLElement;
	private idTabEl: HTMLElement;
	private manualTabEl: HTMLElement;

	private onSubmit: (metadata: TVSeriesMetadata | null) => void;

	constructor(
		app: App,
		private provider: ISeriesMetadataProvider | null,
		private offlineMode: boolean,
		onSubmit: (metadata: TVSeriesMetadata | null) => void,
		initialTab: SeriesTab = 'search'
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.activeTab = offlineMode ? 'manual' : initialTab;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Add series metadata'});

		this.createTabs(contentEl);

		this.tabContentContainer = contentEl.createDiv({cls: 'audiobook-input-content'});
		this.searchTabContent = this.tabContentContainer.createDiv({cls: 'audiobook-tab-content'});
		this.idTabContent = this.tabContentContainer.createDiv({cls: 'audiobook-tab-content', attr: {style: 'display: none;'}});
		this.manualTabContent = this.tabContentContainer.createDiv({cls: 'audiobook-tab-content', attr: {style: 'display: none;'}});

		this.buildSearchTab();
		this.buildIdTab();
		this.buildManualTab();

		// Activate initial tab
		if (this.activeTab === 'id') {
			this.switchTab('id', this.idTabEl);
		} else if (this.activeTab === 'manual') {
			this.switchTab('manual', this.manualTabEl);
		}
	}

	onClose() {
		this.contentEl.empty();
	}

	// ──────────────────────────────────────────────────────────────
	// Tab navigation
	// ──────────────────────────────────────────────────────────────

	private createTabs(container: HTMLElement) {
		const tabContainer = container.createDiv({cls: 'audiobook-tabs'});

		this.searchTabEl = tabContainer.createDiv({cls: 'audiobook-tab audiobook-tab-active', text: 'Search'});
		this.idTabEl = tabContainer.createDiv({cls: 'audiobook-tab', text: 'ID'});
		this.manualTabEl = tabContainer.createDiv({cls: 'audiobook-tab', text: 'Manual'});

		this.searchTabEl.addEventListener('click', () => this.switchTab('search', this.searchTabEl));
		this.idTabEl.addEventListener('click', () => this.switchTab('id', this.idTabEl));
		this.manualTabEl.addEventListener('click', () => this.switchTab('manual', this.manualTabEl));

		if (this.offlineMode) {
			this.searchTabEl.addClass('audiobook-tab-disabled');
			this.idTabEl.addClass('audiobook-tab-disabled');
		}
	}

	private switchTab(tab: SeriesTab, tabEl: HTMLElement) {
		if (this.offlineMode && tab !== 'manual') {
			new Notice('Online features disabled in offline mode');
			return;
		}

		this.activeTab = tab;

		this.tabContentContainer.parentElement?.querySelectorAll('.audiobook-tab').forEach(t => {
			t.removeClass('audiobook-tab-active');
		});
		tabEl.addClass('audiobook-tab-active');

		this.searchTabContent.style.display = tab === 'search' ? 'block' : 'none';
		this.idTabContent.style.display = tab === 'id' ? 'block' : 'none';
		this.manualTabContent.style.display = tab === 'manual' ? 'block' : 'none';
	}

	// ──────────────────────────────────────────────────────────────
	// Tab content builders
	// ──────────────────────────────────────────────────────────────

	private buildSearchTab() {
		let searchQuery = '';
		const resultsContainer = this.searchTabContent.createDiv({cls: 'audiobook-search-results'});

		new Setting(this.searchTabContent)
			.setName('Search')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('Search for a TV series by title')
			.addText(text => {
				text.setPlaceholder('Series title');
				text.onChange(value => searchQuery = value);
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && searchQuery) {
						void this.searchSeries(searchQuery, resultsContainer);
					}
				});
			});

		new Setting(this.searchTabContent)
			.addButton(btn => btn
				.setButtonText('Search')
				.setCta()
				.onClick(async () => {
					if (!searchQuery) {
						new Notice('Please enter a search query');
						return;
					}
					await this.searchSeries(searchQuery, resultsContainer);
				}));
	}

	private buildIdTab() {
		let idInput = '';

		new Setting(this.idTabContent)
			.setName('Series ID')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('Enter a TVMaze ID, TMDB ID, or IMDb ID (prefix with imdb: for IMDb IDs, e.g. imdb:tt0903747)')
			.addText(text => {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				text.setPlaceholder('e.g. 82   or   imdb:tt0903747');
				text.onChange(value => idInput = value);
				text.inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && idInput) {
						void this.fetchById(idInput);
					}
				});
			});

		new Setting(this.idTabContent)
			.addButton(btn => btn
				.setButtonText('Fetch metadata')
				.setCta()
				.onClick(async () => {
					if (!idInput) {
						new Notice('Please enter an ID');
						return;
					}
					await this.fetchById(idInput);
				}));
	}

	private buildManualTab() {
		const metadata: Partial<TVSeriesMetadata> = {provider: 'manual'};

		const submit = () => {
			if (!metadata.title) {
				new Notice('Title is required');
				return;
			}
			this.onSubmit(metadata as TVSeriesMetadata);
			this.close();
		};

		const addEnter = (text: { inputEl: HTMLInputElement }) => {
			text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
				if (e.key === 'Enter') submit();
			});
		};

		new Setting(this.manualTabContent)
			.setName('Title')
			.addText(text => {
				text.setPlaceholder('Series title');
				text.onChange(v => metadata.title = v);
				addEnter(text);
			});

		new Setting(this.manualTabContent)
			.setName('Network / platform')
			.addText(text => {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				text.setPlaceholder('e.g. HBO, Netflix');
				text.onChange(v => metadata.network = v);
				addEnter(text);
			});

		new Setting(this.manualTabContent)
			.setName('Status')
			.addText(text => {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				text.setPlaceholder('e.g. Ended, running');
				text.onChange(v => metadata.status = v);
				addEnter(text);
			});

		new Setting(this.manualTabContent)
			.setName('First aired')
			.addText(text => {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				text.setPlaceholder('YYYY-MM-DD');
				text.onChange(v => metadata.firstAired = v);
				addEnter(text);
			});

		new Setting(this.manualTabContent)
			.setName('Cover URL')
			.addText(text => {
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				text.setPlaceholder('https://...');
				text.onChange(v => metadata.coverUrl = v);
				addEnter(text);
			});

		new Setting(this.manualTabContent)
			.setName('Overview')
			.addTextArea(textarea => {
				textarea.setPlaceholder('Short description of the series...');
				textarea.onChange(v => metadata.overview = v);
			});

		new Setting(this.manualTabContent)
			.addButton(btn => btn
				.setButtonText('Create')
				.setCta()
				.onClick(submit));
	}

	// ──────────────────────────────────────────────────────────────
	// Fetch helpers
	// ──────────────────────────────────────────────────────────────

	private async searchSeries(query: string, container: HTMLElement) {
		if (!this.provider) return;
		container.empty();

		try {
			const results = await this.provider.search(query);

			if (results.length === 0) {
				container.createDiv({text: 'No results found', cls: 'audiobook-search-empty'});
				return;
			}

			results.forEach(result => {
				const item = container.createDiv({cls: 'audiobook-search-item'});
				const m = result.metadata;

				if (m.coverUrl) {
					item.createEl('img', {
						cls: 'audiobook-search-thumbnail',
						attr: {src: m.coverUrl, alt: m.title}
					});
				}

				const info = item.createDiv({cls: 'audiobook-search-info'});
				info.createEl('strong', {text: m.title});
				if (m.network) {
					info.createDiv({text: m.network, cls: 'audiobook-search-author'});
				}
				if (m.firstAired) {
					info.createDiv({text: m.firstAired.substring(0, 4), cls: 'audiobook-search-author'});
				}
				if (m.status) {
					info.createDiv({text: m.status, cls: 'audiobook-search-author'});
				}

				const btn = item.createEl('button', {text: 'Select', cls: 'mod-cta'});
				btn.addEventListener('click', () => {
					void this.fetchById(m.id, m);
				});
			});
		} catch (error) {
			console.error('[SeriesInputModal] Search error:', error);
			const msg = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Search failed: ${msg}`);
		}
	}

	private async fetchById(id: string, fallback?: TVSeriesMetadata) {
		if (!this.provider) return;
		try {
			const metadata = (await this.provider.fetchById(id)) ?? fallback ?? null;
			if (metadata) {
				this.onSubmit(metadata);
				this.close();
			} else {
				new Notice('Could not fetch metadata for this ID');
			}
		} catch (error) {
			console.error('[SeriesInputModal] Fetch error:', error);
			const msg = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error: ${msg}`);
		}
	}
}
