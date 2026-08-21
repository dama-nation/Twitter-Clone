import { useState } from "react";
import { MdOutlineMail, MdDriveFileRenameOutline, MdOutlineLock } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthInput from "../../../components/auth/AuthInput";
import AuthError from "../../../components/auth/AuthError";
import AuthSubmitButton from "../../../components/auth/AuthSubmitButton";
import useFormState from "../../../hooks/useFormState";
import { apiRequest } from "../../../utils/api";

const SignUpPage = () => {
    const { formData, handleInputChange } = useFormState({
        email: "",
        username: "",
        fullName: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const queryClient = useQueryClient();

    const { mutate, isError, isPending, error } = useMutation({
        mutationFn: async ({ email, username, fullName, password }) => {
            return apiRequest("/api/auth/signup", {
                method: "POST",
                body: { email, username, fullName, password },
                fallback: "Failed to create account",
            });
        },
        onSuccess: () => {
            toast.success("Account created successfully");
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(formData);
    };

    return (
        <AuthLayout
            subtitle='Join today.'
            footerText='Already have an account?'
            footerLink='/login'
            footerLabel='Sign in'
        >
            <form className='flex flex-col gap-3.5' onSubmit={handleSubmit}>
                <AuthInput
                    icon={<MdOutlineMail className='w-5 h-5 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0' />}
                    type='email'
                    className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                    placeholder='Email'
                    name='email'
                    onChange={handleInputChange}
                    value={formData.email}
                    required
                />
                <AuthInput
                    icon={<MdDriveFileRenameOutline className='w-5 h-5 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0' />}
                    type='text'
                    className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                    placeholder='Full Name'
                    name='fullName'
                    onChange={handleInputChange}
                    value={formData.fullName}
                    required
                />
                <AuthInput
                    icon={<FaRegUser className='w-4 h-4 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0 mx-0.5' />}
                    type='text'
                    className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                    placeholder='Username'
                    name='username'
                    onChange={handleInputChange}
                    value={formData.username}
                    required
                />
                <AuthInput
                    icon={<MdOutlineLock className='w-5 h-5 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0' />}
                    type='password'
                    className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                    placeholder='Password'
                    name='password'
                    onChange={handleInputChange}
                    value={formData.password}
                    required
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                />
                {isError && <AuthError message={error.message} />}
                <AuthSubmitButton isPending={isPending} pendingLabel='Creating account...' label='Create account' />
            </form>
        </AuthLayout>
    );
};

export default SignUpPage;