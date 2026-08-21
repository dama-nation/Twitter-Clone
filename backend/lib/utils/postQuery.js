export const populatePostUsers = (query) => query
    .populate({ path: "user", select: "-password" })
    .populate({ path: "comments.user", select: "-password" });
