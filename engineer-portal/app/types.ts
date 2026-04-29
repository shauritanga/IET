import type {FC} from "react";
import { AxiosError } from "axios";

export type IconWeight =
    | "Broken"
    | "LineDuotone"
    | "Linear"
    | "Outline"
    | "Bold"
    | "BoldDuotone";

export interface IconProps {
    className?: string;
    strokeWidth?: string | number | undefined;
    weight?: IconWeight;
}

export type IconType = FC<IconProps>;

export enum Gender {
    MALE=1,
    FEMALE=2
}

export type APIValidationError = {
    property?: string;
    message?: string;
    constraints?: string[];
    value?: unknown;
};

export type APIErrorResponse = {
    message?: string;
    errors?: APIValidationError[];
};

export type TErrorMessage = AxiosError<APIErrorResponse>;

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


export interface LabelWithValue {
    label: string;
    value: number | string | boolean;
}

export type Callable<Args = unknown, ReturnType = void> = (
    args: Args
) => ReturnType;
