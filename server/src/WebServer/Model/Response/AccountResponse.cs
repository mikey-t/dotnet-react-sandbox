using WebServer.Model.Auth;

namespace WebServer.Model.Response;

public class AccountResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string? DisplayName { get; set; }
    public List<string> Roles { get; set; }

    public AccountResponse(Guid id, string email, string? displayName, List<string> roles)
    {
        Id = id;
        Email = email;
        DisplayName = displayName;
        Roles = roles;
    }
    
    public static AccountResponse FromAccount(Account account)
    {
        Guid id = account.Id ?? Guid.Empty;
        return new AccountResponse(id, account.Email, account.DisplayName, account.Roles);
    }
}
