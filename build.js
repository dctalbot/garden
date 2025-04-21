import https from "https";
import fs from "fs";

/**
 * Fetch Instagram media. Docs: https://developers.facebook.com/docs/instagram-platform/reference/instagram-media
 *
 * @returns {Promise<Array<{id: string, media_url: string, permalink: string, timestamp: string}>>}
 * An array of Media objects.
 * @throws Will throw an error if the request fails.
 */
async function fetchMedia() {
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
 * Fetch Partiful events. There is no API, so we just hack on https://partiful.com/u/jej68Pa0PBSWZdQOoWqey4O95Zt2
 *
 * @returns {Promise<Array<{id: string, startDate: string, title: string}>>}
 * An array of Event objects.
 * @throws Will throw an error if the request fails.
 */
async function fetchEvents() {
  const REQUEST_URL = "https://api.partiful.com/getPublishedEvents";

  const res = await new Promise((resolve, reject) => {
    const req = https.request(
      REQUEST_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
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

    req.write(
      '{"data":{"params":{"userId":"jej68Pa0PBSWZdQOoWqey4O95Zt2"},"userId":null}}',
    );

    req.end();
  });

  const jsonData = JSON.parse(res);
  return jsonData.result.data;
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

function filterByID(stored, fetched) {
  const existingIds = stored.map(({ id }) => id);
  return fetched.filter(({ id }) => !existingIds.includes(id));
}

/**
 * gets media data from file store
 *
 * @param {string} collectionName - The name of the collection to retrieve from the database.
 * @returns {Array<{id: string, permalink: string, timestamp: string}>}
 * An array of media objects.
 */
function getStored(collectionName) {
  return JSON.parse(fs.readFileSync("./src/db.json", "utf-8"))[collectionName];
}

/**
 * Updates the file store
 *
 * @param {string} collectionName - The name of the collection to mutate in the database.
 * @param x - The new record.
 */
function insertRecord(collectionName, x) {
  const db = JSON.parse(fs.readFileSync("./src/db.json", "utf-8"));
  db[collectionName] = [...db[collectionName], x];
  fs.writeFileSync("./src/db.json", JSON.stringify(db, null, 2));
}

/**
 * Main function to fetch media data and save images to local files.
 *
 * @returns {Promise<void>}
 * @throws Will throw an error if any step in the process fails.
 */
async function main() {
  try {
    const storedMedia = getStored("media");
    const fetchedMedia = await fetchMedia();
    const newMedia = filterByID(storedMedia, fetchedMedia);

    for (const { id, media_url, timestamp, permalink } of newMedia) {
      const bytes = await getImgBytes(media_url);
      writeImgFile(Promise.resolve(bytes), `./src/assets/img/insta/${id}.jpg`);
      insertRecord("media", {
        id,
        timestamp,
        permalink,
      });
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  try {
    const storedEvents = getStored("events");
    const fetchedEvents = await fetchEvents();
    const newEvents = filterByID(storedEvents, fetchedEvents);

    for (const { id, startDate, title } of newEvents) {
      insertRecord("events", {
        id,
        timestamp: startDate,
        title,
        permalink: `https://partiful.com/e/${id}`,
      });
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

// do the thing
await main();
