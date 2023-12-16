using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using MikeyT.EnvironmentSettingsNS.Interface;
using Serilog;
using WebServer.Auth;
using WebServer.Data;
using WebServer.Model.Auth;
using WebServer.Model.Request;

namespace WebServer.Logic;

public interface ILoginLogic
{
    Task<LoginResult?> GetLoginResult(LoginRequest loginRequest);
    Task<LoginResult> GetGoogleLoginResult(GoogleLoginRequest loginRequest);
    Task<LoginResult> GetMicrosoftLoginResult(MicrosoftLoginRequest loginRequest);
    Task SeedSuperAdmin();
    Task<bool> IsWhitelisted(string email);
}

public class LoginResult
{
    public Account Account { get; }
    public string JwtString { get; }

    public LoginResult(Account account, string jwtString)
    {
        Account = account;
        JwtString = jwtString;
    }
}

public class LoginLogic : ILoginLogic
{
    private readonly Serilog.ILogger _logger;
    private readonly IEnvironmentSettings _environmentSettings;
    private readonly IAccountRepository _accountRepository;
    private readonly IPasswordLogic _passwordLogicV2;
    private readonly IGoogleLoginWrapper _googleLoginWrapper;

    public LoginLogic(
        Serilog.ILogger logger,
        IEnvironmentSettings environmentSettings,
        IAccountRepository accountRepository,
        IPasswordLogic passwordLogicV2,
        IGoogleLoginWrapper googleLoginWrapper)
    {
        _logger = logger;
        _environmentSettings = environmentSettings;
        _accountRepository = accountRepository;
        _passwordLogicV2 = passwordLogicV2;
        _googleLoginWrapper = googleLoginWrapper;
    }

    public static LoginLogic FromEnvSettingsOnly(IEnvironmentSettings envSettings)
    {
        return new LoginLogic(
            Log.ForContext<LoginLogic>(),
            envSettings,
            new AccountRepository(new ConnectionStringProvider(envSettings), envSettings),
            new PasswordLogic(),
            new GoogleLoginWrapper());
    }

    public async Task<LoginResult?> GetLoginResult(LoginRequest loginRequest)
    {
        var account = await GetAccountIfExistsAndCorrectPassword(loginRequest);
        if (account == null)
        {
            return null;
        }

        var jwtString = GenerateJwtString(account);
        return new LoginResult(account, jwtString);
    }

    public async Task<LoginResult> GetGoogleLoginResult(GoogleLoginRequest loginRequest)
    {
        GoogleJwtResponse? googleJwtResponse;

        try
        {
            googleJwtResponse = await _googleLoginWrapper.GetGoogleJwtResponse(loginRequest.Credential);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Google Jwt login exception caught for Jwt: {Jwt}", loginRequest.Credential);
            throw new ThirdPartyLoginException("Google was not able to process the login request");
        }

        if (googleJwtResponse == null)
        {
            _logger.Error("Google Jwt login response was null for Jwt: {Jwt}", loginRequest.Credential);
            throw new ThirdPartyLoginException("Google was not able to process the login request");
        }

        if (!googleJwtResponse.EmailVerified)
        {
            _logger.Error("Rejecting Google login attempt for unverified email: {Email}", googleJwtResponse.Email);
            throw new ThirdPartyLoginException("Google login requires a verified email address");
        }

        var normalizedEmail = EmailLogic.NormalizeEmail(googleJwtResponse.Email);

        if (!await IsWhitelisted(normalizedEmail))
        {
            throw new ThirdPartyLoginException("Email is not on the approved list");
        }

        var account = await _accountRepository.GetAccountByEmail(normalizedEmail);

        if (account == null)
        {
            var newAccount = new Account(normalizedEmail, googleJwtResponse.GivenName, googleJwtResponse.FamilyName, null);
            newAccount.Roles.Add(Roles.USER);
            account = await _accountRepository.AddAccount(newAccount);
        }

        var jwtString = GenerateJwtString(account);
        return new LoginResult(account, jwtString);
    }

