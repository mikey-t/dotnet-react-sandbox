using System.Text.Json.Serialization;

namespace WebServer.Model.Auth;

public class Account
{
    public Guid? Id { get; set; }
    public string Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }

    public List<string> Roles { get; set; } = [];

    [JsonIgnore] public string? Password { get; set; }

    public Account(string email, string password, List<string> roles)
    {
        Email = email;
        Password = password;
        Roles = roles;
    }
    
    public Account(string email, string? firstName, string? lastName, string? displayName)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        DisplayName = displayName;
    }
    
    public Account(string email, string firstName, string lastName, string? displayName, string password, List<string> roles)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        DisplayName = displayName;
        Password = password;
        Roles = roles;
    }
    

    // Satisfies Dapper requirement
    public Account()
    {
        Email = string.Empty;
        FirstName = string.Empty;
        LastName = string.Empty;
        DisplayName = string.Empty;
        Password = string.Empty;
    }

    public bool HasRole(string role)
    {
        return Roles.Exists(r => r == role);
    }
    
    public bool HasRole(Role role)
    {
        return HasRole(role.ToString());
    }
}
