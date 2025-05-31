const MUTATION = {
  CREATE_CUSTOM_MODULE_FORM: `
    mutation (
      $input: createCustomModuleFormInput
    ) {
      createCustomModuleForm (
        input: $input
      ) {
        customModuleForm {
          id
        }
        messages {
          field,
          message
        }
      }
    }
  `,
  CREATE_CUSTOM_MODULE: `
    mutation (
      $input: createCustomModuleInput
    ) {
      createCustomModule (
        input: $input
      ) {
        customModule {
          id
        },
        messages {
          field,
          message
        }
      }

    }
  `
};