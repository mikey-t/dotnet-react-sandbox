using Dapper;
using Npgsql;
using WebServer.Logic;

namespace WebServer.Data;

public class BaseRepository
{
    protected readonly NpgsqlDataSource _dataSource;

    protected BaseRepository(NpgsqlDataSource dataSource)
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        SqlMapper.AddTypeHandler(new DateTimeHandler());
        _dataSource = dataSource;
    }

    protected async Task<NpgsqlConnection> GetConnection()
    {
        return await _dataSource.OpenConnectionAsync();
    }

    public string GetConnectionString()
    {
        var testDbName = Environment.GetEnvironmentVariable(GlobalSettings.DB_NAME_TEST.ToString());
        var connectionString = _dataSource.ConnectionString;
        if (!connectionString.Contains($"Database={testDbName};"))
        {
            throw new ApplicationException("The connection string is only available outside the repository class when testing");
        }

        return connectionString;
    }
}
