'use strict';

const url = require('url');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const typeis = require('type-is');
const querystring = require('querystring');
const Promise = require('bluebird');
const DEFAULT_HTTP_PORT = 80;
const DEFAULT_HTTPS_PORT = 443;

function doRequest(nodeHttpOptions, body = null) {
    const delegate = nodeHttpOptions.protocol === 'https:' ? https : http;

    return function requestResolver(resolve, reject) {
        const req = delegate.request(nodeHttpOptions, (res) => {
            let response;
            let responseSize = 0;
            let responseIsText = false;
            let stream = res;
            const encoding = (res.headers['content-encoding'] || 'identity').toLowerCase();

            // Handle encoding
            switch (encoding) {
                case 'deflate':
                    stream = zlib.createInflate();
                    res.pipe(stream);
                    break;
                case 'gzip':
                    stream = zlib.createGunzip();
                    res.pipe(stream);
                    break;
                case 'identity':
                    stream = res;
                    break;
                default:
                    // TODO: throw error
                    /*throw createError(415, 'unsupported content encoding "' + encoding + '"', {
                        encoding: encoding
                    });*/
            }

            // Handle mime
            switch (typeis(res, ['json', 'html', 'text'])) {
                case 'html':
                case 'json':
                case 'text':
                    responseIsText = true;
                    response = '';
                    stream.setEncoding('utf8'); // FIXME: Assuming utf8 for all responses is invalid
                    break;
                default:
                    response = [];
            }

            res.on('error', (err) => {
                reject(err); // TODO: think about typing ResponseError
            });
            stream.on('error', (err) => {
                reject(err); // TODO: think about typing GunzipResponseError
            });
            stream.on('data', (chunk) => {
                if (responseIsText) {
                    response += chunk;
                } else {
                    response.push(chunk);
                }
                responseSize += chunk.length;
            });
            stream.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    size: responseSize,
                    data: responseIsText ? response : Buffer.concat(response, responseSize)
                });
            });
        });

        req.on('error', (e) => {
            reject(e); // TODO: think about typing RequestError
        });

        // write data to request body
        if (body !== null) {
            req.write(body);
        }
        req.end();
    };
}

/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                                    href                                     │
 * ├──────────┬┬───────────┬─────────────────┬───────────────────────────┬───────┤
 * │ protocol ││   auth    │      host       │           path            │ hash  │
 * │          ││           ├──────────┬──────┼──────────┬────────────────┤       │
 * │          ││           │ hostname │ port │ pathname │     search     │       │
 * │          ││           │          │      │          ├─┬──────────────┤       │
 * │          ││           │          │      │          │ │    query     │       │
 * "  http:   // user:pass @ host.com : 8080   /p/a/t/h  ?  query=string   #hash "
 * │          ││           │          │      │          │ │              │       │
 * └──────────┴┴───────────┴──────────┴──────┴──────────┴─┴──────────────┴───────┘
 */
class HttpClient {
    constructor(timeout, dnsTimeout, socketTimeout, agent) {
        this._timeout = timeout;
        this._dnsTimeout = dnsTimeout;
        this._socketTimeout = socketTimeout;
        this._agent = agent;
    }

    get(href, queryParams = {}, headers = {}) {
        const hrefParts = url.parse(href);
        const query = Object.keys(queryParams).length !== 0 ? '?' + querystring.stringify(queryParams) : '';
        const nodeHttpOptions = {
            protocol: hrefParts.protocol,
            hostname: hrefParts.hostname,
            family: 4, // TODO: is this relevant?
            port: hrefParts.port || (hrefParts.protocol === 'https:' ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT),
            method: 'GET',
            path: hrefParts.pathname + query,
            headers,
            auth: hrefParts.auth,
            agent: this._agent,
            timeout: this._socketTimeout
        };

        return new Promise(doRequest(nodeHttpOptions));
    }

    post(href, body, queryParams = {}, headers = {}) {
        const hrefParts = url.parse(href);
        const query = Object.keys(queryParams).length !== 0 ? '?' + querystring.stringify(queryParams) : '';
        const nodeHttpOptions = {
            protocol: hrefParts.protocol,
            hostname: hrefParts.hostname,
            family: 4, // TODO: is this relevant?
            port: hrefParts.port || (hrefParts.protocol === 'https:' ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT),
            method: 'POST',
            path: hrefParts.pathname + query,
            headers,
            auth: hrefParts.auth,
            agent: this._agent,
            timeout: this._socketTimeout
        };

        return new Promise(doRequest(nodeHttpOptions), body);
    }
}

function httpClientFactory(timeout = 1000, dnsTimeout = 100, socketTimeout = 100, agent = undefined) {
    return new HttpClient(timeout, dnsTimeout, socketTimeout, agent);
}

module.exports = httpClientFactory;