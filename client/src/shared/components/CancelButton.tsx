import Button from '@mui/material/Button';

type CancelButtonProps = {
    onClick: () => void;
    label?: string;
    size?: 'small' | 'medium' | 'large';
};

export function CancelButton({
    onClick,
    label = 'Cancel',
    size = 'medium',
}: CancelButtonProps) {
    return (
        <Button
            type="button"
            variant="outlined"
            color="error"
            size={size}
            onClick={onClick}
        >
            {label}
        </Button>
    );
}
