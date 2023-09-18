namespace WebServer.Model.Auth;

public class Registration
{
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public Guid VerificationCode { get; init; }
    public DateTime CreatedAt { get; set; }
    public int VerificationEmailCount { get; set; }
}
