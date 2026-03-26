import express from "express";
import { supabase } from "../supabase/supabase";

const router = express.Router();
router.use(express.json());

router.get("/", (req, res) => {
  res.send("client pannel Law!");
});

router.get("/get-case/:code", async (req, res) => {
  const code = req.params.code;
  try {
    const { data, error } = await supabase
      .from("Cases")
      .select("*")
      .eq("code", code);
    if (error) throw error;
    res.status(200).json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: true, msg: err });
  }
});

export default router;
