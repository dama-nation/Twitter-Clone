import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiRequest } from "../utils/api";

const useFollow = () => {
	const queryClient = useQueryClient();

	const { mutate: follow, isPending, variables } = useMutation({
		mutationFn: (userId) => apiRequest(`/api/users/follow/${userId}`, { method: "POST", fallback: "Something went wrong!" }),
		onSuccess: () => {
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
			]);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { follow, isPending, pendingUserId: variables };
};

export default useFollow;