import API from '../../../shared/services/APIManager';
import { TransactionBatch, CreateBatchRequest } from '../types/batch';

export interface BatchListParams {
  offset?: number;
  limit?: number;
  is_active?: boolean;
}

class BatchService {
  private readonly baseUrl = '/mobile-corporate/transaction-batches';

  /**
   * Get list of transaction batches
   */
  async getBatches(params: BatchListParams = {}): Promise<TransactionBatch[]> {
    try {
      const defaultParams = {
        offset: 0,
        limit: 100,
        is_active: true,
        ...params,
      };

      console.log('[batch] Fetching batches with params:', defaultParams);

      const response = await API.get(this.baseUrl, {
        params: defaultParams,
      });

      const data = response.data;
      console.log('[batch] API response:', data);

      // Handle empty array response
      if (Array.isArray(data) && data.length === 0) {
        console.log('[batch] No active batches found');
        return [];
      }

      // Handle array response (list of batches)
      if (Array.isArray(data)) {
        console.log(`[batch] Found ${data.length} active batches`);
        return data;
      }

      // Handle paginated response (if API returns object with data array)
      if (data && Array.isArray(data.data)) {
        console.log(`[batch] Found ${data.data.length} active batches (paginated)`);
        return data.data;
      }

      console.warn('[batch] Unexpected response format:', data);
      return [];
    } catch (error: any) {
      console.error('[batch] Error fetching batches:', error.message);
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }
  }

  /**
   * Get the latest active batch
   */
  async getLatestActiveBatch(): Promise<TransactionBatch | null> {
    try {
      const batches = await this.getBatches({ is_active: true });
      
      if (batches.length === 0) {
        console.log('[batch] No active batches available');
        return null;
      }

      // Sort by created_at descending to get the latest
      const sortedBatches = batches.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const latestBatch = sortedBatches[0];
      console.log('[batch] Latest active batch:', {
        id: latestBatch.id,
        unique_code_cbs: latestBatch.unique_code_cbs,
        created_at: latestBatch.created_at,
        is_active: latestBatch.is_active
      });

      return latestBatch;
    } catch (error: any) {
      console.error('[batch] Error getting latest active batch:', error.message);
      throw error;
    }
  }

  /**
   * Check if there are any active batches
   */
  async hasActiveBatch(): Promise<boolean> {
    try {
      const latestBatch = await this.getLatestActiveBatch();
      return latestBatch !== null;
    } catch (error: any) {
      console.error('[batch] Error checking active batch:', error.message);
      return false;
    }
  }

  /**
   * Stop a batch by ID
   */
  async stopBatch(batchId: string): Promise<boolean> {
    try {
      console.log('[batch] Stopping batch:', batchId);

      const response = await API.patch(`${this.baseUrl}/${batchId}/stop`, {
        status: 0,
        is_active: false
      });

      console.log('[batch] Stop batch response:', response.data);
      return true;
    } catch (error: any) {
      console.error('[batch] Error stopping batch:', error.message);
      throw new Error(`Failed to stop batch: ${error.message}`);
    }
  }

  /**
   * Create a new batch
   */
  async createBatch(batchData: CreateBatchRequest): Promise<TransactionBatch> {
    try {
      console.log('[batch] Creating new batch:', batchData);

      const response = await API.post(this.baseUrl, batchData);

      console.log('[batch] Create batch response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[batch] Error creating batch:', error.message);
      throw new Error(`Failed to create batch: ${error.message}`);
    }
  }
}

export const batchService = new BatchService();
