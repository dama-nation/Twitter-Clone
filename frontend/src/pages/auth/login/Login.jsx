import { useState } from "react";
import { Link } from "react-router-dom";
import XSvg from "../../../components/svgs/X";

import {
    MdOutlineMail,
    MdOutlineLock,
    MdOutlineVisibility,
    MdOutlineVisibilityOff
} from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const queryClient = useQueryClient();

    const {
        mutate: loginMutation,
        isPending,
        isError,
        error,
    } = useMutation({
        mutationFn: async ({ username, password }) => {
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Invalid username or password");
                }
                return data;
            } catch (error) {
                throw new Error(error.message || "Failed to log in");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        loginMutation(formData);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className='min-h-screen w-full flex items-center justify-center bg-black px-6 selection:bg-[#1d9bf0] selection:text-white'>
            <div className='flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-28 w-full max-w-5xl py-8'>
                
                {/* Left Brand Identity */}
                <div className='hidden lg:flex items-center justify-center flex-shrink-0'>
                    <XSvg className='w-72 h-72 fill-white drop-shadow-[0_0_35px_rgba(255,255,255,0.05)]' />
                </div>

                {/* Right Form Container */}
                <div className='w-full max-w-md flex flex-col justify-center'>
                    <div className='mb-8'>
                        <XSvg className='w-10 h-10 lg:hidden fill-white mb-6' />
                        <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans'>
                            Happening now
                        </h1>
                        <h2 className='text-xl sm:text-2xl font-bold text-gray-200 mt-2 tracking-tight'>
                            Sign in to X
                        </h2>
                    </div>

                    <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                        {/* Username Field */}
                        <div className='group flex items-center gap-3 bg-[#000000] border border-[#333639] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-4 py-3.5 transition-all duration-200'>
                            <MdOutlineMail className='w-5 h-5 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0' />
                            <input
                                type='text'
                                className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                                placeholder='Phone, email, or username'
                                name='username'
                                onChange={handleInputChange}
                                value={formData.username}
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className='group flex items-center gap-3 bg-[#000000] border border-[#333639] focus-within:border-[#1d9bf0] focus-within:ring-1 focus-within:ring-[#1d9bf0] rounded-xl px-4 py-3.5 transition-all duration-200'>
                            <MdOutlineLock className='w-5 h-5 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0' />
                            <input
                                type={showPassword ? "text" : "password"}
                                className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                                placeholder='Password'
                                name='password'
                                onChange={handleInputChange}
                                value={formData.password}
                                required
                            />
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
                        </div>

                        {/* Error Alert Box */}
                        {isError && (
                            <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-fadeIn'>
                                {error.message}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={isPending}
                            className='w-full py-3.5 px-4 mt-2 bg-white hover:bg-[#e6e6e6] active:bg-[#cccccc] text-black font-bold rounded-full transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[15px]'
                        >
                            {isPending ? (
                                <>
                                    <span className='loading loading-spinner loading-sm text-black'></span>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                "Log in"
                            )}
                        </button>
                    </form>

                    {/* Footer / Inline Centralized Text */}
                    <div className='mt-8 pt-6 border-t border-[#2f3336] flex items-center justify-center gap-1.5 text-sm'>
                        <span className='text-gray-500'>Don't have an account?</span>
                        <Link to='/signup' className='text-[#1d9bf0] font-semibold hover:underline'>
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;