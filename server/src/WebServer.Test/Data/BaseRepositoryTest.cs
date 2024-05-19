using MikeyT.EnvironmentSettingsNS.Interface;
using MikeyT.EnvironmentSettingsNS.Logic;
using Npgsql;
using System;
using WebServer.Data;

namespace WebServer.Test.Data;

public class BaseRepositoryTest
{
    protected readonly string ConnectionString;
    protected readonly IEnvironmentSettings EnvironmentSettings;
    protected readonly Guid DefaultAccountId;
    protected readonly Guid AltAccountId;

    protected BaseRepositoryTest()
    {
        DotEnv.Load();
        EnvironmentSettings = new EnvironmentSettings(new DefaultEnvironmentVariableProvider(), new DefaultSecretVariableProvider());
        EnvironmentSettings.AddSettings<GlobalSettings>();
        ConnectionString = new ConnectionStringProvider(EnvironmentSettings, true).GetConnectionString();
        var createTestAccountsResult = TestHelper.EnsureDefaultTestAccounts(new AccountRepository(NpgsqlDataSource.Create(ConnectionString))).GetAwaiter().GetResult();
        DefaultAccountId = createTestAccountsResult.DefaultId;
        AltAccountId = createTestAccountsResult.AltId;
    }
}
