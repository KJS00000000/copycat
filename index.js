// Please use caution when using these scripts!!! 
// Please read and understand the consequences of using, modifying, and/or executing these scripts.
// The developer of this script assumes no responsability for it's use or any side effects of it's execution.
// This script can be used to copy form templates (CustomModuleForms) between Healthie Staging and Production
// This script is not perfect and was recently written as a POC
// Updates to this script may be made in the future
// This script may be modified, shared, and reused as desired


function hideLoadingModal() {
  let loadingModal = document.getElementById('loading-modal');
  loadingModal.style.display = 'none';
  loadingModal.style.visibility = 'hidden';
}

function showLoadingModal() {
  let loadingModal = document.getElementById('loading-modal');
  loadingModal.style.display = 'block';
  loadingModal.style.visibility = 'visible';
}

function setLoadingModalText(text, append) {
  console.log('... ' + text);
  log(text);
  let loadingModalFG = document.getElementById('loading-modal-fg');
  if (append === true) {
    loadingModalFG.innerHTML += '<br/>' + text;
  } else {
    loadingModalFG.innerHTML = text || 'Working';
  }
}

function log(text) {
  let log = document.getElementById('log');
  log.innerHTML += '<br/>' + text;
}

function logError(text) {
  let log = document.getElementById('log');
  log.innerHTML += `<div class='error'>${text}</div>`;
}

function logInfo(text) {
  let log = document.getElementById('log');
  log.innerHTML += `<div class='info'>${text}</div>`;
}

hideLoadingModal();

document.getElementById('source-environment-url').value = config.sourceEnvironment.url;
document.getElementById('source-environment-api-key').value = config.sourceEnvironment.apiKey;
document.getElementById('destination-environment-url').value = config.destinationEnvironment.url;
document.getElementById('destination-environment-api-key').value = config.destinationEnvironment.apiKey;

async function checkSourceEnvironment() {
  logInfo('Checking source environment');

  config.sourceEnvironment.url = document.getElementById('source-environment-url').value;
  config.sourceEnvironment.apiKey = document.getElementById('source-environment-api-key').value;
  
  let result = await Healthie.api({
    url: config.sourceEnvironment.url,
    apiKey: config.sourceEnvironment.apiKey,
    query: QUERY.CURRENT_USER,
    variables: ''
  });
  try {
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

function renderSourceEnvironmentDetails() {
  let element = document.getElementById('source-environment-details');
  element.innerHTML = `
    <b>User ID:</b>&nbsp;&nbsp;${config.sourceEnvironment.user_id}
    &nbsp;&nbsp;
    <b>User Name:</b>&nbsp;&nbsp;${config.sourceEnvironment.user_name}
  `;
}

async function checkDestinationEnvironment() {
  logInfo('Checking destination environment');
  config.destinationEnvironment.url = document.getElementById('destination-environment-url').value;
  config.destinationEnvironment.apiKey = document.getElementById('destination-environment-api-key').value;
  
  let result = await Healthie.api({
    url: config.destinationEnvironment.url,
    apiKey: config.destinationEnvironment.apiKey,
    query: QUERY.CURRENT_USER,
    variables: ''
  });
  try {
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

async function fetchFormsToCopy() {
  await checkSourceEnvironment();
  if (!config.sourceEnvironment.isValid) {
    logError('Source environment is not valid!');
    return;
  }

  await checkDestinationEnvironment();
  console.log(config.destinationEnvironment.isValid);

  if (!config.destinationEnvironment.isValid) {
    logError('Destination environment is not valid!');
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

async function copyForms() {
  await checkSourceEnvironment();
  if (!config.sourceEnvironment.isValid) {
    logError('Source environment is not valid!');
    return;
  }
  await checkDestinationEnvironment();
  if (!config.destinationEnvironment.isValid) {
    logError('Destination environment is not valid!');
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

  showLoadingModal();
  setLoadingModalText('Copying forms...');
  for (const formData of selectedForms) {
    if (formData.form.isSelected) {
      try{
        await copyForm(formData.id);
      } catch (e) {
        console.log('Error while copying form');
        console.log(e);
      }
    }
  }

  hideLoadingModal();
}

async function copyForm(formId) {
  setLoadingModalText('Copying form ' + formId + ' from ' + config.sourceEnvironment.url);
  
  let fetchFormResult = await Healthie.api({
    url: config.sourceEnvironment.url,
    apiKey: config.sourceEnvironment.apiKey,
    query: QUERY.CUSTOM_MODULE_FORM,
    variables: {
      id: formId
    }
  });

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

  let createFormResult = await Healthie.api({
    url: config.destinationEnvironment.url,
    apiKey: config.destinationEnvironment.apiKey,
    query: MUTATION.CREATE_CUSTOM_MODULE_FORM,
    variables: {
      input: createCustomModuleFormInput
    }
  });

  let newCustomModuleFormId = createFormResult.data.createCustomModuleForm.customModuleForm.id;
  setLoadingModalText('Created Form ' + newCustomModuleFormId + ' in ' + config.destinationEnvironment.url, true);
  setLoadingModalText('Copying Form Modules', true);

  customModuleFormToCopy.custom_modules.forEach(async (customModuleToCopy) => {
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

    let createCustomModuleResult = await Healthie.api({
      url: config.destinationEnvironment.url,
      apiKey: config.destinationEnvironment.apiKey,
      query: MUTATION.CREATE_CUSTOM_MODULE,
      variables: {
        input: createCustomModuleInput
      }
    });
  });

}

function renderDestinationEnvironmentDetails() {
  let element = document.getElementById('destination-environment-details');
  element.innerHTML = `
    <b>User ID:</b>&nbsp;&nbsp;${config.destinationEnvironment.user_id}
    &nbsp;&nbsp;
    <b>User Name:</b>&nbsp;&nbsp;${config.destinationEnvironment.user_name}
  `;
}

function renderAvailableForms() {
  let element = document.getElementById('available-forms');
  element.innerHTML = '';
  data.availableForms.forEach((formData) => {
    let form = new Form(formData);
    formData.form = form;
    element.appendChild(form.element);
  });
}

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
