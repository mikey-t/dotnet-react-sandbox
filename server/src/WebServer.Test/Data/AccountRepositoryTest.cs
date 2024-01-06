using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using FluentAssertions;
using Npgsql;
using WebServer.Data;
using WebServer.Model.Auth;
using Xunit;

namespace WebServer.Test.Data;

public class AccountRepositoryTest : BaseRepositoryTest
{
    private readonly AccountRepository _accountRepo;

    public AccountRepositoryTest()
    {
        _accountRepo = new AccountRepository(NpgsqlDataSource.Create(ConnectionString));
    }

    [Fact]
    public async Task AccountRepository_BasicCrudTest()
    {
        await DeleteAllAccounts();
        await TestHelper.EnsureDefaultTestAccounts(_accountRepo);

        var allAccounts = await _accountRepo.GetAll();

        allAccounts.Should().HaveCount(2);

        var johnDoeAccount = new Account
        (
            "john.doe@test.com",
            "John",
            "Doe",
            "john_doe_42",
            "super_secret",
            new List<string> { Role.USER.ToString(), Role.SUPER_ADMIN.ToString() }
        );

        const string janePassword = "jane_password";

        var janeDoeAccount = new Account
        (
            "jane.dow@test.com",
            "Jane",
            "Doe",
            "jane_doe_43",
            janePassword,
            new List<string> { Role.USER.ToString() }
        );

        var johnDoeSavedAccount = await _accountRepo.AddAccount(johnDoeAccount);
        var JaneDoeSavedAccount = await _accountRepo.AddAccount(janeDoeAccount);

        johnDoeSavedAccount.Should().NotBeNull();
        johnDoeSavedAccount.Id.Should().BeGreaterThan(0);
        johnDoeSavedAccount.Roles.Should().NotBeNull();
        johnDoeSavedAccount.Roles.Should().Contain(new List<string> { Role.USER.ToString(), Role.SUPER_ADMIN.ToString() });

        JaneDoeSavedAccount.Should().NotBeNull();
        JaneDoeSavedAccount.Id.Should().BeGreaterThan(0);
        JaneDoeSavedAccount.Roles.Should().NotBeNull();
        JaneDoeSavedAccount.Roles.Should().Contain(new List<string> { Role.USER.ToString() });
        JaneDoeSavedAccount.Roles.Should().NotContain(new List<string> { Role.SUPER_ADMIN.ToString() });

        allAccounts = await _accountRepo.GetAll();
        allAccounts.Should().HaveCount(4);

        var janeAccountFromEmailAndPassword = await _accountRepo.GetAccountByEmail(janeDoeAccount.Email);
        janeAccountFromEmailAndPassword.Should().NotBeNull();
    }

    [Fact]
    public async Task AddAccount_DuplicateEmail_Throws()
    {
        var account = GetTestAccount();
        await DeleteAccount(account.Email, _accountRepo);

        await _accountRepo.AddAccount(account);

        Func<Task> act = async () => { await _accountRepo.AddAccount(account); };
        await act.Should().ThrowAsync<Exception>().WithMessage("*duplicate*");
    }

    [Fact]
    public async Task AddAccount_DuplicateEmailDifferentCase_Throws()
    {
        var account = GetTestAccount();
        await DeleteAccount(account.Email, _accountRepo);

        await _accountRepo.AddAccount(account);

        account.Email = account.Email.ToUpper();

        Func<Task> act = async () => { await _accountRepo.AddAccount(account); };
        await act.Should().ThrowAsync<Exception>().WithMessage("*duplicate*");
    }

    [Fact]
    public async Task BasicRegistrationCrudTest()
    {
        await DeleteAllRegistrations();

        var registration = GetTestRegistration();

        var savedRegistration = await _accountRepo.AddRegistration(registration);

        savedRegistration.Should().BeEquivalentTo(registration);

        var retrievedRegistration = await _accountRepo.GetRegistrationByEmail(registration.Email);

        retrievedRegistration.Should().BeEquivalentTo(registration);

        retrievedRegistration = await _accountRepo.GetRegistrationByVerificationCode(registration.VerificationCode);

        retrievedRegistration.Should().BeEquivalentTo(registration);

        await _accountRepo.DeleteRegistration(registration.Email);

        retrievedRegistration = await _accountRepo.GetRegistrationByEmail(registration.Email);

        retrievedRegistration.Should().BeNull();
    }

    [Fact]
    public async Task SetRegistrationEmailCount_UpdatesCount()
    {
        await DeleteAllRegistrations();

        var registration = GetTestRegistration();

        var savedRegistration = await _accountRepo.AddRegistration(registration);

        savedRegistration.Should().NotBeNull();
        savedRegistration.VerificationEmailCount.Should().Be(0);

        await _accountRepo.SetRegistrationEmailCount(registration.Email, 1);

        savedRegistration = await _accountRepo.GetRegistrationByEmail(registration.Email);

        savedRegistration.Should().NotBeNull();
        savedRegistration!.VerificationEmailCount.Should().Be(1);
    }

    private static Account GetTestAccount()
    {
        return new Account
        {
            Email = "john.doe@test.com",
            FirstName = "John",
            LastName = "Doe",
            DisplayName = "John Doe",
            Password = "super_secret",
            Roles = [Role.USER.ToString()]
        };
    }

    private static Registration GetTestRegistration()
    {
        return new Registration
        {
            Email = "test@test.com",
            FirstName = "John",
            LastName = "Doe",
            Password = "super_secret",
            VerificationCode = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow.WithoutMilliseconds()
        };
    }

    private async Task DeleteAllAccounts()
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.ExecuteAsync("delete from account_role");
        // Don't delete default test user to avoid foreign key constraint errors
        await connection.ExecuteAsync("delete from account where email != @Email", new { TestHelper.DefaultTestAccount.Email });
    }

    private async Task DeleteAccount(string email, IAccountRepository accountRepo)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        var account = await accountRepo.GetAccountByEmail(email);
        if (account == null)
        {
            return;
        }

        const string deleteRolesSql = "delete from account_role where account_id = @AccountId";
        await connection.ExecuteAsync(deleteRolesSql, new { AccountId = account.Id });

        const string deleteAccountSql = "delete from account where id = @Id";
        await connection.ExecuteAsync(deleteAccountSql, new { Id = account.Id });
    }

    private async Task DeleteAllRegistrations()
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.ExecuteAsync("delete from registration");
    }
}
