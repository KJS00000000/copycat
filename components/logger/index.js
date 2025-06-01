(function() {

  class Logger {

    static element;

    static {
      this.element = document.getElementById('logger');
    }

    static log(options) {
      this.element.innerHTML += `<div class='${(options.class || 'basic')}'>${options.message}</div>`;
    }

    static logGraphQL(options) {
      let html = `<div class='graphql'>GraphQL: ${options.url.trim()}</div>`;
      html += `<pre class='graphql'>`;
      html += `# Query / Mutation<br/><br/>`;
      html += `${options.query.trim()}`;
      html += '<br/><br/>';
      html += `# Variables<br/><br/>${JSON.stringify(options.variables, null, 2).trim()}<br/><br/>`;
      html += `</pre></div>`;
      console.log(html);
      this.element.innerHTML += html;
    }
    
  }
  
  window.Logger = Logger;

})();