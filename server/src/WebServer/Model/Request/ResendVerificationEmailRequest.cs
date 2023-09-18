using System.ComponentModel.DataAnnotations;

namespace WebServer.Model.Request;

public class ResendVerificationEmailRequest
{
    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    public string Email { get; set; } = null!;
}
