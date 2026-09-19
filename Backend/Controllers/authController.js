import supabase from "../config/Supabase.js";
import { validateEmail } from "../utilis/validation.js";

export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!validateEmail(email) || !password) {return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Email and password are required",
                },});
            }
const { data, error } = await supabase.auth.signUp({email, password,});
        if (error) {
            return res.status(400).json({
                error: {code: "AUTH_ERROR",
                    message: error.message,
                },});
        }
        const user = data.user;
        if (!user) {
            return res.status(400).json({
                error: {
                    code: "REGISTRATION_FAILED",
                    message: "User registration failed",
                },});
        }

        const { data: profile, error: profileError } = await supabase
            .from("users")
            .insert([
                {
                    id: user.id,
                    email: user.email,
                    name: name || null,
                },
            ])
            .select()
            .single();
        if (profileError) {
            return res.status(500).json({
                error: {
                    code: "PROFILE_CREATION_FAILED",
                    message: profileError.message,
                },});
        }
        res.status(201).json({
            message: "Registration successful",
            user: profile,
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message,
            },});
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!validateEmail(email) || !password) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Email and password are required",
                },});
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            return res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: error.message,
                },});
        }
        res.status(200).json({
            message: "Login successful",
            session: data.session,
            user: data.user,
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message,
            },
        });
    }
};
export const getMe = async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", req.user.id)
            .single();
        if (error) {
            return res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User profile not found",
                },
            });
        }
        res.status(200).json({
            user: profile,
        });
    } catch (error) {
        res.status(500).json({
            error: {
                code: "SERVER_ERROR",
                message: error.message,
            },
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl : '';
        if (imageUrl && !imageUrl.startsWith('data:image/')) {
            return res.status(400).json({ error: { code: 'INVALID_IMAGE', message: 'Profile photo must be an image' } });
        }
        if (imageUrl.length > 2000000) {
            return res.status(413).json({ error: { code: 'IMAGE_TOO_LARGE', message: 'Profile photo is too large' } });
        }
        const { data: profile, error } = await supabase.from('users').update({ image_url: imageUrl || null }).eq('id', req.user.id).select().single();
        if (error) throw error;
        res.json({ user: profile });
    } catch (error) {
        res.status(500).json({ error: { code: 'PROFILE_UPDATE_FAILED', message: error.message } });
    }
};


