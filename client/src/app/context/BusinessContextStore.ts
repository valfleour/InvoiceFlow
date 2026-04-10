import { createContext, useContext } from 'react';
import type { BusinessProfile } from '../../shared/types';

export interface BusinessCtx {
    business: BusinessProfile | null;
    businesses: BusinessProfile[];
    setBusiness: (business: BusinessProfile | null) => void;
    reload: () => void;
}

export const BusinessContext = createContext<BusinessCtx>({
    business: null,
    businesses: [],
    setBusiness: () => { },
    reload: () => { },
});

export function useBusiness() {
    return useContext(BusinessContext);
}
