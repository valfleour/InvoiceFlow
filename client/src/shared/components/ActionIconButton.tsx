import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import { AppTooltip } from './AppTooltip';

type ActionKind = 'edit' | 'delete';

type SharedProps = {
    action: ActionKind;
    label: string;
    title?: string;
};

const iconByAction = {
    edit: EditIcon,
    delete: DeleteIcon,
};
const colorByAction: Record<ActionKind, 'primary' | 'error'> = {
    edit: 'primary',
    delete: 'error',
};

function ActionIcon({ action }: { action: ActionKind }) {
    const Icon = iconByAction[action];
    return <Icon fontSize="inherit" aria-hidden="true" />;
}

export function ActionIconButton({
    action,
    label,
    title,
    ...props
}: SharedProps & Omit<IconButtonProps, 'action' | 'children' | 'color'>) {
    return (
        <AppTooltip title={title ?? label}>
            <IconButton
                size="small"
                color={colorByAction[action]}
                aria-label={label}
                {...props}
            >
                <ActionIcon action={action} />
            </IconButton>
        </AppTooltip>
    );
}
