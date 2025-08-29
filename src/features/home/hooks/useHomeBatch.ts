import { useState, useCallback } from 'react';

export function useHomeBatch() {
  const [batchActive, setBatchActive] = useState(false);
  const [batchCode, setBatchCode] = useState<string | null>(null);
  const [totalMoney, setTotalMoney] = useState(1000);
  const [totalDeposit, setTotalDeposit] = useState(20);

  const startBatch = useCallback(() => {
    setBatchActive(true);
    setBatchCode('B734211…');
  }, []);

  const stopBatch = useCallback(() => {
    setBatchActive(false);
    setBatchCode(null);
    setTotalMoney(0);
    setTotalDeposit(0);
  }, []);

  const finishTransfer = useCallback(() => {
    // TODO: Implement finish transfer logic
    console.log('[home] Finish transfer called');
  }, []);

  return {
    // State
    batchActive,
    batchCode,
    totalMoney,
    totalDeposit,
    
    // Functions
    startBatch,
    stopBatch,
    finishTransfer,
  };
}
