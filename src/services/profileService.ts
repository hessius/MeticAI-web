import { getServerUrl } from '@/lib/config';
import { apiFetch, createFormData } from './api';
import { APIResponse, APIResponseSchema, AdvancedCustomizationOptions } from '@/types';

export interface AnalyzeImageRequest {
  image: File;
  preferences?: string;
  tags?: string[];
  advancedOptions?: AdvancedCustomizationOptions;
}

export interface ProfileCountResponse {
  count: number;
}

/**
 * Profile Service - handles all profile-related API calls
 */
export class ProfileService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getServerUrl();
  }

  /**
   * Get the total count of profiles
   */
  async getProfileCount(): Promise<number> {
    try {
      const response = await apiFetch<ProfileCountResponse>(
        `${this.baseUrl}/profile-count`
      );
      return response.count;
    } catch (error) {
      console.error('Failed to fetch profile count:', error);
      return 0;
    }
  }

  /**
   * Analyze an image and generate a profile
   */
  async analyzeImage(request: AnalyzeImageRequest): Promise<APIResponse> {
    const formData = createFormData({
      image: request.image,
      preferences: request.preferences || '',
      tags: JSON.stringify(request.tags || []),
      advanced_options: JSON.stringify(request.advancedOptions || {}),
    });

    const response = await apiFetch<unknown>(
      `${this.baseUrl}/analyze`,
      {
        method: 'POST',
        body: formData,
      }
    );

    // Validate response with Zod
    return APIResponseSchema.parse(response);
  }

  /**
   * Delete a profile by ID
   */
  async deleteProfile(profileId: string): Promise<void> {
    await apiFetch(
      `${this.baseUrl}/profiles/${profileId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Update a profile
   */
  async updateProfile(
    profileId: string,
    data: { name?: string; profile_json?: string; preferences?: string }
  ): Promise<void> {
    await apiFetch(
      `${this.baseUrl}/profiles/${profileId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Export profile as JSON file
   */
  async exportProfile(profileId: string): Promise<Blob> {
    return await apiFetch<Blob>(
      `${this.baseUrl}/profiles/${profileId}/export`
    );
  }
}

// Export singleton instance
export const profileService = new ProfileService();
