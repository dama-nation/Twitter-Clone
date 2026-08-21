import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../utils/api";

const useSearchUsers = (searchQuery, queryKeyNamespace) =>
    useQuery({
        queryKey: [queryKeyNamespace, searchQuery],
        queryFn: async () => {
            if (!searchQuery) return [];
            return apiRequest(`/api/users/search/${searchQuery}`);
        },
        enabled: false,
    });

export default useSearchUsers;
