/**
 * @file
 * Based on insert.js of insert module.
 */

(function ($) {

/**
 * Behavior to add "Insert" buttons.
 */
Drupal.behaviors.canned_texts = {};
Drupal.behaviors.canned_texts.attach = function(context) {
  if (typeof(insertTextarea) == 'undefined') {
    insertTextarea = $('#edit-body textarea.text-full').get(0) || false;
  }

  // Keep track of the last active textarea (if not using WYSIWYG).
  $('textarea:not([name$="[data][title]"]):not(.canned-text-insert-processed)', context).addClass('canned-text-insert-processed').focus(insertSetActive).blur(insertRemoveActive);

  // Add the click handler to the insert button.
  $('.canned-text-insert-button:not(.canned-text-insert-processed)', context).addClass('canned-text-insert-processed').click(insert);

  function insertSetActive() {
    insertTextarea = this;
    this.insertHasFocus = true;
  }

  function insertRemoveActive() {
    if (insertTextarea == this) {
      var thisTextarea = this;
      setTimeout(function() {
        thisTextarea.insertHasFocus = false;
      }, 1000);
    }
  }

  function insert(e) {
    var machine_name = $('#' + $(this).attr('rel')).val();
    var content = '';
    var options = {};

    if (machine_name.length > 0) {
      $.get(Drupal.settings.basePath + 'canned_texts/' + machine_name + '/' +  window.location.pathname, function(data){
        content = data;

        // Allow other modules to perform replacements.
        options['content'] = content;
        $.event.trigger('insertIntoActiveEditor', [options]);
        content = options['content'];

        // Insert the text.
        Drupal.canned_texts_insert.insertIntoActiveEditor(content);
      });
      e.preventDefault();
    }
  }
};

// General Insert API functions.
Drupal.canned_texts_insert = {
  /**
   * Insert content into the current (or last active) editor on the page. This
   * should work with most WYSIWYGs as well as plain textareas.
   *
   * @param content
   */
  insertIntoActiveEditor: function(content) {
    var editorElement;

    // Always work in normal text areas that currently have focus.
    if (insertTextarea && insertTextarea.insertHasFocus) {
      editorElement = insertTextarea;
      Drupal.canned_texts_insert.insertAtCursor(insertTextarea, content);
    }
    // Direct tinyMCE support.
    else if (typeof(tinyMCE) != 'undefined' && tinyMCE.activeEditor) {
      editorElement = document.getElementById(tinyMCE.activeEditor.editorId);
      Drupal.canned_texts_insert.activateTabPane(editorElement);
      tinyMCE.activeEditor.execCommand('mceInsertContent', false, content);
    }
    // WYSIWYG support, should work in all editors if available.
    else if (Drupal.wysiwyg && Drupal.wysiwyg.activeId) {
      editorElement = document.getElementById(Drupal.wysiwyg.activeId);
      Drupal.canned_texts_insert.activateTabPane(editorElement);
      Drupal.wysiwyg.instances[Drupal.wysiwyg.activeId].insert(content);
    }
    // FCKeditor module support.
    else if (typeof(FCKeditorAPI) != 'undefined' && typeof(fckActiveId) != 'undefined') {
      editorElement = document.getElementById(fckActiveId);
      Drupal.canned_texts_insert.activateTabPane(editorElement);
      FCKeditorAPI.Instances[fckActiveId].InsertHtml(content);
    }
    // Direct FCKeditor support (only body field supported).
    else if (typeof(FCKeditorAPI) != 'undefined') {
      // Try inserting into the body.
      if (FCKeditorAPI.Instances[insertTextarea.id]) {
        editorElement = insertTextarea;
        Drupal.canned_texts_insert.activateTabPane(editorElement);
        FCKeditorAPI.Instances[insertTextarea.id].InsertHtml(content);
      }
      // Try inserting into the first instance we find (may occur with very
      // old versions of FCKeditor).
      else {
        for (var n in FCKeditorAPI.Instances) {
          editorElement = document.getElementById(n);
          Drupal.canned_texts_insert.activateTabPane(editorElement);
          FCKeditorAPI.Instances[n].InsertHtml(content);
          break;
        }
      }
    }
    // CKeditor module support.
    else if (typeof(CKEDITOR) != 'undefined' && typeof(Drupal.ckeditorActiveId) != 'undefined') {
      editorElement = document.getElementById(Drupal.ckeditorActiveId);
      Drupal.canned_texts_insert.activateTabPane(editorElement);
      CKEDITOR.instances[Drupal.ckeditorActiveId].insertHtml(content);
    }
    // Direct CKeditor support (only body field supported).
    else if (typeof(CKEDITOR) != 'undefined' && CKEDITOR.instances[insertTextarea.id]) {
      editorElement = insertTextarea;
      Drupal.canned_texts_insert.activateTabPane(editorElement);
      CKEDITOR.instances[insertTextarea.id].insertHtml(content);
    }
    else if (insertTextarea) {
      editorElement = insertTextarea;
      Drupal.canned_texts_insert.activateTabPane(editorElement);
      Drupal.canned_texts_insert.insertAtCursor(insertTextarea, content);
    }

    return false;
  },

  /**
   * Check for vertical tabs and activate the pane containing the editor.
   *
   * @param editor
   *   The DOM object of the editor that will be checked.
   */
  activateTabPane: function(editor) {
    var $pane = $(editor).parents('.vertical-tabs-pane:first');
    var $panes = $pane.parent('.vertical-tabs-panes');
    var $tabs = $panes.parents('.vertical-tabs:first').find('ul.vertical-tabs-list:first li a');
    if ($pane.size() && $pane.is(':hidden') && $panes.size() && $tabs.size()) {
      var index = $panes.children().index($pane);
      $tabs.eq(index).click();
    }
  },

  /**
   * Insert content into a textarea at the current cursor position.
   *
   * @param editor
   *   The DOM object of the textarea that will receive the text.
   * @param content
   *   The string to be inserted.
   */
  insertAtCursor: function(editor, content) {
    // Record the current scroll position.
    var scroll = editor.scrollTop;

    // IE support.
    if (document.selection) {
      editor.focus();
      sel = document.selection.createRange();
      sel.text = content;
    }

    // Mozilla/Firefox/Netscape 7+ support.
    else if (editor.selectionStart || editor.selectionStart == '0') {
      var startPos = editor.selectionStart;
      var endPos = editor.selectionEnd;
      editor.value = editor.value.substring(0, startPos) + content + editor.value.substring(endPos, editor.value.length);
    }

    // Fallback, just add to the end of the content.
    else {
      editor.value += content;
    }

    // Ensure the textarea does not unexpectedly scroll.
    editor.scrollTop = scroll;
  }
};

})(jQuery);
