using Microsoft.AspNetCore.Mvc;
using WebServer.Logic;
using WebServer.Model.Auth;

namespace WebServer.Controllers;

public class ApiBaseController : ControllerBase
{
    private readonly ICurrentAccountProvider _currentAccountProvider;
    
    protected Account? CurrentAccount => _currentAccountProvider.GetCurrentAccount();

    public ApiBaseController(ICurrentAccountProvider currentAccountProvider)
    {
        _currentAccountProvider = currentAccountProvider;
    }
}
