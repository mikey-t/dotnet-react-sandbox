using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Serilog;
using WebServer.Model.Auth;

namespace WebServer.Auth;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizeAttribute : Attribute, IAuthorizationFilter
{
    private readonly Role[] _roles;

    public AuthorizeAttribute(params Role[] roles)
    {
        _roles = roles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var logger = Log.ForContext<AuthorizeAttribute>();

        var allowAnon = (context.ActionDescriptor as ControllerActionDescriptor)?
            .MethodInfo
            .GetCustomAttributes<AllowAnonymousAttribute>()
            .FirstOrDefault() != null;

        if (allowAnon)
        {
            return;
        }

        var account = (Account?)context.HttpContext?.Items?[GlobalConstants.HTTP_CONTEXT_ACCOUNT_KEY];

        if (account == null)
        {
            context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
            return;
        }

        if (_roles.Length == 0 || _roles.Any(role => account.Roles.Contains(role.ToString().ToUpper())))
        {
            return;
        }

        context.Result = new JsonResult(new { message = "Forbidden" }) { StatusCode = 403 };
    }
}
