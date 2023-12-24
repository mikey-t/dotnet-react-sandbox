using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MikeyT.EnvironmentSettingsNS.Interface;
using WebServer.Auth;
using WebServer.Logic;
using WebServer.Model.Request;
using WebServer.Model.Response;

namespace WebServer.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly ILogger<AccountController> _logger;
    private readonly IEnvironmentSettings _environmentSettings;
    private readonly ILoginLogic _loginLogic;
    private readonly IRegistrationLogic _registrationLogic;

    public AccountController(ILogger<AccountController> logger, IEnvironmentSettings environmentSettings,
        ILoginLogic loginLogic, IRegistrationLogic registrationLogic)
    {
        _logger = logger;
        _environmentSettings = environmentSettings;
        _loginLogic = loginLogic;
        _registrationLogic = registrationLogic;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
    [ProducesResponseType(typeof(AccountResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
    {
        var loginResult = await _loginLogic.GetLoginResult(loginRequest);
        if (loginResult == null)
        {
            return Unauthorized();
        }

        Response.Cookies.Append(GlobalConstants.TOKEN_HEADER, loginResult.JwtString, new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Ok(AccountResponse.FromAccount(loginResult.Account));
    }

    [AllowAnonymous]
    [HttpPost("login-google")]
    [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
    [ProducesResponseType(typeof(AccountResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> LoginGoogle([FromBody] GoogleLoginRequest request)
    {
        LoginResult loginResult;
        try
        {
            loginResult = await _loginLogic.GetGoogleLoginResult(request);
        }
        catch (ThirdPartyLoginException ex)
        {
            return Unauthorized(ex.Message);
        }

        Response.Cookies.Append(GlobalConstants.TOKEN_HEADER, loginResult.JwtString, new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Ok(AccountResponse.FromAccount(loginResult.Account));
    }

    [AllowAnonymous]
    [HttpPost("login-microsoft")]
    [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
    [ProducesResponseType(typeof(AccountResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> LoginMicrosoft([FromBody] MicrosoftLoginRequest request)
    {
        LoginResult loginResult;
        try
        {
            loginResult = await _loginLogic.GetMicrosoftLoginResult(request);
        }
        catch (ThirdPartyLoginException ex)
        {
            return Unauthorized(ex.Message);
        }

        Response.Cookies.Append(GlobalConstants.TOKEN_HEADER, loginResult.JwtString, new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Secure = true,
            SameSite = SameSiteMode.Strict
        });

        return Ok(AccountResponse.FromAccount(loginResult.Account));
    }

    [AllowAnonymous]
    [HttpGet("microsoft-login-redirect")]
    public IActionResult MicrosoftLoginRedirect()
    {
        // MSAL docs explain that the only supported responseMode is "fragment" and fragments are not sent to the server, so we're doing nothing here.
        // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#why-is-fragment-the-only-valid-field-for-responsemode-in-msal-browser
        return Ok();
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(GlobalConstants.TOKEN_HEADER);
        return Ok();
    }

    [HttpGet("me")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(AccountResponse), (int)HttpStatusCode.OK)]
    public IActionResult Me()
    {
        var account = HttpContext.Account();

        if (account == null)
        {
            // We don't throw an error code because checking for the user happens on every page load.
            // Return an empty 200, which just means "you're not logged in".
            return Ok();
        }

        return Ok(AccountResponse.FromAccount(account));
    }

    [HttpPost("register")]
    [ProducesResponseType((int)HttpStatusCode.Conflict)]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> Register([FromBody] RegistrationRequest request)
    {
        var result = await _registrationLogic.Register(request);

        if (result.ErrorMessage != null)
        {
            return Conflict(result.ErrorMessage);
        }

        return Ok();
    }

    [HttpPost("verify-email")]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var result = await _registrationLogic.VerifyEmail(request.Code);

        if (result.ErrorMessage != null)
        {
            return BadRequest(result.ErrorMessage);
        }

        return Ok();
    }

    [HttpPost("resend-verification-email")]
    [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationEmailRequest request)
    {
        var result = await _registrationLogic.ResendVerificationEmail(request.Email);

        if (result.ErrorMessage != null)
        {
            return StatusCode(500, result.ErrorMessage);
        }

        return Ok();
    }
}
