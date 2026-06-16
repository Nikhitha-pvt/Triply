import { useState } from 'react';
import { createPriceAlert } from '../lib/api';

export const usePriceAlert = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupAlert = async (
    tripId: string,
    segmentType: 'transport' | 'hotel',
    segmentData: any,
    targetPrice: number
  ) => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await createPriceAlert({
        trip_id: tripId,
        segment_type: segmentType,
        segment_data: segmentData,
        target_price_inr: targetPrice,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to setup price alert');
    } finally {
      setLoading(false);
    }
  };

  return {
    setupAlert,
    loading,
    success,
    error,
  };
};
