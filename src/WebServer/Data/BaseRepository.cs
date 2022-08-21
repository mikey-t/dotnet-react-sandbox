using Dapper;
using MikeyT.EnvironmentSettingsNS.Interface;
using WebServer.Logic;

namespace WebServer.Data;

public class BaseRepository
{
    protected string ConnectionString { get; }

    protected BaseRepository(IConnectionStringProvider connectionStringProvider, IEnvironmentSettings environmentSettings)
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        SqlMapper.AddTypeHandler(new DateTimeHandler());
        ConnectionString = connectionStringProvider.GetConnectionString(environmentSettings.GetString(GlobalSettings.DB_NAME));
    }

    public string GetConnectionString()
    {
        if (!ConnectionString.Contains("Database=test_"))
        {
            throw new ApplicationException("ConnectionString is only available outside the repository class when testing");
        }

        return ConnectionString;
    }
}
