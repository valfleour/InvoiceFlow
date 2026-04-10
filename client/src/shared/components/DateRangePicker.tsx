import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMemo, useState, type MouseEvent } from 'react';
import { formatDate } from '../utils';

export interface DateRangeValue {
    startDate: string;
    endDate: string;
}

interface DateRangePickerProps {
    label?: string;
    description?: string;
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
}

function formatDateLabel(value: string) {
    return formatDate(value, undefined, value);
}

export function DateRangePicker({
    label = 'Date Range',
    description = 'Filter records by date. Changes apply immediately.',
    value,
    onChange,
}: DateRangePickerProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const buttonLabel = useMemo(() => {
        if (value.startDate && value.endDate) {
            return `${formatDateLabel(value.startDate)} - ${formatDateLabel(value.endDate)}`;
        }
        if (value.startDate) {
            return `From ${formatDateLabel(value.startDate)}`;
        }
        if (value.endDate) {
            return `Until ${formatDateLabel(value.endDate)}`;
        }

        return label;
    }, [label, value.endDate, value.startDate]);

    const openPicker = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const closePicker = () => {
        setAnchorEl(null);
    };

    const clearPicker = () => {
        const empty = { startDate: '', endDate: '' };
        onChange(empty);
    };

    const updateRange = (changes: Partial<DateRangeValue>) => {
        const nextValue = { ...value, ...changes };
        const normalized = nextValue.startDate && nextValue.endDate && nextValue.startDate > nextValue.endDate
            ? { startDate: nextValue.endDate, endDate: nextValue.startDate }
            : nextValue;

        onChange(normalized);
    };

    return (
        <>
            <Button
                type="button"
                variant="outlined"
                onClick={openPicker}
                className="date-range-trigger"
            >
                {buttonLabel}
            </Button>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={closePicker}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                <Stack spacing={2} className="date-range-popover">
                    <div>
                        <Typography variant="subtitle2">Invoice Date Range</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                    </div>
                    <TextField
                        label="From"
                        type="date"
                        size="small"
                        value={value.startDate}
                        onChange={(event) => updateRange({ startDate: event.target.value })}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        label="To"
                        type="date"
                        size="small"
                        value={value.endDate}
                        onChange={(event) => updateRange({ endDate: event.target.value })}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <div className="date-range-actions">
                        <Button type="button" variant="text" onClick={clearPicker}>
                            Clear
                        </Button>
                        <Button type="button" variant="contained" onClick={closePicker}>
                            Done
                        </Button>
                    </div>
                </Stack>
            </Popover>
        </>
    );
}
