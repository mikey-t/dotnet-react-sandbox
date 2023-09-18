using System.ComponentModel.DataAnnotations;

namespace WebServer.Model.Request;

public class GoogleLoginRequest
{
    [Required]
    public string Credential { get; set; } = null!;
}
