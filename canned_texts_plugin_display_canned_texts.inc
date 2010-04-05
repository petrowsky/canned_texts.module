<?php
// $Id$

class canned_texts_plugin_display_canned_texts extends views_plugin_display {
  var $row_id;

  function option_definition() {
    $options = parent::option_definition();

    $options['types'] = array('default' => array());
    $options['modes'] = array('default' => array());
    $options['show_title'] = array('default' => 0);

    return $options;
  }

  function options_summary(&$categories, &$options) {
    // It is very important to call the parent function here:
    parent::options_summary($categories, $options);

    $categories['canned_texts'] = array(
      'title' => t('Canned Texts settings'),
    );

    $types = $this->get_option('types');
    if (empty($types)) {
      $types = array();
    }

    $options['types'] = array(
      'category' => 'canned_texts',
      'title' => t('Node types'),
      'value' => count($types) ? implode(', ', $types) : t('- None selected -'),
    );

    $used_modes = $this->get_option('modes');

    // Get the human readable names.
    $display_modes = array();
    $modes = array(
      'node' => t('Node forms'),
      'comment' => t('Comment forms'),
    );

    foreach ($used_modes as $mode) {
      $display_modes[] = $modes[$mode];
    }
    $options['modes'] = array(
      'category' => 'canned_texts',
      'title' => t('Show in'),
      'value' => count($display_modes) ? implode(', ', $display_modes) : t('- None selected -'),
    );

    $weight = $this->get_option('weight');
    if (empty($weight)) {
      $weight = 10;
    }

    $options['show_title'] = array(
      'category' => 'canned_texts',
      'title' => t('Show title'),
      'value' => $this->get_option('show_title') ? t('Yes') : t('No'),
    );

  }

  /**
   * Provide the default form for setting options.
   */
  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    switch ($form_state['section']) {
      case 'types':
        $form['#title'] .= t('Node types');
        $form['types'] = array(
          '#type' => 'checkboxes',
          '#multiple' => TRUE,
          '#required' => TRUE,
          '#title' => t('Insert canned texts widgets in the following node types forms'),
          '#options' => node_get_types('names'),
          '#default_value' => $this->get_option('types'),
        );
        break;
    case 'modes':
      $form['#title'] .= t('Show in');
      $modes = array(
        'node' => t('In node forms'),
      );
      if (module_exists('comment')) {
        $modes['comment'] = t('In comment forms');
      }

      $form['modes'] = array(
        '#type' => 'checkboxes',
        '#multiple' => TRUE,
        '#required' => TRUE,
        '#title' => t('Select where insert the widget'),
        '#options' => $modes,
        '#default_value' => $this->get_option('modes'),
      );
      break;
    case 'show_title':
      $form['#title'] .= t('Show title');
      $form['show_title'] = array(
        '#type' => 'checkbox',
        '#title' => t('Show the title of the view above the widget.'),
        '#default_value' => $this->get_option('show_title'),
      );
      break;
    }
  }

  function options_submit($form, &$form_state) {
    parent::options_submit($form, $form_state);

    switch ($form_state['section']) {
      case 'types':
        $this->set_option('types', array_filter($form_state['values']['types']));
        break;
      case 'modes':
        $this->set_option('modes', array_filter($form_state['values']['modes']));
        break;
      case 'show_title':
        $this->set_option('show_title', $form_state['values']['show_title']);
        break;
    }
  }

  function uses_exposed() {}

  function query() {
    if ($this->view->style_plugin->uses_row_plugin()) {
      $this->row_id = $this->view->query->add_field($this->view->query->base_table, $this->view->query->base_field);
    }
  }

  function execute() {
    return $this->view->render($this->display->id);
  }

  function render() {
    return !empty($this->view->result) || !empty($this->view->style_plugin->definition['even empty']) ? $this->view->style_plugin->render($this->view->result) : '';
  }

  /**
   * This method is a workarround to get something similar
   * to a rendered view, but in a array.
   */
  function render_array() {
    if ($this->view->style_plugin->uses_row_plugin() && empty($this->view->style_plugin->row_plugin)) {
      vpr('views_plugin_style_default: Missing row plugin');
      return;
    }

    if (!empty($this->row_id)) {
      $id = $this->row_id;
    }
    else {
      return array();
    }

    // Group the rows according to the grouping field, if specified.
    $sets = $this->view->style_plugin->render_grouping($this->view->result, $this->options['grouping']);

    // Render each group separately and concatenate.  Plugins may override this
    // method if they wish some other way of handling grouping.
    $output = '';
    foreach ($sets as $title => $records) {
      if ($this->view->style_plugin->uses_row_plugin()) {
        $rows = array();
        foreach ($records as $row_index => $row) {
          $this->view->row_index = $row_index;
          $rows[$row->$id] = $this->view->style_plugin->row_plugin->render($row);
        }
      }
      else {
        $rows = $records;
      }

      $output[] = theme($this->theme_functions(), $this->view, $this->options, $rows, $title);
    }
    unset($this->view->row_index);
    return $rows;
  }
}
