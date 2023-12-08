using Dapper;
using MikeyT.EnvironmentSettingsNS.Interface;
using Npgsql;
using WebServer.Logic;

namespace WebServer.Data;

public class BaseRepository
{
    protected string ConnectionString { get; }

    protected BaseRepository(IConnectionStringProvider connectionStringProvider, IEnvironmentSettings environmentSettings)
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        SqlMapper.AddTypeHandler(new DateTimeHandler());
        ConnectionString = connectionStringProvider.GetConnectionString();
    }

    public string GetConnectionString()
    {
        var testDbName = Environment.GetEnvironmentVariable(GlobalSettings.DB_NAME_TEST.ToString());
        if (!ConnectionString.Contains($"Database={testDbName};"))
        {
            throw new ApplicationException("ConnectionString is only available outside the repository class when testing");
        }

        return ConnectionString;
    }

    protected async Task<NpgsqlConnection> GetConnection()
    {
        var connection = new NpgsqlConnection(ConnectionString);
        // Using async syntax so "await using var" works when calling this
        return await Task.FromResult(connection);
    }
}
