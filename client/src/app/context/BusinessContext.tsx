import { useState, useEffect, type ReactNode } from 'react';
import type { BusinessProfile } from '../../shared/types';
import { fetchBusinessProfiles } from '../../features/business-profile/api';
import { useAuth } from './AuthContext';
import { BusinessContext } from './BusinessContextStore';

export function BusinessProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
    const [business, setBusiness] = useState<BusinessProfile | null>(null);

    const load = () => {
        fetchBusinessProfiles()
            .then((list) => {
                setBusinesses(list);
                setBusiness((current) => {
                    const currentBusiness = current
                        ? list.find((item) => item.id === current.id) ?? null
                        : null;
                    const activeBusinesses = list
                        .filter((item) => item.isActive)
                        .sort((left, right) => (
                            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
                        ));
                    const activeBusiness = activeBusinesses[0] ?? null;

                    if (currentBusiness) {
                        return currentBusiness;
                    }

                    if (activeBusiness) {
                        return activeBusiness;
                    }

                    if (list.length === 0) {
                        return null;
                    }

                    if (!current) {
                        return null;
                    }

                    return list.find((item) => item.id === current.id) ?? null;
                });
            })
            .catch(() => {
                setBusinesses([]);
                setBusiness(null);
            });
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setBusinesses([]);
            setBusiness(null);
            return;
        }

        load();
    }, [isAuthenticated]);

    return (
        <BusinessContext.Provider
            value={{ business, businesses, setBusiness, reload: load }}
        >
            {children}
        </BusinessContext.Provider>
    );
}
