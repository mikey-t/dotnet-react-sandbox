using Google.Apis.Auth;

namespace WebServer.Auth;

public interface IGoogleLoginWrapper
{
    Task<GoogleJwtResponse> GetGoogleJwtResponse(string jwt);
}

public class GoogleJwtResponse
{
    public string Scope { get; set; }
    public string Prn { get; set; }
    public string HostedDomain { get; set; }
    public string Email { get; set; }
    public bool EmailVerified { get; set; }
    public string Name { get; set; }
    public string GivenName { get; set; }
    public string FamilyName { get; set; }
    public string Picture { get; set; }
    public string Locale { get; set; }

    public GoogleJwtResponse(string scope, string prn, string hostedDomain, string email, bool emailVerified,
        string name, string givenName, string familyName, string picture, string locale)
    {
        Scope = scope;
        Prn = prn;
        HostedDomain = hostedDomain;
        Email = email;
        EmailVerified = emailVerified;
        Name = name;
        GivenName = givenName;
        FamilyName = familyName;
        Picture = picture;
        Locale = locale;
    }

    public static GoogleJwtResponse FromPayloadObject(GoogleJsonWebSignature.Payload payload)
    {
        return new GoogleJwtResponse(
            payload.Scope,
            payload.Prn,
            payload.HostedDomain,
            payload.Email,
            payload.EmailVerified,
            payload.Name,
            payload.GivenName,
            payload.FamilyName,
            payload.Picture,
            payload.Locale
        );
    }
}

public class GoogleLoginWrapper : IGoogleLoginWrapper
{
    public async Task<GoogleJwtResponse> GetGoogleJwtResponse(string jwt)
    {
        var googleResponse = await GoogleJsonWebSignature.ValidateAsync(jwt, new GoogleJsonWebSignature.ValidationSettings());
        return GoogleJwtResponse.FromPayloadObject(googleResponse);
    }
}
