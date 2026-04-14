import { Upload } from "lucide-react";
import React, { type RefObject } from "react";
import FileUploadIcon from "~/components/custom/icons/file-upload-icon";

interface FileDropzoneProps {
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleBoxClick: () => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleFileSelect: (files: FileList | null) => void;
    placeholder?: string;
}

export function FileDropzone({
                                 fileInputRef,
                                 handleBoxClick,
                                 handleDragOver,
                                 handleDrop,
                                 handleFileSelect,
                                 placeholder
                             }: FileDropzoneProps) {
    return (
        <div>
            <div
                className="border-2 border-dashed border-border bg-[#39090940]/25 rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={handleBoxClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="mb-2 bg-muted rounded-full p-3">
                   <FileUploadIcon/>
                </div>
                <p className="text-sm font-medium text-foreground">
                    <span className={"font-bold text-[#E20C0A]"}>Click or drop</span> here to upload
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-light">
                    {placeholder}
                </p>
                <input
                    type="file"
                    id="fileUpload"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </div>
        </div>
    );
}
