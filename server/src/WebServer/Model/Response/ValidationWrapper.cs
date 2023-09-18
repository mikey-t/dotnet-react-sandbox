using Microsoft.AspNetCore.Mvc;

namespace WebServer.Model.Response;

public class ValidationWrapper
{
    private readonly Dictionary<string, List<string>> errors;
    
    public ValidationWrapper()
    {
        errors = new Dictionary<string, List<string>>();
    }

    public void Add(string key, string message)
    {
        if (!errors.ContainsKey(key))
        {
            errors.Add(key, new List<string>());
        }
        
        errors[key].Add(message);
    }

    public bool HasErrors()
    {
        return errors.Count > 0;
    }

    public ValidationProblemDetails GetValidationProblemDetails()
    {
        var convertedErrors = errors.Keys.ToDictionary(key => key, key => errors[key].ToArray());
        return new ValidationProblemDetails(convertedErrors);
    }
}
