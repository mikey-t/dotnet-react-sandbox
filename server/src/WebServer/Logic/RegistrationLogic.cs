using MikeyT.EnvironmentSettingsNS.Interface;
using WebServer.Auth;
using WebServer.Data;
using WebServer.Model.Auth;
using WebServer.Model.Request;

namespace WebServer.Logic;

public interface IRegistrationLogic
{
    Task<RegistrationResult> SignUp(RegistrationRequest req);
    Task<RegistrationResult> VerifyEmail(string code);
    Task<RegistrationResult> ResendVerificationEmail(string email);
}

public class RegistrationResult
{
    public string? ErrorMessage { get; init; }
}

public class RegistrationLogic : IRegistrationLogic
{
    private const int MAX_VERIFICATION_RESEND_COUNT = 5;

    private const string VERIFICATION_EMAIL_SUBJECT = "Verify your email";

    private const string VERIFICATION_EMAIL_TEMPLATE_TEXT =
        "Please verify your email by following this link: https://{0}/verify-email?code={1}";

    private const string VERIFICATION_EMAIL_TEMPLATE_HTML =
        "<html><head></head><body><p>Please verify your email by following this link: <a href=\"https://{0}/verify-email?code={1}\">https://{2}/verify-email?code={3}</a></p></body></html>";

    private readonly ILogger _logger;
    private readonly IAccountRepository _accountRepo;
    private readonly IPasswordLogic _passwordLogicV2;
    private readonly IEmailSender _emailSender;
    private readonly IEnvironmentSettings _envSettings;
    private readonly ILoginLogic _loginLogic;

    public RegistrationLogic(ILogger<RegistrationLogic> logger, IAccountRepository accountRepo, IPasswordLogic passwordLogic, IEmailSender emailSender,
        IEnvironmentSettings envSettings, ILoginLogic loginLogic)
    {
        _logger = logger;
        _accountRepo = accountRepo;
        _passwordLogicV2 = passwordLogic;
        _emailSender = emailSender;
        _envSettings = envSettings;
        _loginLogic = loginLogic;
    }

    public async Task<RegistrationResult> SignUp(RegistrationRequest req)
    {
        var email = EmailLogic.NormalizeEmail(req.Email);

        if (!await _loginLogic.IsWhitelisted(email))
        {
            throw new ThirdPartyLoginException("Email is not on the approved list");
        }

        // Check if account already exists
        var existingAccount = await _accountRepo.GetAccountByEmail(email);
        if (existingAccount != null)
        {
            return new RegistrationResult { ErrorMessage = "This email is already in use" };
        }

        // Check if registration already exists
        var existingRegistration = await _accountRepo.GetRegistrationByEmail(email);
        if (existingRegistration != null)
        {
            return new RegistrationResult { ErrorMessage = "This email is already registered - please confirm your email" };
        }

        var registration = await _accountRepo.AddRegistration(new Registration
        {
            Email = email,
            Password = _passwordLogicV2.GetPasswordHash(req.Password),
            FirstName = req.FirstName,
            LastName = req.LastName,
            VerificationCode = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        });

        try
        {
            await _emailSender.SendMail(
                registration.Email,
                VERIFICATION_EMAIL_SUBJECT,
                GetVerificationEmailBodyText(registration.VerificationCode),
                GetVerificationEmailBodyHtml(registration.VerificationCode));
            await _accountRepo.SetRegistrationEmailCount(registration.Email, 1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending verification email for {Email}", registration.Email);
            return new RegistrationResult { ErrorMessage = "Error sending verification email" };
        }

        return new RegistrationResult();
    }

    public async Task<RegistrationResult> VerifyEmail(string code)
    {
        var registration = await _accountRepo.GetRegistrationByVerificationCode(Guid.Parse(code));

        if (registration == null)
        {
            return new RegistrationResult { ErrorMessage = "No pending verifications found" };
        }

        var account = new Account(registration.Email, registration.FirstName, registration.LastName, null, registration.Password,
            new List<string> { Roles.USER });

        await _accountRepo.AddAccount(account);

        await _accountRepo.DeleteRegistration(account.Email);

        return new RegistrationResult();
    }

    public async Task<RegistrationResult> ResendVerificationEmail(string emailFromRequest)
    {
        var email = EmailLogic.NormalizeEmail(emailFromRequest);

        var registration = await _accountRepo.GetRegistrationByEmail(email);

        if (registration == null)
        {
            _logger.LogInformation("Attempt to re-send verification email with no registration record for email {Email}", email);
            return new RegistrationResult();
        }

        if (registration.VerificationEmailCount > MAX_VERIFICATION_RESEND_COUNT)
        {
            _logger.LogInformation("Max verification re-send attempts for email {Email}", email);
            return new RegistrationResult();
        }

        try
        {
            await _emailSender.SendMail(
                registration.Email,
                VERIFICATION_EMAIL_SUBJECT,
                GetVerificationEmailBodyText(registration.VerificationCode),
                GetVerificationEmailBodyHtml(registration.VerificationCode));
            await _accountRepo.SetRegistrationEmailCount(registration.Email, 1);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error re-sending verification email for {Email}", registration.Email);
            return new RegistrationResult { ErrorMessage = "Error sending verification email" };
        }

        await _accountRepo.SetRegistrationEmailCount(email, registration.VerificationEmailCount + 1);

        return new RegistrationResult();
    }

    private string GetVerificationEmailBodyText(Guid code)
    {
        var domain = GetDomainString();
        return string.Format(VERIFICATION_EMAIL_TEMPLATE_TEXT, domain, code);
    }

    private string GetVerificationEmailBodyHtml(Guid code)
    {
        var domain = GetDomainString();
        return string.Format(VERIFICATION_EMAIL_TEMPLATE_HTML, domain, code, domain, code);
    }

    private string GetDomainString()
    {
        var domain = _envSettings.GetString(GlobalSettings.SITE_URL);
        var devClientPort = _envSettings.GetString(GlobalSettings.DEV_CLIENT_PORT);
        if (!string.IsNullOrEmpty(devClientPort))
        {
            domain = $"{domain}:{devClientPort}";
        }
        return domain;
    }
}
