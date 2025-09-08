import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionBatch } from '../features/home/types/batch';
import { batchService } from '../features/home/services/batchService';

type BatchState = {
  currentBatch: TransactionBatch | null;
  hasActiveBatch: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
  
  // Actions
  setCurrentBatch: (batch: TransactionBatch | null) => void;
  checkActiveBatch: () => Promise<boolean>;
  refreshBatch: () => Promise<void>;
  clearBatch: () => void;
};

export const useBatch = create<BatchState>()((set, get) => ({
  currentBatch: null,
  hasActiveBatch: false,
  isLoading: false,
  lastChecked: null,
  
  setCurrentBatch: (batch: TransactionBatch | null) => {
    console.log('[batch-store] Setting current batch:', batch?.id || 'null');
    
    // Store active batch ID in AsyncStorage for location tracking
    if (batch?.id) {
      AsyncStorage.setItem('activeBatchId', batch.id);
      console.log('[batch-store] Stored active batch ID:', batch.id);
    } else {
      AsyncStorage.removeItem('activeBatchId');
      console.log('[batch-store] Removed active batch ID');
    }
    
    set({ 
      currentBatch: batch,
      hasActiveBatch: batch !== null,
      lastChecked: new Date()
    });
  },
  
  checkActiveBatch: async (): Promise<boolean> => {
    const { isLoading } = get();
    if (isLoading) {
      console.log('[batch-store] Already checking batch, skipping...');
      return get().hasActiveBatch;
    }

    try {
      console.log('[batch-store] Checking for active batch...');
      set({ isLoading: true });
      
      const latestBatch = await batchService.getLatestActiveBatch();
      const hasActive = latestBatch !== null;
      
      // Store active batch ID in AsyncStorage if batch is found
      if (latestBatch?.id) {
        AsyncStorage.setItem('activeBatchId', latestBatch.id);
        console.log('[batch-store] Stored active batch ID from check:', latestBatch.id);
      } else {
        AsyncStorage.removeItem('activeBatchId');
        console.log('[batch-store] Removed active batch ID from check');
      }
      
      set({ 
        currentBatch: latestBatch,
        hasActiveBatch: hasActive,
        lastChecked: new Date(),
        isLoading: false
      });
      
      console.log('[batch-store] Batch check completed:', {
        hasActive,
        batchId: latestBatch?.id || 'none'
      });
      
      return hasActive;
    } catch (error) {
      console.error('[batch-store] Error checking active batch:', error);
      set({ 
        isLoading: false,
        hasActiveBatch: false,
        currentBatch: null
      });
      return false;
    }
  },
  
  refreshBatch: async (): Promise<void> => {
    console.log('[batch-store] Refreshing batch data...');
    await get().checkActiveBatch();
  },
  
  clearBatch: () => {
    console.log('[batch-store] Clearing batch data');
    
    // Remove active batch ID from AsyncStorage
    AsyncStorage.removeItem('activeBatchId');
    console.log('[batch-store] Removed active batch ID from storage');
    
    set({ 
      currentBatch: null,
      hasActiveBatch: false,
      lastChecked: null
    });
  },
}));
