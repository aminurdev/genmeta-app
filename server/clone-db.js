import { MongoClient } from "mongodb";

const SOURCE_URI = "";

const TARGET_URI = "";

const SOURCE_DB = "GenMetaApp";
const TARGET_DB = "GenMetaApp";

async function cloneDatabase() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(SOURCE_DB);
    const targetDb = targetClient.db(TARGET_DB);

    const collections = await sourceDb.listCollections().toArray();

    for (const { name } of collections) {
      console.log(`Cloning collection: ${name}`);

      const sourceCollection = sourceDb.collection(name);
      const targetCollection = targetDb.collection(name);

      // ✅ Copy indexes
      const indexes = await sourceCollection.indexes();
      if (indexes.length > 1) {
        await targetCollection.createIndexes(
          indexes.filter((i) => i.name !== "_id_")
        );
      }

      // ✅ Stream documents safely
      const cursor = sourceCollection.find();
      const batch = [];

      for await (const doc of cursor) {
        batch.push(doc);

        if (batch.length === 1000) {
          await targetCollection.insertMany(batch);
          batch.length = 0;
        }
      }

      if (batch.length) {
        await targetCollection.insertMany(batch);
      }
    }

    console.log("✅ Database cloned successfully!");
  } catch (err) {
    console.error("❌ Clone failed:", err);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

cloneDatabase();
