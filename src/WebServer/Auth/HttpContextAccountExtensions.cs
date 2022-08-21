
using WebServer.Model.Auth;

namespace WebServer.Auth;

public static class HttpContextAccountExtensions
{
    public static Account? Account(this Microsoft.AspNetCore.Http.HttpContext context)
    {
        return context?.Items[GlobalConstants.CONTEXT_ACCOUNT_KEY] as Account;
    }
}
