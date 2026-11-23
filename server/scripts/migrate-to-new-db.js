import dotenv from "dotenv";
import { migrateFromOldDatabase } from "../src/database/migrateFromOldDb.js";

dotenv.config();

function parseCliArgs(argv) {
  const args = {
    sourceUri: process.env.SOURCE_URI || "mongodb://localhost:27017",
    sourceDbName: process.env.SOURCE_DB || "GenMeta_old",
    targetUri: process.env.TARGET_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
    targetDbName: process.env.TARGET_DB || process.env.DB_NAME || "GenMetaApp",
    dropTarget: false,
    dryRun: false,
    includeLegacyOrders: true,
    includePaymentTransactions: true,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const [flag, inlineVal] = token.split("=", 2);
    const readValue = () => (inlineVal !== undefined ? inlineVal : argv[++i]);

    switch (flag) {
      case "--source-uri":
        args.sourceUri = readValue();
        break;
      case "--source-db":
        args.sourceDbName = readValue();
        break;
      case "--target-uri":
        args.targetUri = readValue();
        break;
      case "--target-db":
        args.targetDbName = readValue();
        break;
      case "--drop-target":
        args.dropTarget = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--skip-orders":
        args.includeLegacyOrders = false;
        break;
      case "--skip-transactions":
        args.includePaymentTransactions = false;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
GenMeta Legacy -> V2 Database Migration Runner

Usage:
  node scripts/migrate-to-new-db.js [options]

Options:
  --source-uri <uri>    Legacy MongoDB URI (default: SOURCE_URI or mongodb://localhost:27017)
  --source-db <name>    Legacy database name (default: SOURCE_DB or GenMeta_old)
  --target-uri <uri>    Target MongoDB URI (default: TARGET_URI, MONGODB_URI, or mongodb://127.0.0.1:27017)
  --target-db <name>    Target database name (default: TARGET_DB, DB_NAME, or GenMetaApp)
  --dry-run             Read and transform without writing to target database
  --drop-target         Drop existing non-empty target database before migrating
  --skip-orders         Skip migrating legacy 'orders' collection
  --skip-transactions   Skip synthesizing 'paymenttransactions' records
  -h, --help            Show this help message
`);
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const result = await migrateFromOldDatabase(options);

  if (result.dryRun) {
    console.log("Dry-run summary:", JSON.stringify(result.stats, null, 2));
  }
  console.log(
    `\n🎉 Migration ${result.dryRun ? "dry-run " : ""}finished successfully in ${result.durationMs}ms (warnings: ${result.warnings.length}).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Database migration failed:", err.message || err);
  process.exit(1);
});
