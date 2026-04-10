import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { getApiErrorMessage } from '../../shared/api';
import { ActionIconButton } from '../../shared/components/ActionIconButton';
import { ConfirmationDialog } from '../../shared/components/ConfirmationDialog';
import type { Client } from '../../shared/types';
import { deleteClient, fetchClients } from './api';

export function ClientsPage() {
    const { business } = useBusiness();
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [clientPendingDelete, setClientPendingDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionError, setActionError] = useState('');
    const visibleClients = business ? clients : [];

    useEffect(() => {
        if (business) {
            fetchClients(business.id).then(setClients);
        }
    }, [business]);

    const openDeleteDialog = (client: Client) => {
        setActionError('');
        setClientPendingDelete(client);
    };

    const closeDeleteDialog = () => {
        if (isDeleting) {
            return;
        }

        setClientPendingDelete(null);
    };

    const handleDelete = async () => {
        if (!clientPendingDelete) {
            return;
        }

        setIsDeleting(true);
        setActionError('');

        try {
            await deleteClient(clientPendingDelete.id);
            setClients((prev) => prev.filter((client) => client.id !== clientPendingDelete.id));
            setClientPendingDelete(null);
        } catch (err: unknown) {
            setActionError(getApiErrorMessage(err, 'Unable to delete client.'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Clients</h1>
                <Button
                    component={Link}
                    to="/clients/new"
                    variant="contained"
                    disabled={!business}
                >
                    + New Client
                </Button>
            </div>

            {actionError ? <div className="error-msg">{actionError}</div> : null}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleClients.length > 0 ? (
                        visibleClients.map((client) => (
                            <tr key={client.id}>
                                <td>{client.clientName}</td>
                                <td>{client.companyName || '-'}</td>
                                <td>{client.email}</td>
                                <td>
                                    <Chip
                                        label={client.isActive ? 'Active' : 'Inactive'}
                                        size="small"
                                        variant={client.isActive ? 'filled' : 'outlined'}
                                        sx={client.isActive ? {
                                            backgroundColor: '#2DCE89',
                                            color: '#ffffff',
                                        } : undefined}
                                    />
                                </td>
                                <td>
                                    <ActionIconButton
                                        action="edit"
                                        onClick={() => navigate(`/clients/${client.id}/edit`)}
                                        label={`Edit ${client.clientName}`}
                                    />{' '}
                                    <ActionIconButton
                                        action="delete"
                                        onClick={() => openDeleteDialog(client)}
                                        label={`Delete ${client.clientName}`}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="empty-table-row">
                                {business ? 'No clients yet. Add your first client.' : 'Select a business profile first.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <ConfirmationDialog
                open={Boolean(clientPendingDelete)}
                title="Delete Client"
                message={(
                    <p>
                        Delete <strong>{clientPendingDelete?.clientName}</strong>? This action cannot be undone.
                    </p>
                )}
                confirmLabel="Delete"
                confirmingLabel="Deleting..."
                intent="danger"
                isSubmitting={isDeleting}
                onConfirm={handleDelete}
                onClose={closeDeleteDialog}
            />
        </div>
    );
}
