import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { getApiErrorMessage } from '../../shared/api';
import { ActionIconButton } from '../../shared/components/ActionIconButton';
import { ConfirmationDialog } from '../../shared/components/ConfirmationDialog';
import type { BusinessProfile } from '../../shared/types';
import { deleteBusinessProfile, fetchBusinessProfiles } from './api';

export function BusinessProfilePage() {
    const { business, setBusiness, reload } = useBusiness();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
    const [profilePendingDelete, setProfilePendingDelete] = useState<BusinessProfile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        fetchBusinessProfiles().then(setProfiles);
    }, []);

    const openDeleteDialog = (profile: BusinessProfile) => {
        setActionError('');
        setProfilePendingDelete(profile);
    };

    const closeDeleteDialog = () => {
        if (isDeleting) {
            return;
        }

        setProfilePendingDelete(null);
    };

    const handleDelete = async () => {
        if (!profilePendingDelete) {
            return;
        }

        setIsDeleting(true);
        setActionError('');

        try {
            await deleteBusinessProfile(profilePendingDelete.id);
            const remaining = profiles.filter((item) => item.id !== profilePendingDelete.id);
            setProfiles(remaining);

            if (business?.id === profilePendingDelete.id) {
                setBusiness(remaining.find((item) => item.isActive) ?? null);
            }

            setProfilePendingDelete(null);
            reload();
        } catch (err: unknown) {
            setActionError(getApiErrorMessage(err, 'Unable to delete business profile.'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Business Profile</h1>
                <Button component={Link} to="/businesses/new" variant="contained">
                    + New Business
                </Button>
            </div>

            {actionError ? <div className="error-msg">{actionError}</div> : null}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Currency</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {profiles.length > 0 ? (
                        profiles.map((profile) => (
                            <tr key={profile.id}>
                                <td>{profile.businessName}</td>
                                <td>{profile.email}</td>
                                <td>{profile.defaultCurrency}</td>
                                <td>
                                    <Chip
                                        label={profile.isActive ? 'Active' : 'Inactive'}
                                        size="small"
                                        variant={profile.isActive ? 'filled' : 'outlined'}
                                        sx={profile.isActive ? {
                                            backgroundColor: '#2DCE89',
                                            color: '#ffffff',
                                        } : undefined}
                                    />
                                </td>
                                <td>
                                    <ActionIconButton
                                        action="edit"
                                        onClick={() => navigate(`/businesses/${profile.id}/edit`)}
                                        label={`Edit ${profile.businessName}`}
                                    />{' '}
                                    <ActionIconButton
                                        action="delete"
                                        onClick={() => openDeleteDialog(profile)}
                                        label={`Delete ${profile.businessName}`}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="empty-table-row">
                                No business profiles yet. Create one to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <ConfirmationDialog
                open={Boolean(profilePendingDelete)}
                title="Delete Business Profile"
                message={(
                    <p>
                        Delete <strong>{profilePendingDelete?.businessName}</strong>? This action cannot be undone.
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
