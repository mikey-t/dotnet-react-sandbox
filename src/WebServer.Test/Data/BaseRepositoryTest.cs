using MikeyT.EnvironmentSettingsNS.Interface;
using MikeyT.EnvironmentSettingsNS.Logic;
using WebServer.Data;

namespace WebServer.Test.Data;

public class BaseRepositoryTest
{
    protected readonly IConnectionStringProvider ConnectionStringProvider;
    protected readonly IEnvironmentSettings EnvironmentSettings;
    protected readonly long DefaultAccountId;
    protected readonly long AltAccountId;

    protected BaseRepositoryTest()
    {
        EnvironmentSettings = new EnvironmentSettings(new DefaultEnvironmentVariableProvider(), new DefaultSecretVariableProvider());
        EnvironmentSettings.AddSettings<TestSettings>();
        ConnectionStringProvider = new ConnectionStringProvider(EnvironmentSettings);
        var createTestAccountsResult = TestHelper.EnsureDefaultTestAccounts(new AccountRepository(ConnectionStringProvider, EnvironmentSettings)).GetAwaiter().GetResult();
        DefaultAccountId = createTestAccountsResult.DefaultId;
        AltAccountId = createTestAccountsResult.AltId;
    }
}
