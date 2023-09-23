using DbMigrator;
using MikeyT.DbMigrations;
using MikeyT.DbMigrations.Postgres;

return await DbMigratorCli.Run(args, new PostgresDbMigrator(new MainDbContext()));
