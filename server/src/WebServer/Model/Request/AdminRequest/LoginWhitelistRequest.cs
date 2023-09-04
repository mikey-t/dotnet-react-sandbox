using System.ComponentModel.DataAnnotations;

namespace WebServer.Model.Request.AdminRequest;

public class LoginWhitelistRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
