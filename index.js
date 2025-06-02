/* 
  WARNING - PLEASE USE CAUTION WHEN USING THESE SCRIPTS

  Be sure to read and understand the consequences of using, modifying, and/or executing these scripts.

  Purpose
  This script can be used to copy form templates (CustomModuleForms) between Healthie Staging and Production

  Disclaimer
  The developer of this script assumes no responsability for it's use or any side effects of it's execution.
  This script is not perfect and was recently written to provide guidance for copying forms via the Healthie API

  This script may be modified, shared, and reused as desired
*/

// Initialize data
let data = {};
if (config.SafeMode) {
  Logger.log({
    message: "SafeMode is enabled!<br/><br/>Forms will not be copied.<br/><br/>You can change this in config.js",
    class: 'warning'
  })
}

// Hide the loading modal
LoadingModal.hide();

// Initialize configuration variables
document.getElementById('source-environment-url').value = config.sourceEnvironment.url;
document.getElementById('source-environment-api-key').value = config.sourceEnvironment.apiKey;
document.getElementById('destination-environment-url').value = config.destinationEnvironment.url;
document.getElementById('destination-environment-api-key').value = config.destinationEnvironment.apiKey;

// Fetch available forms from the source environment
// Limited by page size
async function fetchFormsToCopy() {
  let environmentsAreValid = checkIfEnvironmentsAreValid();
  if (!environmentsAreValid) {
    return;
  }

  config.selectFormsFilter = document.getElementById('select-forms-filter').value;

  let result = await Healthie.api({
    url: config.destinationEnvironment.url,
    apiKey: config.destinationEnvironment.apiKey,
    query: QUERY.CUSTOM_MODULE_FORMS,
    variables: {
      page_size: 10,
      keywords: config.selectFormsFilter || ''
    }
  });
  try {
    data.availableForms = result.data.customModuleForms;
    renderAvailableForms();
  } catch(e) {
    console.log(e);
  }
}

// Render the available forms from the source environment
function renderAvailableForms() {
  let element = document.getElementById('available-forms');
  element.innerHTML = '';
  data.availableForms.forEach((formData) => {
    let form = new Form(formData);
    formData.form = form;
    element.appendChild(form.element);
  });
}

// Copy the selected forms from the source environment to the destination environment
async function copyForms() {
  let environmentsAreValid = checkIfEnvironmentsAreValid();
  if (!environmentsAreValid) {
    return;
  }

  if (!data.availableForms || data.availableForms.length === 0) {
    alert('You must select a form to copy');
    return;
  }

  let selectedForms = data.availableForms.filter((formData) => {
    return formData.form.isSelected
  });

  if (selectedForms.length === 0) {
    alert('You must select a form to copy');
    return;
  }

  LoadingModal.show();
  LoadingModal.updateForeground({
    html: 'Copying forms...'
  });
  for (const formData of selectedForms) {
    if (formData.form.isSelected) {
      try{
        await copyForm(formData);
      } catch (e) {
        Logger.log({
          message: 'Errow while copying form!',
          class: 'error'
        });
        console.log('Error while copying form');
        console.log(e);
      }
    }
  }

  LoadingModal.hide();
}

