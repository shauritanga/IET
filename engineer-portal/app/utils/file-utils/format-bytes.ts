/**
 * Converts a number of bytes into a human-readable string with appropriate units (bytes, KB, MB, GB).
 *
 * @param bytes - The number of bytes to format. Must be a non-negative finite number.
 * @param decimals - The number of decimal places to include in the formatted output. Defaults to 2.
 * @returns A string representing the formatted size with appropriate units.
 * @throws If `bytes` is not a non-negative finite number, an error is thrown.
 *
 * @example
 * ```typescript
 * formatBytes(1024); // "1 KB"
 * formatBytes(1048576, 1); // "1 MB"
 * formatBytes(0); // "0 bytes"
 * ```
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (!Number.isFinite(bytes) || bytes < 0) {
        throw new Error("bytes must be a non-negative finite number");
    }

    const base = 1024;
    const KB = base;
    const MB = base ** 2;
    const GB = base ** 3;

    const format = (value: number, unit: string) => {
        const fixed = value.toFixed(decimals);

        const trimmed = fixed.replace(/\.0{1,12}$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
        return `${trimmed} ${unit}`;
    };

    if (bytes >= GB) return format(bytes / GB, "GB");
    if (bytes >= MB) return format(bytes / MB, "MB");
    if (bytes >= KB) return format(bytes / KB, "KB");

    // bytes
    const n = Math.round(bytes);
    return `${n} ${n === 1 ? "byte" : "bytes"}`;
};
