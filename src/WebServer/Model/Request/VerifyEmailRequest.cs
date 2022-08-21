using System.ComponentModel.DataAnnotations;

namespace WebServer.Model.Request;

public class VerifyEmailRequest
{
    [Required]
    public string Code { get; set; } = null!;
}
