import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const useFollow = () => {
    const queryClient = useQueryClient()
    const { mutate: follow, isPending } = useMutation({
        mutationFn: async (userId) => {
          try{
            const res = await fetch(`/api/users/follow/${userId}`,{
              method: 'POST'
            })
            const data = res.json();
            if(!res.ok) throw new Error(data.message || 'Something Went Wrong')
            return data;
          }catch(error){
            throw new Error(error.message)
          }
        },
        onSuccess: () => {
          Promise.all([
            queryClient.invalidateQueries({queryKey: ['suggestedUsers']}),
            queryClient.invalidateQueries({queryKey: ['authUser']})
          ])
        },
        onError: () => {
          toast.error('Something went wrong')
        }
    })
  return { follow, isPending }
}

export default useFollow