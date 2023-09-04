using System.Security.Cryptography;

namespace WebServer.Logic;

public interface IPasswordLogic
{
    string GetPasswordHash(string password);
    bool PasswordIsValid(string password, string hash);
}

public class PasswordLogic : IPasswordLogic
{
    private const int HASH_ITERATIONS = 100000;
    public const string PASSWORD_PARAM_EMPTY_ERROR = "password is required";
    public const string HASH_PARAM_EMPTY_ERROR = "hash is required";

    public string GetPasswordHash(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException(PASSWORD_PARAM_EMPTY_ERROR);
        }

        var salt = RandomNumberGenerator.GetBytes(16);
        var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000);
        var hashBytes = pbkdf2.GetBytes(20);

        var hashWithSaltBytes = new byte[36];
        Array.Copy(salt, 0, hashWithSaltBytes, 0, 16);
        Array.Copy(hashBytes, 0, hashWithSaltBytes, 16, 20);

        return Convert.ToBase64String(hashWithSaltBytes);
    }

    public bool PasswordIsValid(string password, string hash)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException(PASSWORD_PARAM_EMPTY_ERROR);
        }

        if (string.IsNullOrWhiteSpace(hash))
        {
            throw new ArgumentException(HASH_PARAM_EMPTY_ERROR);
        }

        var hashWithSaltBytes = Convert.FromBase64String(hash);

        var saltBytes = new byte[16];
        Array.Copy(hashWithSaltBytes, 0, saltBytes, 0, 16);

        var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, HASH_ITERATIONS);

        var hashBytes = pbkdf2.GetBytes(20);

        for (var i = 0; i < 20; i++)
        {
            if (hashWithSaltBytes[i + 16] != hashBytes[i])
            {
                return false;
            }
        }

        return true;
    }
}
