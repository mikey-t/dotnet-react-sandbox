namespace WebServer.Logic;

public class EmailLogic
{
    public static string NormalizeEmail(string email)
    {
        const string gmailDomain = "@gmail.com";
        var normal = email.Trim().ToLowerInvariant();
        
        // If gmail, remove periods and anything after and including "+"
        if (normal.EndsWith(gmailDomain))
        {
            var firstPart = normal.Substring(0, normal.IndexOf(gmailDomain, StringComparison.Ordinal));
            var firstPartNormal = string.Empty;
            for (var i = 0; i < firstPart.Length; i++)
            {
                if (firstPart[i] == '.')
                {
                    continue;
                }

                if (firstPart[i] == '+')
                {
                    break;
                }

                firstPartNormal += firstPart[i];
            }

            normal = firstPartNormal + gmailDomain;
        }
        
        return normal;
    }
}
