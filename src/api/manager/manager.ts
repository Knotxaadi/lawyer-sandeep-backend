import express from "express";
import multer from "multer";
import { supabase } from "../supabase/supabase";

const router = express.Router();
router.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

interface CaseFile {
  name: string;
  type: string;
  date: string;
  size: string;
}

interface Case {
  code: string;
  MacCode: string;
  title: string;
  client: string;
  court: string;
  status: string;
  nextHearing: string;
  filedDate: string;
  advocate: string;
  description: string;
  files: CaseFile[];
}

router.get("/", (req, res) => {
  res.send("Manager pannel Law!");
});

router.get("/cases", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Cases").select("*");
    if (error) throw error;
    res.status(200).json({ success: true, Cases: data });
  } catch (err) {
    res.status(500).json({ success: false, msg: err });
  }
});

router.get("/codes", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Cases").select("code");
    if (error) throw error;
    res.status(200).json({ success: true, Cases: data });
  } catch (err) {
    res.status(500).json({ success: false, msg: err });
  }
});

router.put("/update-case", async (req, res) => {
  const UpdatedCase_details = req.body;
  let obj = {};
  if (UpdatedCase_details.status) {
    obj = { ...obj, status: UpdatedCase_details.status };
  }
  if (UpdatedCase_details.nextHearing) {
    obj = { ...obj, nextHearing: UpdatedCase_details.nextHearing };
  }
  try {
    const { error } = await supabase
      .from("Cases")
      .update(obj)
      .eq("code", UpdatedCase_details.code);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, msg: err });
  }
});

router.put("/update-case-file", upload.array("files"), async (req, res) => {
  try {
    const { caseCode, previousFiles } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!caseCode || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields",
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const filePath = `cases/${caseCode}/${Date.now()}_${file.originalname}`;

      // 🌊 Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("case-files")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      // 🌿 Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("case-files")
        .getPublicUrl(data.path);

      // 🌠 Build your object
      uploadedFiles.push({
        name: file.originalname,
        type: file.mimetype,
        date: new Date().toISOString(),
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        url: publicUrlData.publicUrl,
      });
    }

    // 🌊 Handle previous files
    const parsedPrevious =
      typeof previousFiles === "string"
        ? JSON.parse(previousFiles)
        : previousFiles || [];

    const updatedFiles = [...parsedPrevious, ...uploadedFiles];

    // 🌿 Save in DB
    const { error: dbError } = await supabase
      .from("Cases")
      .update({ files: updatedFiles })
      .eq("code", caseCode);

    if (dbError) throw dbError;

    res.status(200).json({
      success: true,
      msg: "Files uploaded & saved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      msg: err.message || "Server error",
    });
  }
});

router.post("/create-case", async (req, res) => {
  const Case: Case = req.body;
  try {
    const { data, error } = await supabase.from("Cases").insert([
      {
        code: Case.code,
        MacCode: Case.MacCode,
        title: Case.title,
        client: Case.client,
        court: Case.court,
        status: Case.status,
        nextHearing: Case.nextHearing,
        filedDate: Case.filedDate,
        advocate: Case.advocate,
        description: Case.description,
        files: [],
      },
    ]);
    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, msg: err });
  }
});

router.delete("/delete-case", async (req, res) => {
  const body = req.body;
  try {
    if (body.MacCode === null) {
      throw new Error("No Code");
    }
    if (body.files.length !== 0) {
      let multi_Files = [];
      for (const file of body.files) {
        let url = file.url;
        url = url.split("storage/v1/object/public/case-files/")[1];
        multi_Files.push(url);
      }
      multi_Files = multi_Files.map((path) => decodeURIComponent(path));
      console.log(multi_Files);

      const { error: fileError } = await supabase.storage
        .from("case-files")
        .remove(multi_Files);

      if (fileError) throw fileError;
    }

    const { error: dbError } = await supabase
      .from("Cases")
      .delete()
      .eq("code", body.code);
    if (dbError) throw dbError;

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, msg: err });
  }
});

export default router;
