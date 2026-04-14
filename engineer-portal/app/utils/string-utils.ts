import type { LabelWithValue } from "~/types";
import type { PhoneNumberType } from "~/utils/zod";

/**
 * Gets the initials from a name.
 *
 * @param name - The name to extract initials from. Can be a single name or full name.
 * @returns A two-character string containing the initials. For full names, returns first letter of
 * first name and first letter of last name. For single names, returns the first two letters.
 *
 * @example
 * // Returns "JD"
 * getInitials("John Doe")
 *
 * @example
 * // Returns "JS"
 * getInitials("Jane Smith")
 *
 * @example
 * // Returns "BA"
 * getInitials("Barack")
 */
export function getInitials(name: string): string {
    if (!name || name.trim() === "") {
        return "";
    }

    const nameParts = name.trim().split(/\s+/);

    if (nameParts.length >= 2) {
        const firstInitial = nameParts[0].charAt(0).toUpperCase();
        const lastInitial = nameParts[nameParts.length - 1]
            .charAt(0)
            .toUpperCase();
        return `${firstInitial}${lastInitial}`;
    } else {
        const singleName = nameParts[0];
        if (singleName.length >= 2) {
            return singleName.substring(0, 2).toUpperCase();
        } else {
            return singleName.charAt(0).toUpperCase().repeat(2);
        }
    }
}

/**
 * Generates a random alphanumeric identifier as a string.
 *
 * The generated ID is derived from a random decimal number,
 * removing the initial '0.' and selecting a substring of digits.
 * This ID might not be unique due to the nature of random number generation.
 *
 * @returns {string} A random alphanumeric string of fixed length derived from a random decimal.
 */
export const generateRandomId = () => {
    return Math.random().toString().slice(3, 9);
};

/**
 * Formats a camelCase string to Title Case with spaces
 * @param str - The camelCase string to format
 * @returns A string formatted in Title Case with spaces
 */
export const formatCamelCaseToTitle = (str: string): string => {
    const withSpaces = str.replace(/([A-Z])/g, " $1");
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

/**
 * Converts a provided LabelWithValue object into a JSON string format.
 * If no value is provided, the function returns undefined.
 *
 * @param {LabelWithValue} [value] - The object containing label and value properties to be serialized.
 * @returns {string|undefined} The JSON string representation of the provided object or undefined if no value is supplied.
 */
export const stringifyLabelValue = (
    value?: LabelWithValue
): string | undefined => (value ? JSON.stringify(value) : undefined);

/**
 * Converts a given PhoneNumberType object to its string representation.
 *
 * @param {PhoneNumberType} phone - The phone number object containing country code and phone number.
 * @returns {string} A string representation of the phone number, combining the country code and the phone number.
 */
export const convertPhoneNumberToString = (phone: PhoneNumberType) => {
    return `${phone.countryCode.value}${phone.phoneNumber}`;
};

/**
 * Generates a default phone number value in a standardized format.
 *
 * @param {string} phone - The input phone number string.
 * @returns {PhoneNumberType} An object containing the country code and a formatted phone number.
 */
export const generateDefaultPhoneNumberValue = (
    phone: string
): PhoneNumberType => {
    let formattedPhoneNumber: string;

    const TANZANIA_COUNTRY_CODE = {
        label: "TZ",
        value: "+255",
    };

    if (phone.startsWith("0")) {
        formattedPhoneNumber = phone.substring(1);
    } else if (phone.startsWith("+255")) {
        formattedPhoneNumber = phone.substring(4);
    } else {
        formattedPhoneNumber = phone;
    }

    return {
        countryCode: TANZANIA_COUNTRY_CODE,
        phoneNumber: formattedPhoneNumber,
    };
};
