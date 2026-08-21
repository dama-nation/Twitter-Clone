const AuthError = ({ message }) => (
    <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-fadeIn'>
        {message}
    </div>
);

export default AuthError;
