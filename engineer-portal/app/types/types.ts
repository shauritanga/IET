import { AxiosError } from "axios";
import type {FC} from "react";

export type TErrorMessage = AxiosError<{ message: string }>;

export type TSuccess<T> = (data: T) => void;
export type TError = (error: TErrorMessage) => void;

export type APIResponse<T> = {
    data: T;
};

export type ListResponse<T> = {
    data: T[];
    pagination?: Pagination;
};

export type Pagination = {
    total: number;
    currentPage: boolean;
    totalPages: number;
    pageSize: number;
};

export type QueryOptions = {
    q?: string;
    page: number;
    size: number;
};

export type UploadResponse = {
    id: string;
    filename: string;
    filePath: string;
    mimeType: string;
    size: string;
    uploadedAt: string;
};



export interface IconProps {
    className?: string;
    strokeWidth?: string | number | undefined;
    weight?: string | number | undefined;
}

export type IconType = FC<IconProps>;

export enum Gender {
    MALE=1,
    FEMALE=2
}
