# CopyCat
### Form Copy Utility
These scripts can be used to copy form templates (CustomModuleForms) between Healthie's Staging and Production environments. They are mainly to be used to get an understanding of `how` you might use the Healthie API to fetch and create form templates.

### Requirements
NodeJS - For proxying requests

### Using the Utility
#### Clone the repo
```
  git clone git@github.com:KJS00000000/copycat.git
```
#### Configure
Open config.js and enter in `url` and `apiKey` details for sourceEnvironment.

Staging URL: `https://staging-api.gethealthie.com/graphql`   

Production URL (Proxied): `http://localhost:8083`

<em>Note: This can also be done via the UI</em>
##### Start the proxy server
##### SafeMode
By default, the script is setup to run in SafeMode. This means that forms will not be copied, but you can check environments and log out the queries that would be made if SafeMode were set to false. SafeMode can be disabled in `config.js` by setting it to `false`. It is recommended to use SafeMode until you are familliar with the tool.

```
  node server.js
```
#### Open index.html in your browser
Open the `index.html` file in your browser. 

<em>Note: This has only been tested in Google Chrome</em>
##### Copy forms via the UI
Use the UI to copy forms between environments.

There are 5 sections: Source Environment, Destination Environment, Select Form(s) to Copy, Copy Forms, and Event Log. Each of these sections can be collapsed by clicking in the header area. 

###### Source Environment
This is where forms will be copied from.
###### Destination Environment
This is where forms will be copied to.
###### Select Form(s) to Copy
This is where you can search for and select the forms you wish to copy. Click the `Search` button to fetch forms and use the input to filter them. By default, the search will only return 10 forms, but this can be modified in index.js. (Search for `page_size`)
###### Copy Forms
Once you have selected the forms to copy, click the `Copy Forms` button to copy forms from the source environment to the destination environment.
###### Event Log
Interactions will be logged in this section while interacting with the UI. You can look here to see the GraphQL requests that are being used.

<em>Note: This log will clear on page reload!</em>
#### TODO - Missing Feature(s)
###### parent_custom_module_id
CustomModules have a field for `parent_custom_module_id` that is not being populated at this time. You may need to update the script or run addtional mutations if your forms require this value. This will be updated in the future.