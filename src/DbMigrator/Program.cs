using DbMigrator;
using MikeyT.DbMigrations;
using MikeyT.DbMigrations.Postgres;

await DbMigratorCli.Run(args, new PostgresDbMigrator(new MainDbContext()));