// Copy a form from the source environment to the destination environment
async function copyForm(formData) {
  let formId = formData.id;
  formData.createdCustomModulesIndexedByOriginalId = {};

  LoadingModal.updateForeground({
    html: 'Copying form ' + formId + ' from ' + config.sourceEnvironment.url
  });
  
  let fetchFormResult = await Healthie.api({
    url: config.sourceEnvironment.url,
    apiKey: config.sourceEnvironment.apiKey,
    query: QUERY.CUSTOM_MODULE_FORM,
    variables: {
      id: formId
    }
  });

  console.log(fetchFormResult);

  let customModuleFormToCopy = fetchFormResult.data.customModuleForm;

  let createCustomModuleFormInput = {
    is_video: customModuleFormToCopy.is_video,
    metadata: JSON.stringify({
      copied: {
        using: 'CopyCat',
        from: config.sourceEnvironment.url,
        api_key_user_id: config.sourceEnvironment.user_id,
        at: new Date().toISOString(),
        custom_module_form_id: customModuleFormToCopy.id
      }
    }),
    name: customModuleFormToCopy.name,
    prefill: customModuleFormToCopy.prefill,
    use_for_charting: customModuleFormToCopy.use_for_charting,
    use_for_program: customModuleFormToCopy.use_for_program
  };

  console.log(createCustomModuleFormInput);

  let newCustomModuleFormId;

  if (!config.SafeMode) {
    let createFormResult = await Healthie.api({
      url: config.destinationEnvironment.url,
      apiKey: config.destinationEnvironment.apiKey,
      query: MUTATION.CREATE_CUSTOM_MODULE_FORM,
      variables: {
        input: createCustomModuleFormInput
      }
    });
    newCustomModuleFormId = createFormResult.data.createCustomModuleForm.customModuleForm.id;
  } else {
    console.log('createCustomModuleFormInput: ', createCustomModuleFormInput);
    newCustomModuleFormId = '... DRY RUN ...';
  }

  formData.newCustomModuleFormId = newCustomModuleFormId;

  LoadingModal.updateForeground({
    html: `
      Created Form ${newCustomModuleFormId} in ${config.destinationEnvironment.url}
      <br/>
      Copying Form Modules...
    `,
    append: true,
  });

  // Create CustomModules for this CustomModuleForm
  let counter = 1;
  for (const customModuleToCopy of customModuleFormToCopy.custom_modules) {
    let createCustomModuleInput = {
      custom_module_form_id: newCustomModuleFormId,
      is_custom: customModuleToCopy.is_custom,
      label: customModuleToCopy.label,
      mod_type: customModuleToCopy.mod_type,
      options: customModuleToCopy.options,
      parent_custom_module_id: null,
      required: customModuleToCopy.required,
      sublabel: customModuleToCopy.sublabel
    };

    if (!config.SafeMode) {
      let createCustomModuleResponse = await Healthie.api({
        url: config.destinationEnvironment.url,
        apiKey: config.destinationEnvironment.apiKey,
        query: MUTATION.CREATE_CUSTOM_MODULE,
        variables: {
          input: createCustomModuleInput
        }
      });
      formData.createdCustomModulesIndexedByOriginalId[customModuleToCopy.id] = createCustomModuleResponse.data.createCustomModule.customModule.id;
    } else {
      console.log('createCustomModuleInput: ', createCustomModuleInput);
      formData.createdCustomModulesIndexedByOriginalId[customModuleToCopy.id] = `... DRY RUN (${counter}) ...`
      counter++;
    }
  }

  // Update CustomModules with conditional logic
  for (const customModuleToCopy of customModuleFormToCopy.custom_modules) {
    if (customModuleToCopy.custom_module_condition) {
      let createdCustomModuleId = formData.createdCustomModulesIndexedByOriginalId[customModuleToCopy.id];
      let createdConditionalCustomModuleId = formData.createdCustomModulesIndexedByOriginalId[customModuleToCopy.custom_module_condition.conditional_custom_module_id];
      let updateCustomModuleInput = {
        id: createdCustomModuleId,
        custom_module_condition: {
          conditional_custom_module_id: createdConditionalCustomModuleId,
          filter_type: customModuleToCopy.custom_module_condition.filter_type,
          value_to_filter: customModuleToCopy.custom_module_condition.value_to_filter
        }
      };

      if (!config.SafeMode) {
        let updateCustomModuleResponse = await Healthie.api({
          url: config.destinationEnvironment.url,
          apiKey: config.destinationEnvironment.apiKey,
          query: MUTATION.UPDATE_CUSTOM_MODULE,
          variables: {
            input: updateCustomModuleInput
          }
        });
      } else {
        console.log('updateCustomModuleInput: ', updateCustomModuleInput);
      }
    }
  }

  // TODO - Looking into updating CustomModules for parent_custom_module_id
}

