import { useState } from "react";
import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

const HomePage = () => {
    const [feedType, setFeedType] = useState("forYou");

    return (
        <div className='flex-1 min-w-0 border-r border-gray-700 min-h-screen'>
            {/* Sticky Header with Backdrop Blur */}
            <div className='flex w-full border-b border-gray-700 sticky top-0 bg-black/80 backdrop-blur-md z-10'>
                <div
                    className='flex justify-center flex-1 p-3 hover:bg-stone-900 transition duration-200 cursor-pointer relative'
                    onClick={() => setFeedType("forYou")}
                >
                    <span className={`text-sm sm:text-base ${feedType === "forYou" ? "font-bold text-white" : "text-gray-500"}`}>
                        For you
                    </span>
                    {feedType === "forYou" && (
                        <div className='absolute bottom-0 w-16 h-1 rounded-full bg-primary'></div>
                    )}
                </div>
                <div
                    className='flex justify-center flex-1 p-3 hover:bg-stone-900 transition duration-200 cursor-pointer relative'
                    onClick={() => setFeedType("following")}
                >
                    <span className={`text-sm sm:text-base ${feedType === "following" ? "font-bold text-white" : "text-gray-500"}`}>
                        Following
                    </span>
                    {feedType === "following" && (
                        <div className='absolute bottom-0 w-16 h-1 rounded-full bg-primary'></div>
                    )}
                </div>
            </div>

            {/* Create Post Input Section */}
            <CreatePost />

            {/* Posts Feed */}
            <Posts feedType={feedType} />
        </div>
    );
};

export default HomePage;