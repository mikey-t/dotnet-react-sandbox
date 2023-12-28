using MikeyT.EnvironmentSettingsNS.Interface;
using WebServer;

public interface IFeatureFlags
{
    bool IsEmailSendingEnabled();
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
}
