import type { FC } from "react";
import React, { useState } from "react";
import { uploadChunkFile, uploadSingleFile } from "~/utils/uploadFile";

interface IUploadFileInputProps {
  label: string;
  onUploadFile: (file: File) => Promise<any>;
}
const UploadFileInput: FC<IUploadFileInputProps> = ({
  onUploadFile,
  label,
}) => {
  const [uploadUrl, setUploadUrl] = useState("");

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (!target.files?.length) return;

    const file = target.files[0];
    const { url } = await onUploadFile(file);
    setUploadUrl(url);
  };

  return (
    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 mb-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="file">
          <b>{label}</b>
        </label>
        <input
          type="file"
          name="file"
          onChange={onFileChange}
          placeholder="single upload"
        />
      </div>
      <div className="my-4">
        <a
          className=" text-blue-600 hover:underline"
          href={uploadUrl}
          target="_blank"
          rel="noreferrer"
        >
          {uploadUrl}
        </a>
      </div>
    </div>
  );
};

export default function Index() {
  return (
    <main className="relative min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold mb-8">
        Optimizing Large File Upload Performance Testing
      </h1>
      <div className="relative sm:pb-16 sm:pt-8 flex">
        <UploadFileInput
          onUploadFile={uploadSingleFile}
          label="Upload a single file"
        />
        <UploadFileInput
          onUploadFile={uploadChunkFile}
          label="Upload a chunk of files"
        />
      </div>
    </main>
  );
}
