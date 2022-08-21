using System.Net;
using Microsoft.AspNetCore.Mvc;
using WebServer.Auth;
using WebServer.Data;
using WebServer.Model.Auth;
using WebServer.Model.Request.AdminRequest;

namespace WebServer.Controllers.AdminControllers;

[Authorize(Roles = nameof(Role.SUPER_ADMIN))]
[ApiController]
[Route("api/admin/login-whitelist")]
public class LoginWhitelistController : ControllerBase
{
    private readonly ILogger<LoginWhitelistController> _logger;
    private readonly IAccountRepository _repo;
    
    public LoginWhitelistController(ILogger<LoginWhitelistController> logger, IAccountRepository repo)
    {
        _logger = logger;
        _repo = repo;
    }

    [HttpGet("all")]
    [ProducesResponseType(typeof(IEnumerable<string>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetAllUsers()
    {
        var all = await _repo.GetLoginWhitelist();
        return Ok(all);
    }
    
    [HttpPost]
    [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
    [ProducesResponseType((int)HttpStatusCode.Conflict)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    public async Task<IActionResult> AddToLoginWhitelist([FromBody] LoginWhitelistRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return StatusCode((int)HttpStatusCode.InternalServerError);
        }

        var isAlreadyWhitelisted = await _repo.IsOnLoginWhitelist(request.Email);

        if (isAlreadyWhitelisted)
        {
            return Conflict();
        }

        await _repo.AddToLoginWhitelist(request.Email);
        
        return NoContent();
    }
    
    [HttpDelete("{email}")]
    [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    public async Task<IActionResult> RemoveFromLoginWhitelist(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return StatusCode((int)HttpStatusCode.InternalServerError);
        }

        await _repo.RemoveFromLoginWhiteList(email);
        
        return NoContent();
    }
}
