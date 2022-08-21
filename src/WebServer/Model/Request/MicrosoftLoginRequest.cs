using System.ComponentModel.DataAnnotations;

namespace WebServer.Model.Request;

public class MicrosoftLoginRequest
{
    [Required]
    public string Code { get; set; } = null!;
}
