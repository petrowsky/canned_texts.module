<?php
// $Id$

/**
 * Implementation of hook_views_plugins().
 */
function canned_texts_views_plugins() {
  return array(
    'display' => array(
      'canned_texts' => array(
        'title' => t('Canned Texts'),
        'help' => t('Provides a list of items to be used as canned texts.'),
        'handler' => 'canned_texts_plugin_display_canned_texts',
        'use ajax' => TRUE,
        'canned texts' => TRUE,
        'theme' => 'views_view',
        'use pager' => TRUE,
        'use exposed' => FALSE,
        'use more' => FALSE,
        'admin' => t('Canned Texts'),
        'help topic' => 'display-canned-texts',
      ),
    ),
  );
}
