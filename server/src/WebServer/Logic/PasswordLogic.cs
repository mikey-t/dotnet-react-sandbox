using System.Security.Cryptography;

namespace WebServer.Logic;

public interface IPasswordLogicV1
{
    string GetPasswordHash(string password);
    bool PasswordIsValid(string password, string hash);
}

public interface IPasswordLogicV2
{
    string GetPasswordHash(string password);
    bool PasswordIsValid(string password, string hash);
}

public class PasswordLogicV2 : IPasswordLogicV2
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

        var salt = RandomNumberGenerator.GetBytes(SALT_SIZE);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, HASH_ITERATIONS, HashAlgorithmName.SHA256);
        var hashBytes = pbkdf2.GetBytes(HASH_SIZE);

        var hashWithSaltBytes = new byte[SALT_SIZE + HASH_SIZE];
        Array.Copy(salt, 0, hashWithSaltBytes, 0, SALT_SIZE);
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

        using var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, HASH_ITERATIONS, HashAlgorithmName.SHA256);
        var hashBytes = pbkdf2.GetBytes(HASH_SIZE);

        if (hashWithSaltBytes.Length != SALT_SIZE + HASH_SIZE)
        {
            return false;
        }

        byte[] storedHashBytes = new byte[HASH_SIZE];
        Array.Copy(hashWithSaltBytes, SALT_SIZE, storedHashBytes, 0, HASH_SIZE);

        return CryptographicOperations.FixedTimeEquals(storedHashBytes, hashBytes);
    }

}

[Obsolete("Use PasswordLogicV2. This can be deleted once all users have their hash converted to V2.")]
public class PasswordLogicV1 : IPasswordLogicV1
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
#pragma warning disable SYSLIB0041 // Type or member is obsolete
        var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000);
#pragma warning restore SYSLIB0041 // Type or member is obsolete
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

#pragma warning disable SYSLIB0041 // Type or member is obsolete
        var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, HASH_ITERATIONS);
#pragma warning restore SYSLIB0041 // Type or member is obsolete

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
