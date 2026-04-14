import {type FC, useEffect, useMemo, useState} from "react";


import type {PickedFile} from "~/hooks/useFilePicker";

import {isImageMimeType} from "~/utils/file-utils";
import {formatBytes} from "~/utils/file-utils/format-bytes";
import type {UploadMediaResponseType} from "~/utils/zod";
import {Spinner} from "~/components/ui/spinner";
import {Card, CardContent} from "~/components/ui/card";
import {XIcon} from "lucide-react";
import {Button} from "~/components/ui/button";
import {AvatarCard} from "~/components/custom/avatar-card";
import {Document} from "@solar-icons/react/ssr";


const isUploadMediaFile = (
    file: PickedFile | UploadMediaResponseType
): file is UploadMediaResponseType => {
    return "key" in file && "url" in file;
};

interface PickedFileCardProps {
    /** They picked a file to display */
    file: PickedFile | UploadMediaResponseType;
    /** Whether the file is currently being uploaded */
    isUploading?: boolean;
    /** Callback function when the remove button is clicked */
    onRemove: (fileId: string) => void;
}

type FileInfo = {
    fileName: string;
    isImage: boolean;
    size: string;
};

/**
 * Component to display a picked file with preview and remove functionality
 *
 * @example
 * ```tsx
 * <PickedFileCard
 *   file={pickedFile}
 *   isUploading={false}
 *   onRemove={(id) => handleRemove(id)}
 * />
 * ```
 */
const PickedFileCard: FC<PickedFileCardProps> = ({
                                                     file,
                                                     isUploading,
                                                     onRemove,
                                                 }) => {
    const Icon = isUploading ? <Spinner/> : <XIcon/>;
    const [objectUrl, setObjectUrl] = useState<string>("");

    const handleClick = () => {
        if (!isUploading) {
            onRemove(file?.key?.toString());
        }
    };

    const fileInfo = useMemo<FileInfo>(() => {
        if (!isUploadMediaFile(file)) {
            const formattedSize = formatBytes(file.file.size);
            return {
                fileName: file.file.name,
                isImage: isImageMimeType(file.file),
                size: formattedSize,
            };
        }

        return {
            fileName: file.originalName,
            isImage: isImageMimeType(file.fileType),
            size: formatBytes(file.size),
        };
    }, [file]);

    /** Create and cleanup object URL for image preview */
    useEffect(() => {
        if (fileInfo.isImage && !isUploadMediaFile(file)) {
            const url = URL.createObjectURL(file.file);
            setObjectUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [file, fileInfo.isImage]);

    return (
        <Card className="shadow-none py-2! px-4">
            <CardContent className={"p-0! flex justify-between items-center"}>
                <AvatarCard>
                    {objectUrl ? (
                        <AvatarCard.Image
                            alt={""}
                            containerClassName="rounded-md"
                            src={objectUrl}
                        />
                    ) : (
                        <Document className={"size-8 text-[#E20C0A]"} weight={"BoldDuotone"}/>
                    )}
                    <AvatarCard.Content
                        titleClassName={"max-w-54 truncate"}
                        title={fileInfo.fileName}
                        subtitle={fileInfo.size}
                    />
                </AvatarCard>


                <Button
                    variant={"outline"}
                    size={"icon-xs"}
                    disabled={isUploading}
                    onClick={handleClick}
                >
                    <XIcon/>
                </Button>
            </CardContent>
        </Card>
    );
};
export default PickedFileCard;
