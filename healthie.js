class Healthie {

  static async api(options) {
    console.log(options);

log(`
<div class='graphql'>
GraphQL: ${options.url.trim()}
</div>
<pre class='graphql'>
# Query / Mutation
<br/>
${options.query.trim()}
</br>
# Variables
<br/>
${JSON.stringify(options.variables, null, 2).trim()}
</pre>
</div>
`);

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