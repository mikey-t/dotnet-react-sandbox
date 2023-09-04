namespace WebServer.Model.Response;

public class IdResponse
{
    public long Id { get; set; }
    
    public IdResponse(long id)
    {
        Id = id;
    }
}
