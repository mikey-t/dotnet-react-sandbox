using Microsoft.AspNetCore.Mvc;
using WebServer.Auth;
using WebServer.Model.Auth;

namespace WebServer.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Role.USER)]
public class ProtectedController : ControllerBase
{
    private readonly ILogger<ProtectedController> _logger;
    
    public ProtectedController(ILogger<ProtectedController> logger)
    {
        _logger = logger;
    }
    
    [HttpGet("test")]
    public string Test()
    {
        return "test content from a protected API endpoint";
    }
}
