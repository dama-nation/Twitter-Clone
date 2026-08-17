import { Link } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";

const RightPanel = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const queryClient = useQueryClient();

    // Existing suggested users query
    const { data: suggestedUsers, isLoading } = useQuery({
        queryKey: ["suggestedUsers"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/users/suggested");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Something went wrong");
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        }
    });

    // New search query (manual fetch) and error handling
    const { data: searchResults, refetch: searchUsers, isFetching: isSearching, isError: isSearchError, error: searchError } = useQuery({
        queryKey: ["searchUsers", searchQuery],
        queryFn: async () => {
            if (!searchQuery) return [];
            try {
                const res = await fetch(`/api/users/search/${searchQuery}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Something went wrong");
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        enabled: false, // Prevents running on initial load
    });

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) searchUsers();
    };

    const { mutate: follow, isPending, variables: pendingUserId } = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`, {
                    method: "POST",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
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

    return (
        <div className='hidden lg:block my-4 mx-4 w-[350px]'>
            <div className='bg-[#16181C] p-4 rounded-md sticky top-2'>
                
                {/* --- NEW SEARCH BAR --- */}
                <form onSubmit={handleSearch} className='flex items-center gap-2 bg-black rounded-full p-2 mb-4 border border-gray-700 focus-within:border-primary'>
                    <IoSearchOutline className='w-5 h-5 text-gray-500 ml-2' />
                    <input
                        type='text'
                        placeholder='Search users...' // Added flex-1 to make the input take up available space
                        className='bg-transparent border-none outline-none w-full text-white flex-1'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                {/* --- SEARCH RESULTS DISPLAY --- */}
                {searchQuery.trim() !== "" && (
                    <div className='mb-6 border-b border-gray-700 pb-4'>
                        <p className='font-bold mb-4'>Search Results</p>
                        {isSearchError && <div className='text-red-500 text-center my-4'>{searchError.message}</div>}
                        {isSearching && <div className='flex justify-center my-4'><span className='loading loading-spinner'></span></div>}
                        {!isSearching && !isSearchError && searchResults?.length === 0 && (
                            <p className='text-center text-slate-500'>No users found for "{searchQuery}"</p>
                        )}
                        {!isSearching && !isSearchError && searchResults?.length > 0 && (
                            <div className='flex flex-col gap-4'>
                                {searchResults.map((user) => (
                                    <Link to={`/profile/${user.username}`} className='flex items-center justify-between gap-4' key={user._id}>
                                        <div className='flex gap-2 items-center'>
                                            <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                                                <img src={user.profileImg || "/avatar-placeholder.png"} className='w-full h-full object-cover' alt='Profile' />
                                            </div>
                                            <div className='flex flex-col'>
                                                <span className='font-semibold tracking-tight truncate w-28'>
                                                    {user.fullName}
                                                </span>
                                                <span className='text-sm text-slate-500'>@{user.username}</span>
                                            </div>
                                        </div>
                                        <button className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm'>
                                            View
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- EXISTING SUGGESTED USERS --- */}
                {searchQuery.trim() === "" && ( // Only show "Who to follow" if search bar is empty
                    <div>
                        <p className='font-bold mb-4'>Who to follow</p>
                        <div className='flex flex-col gap-4'>
                            {isLoading && (
                                <>
                                    <RightPanelSkeleton />
                                    <RightPanelSkeleton />
                                    <RightPanelSkeleton />
                                    <RightPanelSkeleton />
                                </>
                            )}
                            {!isLoading &&
                                suggestedUsers?.map((user) => (
                                    <Link to={`/profile/${user.username}`} className='flex items-center justify-between gap-4' key={user._id}>
                                        <div className='flex gap-2 items-center'>
                                            <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                                                <img src={user.profileImg || "/avatar-placeholder.png"} className='w-full h-full object-cover' alt='Profile' />
                                            </div>
                                            <div className='flex flex-col'>
                                                <span className='font-semibold tracking-tight truncate w-28'>
                                                    {user.fullName}
                                                </span>
                                                <span className='text-sm text-slate-500'>@{user.username}</span>
                                            </div>
                                        </div>
                                        <button
                                            className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm'
                                            onClick={(e) => { e.preventDefault(); follow(user._id); }}
                                        >
                                            {isPending && pendingUserId === user._id ? (
                                                <LoadingSpinner size='sm' />
                                            ) : "Follow"}
                                        </button>
                                    </Link>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default RightPanel;