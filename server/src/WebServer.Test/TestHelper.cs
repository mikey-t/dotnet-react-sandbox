using System;
using System.Threading;
using System.Threading.Tasks;
using WebServer.Data;
using WebServer.Model.Auth;

namespace WebServer.Test;

public static class TestHelper
{
    private static readonly SemaphoreSlim semaphoreSlim = new(1, 1);
    private static readonly SemaphoreSlim semaphoreSlim2 = new(1, 1);

    public static DateTime WithoutMilliseconds(this DateTime dateTime)
    {
        return new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, dateTime.Hour, dateTime.Minute, dateTime.Second, dateTime.Kind);
    }

    public static readonly Account DefaultTestAccount = new(
        "default.testuser@test.com",
        "Default",
        "TestUser",
        "Default TestUser",
        "super_secret",
        [Role.USER.ToString(), Role.SUPER_ADMIN.ToString()]
    );

    public static readonly Account AltTestAccount = new(
        "alt.testuser@test.com",
        "Alt",
        "TestUser",
        "Alt TestUser",
        "super_secret",
        [Role.USER.ToString()]
    );

    public static async Task<CreateTestAccountsResult> EnsureDefaultTestAccounts(AccountRepository accountRepository)
    {
        var defaultAccount = await EnsureDefaultTestAccount(accountRepository, DefaultTestAccount, semaphoreSlim);
        var altAccount = await EnsureDefaultTestAccount(accountRepository, AltTestAccount, semaphoreSlim2);
        return new CreateTestAccountsResult(defaultAccount.Id!.Value, altAccount.Id!.Value);
    }

    private static async Task<Account> EnsureDefaultTestAccount(AccountRepository accountRepository, Account testAccount, SemaphoreSlim semaphore)
    {
        var account = await accountRepository.GetAccountByEmail(testAccount.Email);
        if (account != null)
        {
            return account;
        }

        await semaphoreSlim.WaitAsync();

        try
        {
            account = await accountRepository.GetAccountByEmail(testAccount.Email);

            if (account != null)
            {
                return account;
            }

            account = await accountRepository.AddAccount(testAccount);
            return account;
        }
        finally
        {
            semaphoreSlim.Release();
        }
    }
}

public class CreateTestAccountsResult(Guid defaultId, Guid altId)
{
    public Guid DefaultId { get; } = defaultId;
    public Guid AltId { get; } = altId;
}
