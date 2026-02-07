import { getServerUrl } from '@/lib/config';
import { apiFetch, buildUrl } from './api';
import {
  HistoryEntry,
  HistoryResponse,
  HistoryResponseSchema,
  PaginationParams,
} from '@/types';

export interface HistoryFilters {
  search?: string;
  tags?: string[];
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface FetchHistoryParams extends PaginationParams, HistoryFilters {}

/**
 * History Service - handles all history-related API calls
 */
export class HistoryService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getServerUrl();
  }

  /**
   * Fetch paginated history with filters
   */
  async fetchHistory(params: FetchHistoryParams): Promise<HistoryResponse> {
    const url = buildUrl(`${this.baseUrl}/profiles`, {
      page: params.page,
      limit: params.limit,
      search: params.search,
      tags: params.tags?.join(','),
      sort_by: params.sortBy,
      sort_order: params.sortOrder,
    });

    const response = await apiFetch<unknown>(url);

    // Validate response with Zod
    return HistoryResponseSchema.parse(response);
  }

  /**
   * Fetch a single profile by ID
   */
  async fetchProfile(profileId: string): Promise<HistoryEntry> {
    const response = await apiFetch<unknown>(
      `${this.baseUrl}/profiles/${profileId}`
    );

    // Validate single entry
    return HistoryResponseSchema.parse({ 
      profiles: [response],
      total: 1,
      page: 1,
      limit: 1,
      has_more: false,
    }).profiles[0];
  }

  /**
   * Fetch profile image URL
   */
  getProfileImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Otherwise, construct the full URL
    return `${this.baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  /**
   * Search profiles by text
   */
  async searchProfiles(query: string, limit = 10): Promise<HistoryEntry[]> {
    const response = await this.fetchHistory({
      page: 1,
      limit,
      search: query,
    });

    return response.profiles;
  }

  /**
   * Fetch profiles by tags
   */
  async fetchProfilesByTags(tags: string[], limit = 20): Promise<HistoryEntry[]> {
    const response = await this.fetchHistory({
      page: 1,
      limit,
      tags,
    });

    return response.profiles;
  }
}

// Export singleton instance
export const historyService = new HistoryService();
