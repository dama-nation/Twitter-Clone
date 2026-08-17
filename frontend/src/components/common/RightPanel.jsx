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
        enabled: false,
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
                if (!res.ok) throw new Error(data.error || "Something went wrong");
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
        <div className='hidden lg:block my-4 mx-3 w-[260px] flex-shrink-0'>
            <div className='sticky top-2 flex flex-col gap-3'>
                {/* Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className='flex items-center gap-2 bg-[#202327] rounded-full px-3 py-2 border border-transparent focus-within:border-primary focus-within:bg-black transition-colors'
                >
                    <IoSearchOutline className='w-4 h-4 text-gray-500 flex-shrink-0' />
                    <input
                        type='text'
                        placeholder='Search users...'
                        className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-xs'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                {/* Search Results */}
                {searchQuery.trim() !== "" && (
                    <div className='bg-[#16181C] p-3 rounded-xl border border-gray-800'>
                        <p className='font-bold mb-3 text-sm text-white'>Search Results</p>
                        {isSearchError && <div className='text-red-500 text-center my-2 text-xs'>{searchError.message}</div>}
                        {isSearching && (
                            <div className='flex justify-center my-2'>
                                <LoadingSpinner size='sm' />
                            </div>
                        )}
                        {!isSearching && !isSearchError && searchResults?.length === 0 && (
                            <p className='text-center text-slate-500 text-xs'>No users found</p>
                        )}
                        {!isSearching && !isSearchError && searchResults?.length > 0 && (
                            <div className='flex flex-col gap-3'>
                                {searchResults.map((user) => (
                                    <Link
                                        to={`/profile/${user.username}`}
                                        className='flex items-center justify-between gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors'
                                        key={user._id}
                                    >
                                        <div className='flex gap-2 items-center min-w-0'>
                                            <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                                                <img
                                                    src={user.profileImg || "/avatar-placeholder.png"}
                                                    className='w-full h-full object-cover'
                                                    alt='Profile'
                                                />
                                            </div>
                                            <div className='flex flex-col min-w-0 leading-tight'>
                                                <span className='font-semibold tracking-tight truncate w-20 text-white text-xs'>
                                                    {user.fullName}
                                                </span>
                                                <span className='text-[11px] text-slate-500 truncate'>@{user.username}</span>
                                            </div>
                                        </div>
                                        <button className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-xs px-3'>
                                            View
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Who to Follow */}
                <div className='bg-[#16181C] p-3 rounded-xl border border-gray-800'>
                    <p className='font-bold mb-3 text-sm text-white'>Who to follow</p>
                    <div className='flex flex-col gap-3'>
                        {isLoading && (
                            <>
                                <RightPanelSkeleton />
                                <RightPanelSkeleton />
                                <RightPanelSkeleton />
                            </>
                        )}
                        {!isLoading &&
                            suggestedUsers?.map((user) => (
                                <Link
                                    to={`/profile/${user.username}`}
                                    className='flex items-center justify-between gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors'
                                    key={user._id}
                                >
                                    <div className='flex gap-2 items-center min-w-0'>
                                        <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                                            <img
                                                src={user.profileImg || "/avatar-placeholder.png"}
                                                className='w-full h-full object-cover'
                                                alt='Profile'
                                            />
                                        </div>
                                        <div className='flex flex-col min-w-0 leading-tight'>
                                            <span className='font-semibold tracking-tight truncate w-20 text-white text-xs'>
                                                {user.fullName}
                                            </span>
                                            <span className='text-[11px] text-slate-500 truncate'>@{user.username}</span>
                                        </div>
                                    </div>
                                    <button
                                        className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-xs px-3'
                                        onClick={(e) => {
                                            e.preventDefault();
                                            follow(user._id);
                                        }}
                                    >
                                        {isPending && pendingUserId === user._id ? (
                                            <LoadingSpinner size='xs' />
                                        ) : (
                                            "Follow"
                                        )}
                                    </button>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RightPanel;