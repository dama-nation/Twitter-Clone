import XSvg from "../svgs/X";
import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Sidebar = () => {
    const queryClient = useQueryClient();
    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/auth/logout", {
                    method: "POST",
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Something went wrong");
            } catch (error) {
                throw new Error(error.message || "Something went wrong");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: () => {
            toast.error("Logout failed");
        },
    });
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

    return (
        <div className='w-16 md:w-52 flex-shrink-0'>
            <div className='sticky top-0 left-0 h-screen flex flex-col justify-between border-r border-gray-700 px-2 md:px-3 py-4'>
                <div className='flex flex-col gap-2'>
                    <Link to='/' className='flex justify-center md:justify-start w-fit p-2 hover:bg-stone-900 rounded-full transition-colors'>
                        <XSvg className='w-7 h-7 fill-white' />
                    </Link>

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

                {authUser && (
                    <Link
                        to={`/profile/${authUser.username}`}
                        className='mt-auto flex gap-2 items-center hover:bg-stone-900 p-2 rounded-full cursor-pointer transition-colors'
                    >
                        <div className='w-9 h-9 rounded-full overflow-hidden flex-shrink-0'>
                            <img
                                src={authUser?.profileImg || "/avatar-placeholder.png"}
                                className='w-full h-full object-cover'
                                alt={authUser?.fullName}
                            />
                        </div>
                        <div className='hidden md:flex justify-between items-center flex-1 min-w-0'>
                            <div className='flex flex-col truncate leading-tight'>
                                <p className='text-white font-bold text-xs truncate'>{authUser?.fullName}</p>
                                <p className='text-gray-500 text-xs truncate'>@{authUser?.username}</p>
                            </div>
                            <BiLogOut
                                className='w-4 h-4 text-gray-400 hover:text-white flex-shrink-0 cursor-pointer ml-1'
                                onClick={(e) => {
                                    e.preventDefault();
                                    logout();
                                }}
                            />
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Sidebar;