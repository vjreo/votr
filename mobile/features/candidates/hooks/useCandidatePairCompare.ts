import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * Select up to two candidates for Compare; shared by Feed and Discover (Home) screens.
 */
export function useCandidatePairCompare() {
  const navigation = useNavigation<any>();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const handleToggleComparison = useCallback((candidateId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(candidateId)) return prev.filter((id) => id !== candidateId);
      if (prev.length >= 2) return [prev[1], candidateId];
      return [...prev, candidateId];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedForComparison.length === 2) {
      navigation.navigate('Compare' as never, {
        candidateIds: selectedForComparison,
      } as never);
    }
  }, [navigation, selectedForComparison]);

  return {
    selectedForComparison,
    handleToggleComparison,
    handleCompare,
  };
}
