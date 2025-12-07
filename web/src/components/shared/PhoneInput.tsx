'use client';

import PhoneInputBase, { isValidPhoneNumber } from 'react-phone-number-input';
import type { E164Number } from 'libphonenumber-js';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Phone number',
  disabled = false,
  error,
  className = '',
}: PhoneInputProps) {
  const handleChange = (nextValue: E164Number | undefined) => {
    const normalized = nextValue ? String(nextValue).replace(/\s+/g, '') : '';
    onChange(normalized);
  };

  const focusStyles = error
    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
    : 'border-gray-300 focus:ring-2 focus:ring-teal-200 focus:border-teal-500';

  return (
    <div className={`space-y-2 ${className}`}>
      <PhoneInputBase
        international
        defaultCountry="US"
        value={value || undefined}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full"
        countrySelectProps={{
          className: `PhoneInputCountrySelect ${disabled ? 'cursor-not-allowed opacity-70' : ''}`,
          'aria-label': 'Country code',
        }}
        numberInputProps={{
          name: 'phone',
          'aria-label': 'Phone number',
          className: `w-full rounded-lg border px-4 py-3 bg-white placeholder-gray-400 focus:outline-none ${focusStyles} ${
            disabled ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''
          }`,
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <p className="text-xs text-gray-400">
        We'll use this number to call you for daily check-ins
      </p>
    </div>
  );
}

export function isValidE164(phone: string): boolean {
  if (!phone) return false;
  return isValidPhoneNumber(phone);
}

export default PhoneInput;
