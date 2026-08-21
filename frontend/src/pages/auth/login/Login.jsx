import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MdOutlineMail, MdOutlineLock } from "react-icons/md";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthInput from "../../../components/auth/AuthInput";
import AuthError from "../../../components/auth/AuthError";
import AuthSubmitButton from "../../../components/auth/AuthSubmitButton";
import useFormState from "../../../hooks/useFormState";
import { apiRequest } from "../../../utils/api";

const LoginPage = () => {
    const { formData, handleInputChange } = useFormState({
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
		mutationFn: ({ username, password }) =>
			apiRequest("/api/auth/login", {
				method: "POST",
				body: { username, password },
				fallback: "Invalid username or password",
			}),
		onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        loginMutation(formData);
    };

    return (
        <AuthLayout
            subtitle='Sign in to X'
            footerText="Don't have an account?"
            footerLink='/signup'
            footerLabel='Sign up'
        >
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <AuthInput
                    icon={<MdOutlineMail className='w-5 h-5 text-gray-500 group-focus-within:text-[#1d9bf0] transition-colors flex-shrink-0' />}
                    type='text'
                    className='bg-transparent border-none outline-none w-full text-white placeholder-gray-500 text-[15px]'
                    placeholder='Phone, email, or username'
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
                <AuthSubmitButton isPending={isPending} pendingLabel='Signing in...' label='Log in' />
            </form>
        </AuthLayout>
    );
};

export default LoginPage;