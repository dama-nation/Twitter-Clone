const AuthSubmitButton = ({ isPending, pendingLabel, label }) => (
    <button
        type='submit'
        disabled={isPending}
        className='w-full py-3.5 px-4 mt-2 bg-white hover:bg-[#e6e6e6] active:bg-[#cccccc] text-black font-bold rounded-full transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[15px]'
    >
        {isPending ? (
            <>
                <span className='loading loading-spinner loading-sm text-black'></span>
                <span>{pendingLabel}</span>
            </>
        ) : (
            label
        )}
    </button>
);

export default AuthSubmitButton;
