import axios from "axios";

interface TCountries {
    name: string;
}

export async function getAllCountries() {
    const response = await axios.get<TCountries[]>(
        "https://restcountries.com/v2/all?fields=name"
    );
    return response.data;
}