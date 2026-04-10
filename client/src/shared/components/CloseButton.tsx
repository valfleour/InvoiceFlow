import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { AppTooltip } from './AppTooltip';

const FilledCloseButton = styled(IconButton)(() => ({
    backgroundColor: '#000000',
    color: '#ffffff',
    '&:hover': {
        backgroundColor: '#1f1f1f',
    },
}));

interface CloseButtonProps {
    onClick: () => void;
}

export function CloseButton({ onClick }: CloseButtonProps) {
    return (
        <AppTooltip title="Close">
            <FilledCloseButton size="small" aria-label="Close" onClick={onClick}>
                <CloseIcon fontSize="small" />
            </FilledCloseButton>
        </AppTooltip>
    );
}
