const QUERY = {
  CURRENT_USER: `
query {
  currentUser {
    id,
    name
  }
}
  `,
  CUSTOM_MODULE_FORMS: `
query (
  $page_size: Int,
  $keywords: String
) {
  customModuleForms (
    should_paginate: true,
    page_size: $page_size,
    keywords: $keywords
  ) {
    id,
    cursor,
    name,
    created_at,
    updated_at,
    use_for_charting,
    use_for_program,
    prefill
  }
}   
  `,
  CUSTOM_MODULE_FORM: `
query (
  $id: ID
) {
  customModuleForm (
    id: $id
  ) {
    id,
    custom_modules {
      id,
      controls_conditional_modules,
      copied_from_form_name,
      custom_module_condition {
        id,
        conditional_custom_module_id,
        custom_module_id,
        filter_type,
        value_to_filter
      },
      custom_module_form_section_id,
      hipaa_name,
      is_custom,
      label,
      mod_type,
      options,
      options_array,
      other_module_ids_to_autoscore_on,
      parent_custom_module_id,
      position,
      required,
      sublabel
    },
    name,
    prefill,
    is_video,
    use_for_charting,
    use_for_program,
    user {
      id,
      name
    }
  }
}
  `
};