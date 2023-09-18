using System.ComponentModel.DataAnnotations;

namespace WebServer.Model.Request;

public class LoginRequest
{
    public const string ERROR_EMAIL_REQUIRED = "email is required";
    public const string ERROR_PASSWORD_REQUIRED = "password is required";

    [MinLength(1, ErrorMessage = ERROR_EMAIL_REQUIRED)]
    [EmailAddress(ErrorMessage = "invalid email address")]
    public string Email { get; set; } = string.Empty;

    [MinLength(1, ErrorMessage = ERROR_PASSWORD_REQUIRED)]
    public string Password { get; set; } = string.Empty;
}
