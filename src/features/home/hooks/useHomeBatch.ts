import { useState, useCallback, useEffect } from 'react';
import { useBatch } from '../../../stores/useBatch';
import { batchService } from '../services/batchService';
import { CreateBatchRequest } from '../types/batch';

export function useHomeBatch() {
  const { 
    currentBatch, 
    hasActiveBatch, 
    isLoading: batchLoading,
    checkActiveBatch,
    refreshBatch,
    clearBatch,
    setCurrentBatch
  } = useBatch();
  
  const [totalMoney, setTotalMoney] = useState(1000);
  const [totalDeposit, setTotalDeposit] = useState(20);
  const [isStartingBatch, setIsStartingBatch] = useState(false);
  const [isStoppingBatch, setIsStoppingBatch] = useState(false);

  // Check for active batch when component mounts (only once)
  useEffect(() => {
    let mounted = true;
    
    const initializeBatch = async () => {
      try {
        console.log('[home-batch] Checking for active batch...');
        const hasActive = await checkActiveBatch();
        
        if (mounted) {
          console.log('[home-batch] Batch check result:', {
            hasActive,
            currentBatch: currentBatch?.id,
            batchCode: currentBatch?.unique_code_cbs
          });
        }
      } catch (error) {
        console.error('[home-batch] Error checking active batch:', error);
      }
    };

    initializeBatch();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const startBatch = useCallback(async () => {
    if (hasActiveBatch) {
      console.warn('[home-batch] Batch already active, cannot start new batch');
      return;
    }

    if (isStartingBatch) {
      console.warn('[home-batch] Already starting batch, please wait');
      return;
    }

    try {
      setIsStartingBatch(true);
      console.log('[home-batch] Starting new batch...');
      
      // Generate UUID for batch ID
      const batchId = `B${Date.now()}${Math.floor(Math.random() * 1000000)}`;
      const now = new Date().toISOString();
      
      // Create batch request data
      const batchData: CreateBatchRequest = {
        id: batchId,
        created_by: 5138, // TODO: Get from user context
        created_at: now,
        status: 1,
        branch_id: "", // TODO: Get from user context
        is_active: true,
        core_trx_group_id: "" // TODO: Get proper value
      };

      // Create new batch
      const newBatch = await batchService.createBatch(batchData);
      
      // Set the new batch in global store
      setCurrentBatch(newBatch);
      console.log('[home-batch] Batch started successfully:', newBatch.id);
    } catch (error) {
      console.error('[home-batch] Error starting batch:', error);
      throw error;
    } finally {
      setIsStartingBatch(false);
    }
  }, [hasActiveBatch, isStartingBatch, setCurrentBatch]);

  const stopBatch = useCallback(async () => {
    if (!currentBatch?.id) {
      console.warn('[home-batch] No batch ID available to stop');
      return;
    }

    if (isStoppingBatch) {
      console.warn('[home-batch] Already stopping batch, please wait');
      return;
    }

    try {
      setIsStoppingBatch(true);
      console.log('[home-batch] Stopping batch:', currentBatch.id);
      await batchService.stopBatch(currentBatch.id);
      
      // Clear batch data from global store after stopping
      clearBatch();
      console.log('[home-batch] Batch stopped and cleared successfully');
    } catch (error) {
      console.error('[home-batch] Error stopping batch:', error);
      throw error;
    } finally {
      setIsStoppingBatch(false);
    }
  }, [currentBatch?.id, isStoppingBatch, clearBatch]);

  const finishTransfer = useCallback(() => {
    // TODO: Implement finish transfer logic
    console.log('[home] Finish transfer called');
  }, []);

  return {
    // State from global store
    batchActive: hasActiveBatch,
    batchCode: currentBatch?.id || null, 
    batchId: currentBatch?.id || null,
    batchLoading,
    currentBatch,
    
    // Local state
    totalMoney,
    totalDeposit,
    
    // Loading states
    isStartingBatch,
    isStoppingBatch,
    
    // Functions
    startBatch,
    stopBatch,
    finishTransfer,
    refreshBatch,
  };
}
