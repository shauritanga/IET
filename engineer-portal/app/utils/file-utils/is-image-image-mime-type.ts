/**
 * Checks if the given MIME type corresponds to an image.
 *
 * @param mime - The MIME type to evaluate.
 * @return A boolean indicating whether the provided MIME type is an image type.
 */
export function isImageMimeType(mime: string): boolean;
export function isImageMimeType(file: Blob | File): boolean;
export function isImageMimeType(input: string | Blob): boolean {
    let mime: string;
    
    if (typeof input === "string") {
        mime = input;
    } else {
        const blobType = input?.type;
        mime = typeof blobType === "string" ? blobType : "";
    }

    if (!mime) return false;

    const normalized = mime.trim().toLowerCase();

    return normalized.startsWith("image/");
}

// ----------------------------------------------------------------------
