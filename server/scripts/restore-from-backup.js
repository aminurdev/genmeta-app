import { MongoClient } from "mongodb";

const SOURCE_URI = "mongodb+srv://genmetaapp:a7ymMF8kwz13A039@cluster0.q9hjz.mongodb.net";
const SOURCE_DB = "GenMetaApp_backup";

const TARGET_URI = "mongodb://127.0.0.1:27017";
const TARGET_DB = "GenMetaApp";

const BATCH_SIZE = 1000;

async function copyDatabase() {
  console.log("=========================================================");
  console.log("   SAFE DATABASE CLONING (READ-ONLY ON SOURCE CLUSTER)   ");
  console.log("=========================================================");
  console.log(`Source (READ-ONLY): ${SOURCE_URI.replace(/:([^:@]+)@/, ":****@")} [${SOURCE_DB}]`);
  console.log(`Target (WRITE):     ${TARGET_URI} [${TARGET_DB}]`);
  console.log("=========================================================\n");

  const sourceClient = new MongoClient(SOURCE_URI, { readPreference: "secondaryPreferred" });
  const targetClient = new MongoClient(TARGET_URI);

  try {
    console.log("Connecting to source and target databases...");
    await sourceClient.connect();
    await targetClient.connect();
    console.log("✓ Connected to both instances successfully.\n");

    const sourceDb = sourceClient.db(SOURCE_DB);
    const targetDb = targetClient.db(TARGET_DB);

    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source backup database.\n`);

    const summary = [];

    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;

      const sourceCollection = sourceDb.collection(name);
      const targetCollection = targetDb.collection(name);

      const totalDocs = await sourceCollection.countDocuments();
      console.log(`▶ Copying collection: [${name}] (Total: ${totalDocs} documents)...`);

      // 1. Copy Documents in Batches
      const cursor = sourceCollection.find({}).batchSize(BATCH_SIZE);
      let batch = [];
      let copiedDocs = 0;

      for await (const doc of cursor) {
        batch.push(doc);

        if (batch.length === BATCH_SIZE) {
          await targetCollection.insertMany(batch, { ordered: false });
          copiedDocs += batch.length;
          process.stdout.write(`   → Processed ${copiedDocs}/${totalDocs} docs...\r`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await targetCollection.insertMany(batch, { ordered: false });
        copiedDocs += batch.length;
      }

      console.log(`   ✓ Copied ${copiedDocs} documents into local [${name}].`);

      // 2. Copy Indexes
      try {
        const indexes = await sourceCollection.indexes();
        const nonIdIndexes = indexes.filter((i) => i.name !== "_id_");

        if (nonIdIndexes.length > 0) {
          const indexSpecs = nonIdIndexes.map((idx) => {
            const spec = { key: idx.key, name: idx.name };
            if (idx.unique) spec.unique = true;
            if (idx.sparse) spec.sparse = true;
            if (idx.expireAfterSeconds !== undefined) spec.expireAfterSeconds = idx.expireAfterSeconds;
            return spec;
          });

          await targetCollection.createIndexes(indexSpecs);
          console.log(`   ✓ Copied ${nonIdIndexes.length} index(es) for [${name}].`);
        }
      } catch (idxErr) {
        console.warn(`   ⚠ Index creation warning on [${name}]: ${idxErr.message}`);
      }

      // 3. Verification
      const targetCount = await targetCollection.countDocuments();
      summary.push({
        collection: name,
        sourceCount: totalDocs,
        targetCount,
        match: totalDocs === targetCount,
      });

      console.log("");
    }

    console.log("=========================================================");
    console.log("                  VERIFICATION SUMMARY                   ");
    console.log("=========================================================");
    let allMatched = true;
    for (const item of summary) {
      const status = item.match ? "✓ MATCH" : "✗ MISMATCH";
      if (!item.match) allMatched = false;
      console.log(` ${status.padEnd(10)} | ${item.collection.padEnd(20)} | Source: ${item.sourceCount.toString().padStart(6)} | Target: ${item.targetCount.toString().padStart(6)}`);
    }
    console.log("=========================================================");

    if (allMatched) {
      console.log("\n🎉 Database clone completed successfully! All document counts match 100%!");
    } else {
      console.warn("\n⚠ Note: Some document counts differed. Check details above.");
    }
  } catch (error) {
    console.error("\n❌ Database clone failed:", error);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

copyDatabase();
