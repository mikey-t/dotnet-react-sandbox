using MikeyT.EnvironmentSettingsNS.Interface;
using WebServer;

public interface IFeatureFlags
{
    bool IsEmailSendingEnabled();
    bool IsExternalLoginsEnabled();
}

public class FeatureFlags : IFeatureFlags
{
    private readonly IEnvironmentSettings _environmentSettings;

    public FeatureFlags(IEnvironmentSettings environmentSettings)
    {
        _environmentSettings = environmentSettings;
    }

    public bool IsEmailSendingEnabled()
    {
        return _environmentSettings.GetBool(GlobalSettings.EMAIL_SENDING_ENABLED);
    }

    public bool IsExternalLoginsEnabled()
    {
        return _environmentSettings.GetBool(GlobalSettings.EXTERNAL_LOGINS_ENABLED);
    }
}
