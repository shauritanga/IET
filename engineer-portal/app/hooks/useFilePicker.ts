import { useEffect, useState } from "react";
import { type DropzoneOptions, useDropzone } from "react-dropzone";
import { generateRandomId } from "~/utils/string-utils";

/**
 * Represents a picked file with a unique ID
 */
export type PickedFile = {
    /** Unique identifier for the file */
    id: string;
    /** The actual File object */
    file: File;
};

/** Supported modes for file picking */
type FilePickerMode = "single" | "multiple";

/**
 * Result type based on picker mode
 * For single mode: Returns a single file or undefined
 * For multiple mode: Returns array of files
 */
type PickerResult<M extends FilePickerMode> = M extends "single"
    ? PickedFile | undefined
    : PickedFile[];

/**
 * Props for single file picker mode
 */
type SingleFilePicker = Omit<DropzoneOptions, "onDrop" | "multiple"> & {
    /** Sets picker to single file mode */
    mode: "single";
    /** Called when file selection changes */
    onChange?: (file: PickedFile) => void;
};

/**
 * Props for multiple files picker mode
 */
type MultipleFilePicker = Omit<DropzoneOptions, "onDrop" | "multiple"> & {
    /** Sets picker to multiple files mode */
    mode: "multiple";
    /** Called when file selection changes */
    onChange?: (file: PickedFile[]) => void;
};

/** Combined props type for the hook */
type UseFilePickerProps = SingleFilePicker | MultipleFilePicker;

/**
 * Return type of the useFilePicker hook
 */
type UseFilePickerReturnType<T extends UseFilePickerProps> = ReturnType<
    typeof useDropzone
> & {
    /** Currently picked file(s) */
    pickedFiles: PickerResult<ExtractMode<T>>;
    /** Removes a file by its ID */
    unPickFileById: (id: string) => void;
};

/** Helper type to extract mode from props */
type ExtractMode<T> = T extends { mode: infer M } ? M : never;

/**
 * Custom hook for file picking functionality with drag & drop support
 * @param props Configuration options for the file picker
 * @returns Object containing file picker state and methods
 */
export function useFilePicker<T extends UseFilePickerProps>(
    props: T
): UseFilePickerReturnType<T> {
    const { onChange: handleChange, mode, ...otherProps } = props;

    const [pickedFiles, setPickedFiles] = useState<
        PickerResult<ExtractMode<T>>
    >(() => {
        return (mode === "multiple" ? [] : undefined) as PickerResult<
            ExtractMode<T>
        >;
    });

    const handleOnDrop = (acceptedFiles: File[]) => {
        if (mode === "single") {
            const file = { file: acceptedFiles[0], id: generateRandomId() };
            (handleChange as (file: PickedFile) => void)?.(file);
            return setPickedFiles(file as PickerResult<ExtractMode<T>>);
        }

        const files = acceptedFiles.map((file) => ({
            file,
            id: generateRandomId(),
        }));

        const alreadyPickedFiles = (
            Array.isArray(pickedFiles) ? pickedFiles : []
        ) as PickedFile[];

        // 💡preserve already picked files
        const allPickedFiles = [...alreadyPickedFiles, ...files];

        (handleChange as (files: PickedFile[]) => void)?.(allPickedFiles);
        return setPickedFiles(allPickedFiles as PickerResult<ExtractMode<T>>);
    };

    useEffect(() => {
        const initialValue = (mode === "multiple"
            ? []
            : undefined) as never as PickerResult<ExtractMode<T>>;

        setPickedFiles(initialValue);
    }, [mode]);

    const dropzone = useDropzone({
        multiple: mode === "multiple",
        noClick: true,
        onDrop: handleOnDrop,
        ...otherProps,
    });

    const unPickFileById = (id: string) => {
        if (mode === "single") {
            setPickedFiles(undefined as PickerResult<ExtractMode<T>>);
            return;
        }

        if (!Array.isArray(pickedFiles)) return;

        const filteredFiles = pickedFiles.filter((file) => file.id !== id);

        setPickedFiles(filteredFiles as PickerResult<ExtractMode<T>>);
    };

    return {
        ...dropzone,
        pickedFiles: pickedFiles as PickerResult<ExtractMode<T>>,
        unPickFileById,
    };
}
