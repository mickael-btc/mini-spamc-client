# mini-spamc-client
Small and robust spamassassin client in javascript

this module connects to spamd daemon. It is able to get reports from a raw String email.

## Initial Setup
Before you need to have spamassassin installed:
```bash
sudo apt install spamassassin spamc
sudo update-rc.d spamassassin enable
sudo service spamassassin start
```
to install the package via npm do :
```bash
npm i https://github.com/mickael-btc/mini-spamc-client.git
```


## Example

```js
const spamcClient = require("mini-spamc-client");
const client = new spamcClient();

client.report("A raw String email based on the RFC 5322 standard", function (result) {
  console.log(result);
});
```
Response example:
```js
{
  error: false,
  responseCode: 0,
  responseMessage: 'EX_OK',
  isSpam: false,
  score: 2.7,
  threshold: 5.0,
  report: [
    {
      points: -1.0,
      testName: 'ALL_TRUSTED',
      description: 'Passed through trusted hosts only via SMTP'
    },
    {
      points: 0.0,
      testName: 'HTML_MESSAGE',
      description: 'BODY: HTML included in message'
    },
    {
      points: 0.1,
      testName: 'MISSING_MID',
      description: 'Missing Message-Id: header'
    },
    {
      points: 1.4,
      testName: 'MISSING_DATE',
      description: 'Missing Date: header'
    },
    {
      points: 0.1,
      testName: 'DKIM_SIGNED',
      description: 'Message has a DKIM or DK signature, not necessarily valid'
    },
    {
      points: -0.1,
      testName: 'DKIM_VALID_AU',
      description: 'Missing Subject: header'
    },
    {
      points: -0.1,
      testName: 'DKIM_VALID',
      description: 'Message has a valid DKIM or DK signature from author\'s domain'
    },
    {
      points: 2.3,
      testName: 'EMPTY_MESSAGE',
      description: 'Message appears to have no textual parts and no Subject: text'
    }
  ]
}
```
