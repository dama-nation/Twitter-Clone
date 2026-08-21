import { useState } from "react";
import { Link } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import useSearchUsers from "../../hooks/useSearchUsers";
import { AVATAR_PLACEHOLDER } from "../../utils/constants";

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: searchResults, refetch: searchUsers, isFetching } = useSearchUsers(searchQuery, "searchUsersPage");

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) searchUsers();
    };

    return (
        <div className='flex-[4_4_0] border-r border-gray-700 min-h-screen'>
            {/* Header / Search Bar */}
            <div className='p-4 border-b border-gray-700 sticky top-0 bg-black z-10'>
                <form onSubmit={handleSearch} className='flex items-center gap-2 bg-[#16181C] rounded-full p-2 border border-gray-700 focus-within:border-primary'>
                    <IoSearchOutline className='w-5 h-5 text-gray-500 ml-2' />
                    <input
                        type='text'
                        placeholder='Search users...'
                        className='bg-transparent border-none outline-none w-full text-white'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </form>
            </div>

            {/* Loading State */}
            {isFetching && (
                <div className='flex justify-center items-center h-full mt-10'>
                    <span className='loading loading-spinner loading-lg'></span>
                </div>
            )}

            {/* Results Display */}
            <div className='flex flex-col'>
                {!isFetching && searchResults?.length === 0 && searchQuery && (
                    <div className='p-4 text-center text-gray-500'>No users found for "{searchQuery}"</div>
                )}
                
                {!isFetching && searchResults?.map((user) => (
                    <Link
                        to={`/profile/${user.username}`}
                        key={user._id}
                        className='flex items-center justify-between gap-4 p-4 border-b border-gray-700 hover:bg-[#16181C] transition duration-200'
                    >
                        <div className='flex gap-2 items-center'>
                            <div className='w-12 h-12 rounded-full overflow-hidden flex-shrink-0'>
                                <img src={user.profileImg || AVATAR_PLACEHOLDER} className='w-full h-full object-cover' alt='Profile' />
                            </div>
                            <div className='flex flex-col'>
                                <span className='font-bold text-white truncate w-40'>{user.fullName}</span>
                                <span className='text-sm text-gray-500'>@{user.username}</span>
                            </div>
                        </div>
                        <button className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm px-4'>
                            View Profile
                        </button>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SearchPage;