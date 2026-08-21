import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import LoadingSpinner from "./LoadingSpinner";
import UserListItem from "./UserListItem";
import useFollow from "../../hooks/useFollow";
import useSearchUsers from "../../hooks/useSearchUsers";
import { apiRequest } from "../../utils/api";

const RightPanel = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: suggestedUsers, isLoading } = useQuery({
        queryKey: ["suggestedUsers"],
        queryFn: () => apiRequest("/api/users/suggested"),
    });

    const { data: searchResults, refetch: searchUsers, isFetching: isSearching, isError: isSearchError, error: searchError } =
        useSearchUsers(searchQuery, "searchUsers");

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) searchUsers();
    };

    const { follow, isPending, pendingUserId } = useFollow();

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
                                    <UserListItem user={user} key={user._id}>
                                        <button className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-xs px-3'>
                                            View
                                        </button>
                                    </UserListItem>
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
                                <UserListItem user={user} key={user._id}>
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
                                </UserListItem>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RightPanel;