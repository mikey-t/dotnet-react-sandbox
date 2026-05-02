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
    private const int SALT_SIZE = 16; // Size in bytes
    private const int HASH_SIZE = 32; // Size in bytes
    public const string PASSWORD_PARAM_EMPTY_ERROR = "password is required";
    public const string HASH_PARAM_EMPTY_ERROR = "hash is required";

    public string GetPasswordHash(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException(PASSWORD_PARAM_EMPTY_ERROR);
        }

        var saltBytes = RandomNumberGenerator.GetBytes(SALT_SIZE);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, HASH_ITERATIONS, HashAlgorithmName.SHA256, HASH_SIZE);

        var hashWithSaltBytes = new byte[SALT_SIZE + HASH_SIZE];
        Array.Copy(saltBytes, 0, hashWithSaltBytes, 0, SALT_SIZE);
        Array.Copy(hashBytes, 0, hashWithSaltBytes, SALT_SIZE, HASH_SIZE);

        return Convert.ToBase64String(hashWithSaltBytes);
    }

    public bool PasswordIsValid(string password, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException(PASSWORD_PARAM_EMPTY_ERROR);
        }

        if (string.IsNullOrWhiteSpace(storedHash))
        {
            throw new ArgumentException(HASH_PARAM_EMPTY_ERROR);
        }

        var hashWithSaltBytes = Convert.FromBase64String(storedHash);
        var saltBytes = new byte[SALT_SIZE];
        Array.Copy(hashWithSaltBytes, 0, saltBytes, 0, SALT_SIZE);

        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, HASH_ITERATIONS, HashAlgorithmName.SHA256, HASH_SIZE);

        if (hashWithSaltBytes.Length != SALT_SIZE + HASH_SIZE)
        {
            return false;
        }

        byte[] storedHashBytes = new byte[HASH_SIZE];
        Array.Copy(hashWithSaltBytes, SALT_SIZE, storedHashBytes, 0, HASH_SIZE);

        return CryptographicOperations.FixedTimeEquals(storedHashBytes, hashBytes);
    }
}
