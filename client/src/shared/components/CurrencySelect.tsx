import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../constants';

interface CurrencySelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    required?: boolean;
    ariaInvalid?: boolean;
}

export function CurrencySelect({
    value,
    onChange,
    className,
    required = false,
    ariaInvalid,
}: CurrencySelectProps) {
    return (
        <select
            value={value || DEFAULT_CURRENCY}
            onChange={(event) => onChange(event.target.value)}
            className={className}
            aria-invalid={ariaInvalid}
            required={required}
        >
            {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                </option>
            ))}
        </select>
    );
}
