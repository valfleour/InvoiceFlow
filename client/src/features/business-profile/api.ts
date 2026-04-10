import api from '../../shared/api';
import type { BusinessProfile } from '../../shared/types';

export async function fetchBusinessProfiles(): Promise<BusinessProfile[]> {
    const { data } = await api.get('/businesses');
    return data;
}

export async function fetchBusinessProfile(id: string): Promise<BusinessProfile> {
    const { data } = await api.get(`/businesses/${id}`);
    return data;
}

export async function createBusinessProfile(
    payload: Omit<BusinessProfile, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'deletedAt' | 'deletedBy'>
): Promise<BusinessProfile> {
    const { data } = await api.post('/businesses', payload);
    return data;
}

export async function updateBusinessProfile(
    id: string,
    payload: Partial<BusinessProfile>
): Promise<BusinessProfile> {
    const { data } = await api.put(`/businesses/${id}`, payload);
    return data;
}

export async function deleteBusinessProfile(id: string): Promise<void> {
    await api.delete(`/businesses/${id}`);
}
