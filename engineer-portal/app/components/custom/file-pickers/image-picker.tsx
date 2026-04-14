import {useState, useRef, useEffect} from "react";
import type { Accept } from "react-dropzone";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useFilePicker, type PickedFile } from "~/hooks/useFilePicker";
import { generateUniqueId } from "~/hooks/useStableIds";
import { stopEventWithCallback } from "~/utils/stop-event-with-callback";
import {Pen,Camera} from "@solar-icons/react/ssr";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import http from "~/utils/http";

const IMAGE_ACCEPT: Accept = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
};

interface ImagePickerProps {
    value?: string;
    onChange?: (url: string | undefined) => void;
    onBlur?: () => void;
    className?: string;
    placeholder?: string;
}

export const ImagePicker = ({
                                value,
                                onChange,
                                onBlur,
                                className,
                                placeholder = "Upload image",
                            }: ImagePickerProps) => {
    const [preview, setPreview] = useState<string | undefined>(value);
    const inputId = useRef(generateUniqueId()).current;
    const objectUrlRef = useRef<string | null>(null);
    const committedValueRef = useRef<string | undefined>(value);

    useEffect(() => {
        committedValueRef.current = value;
        if (value !== undefined) {
            setPreview(value);
            return;
        }

        if (!objectUrlRef.current) {
            setPreview(undefined);
        }
    }, [value]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    const { mutate: uploadFile, isPending: isUploading } = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("photo", file);

            const response = await http.post<{
                success: boolean;
                data: { profilePhotoUrl: string };
                message: string;
            }>("/users/profile/photo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data.data.profilePhotoUrl;
        },
        onSuccess: (data) => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            setPreview(data);
            onChange?.(data);
        },
        onError: (error: any) => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            setPreview(committedValueRef.current);
            onChange?.(committedValueRef.current);
            toast.error(error?.response?.data?.message ?? "Failed to upload photo");
        },
    });

    const handleFileChange = (pickedFile: PickedFile) => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(pickedFile.file);
        objectUrlRef.current = objectUrl;
        setPreview(objectUrl);
        uploadFile(pickedFile.file);
    };

    const { getRootProps, getInputProps, open: openNativeFilePicker } = useFilePicker({
        accept: IMAGE_ACCEPT,
        maxSizeInMB: 5,
        mode: "single",
        onChange: handleFileChange,
    });

    return (
        <div className={cn("flex items-center  gap-4", className)} onBlur={onBlur}>
            {/* Avatar circle */}
            <div
                {...getRootProps({
                    className: cn(
                        "relative cursor-pointer group shrink-0 size-24  rounded-full",
                    ),
                })}
                onClick={stopEventWithCallback(openNativeFilePicker)}
                style={{ isolation: "isolate" }}
            >
                <input {...getInputProps({ id: inputId })} />

                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Uploaded preview"
                            className="size-full object-cover rounded-full"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            {isUploading ? (
                                <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Pen weight="BoldDuotone" className="size-5 text-white" />
                            )}
                        </div>
                    </>
                ) : (
                    /* Empty state avatar */
                    <div className="size-full rounded-full bg-[#390909]/25 flex items-center justify-center">
                        {isUploading ? (
                            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                            <Camera weight="BoldDuotone" className="size-8 text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>

            {/* Upload button */}
            <Button
                type="button"
                variant="outline"
                onClick={stopEventWithCallback(openNativeFilePicker)}
                disabled={isUploading}
                className="rounded-xl font-semibold"
            >
                {isUploading ? "Uploading..." : placeholder}
            </Button>
        </div>
    );
};
