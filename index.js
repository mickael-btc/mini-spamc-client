"use strict";

const net = require("net");

/** 
 * Small and robust spamassassin client
 * @param {String=localhost} host spamassassin ip/host
 * @param {int=783} port spamassassin port
 * @param {int=10} timeout timeout in seconds
 * @function
*/
module.exports = function(host, port, timeout) {
  const protocolVersion = 1.5;
  const HOST = host || "localhost";
  const PORT = port|| 783;
  const TIMEOUT = timeout || 10;
  
  /** 
   * Sends a Ping to spamd and returns Pong on response
   * @function ping
   * @param {Function} onResponse callback function
  */
  this.ping = function(onResponse) {
    executeCommand("PING", null, function (data) {
      /* Check Response has the word PONG */
      if (data.includes("PONG")) {
        onResponse(true);
      } else {
        onResponse(false);
      }
    });
  };

  /** 
   * Return a report object
   * @function ping
   * @param {String} message An email based on the RFC 5322 standard
   * @param {Function} onResponse callback function
  */
  this.report = function(message, onResponse) {
    executeCommand("REPORT", message, function (data) {
      data = data.replace(/\r/g, "");
      const result = { error: false };

      /*  Check for this line: SPAMD/1.1 0 EX_OK */
      const preposition = data.match(/SPAMD\/([0-9\.]+)\s([0-9]+)\s([0-9A-Z_]+)/);
      if (preposition) {
        result.responseCode = parseFloat(preposition[2]);
        result.responseMessage = preposition[3];
      } else {
        result.error = true;
      }

      /* Check for total score and threshold: Spam: False ; -1.1 / 5.0 */
      const score = data.match(/Spam:\s(True|False|Yes|No)\s;\s(-?[0-9\.]+)\s\/\s([0-9\.]+)/);
      if (score) {
        result.isSpam = (score[1] == "True" || score[1] == "Yes") ? true : false;
        result.score = parseFloat(score[2]);
        result.threshold = parseFloat(score[3]);
      } else {
        result.error = true;
      }

      /* Check for detailed explanation of score. Warning! 'data' must end by \n\n or the last reason will be skiped */
      const reasons = data.matchAll(/(?<=\n)(?:([\s|-][0-9\.]+)\s([A-Z0-9\_]+)\s+(.*?(?=(?:\n(?:\s|-)[0-9\.]+)|(?:\n\n))))/gms);
      result.report = [];
      if (result) {
        for (let reason of reasons) {
          result.report.push({
            points: parseFloat(reason[1]),
            testName: reason[2],
            description: reason[3].replace(/\s\s+/g, ' ')
          })
        }
      } else {
        result.error = true;
      }
      if (typeof onResponse == "function") onResponse(result);
    });
  };

  /** 
   * Execute a command and returns the response
   * @function ping
   * @param {String} cmd uppercase spamd command
   * @param {String} message An email based on the RFC 5322 standard
   * @param {Function} onData callback function
  */
  const executeCommand = function(cmd, message, onData, extraHeaders) {
    const stream = net.createConnection(PORT, HOST);
    let data = "";

    stream.setTimeout(TIMEOUT * 1000, function() {
      throw new Error("Connection to spamd Timed Out");
    });

    stream.on("connect", function () {
      /* Create Command to Send to spamd */
      cmd = cmd + " SPAMC/" + protocolVersion + "\r\n";
      if (typeof message == "string") {
        message = message + "\r\n";
        cmd = cmd + "Content-length: " + message.length + "\r\n";
        /* Process Extra Headers if Any */
        if (typeof extraHeaders == "object") {
          for (var i = 0; i < extraHeaders.length; i++) {
            cmd =
              cmd +
              extraHeaders[i].name +
              ": " +
              extraHeaders[i].value +
              "\r\n";
          }
        }
        cmd = cmd + "\r\n" + message;
      }
      stream.write(cmd + "\r\n");
    });

    stream.on("error", function (data) {
      throw new Error("spamd returned a error: " + data.toString());
    });

    stream.on("data", function (buffer) {
      data += buffer.toString();
    });

    stream.on("close", function () {
      onData(data);
    });
  };
};