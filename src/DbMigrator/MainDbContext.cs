using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MikeyT.DbMigrations;
using MikeyT.DbMigrations.Postgres;
using MikeyT.EnvironmentSettingsNS.Logic;

namespace DbMigrator;

public class MainDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        DotEnv.Load();
        var settings = new PostgresDbMigratorSettings();
        var connectionString = settings.GetMigrationsConnectionString();
        Console.WriteLine("Using connection string: " + settings.GetLogSafeConnectionString(connectionString));
        optionsBuilder.UseNpgsql(connectionString);
        optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
        MigrationScriptRunner.SetSqlPlaceholderReplacer(new DefaultSqlPlaceholderReplacer());
    }
}
