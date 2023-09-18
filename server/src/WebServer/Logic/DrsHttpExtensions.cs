using Microsoft.AspNetCore.Http.Extensions;

namespace WebServer.Logic;

public static class HttpExtensions
{
    public static bool RequestPathStartsWith(this HttpContext context, string startsWith)
    {
        return new Uri(context.Request.GetDisplayUrl()).AbsolutePath.StartsWith(startsWith, StringComparison.OrdinalIgnoreCase);
    }
}
