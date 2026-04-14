import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import http from "~/utils/http";
import type { UploadMediaResponseType } from "~/utils/zod";


type UseUploadFileOptions = {
    onSuccess?: (data: UploadMediaResponseType) => void;
    onError?: (error: any) => void;
};

export const useUploadFile = (options?: UseUploadFileOptions) => {

    const { mutate, isPending, isSuccess, isError, error, data } = useMutation({
        mutationFn: async (file: File) => {

            const formData = new FormData();
            formData.append("file", file);

            const response = await http.post<{ success: boolean; data: UploadMediaResponseType; message: string }>(
                "/uploads",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            return response.data.data;
        },
        onSuccess: options?.onSuccess,
        onError: options?.onError,
    });

    const uploadFile = useCallback(
        (file: File) => mutate(file),
        [mutate]
    );

    return {
        uploadFile,
        isUploading: isPending,
        isSuccess,
        isError,
        error,
        data,
    };
};