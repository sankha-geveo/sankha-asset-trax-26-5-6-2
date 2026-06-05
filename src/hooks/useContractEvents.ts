import { useEffect } from 'react';
import ContractService from '@/services/contract-service';

export function useContractEvents(onEvent: (out: unknown) => void) {
  useEffect(() => {
    const cs = ContractService.getInstance();
    return cs.addOutputListener(onEvent);
  }, [onEvent]);
}
