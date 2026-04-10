import Tooltip, { tooltipClasses, type TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import type { ReactElement, ReactNode } from 'react';

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip
        arrow
        enterDelay={300}
        enterNextDelay={150}
        placement="top"
        classes={{ popper: className }}
        {...props}
    />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.grey[900],
        color: theme.palette.common.white,
        borderRadius: 8,
        boxShadow: theme.shadows[4],
        fontSize: 12,
        fontWeight: 500,
        padding: '8px 10px',
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: theme.palette.grey[900],
    },
}));

interface AppTooltipProps {
    title?: ReactNode;
    children: ReactElement;
}

export function AppTooltip({ title, children }: AppTooltipProps) {
    if (!title) {
        return children;
    }

    return (
        <StyledTooltip title={title}>
            <span>{children}</span>
        </StyledTooltip>
    );
}
