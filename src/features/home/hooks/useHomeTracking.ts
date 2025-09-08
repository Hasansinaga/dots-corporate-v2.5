import { useLocationConfig } from '../../../shared/hooks/useLocationConfig';

export function useHomeTracking() {
  // Use the new unified location config hook
  const locationConfig = useLocationConfig({
    // ljkCode will be auto-detected from AsyncStorage
    autoLoad: true,
  });

  return {
    // State
    trackingActive: locationConfig.trackingActive,
    locationRequired: locationConfig.locationRequired,
    locationAvailable: locationConfig.locationAvailable,
    monitoringActive: locationConfig.monitoringActive,
    
    // Functions
    refreshTrackingStatus: locationConfig.refreshTrackingStatus,
    handleTrackingBadgePress: locationConfig.handleTrackingBadgePress,
    openLocationSettings: locationConfig.openLocationSettings,
    
    // Cleanup function
    cleanup: locationConfig.cleanup,
  };
}
