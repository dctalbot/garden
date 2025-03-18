import https from "https";
import fs from "fs";

/**
 * Fetches media data from Instagram API. API reference: https://developers.facebook.com/docs/instagram-platform/reference/instagram-media
 *
 * @returns {Promise<Array<{id: string, media_url: string, timestamp: string}>>}
 * An array of media objects containing id, media_url, and timestamp.
 * @throws Will throw an error if the request fails.
 */
async function getMedia() {
  const REQUEST_URL =
    "https://graph.instagram.com/v21.0/me/media?fields=media_url,id,timestamp";

  const res = await new Promise((resolve, reject) => {
    https.get(
      REQUEST_URL,
      {
        headers: {
          Authorization: "Bearer " + process.env.IG_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
        res.on("error", (err) => {
          reject(err);
        });
      },
    );
  });

  const jsonData = JSON.parse(res);
  return jsonData.data;
}

/**
 * Fetches the raw bytes of an image from a given URL.
 *
 * @param {string} url - The URL of the image.
 * @returns {Promise<Buffer>} A promise that resolves to the raw bytes of the image.
 * @throws Will throw an error if the request fails.
 */
function getImgBytes(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        resolve(Buffer.concat(data));
      });
      res.on("error", (err) => {
        reject(err);
      });
    });
  });
}

/**
 * Writes image bytes to a file.
 *
 * @param {Promise<Buffer>} inputData - A promise that resolves to the image bytes.
 * @param {string} path - The file path where the image will be saved.
 */
function writeImgFile(inputData, path) {
  // write bytes to a file
  inputData.then((data) => {
    fs.writeFile(path, data, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      }
    });
  });
}

/**
 * Filters out media data that corresponds to files already existing in the "./src/assets" directory.
 *
 * @param {Array} mediaData - An array of media objects, each containing an `id` property.
 * @returns {Array} - A filtered array of media objects that do not have corresponding files in the "./src/assets" directory.
 */
function filterOutOldMedia(mediaData) {
  const existingFiles = fs.readdirSync("./src/assets");
  return mediaData.filter(
    ({ id }) => !existingFiles.some((f) => f.includes(id)),
  );
}

/**
 * Main function to fetch media data and save images to local files.
 *
 * @returns {Promise<void>}
 * @throws Will throw an error if any step in the process fails.
 */
async function main() {
  try {
    const mediaData = await getMedia();
    const newMedia = filterOutOldMedia(mediaData);

    for (const { id, media_url, timestamp } of newMedia) {
      const bytes = await getImgBytes(media_url);
      writeImgFile(
        Promise.resolve(bytes),
        `./src/assets/${timestamp}::${id}.jpg`,
      );
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

// do the thing
await main();
