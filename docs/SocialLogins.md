# Social Logins

![Generic Social Login Flow](./images/SocialLoginFlow.png)

TODO:

- Move client side functionality for each social login into separate components
- Create instructions here for where to setup credentials for Microsoft/Google
    - High level steps to get it setup
    - How social user accounts map to app user accounts
    - Importance of normalizing google logins because of their functionality to ignore punctuation and anything after "+"
    - Generic description of where within admin tools to get to configuration
    - Direct URLs to configurations (though these maybe change over time)
    - Explanation of settings
        - Include subdomains for each environment
        - Get public ID and put it in `./src/client/settings.ts`
    - Other explanations
        - Why I'm using only one configuration rather than one for local vs prod
        - Why I'm including my own custom markup and server side validation instead of using a library
