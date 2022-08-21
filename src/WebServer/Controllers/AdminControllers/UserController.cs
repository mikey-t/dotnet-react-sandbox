using System.Net;
using Microsoft.AspNetCore.Mvc;
using MikeyT.EnvironmentSettingsNS.Interface;
using WebServer.Auth;
using WebServer.Data;
using WebServer.Model.Auth;
using WebServer.Model.Response;

namespace WebServer.Controllers.AdminControllers;

[Authorize(Roles = nameof(Role.SUPER_ADMIN))]
[ApiController]
[Route("api/admin/user")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private readonly IEnvironmentSettings _environmentSettings;
    private readonly IAccountRepository _repo;
    
    public UserController(ILogger<UserController> logger, IEnvironmentSettings environmentSettings, IAccountRepository repo)
    {
        _logger = logger;
        _environmentSettings = environmentSettings;
        _repo = repo;
    }

    [HttpGet("all")]
    [ProducesResponseType(typeof(IEnumerable<AccountResponse>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetAllUsers()
    {
        var all = await _repo.GetAll();
        var allResponses = all.Select(AccountResponse.FromAccount).ToList();
        
        return Ok(allResponses);
    }
    
    [HttpPost("{userId:long}/content-creator/{isContentCreator:bool}")]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public async Task<IActionResult> SetUserContentCreator(long userId, bool isContentCreator)
    {
        var user = await _repo.GetAccountById(userId);

        if (user == null)
        {
            return NotFound();
        }

        if (isContentCreator)
        {
            await _repo.AddRole(userId, nameof(Role.CONTENT_CREATOR));
        }
        else
        {
            await _repo.RemoveRole(userId, nameof(Role.CONTENT_CREATOR));
        }
        
        return Ok();
    }
}
