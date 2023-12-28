using MikeyT.EnvironmentSettingsNS.Attributes;
using MikeyT.EnvironmentSettingsNS.Enums;

namespace WebServer
{
    public enum GlobalSettings
    {
        [SettingInfo(ShouldLogValue = true)]
        ASPNETCORE_ENVIRONMENT,

        [SettingInfo(ShouldLogValue = true)]
        SITE_URL,

        [SettingInfo(DefaultValue = "localhost", DefaultForEnvironment = DefaultSettingForEnvironment.LocalOnly, ShouldLogValue = true)]
        DB_HOST,

        [SettingInfo(DefaultValue = "5432", DefaultForEnvironment = DefaultSettingForEnvironment.LocalOnly, ShouldLogValue = true)]
        DB_PORT,

        [SettingInfo(DefaultValue = "drs", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        DB_NAME,

        [SettingInfo(DefaultValue = "test_drs", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        DB_NAME_TEST,

        [SettingInfo(DefaultValue = "drs.mikeyt.net", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        JWT_ISSUER,

        [SettingInfo(DefaultValue = "false", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        POSTGRES_INCLUDE_ERROR_DETAIL,

        [SettingInfo(DefaultValue = "false", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        DISABLE_XSRF,

        [SettingInfo(ShouldLogValue = true)]
        GOOGLE_API_CLIENT_ID,

        [SettingInfo(DefaultValue = "-1", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        PRE_DEPLOY_HTTP_PORT,

        [SettingInfo(DefaultValue = "-1", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments, ShouldLogValue = true)]
        PRE_DEPLOY_HTTPS_PORT,

        [SettingInfo(ShouldLogValue = true)]
        DEV_SERVER_PORT,

        [SettingInfo(ShouldLogValue = true)]
        DEV_CLIENT_PORT,

        [SettingInfo(ShouldLogValue = true, DefaultValue = "false", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments)]
        EMAIL_SENDING_ENABLED,

        [SettingInfo(ShouldLogValue = true, DefaultValue = "false", DefaultForEnvironment = DefaultSettingForEnvironment.AllEnvironments)]
        EXTERNAL_LOGINS_ENABLED,

        // *********
        // Secrets *
        // *********

        [SettingInfo(SettingType = SettingType.Secret)]
        DB_USER,

        [SettingInfo(SettingType = SettingType.Secret)]
        DB_PASSWORD,

        [SettingInfo(SettingType = SettingType.Secret)]
        JWT_KEY,

        [SettingInfo(SettingType = SettingType.Secret)]
        SUPER_ADMIN_EMAIL,

        [SettingInfo(SettingType = SettingType.Secret)]
        SUPER_ADMIN_PASSWORD,

        [SettingInfo(SettingType = SettingType.Secret)]
        GOOGLE_API_SECRET,

        [SettingInfo(SettingType = SettingType.Secret)]
        AWS_SES_USERNAME,

        [SettingInfo(SettingType = SettingType.Secret)]
        AWS_SES_PASSWORD,

        [SettingInfo(SettingType = SettingType.Secret)]
        DB_ROOT_USER,

        [SettingInfo(SettingType = SettingType.Secret)]
        DB_ROOT_PASSWORD
    }
}
