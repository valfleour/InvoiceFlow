import { InvoiceRepository } from '../../domain/invoices/repositories/InvoiceRepository';
import { Client, ClientProps, normalizeClientEmail, normalizeClientName } from '../../domain/clients/entities/Client';
import { ClientRepository } from '../../domain/clients/repositories/ClientRepository';

export class ClientService {
    constructor(
        private readonly repo: ClientRepository,
        private readonly invoiceRepo: InvoiceRepository
    ) { }

    async createClient(ownerUserId: string, workspaceId: string, props: Omit<ClientProps, 'ownerUserId' | 'workspaceId'>): Promise<Client> {
        await this.assertNoDuplicateClient(workspaceId, props.clientName, props.email);
        const client = Client.create({ ...props, ownerUserId, workspaceId });
        return this.repo.save(client);
    }

    async getClient(workspaceId: string, id: string): Promise<Client | null> {
        return this.repo.findById(id, workspaceId);
    }

    async getClientsByBusiness(workspaceId: string, businessId: string): Promise<Client[]> {
        return this.repo.findByBusinessId(businessId, workspaceId);
    }

    async updateClient(
        workspaceId: string,
        id: string,
        changes: Partial<Omit<ClientProps, 'id' | 'workspaceId' | 'ownerUserId' | 'businessId' | 'createdAt' | 'createdBy' | 'deletedAt' | 'deletedBy'>>
    ): Promise<Client> {
        const client = await this.repo.findById(id, workspaceId);
        if (!client) throw new Error(`Client ${id} not found`);

        const nextName = changes.clientName ?? client.clientName;
        const nextEmail = changes.email ?? client.email;
        const duplicate = await this.repo.findByNormalizedIdentity(
            workspaceId,
            normalizeClientName(nextName).toLowerCase(),
            normalizeClientEmail(nextEmail)
        );
        if (duplicate && duplicate.id !== id) {
            throw new Error('A client with the same normalized name and email already exists in this workspace');
        }

        client.update(changes);
        return this.repo.update(client);
    }

    async deleteClient(workspaceId: string, id: string, deletedBy?: string): Promise<void> {
        if (await this.invoiceRepo.existsByClientId(id, workspaceId)) {
            throw new Error('Clients referenced by invoices cannot be deleted');
        }

        return this.repo.delete(id, workspaceId, deletedBy);
    }

    private async assertNoDuplicateClient(workspaceId: string, clientName: string, email: string): Promise<void> {
        const duplicate = await this.repo.findByNormalizedIdentity(
            workspaceId,
            normalizeClientName(clientName).toLowerCase(),
            normalizeClientEmail(email)
        );

        if (duplicate) {
            throw new Error('A client with the same normalized name and email already exists in this workspace');
        }
    }
}
