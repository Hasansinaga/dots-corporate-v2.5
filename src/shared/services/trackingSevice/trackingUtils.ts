// trackingUtils.ts - Cleanup and utility functions
import API from '../APIManager';
import { setActiveTenant } from './trackingCore';
import { forceStopAllTracking } from './trackingManager';

// Cleanup function for app shutdown or logout
export async function cleanupTracking(): Promise<void> {
  console.log('[tracking] === CLEANUP TRACKING ===');
  
  try {
    await forceStopAllTracking();
    
    // Clear tenant
    setActiveTenant(null);
    delete API.defaults.headers.common['X-Tenant-Id'];
    
    console.log('[tracking] === CLEANUP COMPLETE ===');
  } catch (error) {
    console.error('[tracking] Error during cleanup:', error);
  }
}