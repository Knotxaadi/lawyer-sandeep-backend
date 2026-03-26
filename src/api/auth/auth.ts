import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { supabase } from "../supabase/supabase";
const router = express.Router();
router.use(express.json());
import dotenv from "dotenv";
dotenv.config();
// router.use(cors());
const SECRET: any = process.env.SECRET_KEY;

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    // console.log(data);
    if (error) throw error;

    const token = jwt.sign({ email }, SECRET, { expiresIn: "1d" });
    res.cookie("session", token, {
      httpOnly: true,
      secure: true, // true in production HTTPS
      sameSite: "none",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, message: "Logged in" });
  } catch (err) {
    // console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : err,
    });
  }
});

router.get("/auth-check", (req, res) => {
  const token = req.cookies.session;
  //   console.log(token);
  if (!token) return res.status(401).json({ success: false, user: null });

  try {
    const user = jwt.verify(token, SECRET);
    res.json({ success: true, user });
  } catch {
    res.status(401).json({ success: false, user: null });
  }
});

/* LOGOUT */
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.session;
    if (token) {
      await supabase.auth.signOut(token);
    }
    res.clearCookie("session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    // console.error("FULL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : err,
    });
  }
});

export default router;
