import {useQuery} from "@tanstack/react-query";
import {getAllCountries} from "~/routes/application/personal-details/requests/get-countries";

export const QUERY_KEY = "countries";

export function useGetAllCountries() {
    const { isLoading, data } = useQuery({
        queryKey: [QUERY_KEY],
        queryFn: () => getAllCountries(),
    });

    return { isLoading, countries: data };
}