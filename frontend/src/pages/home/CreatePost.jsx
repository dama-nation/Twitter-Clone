import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiRequest } from "../../utils/api";

const CreatePost = () => {
    const [text, setText] = useState("");
    const [img, setImg] = useState(null);
    const imgRef = useRef(null);

    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(["authUser"]);

    const {
        mutate: createPost,
        isPending,
        isError,
        error,
    } = useMutation({
        // Matching 'image' key to the backend controller
        mutationFn: ({ text, img }) =>
            apiRequest("/api/posts/create", { method: "POST", body: { text, image: img } }),
        onSuccess: () => {
            setText("");
            setImg(null);
            toast.success("Post created successfully");
            return queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createPost({ text, img });
    };

    const handleImgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImg(reader.result);
            };
            reader.onerror = () => toast.error("Could not read the selected image");
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className='flex p-4 items-start gap-4 border-b border-gray-700'>
            <div className='w-10 h-10 rounded-full overflow-hidden flex-shrink-0'>
                <img 
                    src={authUser?.profileImg || "/avatar-placeholder.png"} 
                    className='w-full h-full object-cover' 
                    alt='Profile' 
                />
            </div>
            <form className='flex flex-col gap-2 w-full' onSubmit={handleSubmit}>
                <textarea
                    className='textarea w-full p-0 pt-2 text-lg resize-none border-none focus:outline-none border-gray-800'
                    placeholder='What is happening?!'
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                {img && (
                    <div className='relative w-72 mx-auto'>
                        <IoCloseSharp
                            className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                            onClick={() => {
                                setImg(null);
                                imgRef.current.value = null;
                            }}
                        />
                        <img src={img} className='w-full mx-auto h-72 object-contain rounded' alt='Upload preview' />
                    </div>
                )}

                <div className='flex justify-between border-t py-2 border-t-gray-700'>
                    <div className='flex gap-1 items-center'>
                        <CiImageOn
                            className='fill-primary w-6 h-6 cursor-pointer'
                            onClick={() => imgRef.current.click()}
                        />
                        <BsEmojiSmileFill className='fill-primary w-5 h-5 cursor-pointer' />
                    </div>
                    <input type='file' accept='image/*' hidden ref={imgRef} onChange={handleImgChange} />
                    <button className='btn btn-primary rounded-full btn-sm text-white px-4' disabled={isPending}>
                        {isPending ? "Posting..." : "Post"}
                    </button>
                </div>
                {isError && <div className='text-red-500'>{error.message}</div>}
            </form>
        </div>
    );
};
export default CreatePost;