    public async Task<LoginResult> GetMicrosoftLoginResult(MicrosoftLoginRequest loginRequest)
    {
        var configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
            new OpenIdConnectConfigurationRetriever());
        var config = await configManager.GetConfigurationAsync();
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            IssuerSigningKeys = config.SigningKeys,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = false
        };

        SecurityToken validatedToken;
        try
        {
            tokenHandler.ValidateToken(loginRequest.Code, validationParameters, out validatedToken);
        }
        catch (Exception ex)
        {
            const string message = "Error validating Microsoft login token";
            _logger.Error(ex, message);
            throw new ThirdPartyLoginException(message);
        }

        var email = ((JwtSecurityToken)validatedToken).Claims.FirstOrDefault(x => x.Type == "email")?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            const string message = "Microsoft token does not contain email claim";
            _logger.Error(message);
            throw new ThirdPartyLoginException(message);
        }

        var normalizedEmail = EmailLogic.NormalizeEmail(email);

        if (!await IsWhitelisted(normalizedEmail))
        {
            throw new ThirdPartyLoginException("Email is not on the approved list");
        }

        var account = await _accountRepository.GetAccountByEmail(normalizedEmail);

        if (account == null)
        {
            var newAccount = new Account(normalizedEmail, null, null, null);
            newAccount.Roles.Add(Roles.USER);
            account = await _accountRepository.AddAccount(newAccount);
        }

        var jwtString = GenerateJwtString(account);
        return new LoginResult(account, jwtString);
    }

    public async Task SeedSuperAdmin()
    {
        var normalizedEmail = EmailLogic.NormalizeEmail(_environmentSettings.GetString(GlobalSettings.SUPER_ADMIN_EMAIL));
        var password = _environmentSettings.GetString(GlobalSettings.SUPER_ADMIN_PASSWORD);

        var existingAccount = await _accountRepository.GetAccountByEmail(normalizedEmail);

        if (existingAccount != null) return;

        _logger.Information("super admin account does not exist - attempting to seed");

        var hashedPassword = _passwordLogicV2.GetPasswordHash(password);
        await _accountRepository.AddAccount(new Account(normalizedEmail, hashedPassword, new List<string> { Role.USER.ToString(), Role.SUPER_ADMIN.ToString() }));

        _logger.Information("seeded admin account");
    }

    private async Task<Account?> GetAccountIfExistsAndCorrectPassword(LoginRequest loginRequest)
    {
        var normalizedEmail = EmailLogic.NormalizeEmail(loginRequest.Email);

        if (!await IsWhitelisted(normalizedEmail))
        {
            return null;
        }

        var account = await _accountRepository.GetAccountByEmail(normalizedEmail);

        if (account == null)
        {
            _logger.Warning("account does not exist for email {Email}", normalizedEmail);
            return null;
        }

        if (!_passwordLogicV2.PasswordIsValid(loginRequest.Password, account.Password ?? ""))
        {
            _logger.Warning("account exists for email {Email} but password is invalid", normalizedEmail);
            return null;
        }

        return account;
    }

    private string GenerateJwtString(Account account)
    {
        var jwtIssuer = _environmentSettings.GetString(GlobalSettings.JWT_ISSUER);
        var jwtKey = _environmentSettings.GetString(GlobalSettings.JWT_KEY);

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, account.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, account.Email),
            new("role", Roles.ADMIN),
            new("role", Roles.USER)
        };

        claims.AddRange(account.Roles.Select(role => new Claim("role", role)));

        var token = new JwtSecurityToken(jwtIssuer,
            jwtIssuer,
            claims.ToArray(),
            expires: DateTime.UtcNow.AddDays(10),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<bool> IsWhitelisted(string email)
    {
        var normalizedEmail = EmailLogic.NormalizeEmail(email);

        var existingAccount = await _accountRepository.GetAccountByEmail(normalizedEmail);
        if (existingAccount != null && existingAccount.HasRole(Role.SUPER_ADMIN))
        {
            return true;
        }

        return await _accountRepository.IsOnLoginWhitelist(normalizedEmail);
    }
}

public class ThirdPartyLoginException : Exception
{
    public ThirdPartyLoginException()
    {
    }

    public ThirdPartyLoginException(string message) : base(message)
    {
    }

    public ThirdPartyLoginException(string message, Exception inner) : base(message, inner)
    {
    }
}
