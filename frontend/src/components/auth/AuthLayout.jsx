import { Link } from "react-router-dom";
import XSvg from "../svgs/X";

const AuthLayout = ({ subtitle, footerText, footerLink, footerLabel, children }) => (
    <div className='min-h-screen w-full flex items-center justify-center bg-black px-6 selection:bg-[#1d9bf0] selection:text-white'>
        <div className='flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-28 w-full max-w-5xl py-8'>
            <div className='hidden lg:flex items-center justify-center flex-shrink-0'>
                <XSvg className='w-72 h-72 fill-white drop-shadow-[0_0_35px_rgba(255,255,255,0.05)]' />
            </div>
            <div className='w-full max-w-md flex flex-col justify-center'>
                <div className='mb-8'>
                    <XSvg className='w-10 h-10 lg:hidden fill-white mb-6' />
                    <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans'>
                        Happening now
                    </h1>
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-200 mt-2 tracking-tight'>
                        {subtitle}
                    </h2>
                </div>
                {children}
                <div className='mt-8 pt-6 border-t border-[#2f3336] flex items-center justify-center gap-1.5 text-sm'>
                    <span className='text-gray-500'>{footerText}</span>
                    <Link to={footerLink} className='text-[#1d9bf0] font-semibold hover:underline'>
                        {footerLabel}
                    </Link>
                </div>
            </div>
        </div>
    </div>
);

export default AuthLayout;
