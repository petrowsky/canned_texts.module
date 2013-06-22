<?php

/**
 * @file
 * Canned Texts Admin Form
 */

/**
 * Generates the Canned Text editing form.
 */
function canned_text_form($form, &$form_state, $canned_text, $op = 'edit') {

  if ($op == 'clone') {
    $canned_text->label .= ' (cloned)';
    $canned_text->machine_name .= '_clone';
  }

  $form['label'] = array(
    '#title' => t('Label'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => isset($canned_text->label) ? $canned_text->label : '',
  );
  // Machine-readable type name.
  $form['name'] = array(
    '#type' => 'machine_name',
    '#default_value' => isset($canned_text->name) ? $canned_text->name : '',
    // '#disabled' => $canned_text->isLocked(),
    '#machine_name' => array(
      'exists' => 'canned_texts_get_items',
      'source' => array('label'),
    ),
    '#description' => t('A unique machine-readable name for this profile type. It must only contain lowercase letters, numbers, and underscores.'),
  );
  $form['content'] = array(
    '#title' => t('Content'),
    '#type' => 'textarea',
    '#required' => TRUE,
    '#default_value' => isset($canned_text->content) ? $canned_text->content : '',
    '#description' => t('The content to insert when the canned text is selected'),
  );

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save canned text'),
    '#weight' => 40,
  );
  return $form;
}

/**
 * Form API submit callback for the canned text form.
 */
function canned_text_form_submit(&$form, &$form_state) {
  $canned_text = entity_ui_form_submit_build_entity($form, $form_state);
  // Save and go back.
  $canned_text->save();
  $form_state['redirect'] = 'admin/content/canned_texts';
}
