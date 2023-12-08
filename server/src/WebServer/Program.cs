using System.Security.Cryptography.X509Certificates;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MikeyT.EnvironmentSettingsNS.Interface;
using MikeyT.EnvironmentSettingsNS.Logic;
using Serilog;
using WebServer;
using WebServer.Auth;
using WebServer.Data;
using WebServer.Logic;

DotEnv.Load();

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

Log.Logger.Information("Starting up");

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, lc) => lc
        .WriteTo.Console()
        .ReadFrom.Configuration(ctx.Configuration));

    // Add services to the container
    var envSettings = new EnvironmentSettings(new DefaultEnvironmentVariableProvider(), new DefaultSecretVariableProvider());
    envSettings.AddSettings<GlobalSettings>();
    Log.Logger.Information("Loaded environment settings\n{EnvironmentSettings}", envSettings.GetAllAsSafeLogString());

    // The env var PRE_DEPLOY_HTTP_PORT indicates the server was started with the runBuilt option for testing locally in a single combined package
    var preDeployPort = envSettings.GetInt(GlobalSettings.PRE_DEPLOY_HTTP_PORT);
    if (preDeployPort > 0)
    {
        var siteUrl = envSettings.GetString(GlobalSettings.SITE_URL);
        var httpPort = envSettings.GetInt(GlobalSettings.PRE_DEPLOY_HTTP_PORT);
        var httpsPort = envSettings.GetInt(GlobalSettings.PRE_DEPLOY_HTTPS_PORT);

        var httpUrl = $"http://{siteUrl}:{httpPort}";
        var httpsUrl = $"https://{siteUrl}:{httpsPort}";

        builder.WebHost
            .UseUrls(httpUrl, httpsUrl)
            .ConfigureKestrel(kestrelOptions =>
            {
                kestrelOptions.ConfigureHttpsDefaults(httpsOptions =>
                {
                    httpsOptions.ServerCertificate = new X509Certificate2(siteUrl + ".pfx");
                    httpsOptions.AllowAnyClientCertificate();
                });
            });

        Log.Logger.Information("Site URL: {HttpsUrl}", httpsUrl);
    }

    if (envSettings.IsLocal())
    {
        builder.WebHost.UseUrls($"https://localhost:{envSettings.GetInt(GlobalSettings.DEV_SERVER_PORT)}");
    }

    DefaultTypeMap.MatchNamesWithUnderscores = true;
    SqlMapper.AddTypeHandler(new DateTimeHandler());

    builder.Services.AddSingleton<IEnvironmentSettings>(envSettings);
    builder.Services.AddSingleton<IConnectionStringProvider, ConnectionStringProvider>();
    builder.Services.AddSingleton<IPasswordLogicV2>(new PasswordLogicV2());
#pragma warning disable 0618
    builder.Services.AddSingleton<IPasswordLogicV1>(new PasswordLogicV1());
#pragma warning restore 0618
    builder.Services.AddScoped<IAccountRepository, AccountRepository>();
    builder.Services.AddScoped<ILoginLogic, LoginLogic>();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentAccountProvider, CurrentAccountProvider>();
    builder.Services.AddScoped<IGoogleLoginWrapper, GoogleLoginWrapper>();
    builder.Services.AddScoped<IRegistrationLogic, RegistrationLogic>();
    builder.Services.AddScoped<IEmailSender, AwsSimpleEmailSender>();

    var loginLogic = LoginLogic.FromEnvSettingsOnly(envSettings);
    await loginLogic.SeedSuperAdmin();

    builder.Services.AddControllers();
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options => { options.ResolveConflictingActions(apiDesc => apiDesc.First()); });

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = envSettings.GetString(GlobalSettings.JWT_ISSUER),
                ValidAudience = envSettings.GetString(GlobalSettings.JWT_ISSUER),
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(envSettings.GetString(GlobalSettings.JWT_KEY)))
            };
        });

    var app = builder.Build();

    // This doesn't restrict access to the same routes without the prefix... have to rely on "/api" on
    // all controllers or use the app.map([url], [callback with the rest of app setup]) method.
    // app.UsePathBase("/api");

    app.UseSerilogRequestLogging();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
            options.RoutePrefix = "api";
        });
    }

    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseRouting();

    if (!envSettings.GetBool(GlobalSettings.DISABLE_XSRF))
    {
        app.UseMiddleware<ApiAntiCsrfMiddleware>();
    }

    app.UseMiddleware<JwtMiddleware>();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.MapFallbackToFile("index.html");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Unhandled exception");

    var color = Console.ForegroundColor;
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine(ex);
    Console.ForegroundColor = color;
}
finally
{
    Log.Logger.Information("Shutdown complete");
    Log.CloseAndFlush();
}
