import https from "https";
import fs from "fs";

/**
 * Fetches media data from Instagram API. API reference: https://developers.facebook.com/docs/instagram-platform/reference/instagram-media
 *
 * @returns {Promise<Array<{id: string, media_url: string, permalink: string, timestamp: string}>>}
 * An array of media objects.
 * @throws Will throw an error if the request fails.
 */
async function getMedia() {
  const REQUEST_URL =
    "https://graph.instagram.com/v21.0/me/media?fields=media_url,id,timestamp,permalink";

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
 * @returns {Array<{id: string, media_url: string, permalink: string, timestamp: string}>}
 */
function filterForNewMedia(stored, fetched) {
  const existingIds = stored.map(({ id }) => id);
  return fetched.filter(({ id }) => !existingIds.includes(id));
}

/**
 * gets media data from file store
 *
 * @returns {Array<{id: string, permalink: string, timestamp: string}>}
 * An array of media objects.
 */
function getStoredMedia() {
  return JSON.parse(fs.readFileSync("./db.json", "utf-8"))["media"];
}

/**
 * Updates the file store
 *
 * @param {{id: string, permalink: string, timestamp: string}} m - The new media object.
 */
function insertMedia(m) {
  const db = JSON.parse(fs.readFileSync("./db.json", "utf-8"));
  db["media"] = [...db["media"], m];
  fs.writeFileSync("./db.json", JSON.stringify(db, null, 2));
}

/**
 * Main function to fetch media data and save images to local files.
 *
 * @returns {Promise<void>}
 * @throws Will throw an error if any step in the process fails.
 */
async function main() {
  try {
    const storedMedia = getStoredMedia();
    const fetchedMedia = await getMedia();
    const newMedia = filterForNewMedia(storedMedia, fetchedMedia);

    for (const { id, media_url, timestamp, permalink } of newMedia) {
      const bytes = await getImgBytes(media_url);
      writeImgFile(
        Promise.resolve(bytes),
        `./src/assets/img/insta/${timestamp}::${id}.jpg`,
      );
      insertMedia({
        id,
        timestamp,
        permalink,
      });
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

// do the thing
await main();
