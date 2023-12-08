using MikeyT.EnvironmentSettingsNS.Interface;

namespace WebServer.Data;

public interface IConnectionStringProvider
{
    string GetConnectionString(string dbName, string host, string port, string userId, string password);
    string GetConnectionString();
}

public class ConnectionStringProvider : IConnectionStringProvider
{
    private readonly bool _useTestDb;
    private readonly IEnvironmentSettings _envSettings;

    public ConnectionStringProvider(IEnvironmentSettings envSettings, bool useTestDb = false)
    {
        _envSettings = envSettings;
        _useTestDb = useTestDb;
    }

    public string GetConnectionString(string dbName, string host, string port, string userId, string password)
    {
        var connectionString = $"Host={host};Port={port};Database={dbName};User Id={userId};Password={password};";

        if (_envSettings.GetBool("POSTGRES_INCLUDE_ERROR_DETAIL"))
        {
            connectionString += "Include Error Detail=true;";
        }

        return connectionString;
    }

    public string GetConnectionString()
    {
        var dbName = _useTestDb ? _envSettings.GetString(GlobalSettings.DB_NAME_TEST) : _envSettings.GetString(GlobalSettings.DB_NAME);
        var host = _envSettings.GetString(GlobalSettings.DB_HOST);
        var port = _envSettings.GetString(GlobalSettings.DB_PORT);
        var user = _envSettings.GetString(GlobalSettings.DB_USER);
        var pass = _envSettings.GetString(GlobalSettings.DB_PASSWORD);
        return GetConnectionString(dbName, host, port, user, pass);
    }
}
