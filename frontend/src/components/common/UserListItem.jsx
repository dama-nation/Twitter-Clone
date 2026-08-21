import { Link } from "react-router-dom";
import { AVATAR_PLACEHOLDER } from "../../utils/constants";

const UserListItem = ({ user, children }) => (
    <Link
        to={`/profile/${user.username}`}
        className='flex items-center justify-between gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors'
    >
        <div className='flex gap-2 items-center min-w-0'>
            <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                <img
                    src={user.profileImg || AVATAR_PLACEHOLDER}
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
        {children}
    </Link>
);

export default UserListItem;
