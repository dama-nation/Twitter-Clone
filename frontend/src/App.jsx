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

function App() {
    const { data: authUser, isLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.error) return null;
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error.message || "Something went wrong");
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

    return (
        <div className='flex w-full min-h-screen justify-center bg-black'>
            {/* Left Sidebar - Slim & Non-intrusive */}
            {authUser && <Sidebar />}

            {/* Center Main Feed - takes all available middle space */}
            <main className='flex-1 min-w-0 border-r border-gray-700 min-h-screen'>
                <Routes>
                    <Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
                    <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
                    <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />} />
                    <Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' />} />
                    <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
                    <Route path='/search' element={authUser ? <SearchPage /> : <Navigate to='/login' />} />
                </Routes>
            </main>

            {/* Right Panel - Compact Fixed Column */}
            {authUser && <RightPanel />}
            
            <Toaster />
        </div>
    );
}

export default App;