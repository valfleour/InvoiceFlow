import api from '../../shared/api';
import type { Client } from '../../shared/types';

export async function fetchClients(businessId: string): Promise<Client[]> {
    const { data } = await api.get(`/clients?businessId=${businessId}`);
    return data;
}

export async function fetchClient(id: string): Promise<Client> {
    const { data } = await api.get(`/clients/${id}`);
    return data;
}

export async function createClient(
    payload: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'deletedAt' | 'deletedBy'>
): Promise<Client> {
    const { data } = await api.post('/clients', payload);
    return data;
}

export async function updateClient(
    id: string,
    payload: Partial<Client>
): Promise<Client> {
    const { data } = await api.put(`/clients/${id}`, payload);
    return data;
}

export async function deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
}
