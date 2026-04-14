import {z} from "zod";

export const UploadMediaResponseSchema = z.object({
    originalName: z.string().max(255, {
        message: "File name is too long",
    }),
    size: z.coerce
        .number()
        .positive({ message: "File size must be positive" }),
    fileType: z.string("fileType").max(255, {
        message: "File type is too long",
    }),
    key: z.string(),
    url: z.url({ message: "Invalid URL" }),
    mimeType: z.string().max(255)
});

/**
 * Represents the response type for uploading media.
 *
 * This type is inferred from the {@link UploadMediaResponseSchema} using Zod.
 *
 */
export type UploadMediaResponseType = z.infer<typeof UploadMediaResponseSchema>;


export const PhoneNumberSchema = z.object({
    countryCode: z.object({
        label: z.string(),
        value: z.string(),
    }),
    phoneNumber: z.string(),
});

export type PhoneNumberType = z.infer<typeof PhoneNumberSchema>;