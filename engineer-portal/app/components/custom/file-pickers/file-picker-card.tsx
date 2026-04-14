import { useState } from "react";
import type { Accept } from "react-dropzone";

import { type PickedFile, useFilePicker } from "~/hooks/useFilePicker";
import { generateUniqueId } from "~/hooks/useStableIds";
import { useUploadFile } from "~/hooks/useUploadFile";
import type { Callable, IconType } from "~/types";

import { convertToMegabytes } from "~/utils/file-utils/convert-to-megabytes";
import { stopEventWithCallback } from "~/utils/stop-event-with-callback";

import { CloudUpload } from "@solar-icons/react/ssr";
import {cn} from "~/lib/utils";
import PickedFileCard from "~/components/custom/file-pickers/picked-file-card";
import type {UploadMediaResponseType} from "~/utils/zod";
import FileUploadIcon from "../icons/file-upload-icon";

export interface FilePickerCardBaseProps {
    accept?: Accept;
    containerClassName?: string;
    defaultValue?: UploadMediaResponseType;
    hasError?: boolean;
    icon?: IconType;
    instructionText?: string;
    instructionTitle?: string;
    type?: "avatar" | "file";

    /** Maximum allowed File Size in Megabytes (MB)*/
    maxSize?: number;

    /** Minimum allowed File Size in Megabytes (MB)*/
    minSize?: number;
}

export type FilePickerAutoUploadProps<Props> = Props & {
    mode: "auto-upload";
    onChange?: Callable<UploadMediaResponseType | undefined>;
};

export type FilePickerManualUploadProps<Props> = Props & {
    mode: "manual-upload";
    onChange?: Callable<PickedFile | undefined>;
};

type FilePickerCardProps =
    | FilePickerAutoUploadProps<FilePickerCardBaseProps>
    | FilePickerManualUploadProps<FilePickerCardBaseProps>;

export const FilePickerCard = <T extends FilePickerCardProps>({
    containerClassName,
    defaultValue,
    hasError,
    instructionText,
    instructionTitle,
    icon: FileIcon = CloudUpload,
    type = "file",
    onChange,
    mode,
    maxSize,
    minSize,
    accept,
}: T) => {
    const { uploadFile, isUploading } = useUploadFile({
        onSuccess: (data) => {
            if (mode === "auto-upload") onChange?.(data);
        },
    });

    const handleFileChange = async (pickedFile: PickedFile) => {
        setDefaultFile(undefined);
        if (mode === "auto-upload") {
            uploadFile(pickedFile.file);
        } else onChange?.(pickedFile);
    };

    const maxSizeInMB = convertToMegabytes(maxSize ?? 1);
    const minSizeInMB = convertToMegabytes(minSize ?? 1);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        pickedFiles,
        unPickFileById,
        open: openNativeFilePicker,
    } = useFilePicker({
        accept,
        maxSizeInMB,
        minSizeInMB,
        mode: "single",
        onChange: handleFileChange,
    });

    const [defaultFile, setDefaultFile] = useState<
        UploadMediaResponseType | undefined
    >(defaultValue);

    const fileToDisplay = pickedFiles ?? defaultFile;

    const handleRemoveFile = (fileId: string) => {
        setDefaultFile(undefined);
        if (onChange) {
            onChange(undefined);
        }
        unPickFileById(fileId);
    };

    return (
        <div className={cn("space-y-4", containerClassName)}>
            <div
                {...getRootProps({
                    className: cn(
                        "border-outline cursor-pointer bg-[#E5E1E1] border-[#39090940]/25 center flex flex-col items-center rounded-xl border border-dashed py-6",
                        { "p-2 justify-start": type === "avatar" },
                        { hidden: type === "avatar" && fileToDisplay },
                        { "bg-[#39090940]": isDragActive },
                        { "border-status-red/80 bg-status-red-bg/10": hasError }
                    ),
                })}
            >
                <div
                    onClick={stopEventWithCallback(openNativeFilePicker)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            open();
                        }
                    }}
                    className={cn(
                        "flex justify-center h-full w-full cursor-pointer flex-col items-center gap-1",
                        { "flex-row justify-start gap-4": type === "avatar" }
                    )}
                >
                    <div
                        className={cn("bg-faded-container rounded-full p-2", {
                            "rounded-lg": type === "avatar",
                        })}
                    >
                        <FileUploadIcon
                            className="text-primary-400 size-12"
                        />
                    </div>
                    <input {...getInputProps({ id: generateUniqueId() })} />
                    <div
                        className={cn("text-center", {
                            "text-start": type === "avatar",
                        })}
                    >
                        <p className="text-[#787171] font-medium">
                            {instructionTitle ?? (
                                <>
                                    <span className="text-[#E20C0A]">Click or drop </span>
                                    here to upload
                                </>
                            )}
                        </p>
                        <p className="text-[#787171] font-light text-sm">
                            {instructionText ?? "Maximum file size: 12 MB"}
                        </p>
                    </div>
                </div>
            </div>

            {fileToDisplay && (
                <PickedFileCard
                    isUploading={isUploading}
                    file={fileToDisplay}
                    onRemove={handleRemoveFile}
                />
            )}
        </div>
    );
};
