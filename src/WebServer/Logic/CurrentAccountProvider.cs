using WebServer.Auth;
using WebServer.Model.Auth;

namespace WebServer.Logic;

public interface ICurrentAccountProvider
{
    public Account? GetCurrentAccount();
}

public class CurrentAccountProvider : ICurrentAccountProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentAccountProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    public Account? GetCurrentAccount()
    {
        return _httpContextAccessor.HttpContext?.Account();
    }
}
