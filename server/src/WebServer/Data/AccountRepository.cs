using Dapper;
using MikeyT.EnvironmentSettingsNS.Interface;
using Npgsql;
using WebServer.Logic;
using WebServer.Model.Auth;

namespace WebServer.Data;

public interface IAccountRepository
{
    Task<Account> AddAccount(Account account);
    Task<Account?> GetAccountById(long id);
    Task<Account?> GetAccountByEmail(string email);
    Task<List<Account>> GetAll();
    Task<Registration> AddRegistration(Registration registration);
    Task<Registration?> GetRegistrationByEmail(string email);
    Task<Registration?> GetRegistrationByVerificationCode(Guid code);
    Task DeleteRegistration(string email);
    Task SetRegistrationEmailCount(string email, int emailCount);
    Task AddRole(long accountId, string role);
    Task RemoveRole(long accountId, string role);
    Task AddToLoginWhitelist(string email);
    Task RemoveFromLoginWhiteList(string email);
    Task<bool> IsOnLoginWhitelist(string email);
    Task<List<string>> GetLoginWhitelist();
}

public class AccountRepository : BaseRepository, IAccountRepository
{
    public AccountRepository(IConnectionStringProvider connectionStringProvider, IEnvironmentSettings environmentSettings) :
        base(connectionStringProvider, environmentSettings)
    {
    }

    public async Task<Account> AddAccount(Account account)
    {
        if (account == null)
        {
            throw new ArgumentNullException(nameof(account));
        }

        if (account.Id != 0)
        {
            throw new Exception("cannot create an account if it already has an id");
        }

        await using var connection = await GetConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        const string insertSql = @"INSERT INTO account (email, first_name, last_name, display_name, password)
            VALUES( @Email, @FirstName, @LastName, @DisplayName, @Password) returning id;";

        long insertId = await connection.ExecuteScalarAsync<int>(insertSql, account, transaction);

        foreach (var role in account.Roles)
        {
            const string insertRoleSql = "insert into account_role (account_id, \"role\") values (@AccountId, @Role)";
            await connection.ExecuteAsync(insertRoleSql, new { AccountId = insertId, Role = role }, transaction);
        }

        await transaction.CommitAsync();

        return (await GetAccountById(insertId))!;
    }

    public async Task<Account?> GetAccountById(long id)
    {
        await using var connection = await GetConnection();
        var account = await connection.QuerySingleOrDefaultAsync<Account?>("select * from account where id = @Id", new { Id = id });

        if (account == null)
        {
            return null;
        }

        account.Roles = (await connection.QueryAsync<string>("select \"role\" from account_role where account_id = @Id", new { Id = id })).ToList();

        return account;
    }

    public async Task<Account?> GetAccountByEmail(string email)
    {
        await using var connection = await GetConnection();
        var account = await connection.QuerySingleOrDefaultAsync<Account?>("select * from account where email = @Email", new { Email = email });
        if (account == null)
        {
            return null;
        }
        account.Roles = (await connection.QueryAsync<string>("select role from account_role where account_id = @AccountId", new {AccountId = account.Id})).ToList();
        return account;
    }

    public async Task<List<Account>> GetAll()
    {
        await using var connection = await GetConnection();
        var accounts = (await connection.QueryAsync<Account>("select * from account")).ToList();

        const string roleSelectSql = "select * from account_role where account_id = any(@AccountIds)";
        var roles = await connection.QueryAsync<AccountRole>(roleSelectSql, new { AccountIds = accounts.Select(a => a.Id).ToList() });

        foreach (var role in roles)
        {
            accounts.First(a => a.Id == role.AccountId).Roles.Add(role.Role);
        }

        return accounts;
    }

    public async Task<Registration> AddRegistration(Registration registration)
    {
        if (registration == null)
        {
            throw new ArgumentNullException(nameof(registration));
        }

        if (string.IsNullOrWhiteSpace(registration.Email))
        {
            throw new Exception("registration email is required");
        }

        await using var connection = await GetConnection();
        const string insertSql = @"INSERT INTO registration (email, first_name, last_name, password, verification_code, created_at)
            VALUES( @Email, @FirstName, @LastName, @Password, @VerificationCode, @CreatedAt);";

        await connection.ExecuteScalarAsync<int>(insertSql, registration);

        return (await GetRegistrationByEmail(registration.Email))!;
    }

    public async Task<Registration?> GetRegistrationByEmail(string email)
    {
        await using var connection = await GetConnection();
        return await connection.QuerySingleOrDefaultAsync<Registration>("select * from registration where email = @Email", new { Email = email });
    }

    public async Task<Registration?> GetRegistrationByVerificationCode(Guid code)
    {
        await using var connection = await GetConnection();
        return await connection.QuerySingleOrDefaultAsync<Registration>("select * from registration where verification_code = @Code", new { Code = code });
    }

    public async Task DeleteRegistration(string email)
    {
        await using var connection = await GetConnection();
        await connection.ExecuteAsync("delete from registration where email = @Email", new { Email = email });
    }

    public async Task SetRegistrationEmailCount(string email, int emailCount)
    {
        var normalizedEmail = EmailLogic.NormalizeEmail(email);
        await using var connection = await GetConnection();
        await connection.ExecuteAsync(
            "update registration set verification_email_count = @EmailCount where email = @Email",
            new { EmailCount = emailCount, Email = normalizedEmail });
    }

    public async Task AddRole(long accountId, string role)
    {
        await using var connection = await GetConnection();
        const string sql = "insert into account_role (account_id, role) values (@AccountId, @Role) on conflict (account_id, role) do nothing";
        await connection.ExecuteAsync(sql, new { AccountId = accountId, Role = role });
    }

    public async Task RemoveRole(long accountId, string role)
    {
        await using var connection = await GetConnection();
        const string sql = "delete from account_role where account_id = @AccountId and role = @Role";
        await connection.ExecuteAsync(sql, new { AccountId = accountId, Role = role });
    }

    public async Task AddToLoginWhitelist(string email)
    {
        await using var connection = await GetConnection();
        var normalizedEmail = EmailLogic.NormalizeEmail(email);
        await connection.ExecuteAsync("insert into login_whitelist (email) values (@Email)", new {Email = normalizedEmail});
    }

    public async Task RemoveFromLoginWhiteList(string email)
    {
        await using var connection = await GetConnection();
        var normalizedEmail = EmailLogic.NormalizeEmail(email);
        await connection.ExecuteAsync("delete from login_whitelist where email = @Email", new {Email = normalizedEmail});
    }

    public async Task<bool> IsOnLoginWhitelist(string email)
    {
        await using var connection = await GetConnection();
        var normalizedEmail = EmailLogic.NormalizeEmail(email);
        var result = await connection.QuerySingleOrDefaultAsync("select email from login_whitelist where email = @Email", new {Email = normalizedEmail});
        return result != null;
    }

    public async Task<List<string>> GetLoginWhitelist()
    {
        await using var connection = await GetConnection();
        var results = await connection.QueryAsync<string>("select email from login_whitelist");
        return results.ToList();
    }
}
