using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MikeyT.EnvironmentSettingsNS.Interface;
using Serilog;
using WebServer.Data;
using ILogger = Serilog.ILogger;

namespace WebServer.Auth;

public class JwtMiddleware
{
    private readonly ILogger _logger;
    private readonly RequestDelegate _next;
    private readonly IEnvironmentSettings _environmentSettings;

    public JwtMiddleware(RequestDelegate next, IEnvironmentSettings environmentSettings, IServiceProvider serviceProvider)
    {
        _logger = Log.ForContext<JwtMiddleware>();
        _next = next;
        _environmentSettings = environmentSettings;
    }

    public async Task Invoke(HttpContext context, IAccountRepository accountRepository)
    {
        var token = context.Request.Cookies[GlobalConstants.TOKEN_HEADER];

        if (token != null)
            await attachUserToContext(context, token, accountRepository);

        await _next(context);
    }

    private async Task attachUserToContext(HttpContext context, string token, IAccountRepository accountRepository)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = Encoding.ASCII.GetBytes(_environmentSettings.GetString(GlobalSettings.JWT_KEY));

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
                ValidateIssuer = false,
                ValidateAudience = false
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var userId = long.Parse(jwtToken.Claims.First(x => x.Type == "sub").Value);

            // Attach user to context on successful jwt validation
            var user = await accountRepository.GetAccountById(userId);
            context.Items[GlobalConstants.CONTEXT_ACCOUNT_KEY] = user;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Error attaching user to context");
            // Do nothing if jwt validation fails.
            // User is not attached to context so request won't have access to secure routes.
        }
    }
}
