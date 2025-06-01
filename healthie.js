class Healthie {

  static async api(options) {
    Logger.logGraphQL(options);

    let body = {
      query: options.query || '',
      variables: options.variables || ''
    };
    let response = await fetch(options.url, {
      'headers': {
        'accept': '*/*',
        'authorization': `Basic ${options.apiKey}`,
        'authorizationsource': 'API',
        'content-type': 'application/json',
      },
      'body': JSON.stringify(body),
      'method': 'POST',
    });
    return response.json();
  }
  
}