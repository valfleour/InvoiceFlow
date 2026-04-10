import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

type BackButtonProps = {
    to: string;
    label?: string;
};

export function BackButton({ to, label = 'Back' }: BackButtonProps) {
    return (
        <Button
            component={Link}
            to={to}
            variant="contained"
            size="small"
            startIcon={<ArrowBackIcon />}
            className="page-back-button"
        >
            {label}
        </Button>
    );
}
