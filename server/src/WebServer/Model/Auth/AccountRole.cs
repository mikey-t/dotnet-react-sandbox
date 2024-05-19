namespace WebServer.Model.Auth;

public class AccountRole
{
    public Guid AccountId { get; set; }
    public string Role { get; set; } = string.Empty;
}
