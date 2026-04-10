import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

type PageHeaderProps = {
    title: ReactNode;
    backTo?: string;
    backLabel?: string;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    backTo,
    backLabel = 'Back',
    actions,
    className,
}: PageHeaderProps) {
    const classes = ['page-header', className].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            <div className="page-title-block">
                {backTo ? <BackButton to={backTo} label={backLabel} /> : null}
                <h1>{title}</h1>
            </div>
            {actions ? <div className="header-actions">{actions}</div> : null}
        </div>
    );
}
