const {Autohook, validateWebhook, validateSignature} = require('twitter-autohook');

const url = require('url');
const ngrok = require('ngrok');
const http = require('http');

const startServer = (port, auth) => http.createServer((req, res) => {
  const route = url.parse(req.url, true);

  if (!route.pathname) {
    return;
  }

  if (route.query.crc_token) {
    try {
      if (!validateSignature(req.headers, auth, url.parse(req.url).query)) {
        console.error('Cannot validate webhook signature');
        return;
      };
    } catch (e) {
      console.error(e);
    }

    const crc = validateWebhook(route.query.crc_token, auth, res);
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(crc));
  }

  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!validateSignature(req.headers, auth, body)) {
          console.error('Cannot validate webhook signature');
          return;
        };
      } catch (e) {
        console.error(e);
      }

      console.log('Event received:', body);
      res.writeHead(200);
      res.end();
    });
  }
}).listen(port);

(async () => {
  try {
    const url = "https://twitterserver.azurewebsites.net";
    const webhookURL = `${url}/standalone-server/webhook`;

    const config = {
      token: "1497107804381130752-hvyQCDefazNcfHHfbnASWvoTjKcik0",
      token_secret: "RKwjnYC4PD7zQf276y9OOt1eFFpWitVEHHxsDwDIC5Z6R",
      consumer_key: "gKeONkA8ysYPOoPC0wsBD505Y",
      consumer_secret: "d3MLrmVw44N5tRkV8vxZGF62Hyi7E3GH5zC93eR9qPW0DFUxdl",
      env: "Development",
    };

    const server = startServer(8080, config);


    const webhook = new Autohook(config);
    await webhook.removeWebhooks();
    await webhook.start(webhookURL);
    await webhook.subscribe({
      oauth_token: config.token,
      oauth_token_secret: config.token_secret,
    });
    
  } catch(e) {
    console.error(e);
    process.exit(-1);
  }
})();