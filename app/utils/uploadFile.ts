import sparkMd5 from "spark-md5";

const uploadBaseUrl = "/api/upload";

export const calcFileMD5 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    let chunkSize = 2097152; // Read in chunks of 2MB
    let chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    let spark = new sparkMd5.ArrayBuffer();
    let fileReader = new FileReader();

    fileReader.onload = (e) => {
      if (!e.target?.result) return;
      console.log("read chunk nr", currentChunk + 1, "of", chunks);
      spark.append(e.target.result as ArrayBuffer);
      currentChunk++;
      if (currentChunk < chunks) {
        loadNext();
      } else {
        console.log("finished loading");
        resolve(spark.end(false));
      }
    };

    fileReader.onerror = (e) => {
      reject(fileReader.error);
      fileReader.abort();
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end =
        start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }
    loadNext();
  });
};

export const uploadChunkFile = async (
  file: File
): Promise<{ url: string; message: string }> => {
  const fileMd5 = await calcFileMD5(file); // Calculate the MD5 of the file
  const fileStatus = await checkFileExist(
    // Check if the file already exists
    `${uploadBaseUrl}/exists`,
    file.name,
    fileMd5
  );
  if (fileStatus.data && fileStatus.data.isExists) {
    return { url: fileStatus.data.url, message: "File has been uploaded" };
  } else {
    await uploadFileConcurrently({
      url: `${uploadBaseUrl}/chunk`,
      file,
      fileMd5,
      fileSize: file.size,
      chunkSize: 1 * 1024 * 1024, // 1 MB
      chunkIds: fileStatus.data.chunkIds,
      poolLimit: 3,
    });
  }
  const fileData = await concatChunkFiles(
    `${uploadBaseUrl}/concatChunkFiles`,
    file.name,
    fileMd5
  );
  const {
    data: { url },
  } = fileData;
  return { url, message: "File uploaded successfully" };
};

export const asyncPool = async <T, R>(
  concurrency: number,
  iterable: Iterable<T>,
  iteratorFn: (item: T, iterable?: Iterable<T>) => Promise<R>
): Promise<R[]> => {
  const ret: Promise<R>[] = []; // Store all asynchronous tasks
  const executing: Set<Promise<R>> = new Set(); // Stores executing asynchronous tasks
  for (const item of iterable) {
    // Call the iteratorFn function to create an asynchronous task
    const p = Promise.resolve().then(() => iteratorFn(item, iterable));

    ret.push(p); // save new async task
    executing.add(p); // Save an executing asynchronous task

    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= concurrency) {
      // Wait for faster task execution to complete
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
};

export const uploadFileConcurrently = ({
  url,
  file,
  fileMd5,
  fileSize,
  chunkSize,
  chunkIds,
  poolLimit = 1,
}: {
  url: string;
  file: File;
  fileMd5: string;
  fileSize: number;
  chunkSize: number;
  chunkIds: string[];
  poolLimit?: number;
}) => {
  const chunks =
    typeof chunkSize === "number" ? Math.ceil(fileSize / chunkSize) : 1;
  const array = [...Array.from({ length: chunks }, (_, i) => i)]; // 0, 1, 2, 3
  return asyncPool<number, void | Response>(poolLimit, array, (i) => {
    if (chunkIds.indexOf(i.toString()) !== -1) {
      // Ignore uploaded chunks
      return Promise.resolve();
    }
    let start = i * chunkSize;
    let end = i + 1 == chunks ? fileSize : (i + 1) * chunkSize;
    const chunk = file.slice(start, end);
    return uploadChunk({
      url,
      chunk,
      chunkIndex: i,
      fileMd5,
      fileName: file.name,
    });
  });
};

export const uploadChunk = ({
  url,
  chunk,
  chunkIndex,
  fileMd5,
  fileName,
}: {
  url: string;
  chunk: Blob;
  chunkIndex: number;
  fileMd5: string;
  fileName: string;
}) => {
  let formData = new FormData();
  formData.set("file", chunk, fileMd5 + "-" + chunkIndex);
  formData.set("name", fileName);
  formData.set("timestamp", Date.now().toString());

  return fetch(url, {
    method: "POST",
    body: formData,
  });
};

export const uploadSingleFile = async (
  file: File
): Promise<{ url: string; message: string }> => {
  let formData = new FormData();
  formData.set("file", file, file.name);
  formData.set("name", file.name);
  formData.set("timestamp", Date.now().toString());

  const res = await fetch(`${uploadBaseUrl}/single`, {
    method: "POST",
    body: formData,
  });

  const fileData = await res.json();
  const {
    data: { url },
  } = fileData;
  return {
    url,
    message: "File uploaded successfully",
  };
};

const getApiCall = async (url: string, params: any) => {
  const paramsStr = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${paramsStr}`);
  return res.json();
};

export const concatChunkFiles = (url: string, name: string, md5: string) => {
  return getApiCall(url, { name, md5 });
};

export const checkFileExist = (url: string, name: string, md5: string) => {
  return getApiCall(url, { name, md5 });
};
