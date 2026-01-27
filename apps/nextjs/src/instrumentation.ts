/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-restricted-properties */
const enableMigrations = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (enableMigrations) {
      // Dynamic imports to avoid Edge Runtime issues
      const path = await import("path");
      const { migrate, readMigrationFiles } = await import("@app/db");
      const { db } = await import("@app/db/client");

      const migrationsFolder = path.join(
        process.cwd(),
        "packages/db/migrations",
      );

      console.log("* Running db migration script...");
      console.log("Migrations folder", migrationsFolder);
      const migrations = readMigrationFiles({ migrationsFolder });
      console.log("Migrations count", migrations.length);
      await migrate(db, { migrationsFolder });
      console.log("Migration scripts finished\n");
    } else {
      console.log("Migrations are disabled");
    }
  }
}