// Check if the source and destination environments are valid
async function checkIfEnvironmentsAreValid() {
  await checkSourceEnvironment();
  if (!config.sourceEnvironment.isValid) {
    Logger.log({
      message: 'Source environment is not valid!',
      class: 'error'
    });
  } else {
    Logger.log({
      message: 'Source environment is valid!',
      class: 'success'
    });
  }

  await checkDestinationEnvironment();
  if (!config.destinationEnvironment.isValid) {
    Logger.log({
      message: 'Destination environment is not valid!',
      class: 'error'
    });
  } else {
    Logger.log({
      message: 'Destination environment is valid!',
      class: 'success'
    });
  }

  return config.sourceEnvironment.isValid && config.destinationEnvironment.isValid;
}

// Check if the source environment is valid
async function checkSourceEnvironment() {
  Logger.log({
    message: 'Checking source environment'
  });

  config.sourceEnvironment.url = document.getElementById('source-environment-url').value;
  config.sourceEnvironment.apiKey = document.getElementById('source-environment-api-key').value;

  try {
    let result = await Healthie.api({
      url: config.sourceEnvironment.url,
      apiKey: config.sourceEnvironment.apiKey,
      query: QUERY.CURRENT_USER,
      variables: ''
    });

    config.sourceEnvironment.user_id = result.data.currentUser.id;
    config.sourceEnvironment.user_name = result.data.currentUser.name;
    config.sourceEnvironment.isValid = true;
  } catch(e) {
    config.sourceEnvironment.user_id = 'Invalid';
    config.sourceEnvironment.user_name = 'Invalid';
    config.sourceEnvironment.isValid = false;
    console.log(e);
  }
  renderSourceEnvironmentDetails();
}

// Render details about the source environment
function renderSourceEnvironmentDetails() {
  let element = document.getElementById('source-environment-details');
  element.innerHTML = `
    <b>User ID:</b>&nbsp;&nbsp;${config.sourceEnvironment.user_id}
    &nbsp;&nbsp;
    <b>User Name:</b>&nbsp;&nbsp;${config.sourceEnvironment.user_name}
  `;
}

// Check if the destination environment is valid
async function checkDestinationEnvironment() {
  Logger.log({
    message: 'Checking destination environment'
  });
  config.destinationEnvironment.url = document.getElementById('destination-environment-url').value;
  config.destinationEnvironment.apiKey = document.getElementById('destination-environment-api-key').value;

  try {
    let result = await Healthie.api({
      url: config.destinationEnvironment.url,
      apiKey: config.destinationEnvironment.apiKey,
      query: QUERY.CURRENT_USER,
      variables: ''
    });

    config.destinationEnvironment.user_id = result.data.currentUser.id;
    config.destinationEnvironment.user_name = result.data.currentUser.name;
    config.destinationEnvironment.isValid = true;
  } catch(e) {
    config.destinationEnvironment.user_id = 'Invalid';
    config.destinationEnvironment.user_name = 'Invalid';
    config.destinationEnvironment.isValid = false;
    console.log(e);
  }
  renderDestinationEnvironmentDetails();
}

// Render details about the destination environment
function renderDestinationEnvironmentDetails() {
  let element = document.getElementById('destination-environment-details');
  element.innerHTML = `
    <b>User ID:</b>&nbsp;&nbsp;${config.destinationEnvironment.user_id}
    &nbsp;&nbsp;
    <b>User Name:</b>&nbsp;&nbsp;${config.destinationEnvironment.user_name}
  `;
}

// Helper for toggling sections of the DOM
function toggleSection(jsEvent) {
  if (!jsEvent.target) {
    return;
  }
  let section = jsEvent.target.closest('.section');
  if (!section) {
    return;
  }
  if (section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
  } else {
    section.classList.add('collapsed');
  }
}
