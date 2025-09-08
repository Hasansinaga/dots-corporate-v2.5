import React from 'react';
import BatchCard from './BatchCard';

interface BatchCardWrapperProps {
  // Batch data
  batchActive: boolean;
  batchCode: string | null;
  batchId?: string | null;
  batchLoading?: boolean;
  isStartingBatch?: boolean;
  isStoppingBatch?: boolean;
  totalMoney: number;
  totalDeposit: number;
  
  // Tracking data
  locationRequired: boolean;
  trackingActive: boolean;
  gpsEnabled: boolean | null;
  gpsMonitoringActive: boolean;
  
  // Actions
  onStartBatch: () => void;
  onStopBatch: () => void;
  onFinishTransfer: () => void;
  onTrackingBadgePress: () => void;
  onForceLocationCheck: () => Promise<boolean>;
  onGpsBadgePress: () => void;
}

export default function BatchCardWrapper(props: BatchCardWrapperProps) {
  return <BatchCard {...props} />;
}
