import XSvg from "../svgs/X";

import { MdHomeFilled } from "react-icons/md";
import { IoNotifications, IoSearchOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiRequest } from "../../utils/api";
import { AVATAR_PLACEHOLDER } from "../../utils/constants";

const Sidebar = () => {
    const queryClient = useQueryClient();
    const location = useLocation();

    const { mutate: logout } = useMutation({
        mutationFn: () => apiRequest("/api/auth/logout", { method: "POST" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: () => {
            toast.error("Logout failed");
        },
    });

    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

    return (
        <>
            {/* DESKTOP & TABLET SIDEBAR */}
            <div className='hidden sm:block w-16 md:w-56 flex-shrink-0'>
                <div className='sticky top-0 left-0 h-screen flex flex-col justify-between border-r border-gray-700 px-2 md:px-3 py-4'>
                    <div className='flex flex-col gap-2'>
                        {/* Twitter / X Brand Logo */}
                        <Link
                            to='/'
                            className='flex justify-center md:justify-start w-fit p-2 hover:bg-stone-900 rounded-full transition-colors'
                        >
                            <XSvg className='w-7 h-7 fill-white' />
                        </Link>

                        {/* Nav Items */}
                        <ul className='flex flex-col gap-1 mt-2'>
                            <li className='flex justify-center md:justify-start'>
                                <Link
                                    to='/'
                                    className='flex gap-3 items-center hover:bg-stone-900 transition-colors rounded-full py-2.5 px-3 w-full md:w-fit text-white'
                                >
                                    <MdHomeFilled className='w-6 h-6 flex-shrink-0' />
                                    <span className='text-base font-medium hidden md:block'>Home</span>
                                </Link>
                            </li>

                            <li className='flex justify-center md:justify-start'>
                                <Link
                                    to='/search'
                                    className='flex gap-3 items-center hover:bg-stone-900 transition-colors rounded-full py-2.5 px-3 w-full md:w-fit text-white'
                                >
                                    <IoSearchOutline className='w-6 h-6 flex-shrink-0' />
                                    <span className='text-base font-medium hidden md:block'>Explore</span>
                                </Link>
                            </li>

                            <li className='flex justify-center md:justify-start'>
                                <Link
                                    to='/notifications'
                                    className='flex gap-3 items-center hover:bg-stone-900 transition-colors rounded-full py-2.5 px-3 w-full md:w-fit text-white'
                                >
                                    <IoNotifications className='w-6 h-6 flex-shrink-0' />
                                    <span className='text-base font-medium hidden md:block'>Notifications</span>
                                </Link>
                            </li>

                            <li className='flex justify-center md:justify-start'>
                                <Link
                                    to={`/profile/${authUser?.username}`}
                                    className='flex gap-3 items-center hover:bg-stone-900 transition-colors rounded-full py-2.5 px-3 w-full md:w-fit text-white'
                                >
                                    <FaUser className='w-5 h-5 flex-shrink-0' />
                                    <span className='text-base font-medium hidden md:block'>Profile</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Bottom Account & Logout Profile Card */}
                    {authUser && (
                        <div className='mt-auto flex items-center justify-between hover:bg-stone-900 p-2 rounded-full transition-colors'>
                            <Link
                                to={`/profile/${authUser.username}`}
                                className='flex gap-2 items-center min-w-0 flex-1'
                            >
                                <div className='w-9 h-9 rounded-full overflow-hidden flex-shrink-0'>
                                    <img
                                        src={authUser?.profileImg || AVATAR_PLACEHOLDER}
                                        className='w-full h-full object-cover'
                                        alt={authUser?.fullName}
                                    />
                                </div>
                                <div className='hidden md:flex flex-col truncate leading-tight'>
                                    <p className='text-white font-bold text-xs truncate'>{authUser?.fullName}</p>
                                    <p className='text-gray-500 text-xs truncate'>@{authUser?.username}</p>
                                </div>
                            </Link>

                            <BiLogOut
                                className='w-5 h-5 text-gray-400 hover:text-white flex-shrink-0 cursor-pointer ml-1'
                                title='Logout'
                                onClick={(e) => {
                                    e.preventDefault();
                                    logout();
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className='sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-md border-t border-gray-800 flex items-center justify-around z-50 px-2'>
                <Link to='/' className='p-2 text-white hover:text-primary transition-colors'>
                    <MdHomeFilled className={`w-6 h-6 ${location.pathname === "/" ? "text-white" : "text-gray-400"}`} />
                </Link>

                <Link to='/search' className='p-2 text-white hover:text-primary transition-colors'>
                    <IoSearchOutline className={`w-6 h-6 ${location.pathname === "/search" ? "text-white" : "text-gray-400"}`} />
                </Link>

                <Link to='/notifications' className='p-2 text-white hover:text-primary transition-colors'>
                    <IoNotifications className={`w-6 h-6 ${location.pathname === "/notifications" ? "text-white" : "text-gray-400"}`} />
                </Link>

                <Link to={`/profile/${authUser?.username}`} className='p-2 text-white hover:text-primary transition-colors'>
                    <FaUser className={`w-5 h-5 ${location.pathname.startsWith("/profile") ? "text-white" : "text-gray-400"}`} />
                </Link>

                {authUser && (
                    <button
                        onClick={() => logout()}
                        className='p-2 text-red-400 active:scale-95 transition-transform'
                        title='Logout'
                    >
                        <BiLogOut className='w-6 h-6' />
                    </button>
                )}
            </div>
        </>
    );
};

export default Sidebar;