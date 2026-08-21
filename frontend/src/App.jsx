import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/home/Homepage.jsx';
import LoginPage from './pages/auth/login/Login.jsx';
import SignUpPage from './pages/auth/signup/SignUpPage.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import RightPanel from './components/common/RightPanel.jsx';
import NotificationPage from './pages/notification/NotificationPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import SearchPage from './pages/search/SearchPage.jsx';
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from './utils/api.js';

function App() {
    const { data: authUser, isLoading, isError, error } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                return await apiRequest("/api/auth/me");
            } catch (err) {
                // Only a missing/invalid session means "not logged in"; every
                // other failure must surface instead of silently logging out.
                if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
                    return null;
                }
                throw err;
            }
        },
        retry: false,
    });

    if (isLoading) {
        return (
            <div className='h-screen flex justify-center items-center'>
                <LoadingSpinner size='lg' />
            </div>
        );
    }

    if (isError) {
        return (
            <div className='h-screen flex flex-col gap-3 justify-center items-center text-center px-6'>
                <p className='text-red-400 font-semibold'>We could not load your session</p>
                <p className='text-gray-500 text-sm'>{error.message}</p>
                <button className='btn btn-sm rounded-full' onClick={() => window.location.reload()}>
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className='flex w-full min-h-screen justify-center bg-black'>
            {/* Sidebar (Desktop left rail / Mobile bottom nav) */}
            {authUser && <Sidebar />}

            {/* Main Center Outlet */}
            <main className='flex-1 min-w-0 border-r border-gray-700 min-h-screen pb-16 sm:pb-0'>
                <Routes>
                    <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
                    <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
                    <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />} />
                    <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' />} />
                    <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
                    <Route path='/search' element={authUser ? <SearchPage /> : <Navigate to='/login' />} />
                </Routes>
            </main>

            {/* Right Panel (Desktop Explore & Suggestions) */}
            {authUser && <RightPanel />}

            <Toaster />
        </div>
    );
}

export default App;