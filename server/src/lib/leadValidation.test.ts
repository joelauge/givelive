import { describe, it, expect } from 'vitest';
import { validateEmail, validatePhone } from './leadValidation';

describe('validateEmail', () => {
    it.each([
        ['name@example.com', 'name@example.com'],
        ['First.Last+tag@sub.example.co', 'first.last+tag@sub.example.co'],
        ['  padded@example.org  ', 'padded@example.org'],
        ['user_99%x@example.io', 'user_99%x@example.io'],
    ])('accepts and normalizes %s', (input, expected) => {
        const result = validateEmail(input);
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.normalized).toBe(expected);
    });

    it.each([
        [''],
        ['   '],
        ['plainaddress'],
        ['missing-at.example.com'],
        ['name@'],
        ['@example.com'],
        ['name@example'],          // no TLD
        ['name@example.c'],        // 1-char TLD
        ['name@@example.com'],
        ['na me@example.com'],
        ['name@exa mple.com'],
        ['name@example..com'],     // consecutive dots
        ['name@.example.com'],
        [`${'a'.repeat(250)}@example.com`], // > 254 chars
    ])('rejects %s', (input) => {
        expect(validateEmail(input).valid).toBe(false);
    });
});

describe('validatePhone', () => {
    it.each([
        ['4155551234', '4155551234'],
        ['(415) 555-1234', '4155551234'],
        ['415.555.1234', '4155551234'],
        ['415 555 1234', '4155551234'],
        ['+14155551234', '+14155551234'],
        ['+44 20 7946 0958', '+442079460958'],
        ['+5511987654321', '+5511987654321'],
    ])('accepts and normalizes %s', (input, expected) => {
        const result = validatePhone(input);
        expect(result.valid).toBe(true);
        if (result.valid) expect(result.normalized).toBe(expected);
    });

    it.each([
        [''],
        ['   '],
        ['555-1234'],            // too short (no area code)
        ['123456789'],           // 9 digits
        ['12345678901234567'],   // 17 digits
        ['phone number'],
        ['415-555-WXYZ'],
        ['0000000000'],          // all-same-digit
        ['1111111111'],
        ['++14155551234'],
        ['415@555#1234'],
    ])('rejects %s', (input) => {
        expect(validatePhone(input).valid).toBe(false);
    });
});
