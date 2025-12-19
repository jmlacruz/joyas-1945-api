type User = {
    name: string;
    link: string;
    contributor_id: string;
    thumbnail: string;
    reviews: number;
    photos: number;
};

type ExtractedSnippet = {
    original: string;
    translated: string;
};

type Response = {
    date: string;
    iso_date: string;
    iso_date_of_last_edit: string;
    snippet: string;
    extracted_snippet: ExtractedSnippet;
};

export type ReviewFromGoogle = {
    link: string;
    rating: number;
    date: string;
    iso_date: string;
    iso_date_of_last_edit: string;
    source: string;
    review_id: string;
    user: User;
    likes: number;
    snippet?: string;
    extracted_snippet?: ExtractedSnippet;
    response?: Response;
};

type SearchMetadata = {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_maps_reviews_url: string;
    raw_html_file: string;
    prettify_html_file: string;
    total_time_taken: number;
};

type SearchParameters = {
    engine: string;
    place_id: string;
    hl: string;
    next_page_token: string;
    sort_by: string;
};

type SerpApiPagination = {
    next: string;
    next_page_token: string;
};

export type SerpApiResponse = {
    search_metadata: SearchMetadata;
    search_parameters: SearchParameters;
    reviews: ReviewFromGoogle[];
    serpapi_pagination: SerpApiPagination;
};