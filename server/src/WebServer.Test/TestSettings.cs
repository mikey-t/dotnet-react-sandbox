using MikeyT.EnvironmentSettingsNS.Attributes;
using MikeyT.EnvironmentSettingsNS.Enums;

namespace WebServer.Test;

public enum TestSettings
{
    [SettingInfo(ShouldLogValue = true)] ASPNETCORE_ENVIRONMENT,

    [SettingInfo(DefaultValue = "localhost", DefaultForEnvironment = DefaultSettingForEnvironment.LocalOnly, ShouldLogValue = true)]
    DB_HOST,

    [SettingInfo(DefaultValue = "5432", DefaultForEnvironment = DefaultSettingForEnvironment.LocalOnly, ShouldLogValue = true)]
    DB_PORT,

    [SettingInfo(DefaultValue = "postgres", DefaultForEnvironment = DefaultSettingForEnvironment.LocalOnly)]
    DB_USER,

    [SettingInfo(DefaultValue = "Abc1234!", DefaultForEnvironment = DefaultSettingForEnvironment.LocalOnly)]
    DB_PASSWORD,

    [SettingInfo(DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
    DB_NAME,

    [SettingInfo(DefaultValue = "true", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
    POSTGRES_INCLUDE_ERROR_DETAIL
}
