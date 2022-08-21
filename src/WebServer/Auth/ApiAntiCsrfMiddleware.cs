using System.Net;
using Microsoft.AspNetCore.Http.Extensions;
using Serilog;
using ILogger = Serilog.ILogger;

namespace WebServer.Auth;

public class ApiAntiCsrfMiddleware
{
    private readonly ILogger _logger;
    private readonly RequestDelegate _next;

    public ApiAntiCsrfMiddleware(RequestDelegate next)
    {
        _next = next;
        _logger = Log.ForContext<ApiAntiCsrfMiddleware>();
    }

    public async Task Invoke(HttpContext context)
    {
        if (context.Request.Method == HttpMethod.Post.Method ||
            context.Request.Method == HttpMethod.Put.Method ||
            context.Request.Method == HttpMethod.Delete.Method ||
            context.Request.Method == HttpMethod.Patch.Method ||
            context.Request.Method == HttpMethod.Trace.Method)
        {
            if (context.Request.Path.Value != null && context.Request.Path.Value.Contains("api/account/microsoft-token"))
            {
                await _next(context);
                return;
            }
            
            var clientAppInstanceId = context.Request.Headers["x-instance-id"].FirstOrDefault();
            _logger.Debug("Client app instanceId: {ClientAppInstanceId}", clientAppInstanceId);

            if (string.IsNullOrWhiteSpace(clientAppInstanceId))
            {
                _logger.Warning("API call rejected because of missing x-instance-id header for url {Url}", context.Request.GetDisplayUrl());
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                await context.Response.WriteAsync("Unauthorized");
                return;
            }
        }

        await _next(context);
    }
}
