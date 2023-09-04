using System.Text.Json;
using Amazon;
using Amazon.Runtime;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using MikeyT.EnvironmentSettingsNS.Interface;

namespace WebServer.Logic;

public interface IEmailSender
{
    Task SendMail(string recipientAddress, string subject, string bodyText, string? bodyHtml = null);
}

public class AwsSimpleEmailSender : IEmailSender
{
    private readonly ILogger _logger;
    private readonly IEnvironmentSettings _environmentSettings;

    private const string FROM_ACCOUNT = "noreply@cookiebrains.com";

    // private const string FEEDBACK_ADDRESS = "mike@mikeyt.net";
    private const string UTF8 = "UTF-8";

    public AwsSimpleEmailSender(ILogger<AwsSimpleEmailSender> logger, IEnvironmentSettings environmentSettings)
    {
        _logger = logger;
        _environmentSettings = environmentSettings;
    }

    public async Task SendMail(string recipientAddress, string subject, string bodyText, string? bodyHtml = null)
    {
        var username = _environmentSettings.GetString(GlobalSettings.AWS_SES_USERNAME);
        var password = _environmentSettings.GetString(GlobalSettings.AWS_SES_PASSWORD);

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            const string errorMessage = "Configuration missing for sending AWS SES email messages";
            _logger.LogError(errorMessage);
            throw new Exception(errorMessage);
        }

        var creds = new BasicAWSCredentials(username, password);
        // var creds2 = new AwsCredentials
        using var client = new AmazonSimpleEmailServiceV2Client(creds, RegionEndpoint.USWest2);
        var sendRequest = new SendEmailRequest
        {
            Destination = new Destination { ToAddresses = new List<string> { recipientAddress } },
            FromEmailAddress = FROM_ACCOUNT
            // FeedbackForwardingEmailAddress = FEEDBACK_ADDRESS
        };

        var content = new EmailContent
        {
            Simple = new Message
            {
                Subject = new Content { Charset = UTF8, Data = subject },
                Body = new Body { Text = new Content { Charset = UTF8, Data = bodyText } }
            }
        };

        if (bodyHtml != null)
        {
            content.Simple.Body.Html = new Content { Charset = UTF8, Data = bodyHtml };
        }

        sendRequest.Content = content;

        SendEmailResponse? response = null;
        try
        {
            _logger.LogInformation("Sending email using AWS SES...");
            response = await client.SendEmailAsync(sendRequest);
            _logger.LogInformation("Email sent successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email using AWS SES. Response: {Response}", JsonSerializer.Serialize(response));
            throw new Exception("Error sending message");
        }
    }
}
