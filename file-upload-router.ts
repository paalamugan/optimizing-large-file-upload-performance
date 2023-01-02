import path from "path";
import multer from "multer";
import fse from "fs-extra";
import fsp from "fs/promises";
import fs from "fs";
import express from "express";
import { randomUUID } from "crypto";

const TMP_DIR = path.join(process.cwd(), "tmp"); // temporary directory
const UPLOAD_DIR = path.join(process.cwd(), "public", "upload");
const IGNORES = [".DS_Store"]; // ignored files

const router = express.Router();

// const storage = multer.memoryStorage();
const chunkStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let fileMd5 = file.originalname.split("-")[0];
    const fileDir = path.join(TMP_DIR, fileMd5);
    await fse.ensureDir(fileDir);
    cb(null, fileDir);
  },
  filename: function (req, file, cb) {
    let chunkIndex = file.originalname.split("-")[1];
    cb(null, `${chunkIndex}`);
  },
});

const singleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, `${randomUUID()}-${originalname}`);
  },
});

const multerChunkUpload = multer({ storage: chunkStorage });
const multerSingleUpload = multer({ storage: singleStorage });

router.get("/", (req, res) => {
  res.send("Upload file api works");
});

router.get("/exists", async (req, res) => {
  const { name: fileName, md5: fileMd5 } = req.query;
  const filePath = path.join(UPLOAD_DIR, fileName as string);
  const isExists = await fse.pathExists(filePath);
  if (isExists) {
    res.json({
      success: true,
      data: {
        isExists: true,
        url: `http://localhost:3000/upload/${fileName}`,
      },
    });
  } else {
    let chunkIds: string[] = [];
    const chunksPath = path.join(TMP_DIR, fileMd5 as string);
    const hasChunksPath = await fse.pathExists(chunksPath);
    if (hasChunksPath) {
      let files = await fsp.readdir(chunksPath);
      chunkIds = files.filter((file) => {
        return IGNORES.indexOf(file) === -1;
      });
    }
    res.json({
      success: true,
      data: {
        isExists: false,
        chunkIds,
      },
    });
  }
});

router.post("/chunk", multerChunkUpload.single("file"), async (req, res) => {
  res.json({
    success: true,
    data: req.file?.originalname,
  });
});

router.post("/single", multerSingleUpload.single("file"), async (req, res) => {
  res.json({
    success: true,
    data: {
      url: `http://localhost:3000/upload/${req.file?.filename}`,
    },
  });
});

const readFile = (file: string, ws: fs.WriteStream) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on("data", (data) => ws.write(data))
      .on("end", resolve)
      .on("error", reject);
  });
};

const concatChunkFiles = async (sourceDir: string, targetPath: string) => {
  const files = await fsp.readdir(sourceDir);
  const sortedFiles = files
    .filter((file) => {
      return IGNORES.indexOf(file) === -1;
    })
    .sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  const writeStream = fs.createWriteStream(targetPath);
  try {
    for (const file of sortedFiles) {
      let filePath = path.join(sourceDir, file);
      await readFile(filePath, writeStream);
    }
    await fse.remove(sourceDir); // remove temporary file directory
  } catch (err) {
    await fse.remove(targetPath); // remove target file, if something went wrong
    throw err;
  } finally {
    writeStream.end();
  }
};

router.get("/concatChunkFiles", async (req, res) => {
  const { name: fileName, md5: fileMd5 } = req.query as {
    name: string;
    md5: string;
  };

  try {
    await concatChunkFiles(
      path.join(TMP_DIR, fileMd5),
      path.join(UPLOAD_DIR, fileName)
    );
    res.json({
      success: true,
      data: {
        url: `http://localhost:3000/upload/${fileName}`,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: "Something went wrong on file uploading. Please try again later",
    });
  }
});

router.use((error, req, res, next) => {
  if (!(error instanceof multer.MulterError)) {
    return res.status(400).json({
      error: "Something went wrong on file uploading. Please try again later",
    });
  }
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "file is too large",
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      error: "File limit reached",
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: "File must be an image",
    });
  }

  return res.status(400).json({
    error: "Something went wrong on file uploading. Please try again later",
  });
});

fse.ensureDir(UPLOAD_DIR);

export default router;
