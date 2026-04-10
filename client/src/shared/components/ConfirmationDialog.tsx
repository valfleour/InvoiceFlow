import Button from '@mui/material/Button';
import type { ReactNode } from 'react';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: ReactNode;
    subtitle?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmingLabel?: string;
    intent?: 'default' | 'danger';
    isSubmitting?: boolean;
    confirmDisabled?: boolean;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
}

export function ConfirmationDialog({
    open,
    title,
    message,
    subtitle,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmingLabel = 'Working...',
    intent = 'default',
    isSubmitting = false,
    confirmDisabled = false,
    onConfirm,
    onClose,
}: ConfirmationDialogProps) {
    if (!open) {
        return null;
    }

    const handleClose = () => {
        if (isSubmitting) {
            return;
        }

        onClose();
    };

    return (
        <Modal
            title={title}
            subtitle={subtitle}
            onClose={handleClose}
            className={`confirmation-dialog confirmation-dialog--${intent}`}
        >
            <div className="confirmation-dialog-body">{message}</div>
            <div className="confirmation-dialog-actions">
                <Button type="button" variant="outlined" onClick={handleClose} disabled={isSubmitting}>
                    {cancelLabel}
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    color={intent === 'danger' ? 'error' : 'primary'}
                    onClick={() => void onConfirm()}
                    disabled={isSubmitting || confirmDisabled}
                >
                    {isSubmitting ? confirmingLabel : confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
