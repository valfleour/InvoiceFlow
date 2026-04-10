import { useId, type MouseEvent, type ReactNode } from 'react';
import { CloseButton } from './CloseButton';

interface ModalProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    onClose: () => void;
    className?: string;
}

export function Modal({ title, subtitle, children, onClose, className }: ModalProps) {
    const titleId = useId();

    const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={['modal', className].filter(Boolean).join(' ')}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={handleDialogClick}
            >
                <div className="modal-header">
                    <div>
                        <h2 id={titleId}>{title}</h2>
                        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
                    </div>
                    <CloseButton onClick={onClose} />
                </div>

                {children}
            </div>
        </div>
    );
}
