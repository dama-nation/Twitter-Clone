import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
    const [comment, setComment] = useState("");
    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(["authUser"]);
    const postOwner = post.user;
    
    // Safely check if current user liked the post
    const isLiked = Boolean(post?.likes?.includes(authUser?._id));
    const isMyPost = authUser?._id === post?.user?._id;
    const formattedDate = formatPostDate(post.createdAt);

    const { mutate: deletePost, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/${post._id}`, {
                    method: "DELETE",
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: () => {
            toast.success("Post deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const { mutate: likePost, isPending: isLiking } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/like/${post._id}`, {
                    method: "POST",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: (updatedLikes) => {
            // Update cache directly for the main posts list
            queryClient.setQueriesData({ queryKey: ["posts"] }, (oldData) => {
                if (!oldData) return [];
                return oldData.map((p) => {
                    if (p._id === post._id) {
                        return { ...p, likes: updatedLikes };
                    }
                    return p;
                });
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const { mutate: commentPost, isPending: isCommenting } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/comment/${post._id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ text: comment }),
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: () => {
            toast.success("Comment posted successfully");
            setComment("");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleDeletePost = () => {
        deletePost();
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        if (isCommenting || !comment.trim()) return;
        commentPost();
    };

    const handleLikePost = () => {
        if (isLiking) return;
        likePost();
    };

    return (
        <div className='flex gap-3 items-start p-4 border-b border-gray-700'>
            {/* User Avatar */}
            <Link
                to={`/profile/${postOwner.username}`}
                className='w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5'
            >
                <img
                    src={postOwner.profileImg || "/avatar-placeholder.png"}
                    className='w-full h-full object-cover'
                    alt={postOwner.fullName}
                />
            </Link>

            {/* Post Main Body */}
            <div className='flex flex-col flex-1 min-w-0'>
                {/* User Info Header */}
                <div className='flex gap-2 items-center leading-none'>
                    <Link
                        to={`/profile/${postOwner.username}`}
                        className='font-bold hover:underline truncate text-white text-base'
                    >
                        {postOwner.fullName}
                    </Link>
                    <span className='text-gray-500 flex gap-1 text-sm truncate'>
                        <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
                        <span>·</span>
                        <span>{formattedDate}</span>
                    </span>

                    {isMyPost && (
                        <span className='flex justify-end flex-1'>
                            {!isDeleting && (
                                <FaTrash
                                    className='cursor-pointer hover:text-red-500 text-gray-500 transition-colors'
                                    onClick={handleDeletePost}
                                />
                            )}
                            {isDeleting && <LoadingSpinner size='sm' />}
                        </span>
                    )}
                </div>

                {/* Post Content & Media */}
                <div className='flex flex-col gap-3 overflow-hidden mt-2'>
                    {post.text && <span className='text-white text-sm sm:text-base leading-normal'>{post.text}</span>}
                    {(post.image || post.img) && (
                        <img
                            src={post.image || post.img}
                            className='h-80 w-full object-cover rounded-2xl border border-gray-800'
                            alt='Post media'
                        />
                    )}
                </div>

                {/* Post Actions Bar */}
                <div className='flex justify-between mt-3'>
                    <div className='flex gap-4 items-center w-2/3 justify-between'>
                        {/* Comment Modal Trigger */}
                        <div
                            className='flex gap-1 items-center cursor-pointer group'
                            onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
                        >
                            <FaRegComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                            <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                                {post.comments?.length || 0}
                            </span>
                        </div>

                        {/* Modal */}
                        <dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
                            <div className='modal-box rounded-2xl border border-gray-800 bg-[#16181C] p-6'>
                                <h3 className='font-bold text-lg mb-4 text-white'>COMMENTS</h3>
                                <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                                    {(!post.comments || post.comments.length === 0) && (
                                        <p className='text-sm text-slate-500'>
                                            No comments yet 🤔 Be the first one 😉
                                        </p>
                                    )}
                                    {post.comments?.map((c) => (
                                        <div key={c._id} className='flex gap-2 items-start'>
                                            <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0'>
                                                <img
                                                    src={c.user?.profileImg || "/avatar-placeholder.png"}
                                                    className='w-full h-full object-cover'
                                                    alt={c.user?.fullName}
                                                />
                                            </div>
                                            <div className='flex flex-col'>
                                                <div className='flex items-center gap-1 leading-none'>
                                                    <span className='font-bold text-sm text-white'>{c.user?.fullName}</span>
                                                    <span className='text-gray-500 text-xs'>
                                                        @{c.user?.username}
                                                    </span>
                                                </div>
                                                <div className='text-sm text-gray-200 mt-1'>{c.text}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form
                                    className='flex gap-2 items-center mt-4 border-t border-gray-700 pt-3'
                                    onSubmit={handlePostComment}
                                >
                                    <textarea
                                        className='textarea w-full p-2 rounded-xl text-sm resize-none border border-gray-700 bg-black text-white focus:outline-none focus:border-sky-500'
                                        placeholder='Add a comment...'
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <button className='btn btn-primary rounded-full btn-sm text-white px-4'>
                                        {isCommenting ? <LoadingSpinner size='sm' /> : "Post"}
                                    </button>
                                </form>
                            </div>
                            <form method='dialog' className='modal-backdrop'>
                                <button className='outline-none'>close</button>
                            </form>
                        </dialog>

                        {/* Repost Button */}
                        <div className='flex gap-1 items-center group cursor-pointer'>
                            <BiRepost className='w-6 h-6 text-slate-500 group-hover:text-green-500' />
                            <span className='text-sm text-slate-500 group-hover:text-green-500'>0</span>
                        </div>

                        {/* Like Button */}
                        <div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
                            {isLiking ? (
                                <LoadingSpinner size='sm' />
                            ) : isLiked ? (
                                <FaHeart className='w-4 h-4 text-pink-500 transition-transform active:scale-125' />
                            ) : (
                                <FaRegHeart className='w-4 h-4 text-slate-500 group-hover:text-pink-500 transition-transform active:scale-125' />
                            )}
                            <span
                                className={`text-sm ${
                                    isLiked ? "text-pink-500" : "text-slate-500 group-hover:text-pink-500"
                                }`}
                            >
                                {post?.likes?.length || 0}
                            </span>
                        </div>
                    </div>

                    {/* Bookmark */}
                    <div className='flex w-1/3 justify-end gap-2 items-center'>
                        <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer hover:text-sky-400' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Post;