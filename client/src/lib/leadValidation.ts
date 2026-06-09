/**
 * Lead field validation for email and phone shapes.
 * Mirrored in server/src/lib/leadValidation.ts — keep the two in sync.
 */

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export type FieldValidation =
    | { valid: true; normalized: string }
    | { valid: false; message: string };

export function validateEmail(raw: string): FieldValidation {
    const value = raw.trim().toLowerCase();

    if (!value) {
        return { valid: false, message: 'Email is required' };
    }
    if (value.length > 254 || !EMAIL_RE.test(value) || value.includes('..')) {
        return { valid: false, message: 'Enter a valid email like name@example.com' };
    }
    return { valid: true, normalized: value };
}

export function validatePhone(raw: string): FieldValidation {
    const value = raw.trim();

    if (!value) {
        return { valid: false, message: 'Phone number is required' };
    }

    // Strip common formatting: spaces, dashes, dots, parentheses
    const stripped = value.replace(/[\s().-]/g, '');
    const hasPlus = stripped.startsWith('+');
    const digits = hasPlus ? stripped.slice(1) : stripped;

    if (!/^\d+$/.test(digits)) {
        return { valid: false, message: 'Phone numbers can only contain digits, spaces, and ( ) - +' };
    }
    if (digits.length < 10 || digits.length > 15) {
        return { valid: false, message: 'Enter a valid phone number with area code' };
    }
    // Reject obviously fake numbers like 0000000000 or 1111111111
    if (/^(\d)\1+$/.test(digits)) {
        return { valid: false, message: 'Enter a real phone number' };
    }

    return { valid: true, normalized: hasPlus ? `+${digits}` : digits };
}

/** Validate a flow form field by name. Returns null for fields without shape rules. */
export function validateLeadField(field: string, value: string): FieldValidation | null {
    if (field === 'email') return validateEmail(value);
    if (field === 'phone') return validatePhone(value);
    return null;
}
