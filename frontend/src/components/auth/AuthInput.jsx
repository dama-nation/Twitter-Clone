import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";

const AuthInput = ({ icon, type, showPassword, setShowPassword, ...inputProps }) => (
    <div className='group flex items-center gap-3 bg-[#000000] border border-[#333639] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-4 py-3.5 transition-all duration-200'>
        {icon}
        <input
            {...inputProps}
            type={setShowPassword ? (showPassword ? "text" : "password") : type}
        />
        {setShowPassword && (
            <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='text-gray-500 hover:text-gray-300 transition-colors focus:outline-none'
            >
                {showPassword ? (
                    <MdOutlineVisibilityOff className='w-5 h-5' />
                ) : (
                    <MdOutlineVisibility className='w-5 h-5' />
                )}
            </button>
        )}
    </div>
);

export default AuthInput;
