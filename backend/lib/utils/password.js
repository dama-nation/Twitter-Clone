import bcrypt from "bcryptjs";

export const isValidPassword = (password) => password.length >= 6;

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
