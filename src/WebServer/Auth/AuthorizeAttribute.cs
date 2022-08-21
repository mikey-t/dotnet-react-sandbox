using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Serilog;
using WebServer.Model.Auth;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace WebServer.Auth;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizeAttribute : Attribute, IAuthorizationFilter
{
    public string Roles { get; set; } = "";

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

        var unauthorizedResult = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };

        var account = (Account?)context.HttpContext?.Items?[GlobalConstants.CONTEXT_ACCOUNT_KEY];

        logger.Debug("Account: {Account}", JsonSerializer.Serialize(account));
        logger.Debug("Roles: {Roles}", Roles);

        if (account == null)
        {
            context.Result = unauthorizedResult;
            return;
        }

        if (string.IsNullOrWhiteSpace(Roles)) return;

        var roleList = Roles.Split(",").Select(r => r.Trim().ToUpper());

        if (roleList.All(role => account.Roles.Contains(role))) return;

        context.Result = unauthorizedResult;
    }
}
