import http from "~/utils/http";
import type {APIResponse} from "~/types";

export interface TCountries {
    id: string;
    iso2: string;
    name: string;
}

export async function getAllCountries() {
    const response = await http.get<APIResponse<TCountries[]>>("/reference/countries");
    return response.data.data;
}
