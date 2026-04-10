import FormControlLabel from '@mui/material/FormControlLabel';
import Switch, { type SwitchProps } from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

const TOGGLE_ON_COLOR = '#2DCE89';

const GreenSwitchControl = styled(Switch)(() => ({
    '& .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: 'rgba(148, 163, 184, 0.28)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
    },
    '& .MuiSwitch-switchBase': {
        color: '#ffffff',
    },
    '& .MuiSwitch-thumb': {
        backgroundColor: '#ffffff',
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: '#ffffff',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: TOGGLE_ON_COLOR,
        borderColor: 'transparent',
        opacity: 1,
    },
}));

interface GreenSwitchProps {
    checked: boolean;
    onChange: NonNullable<SwitchProps['onChange']>;
    ariaLabel: string;
    label?: string;
}

export function GreenSwitch({ checked, onChange, ariaLabel, label }: GreenSwitchProps) {
    const control = (
        <GreenSwitchControl
            checked={checked}
            onChange={onChange}
            slotProps={{ input: { 'aria-label': ariaLabel } }}
        />
    );

    if (!label) {
        return control;
    }

    return (
        <FormControlLabel
            control={control}
            label={label}
            sx={{
                marginLeft: 0,
                alignItems: 'center',
                '& .MuiFormControlLabel-label': {
                    color: 'var(--text)',
                    fontSize: 14,
                },
            }}
        />
    );
}
