// $Id$

Drupal.behaviors.canned_texts_load = function(context) {

  if (typeof(insertTextarea) == 'undefined') {
    insertTextarea = $('#edit-body').get(0) || false;
  }

  $(".canned_text_widget").change(function () {
    if ($(this).hasClass("mode-node")) {
      var url = '/canned_texts_node/';
    }
    else {
      var url = '/canned_texts_comment/';
    }
    var widget = this.id;

    var nid = $(this).val();
    if (!nid) {
      return;
    }
    $.ajax({
        url: url + this.value,
        dataType: 'json',
        async: true,
        beforeSend: function(){
          $("#" + widget).after('<span id = "remove-after-' + widget + '" class = "canned-texts-throbbing">&nbsp</span>');
        },
        complete: function(){
          $("#remove-after-" + widget).remove();
        },
        success: function(canned_text) {
          Drupal.canned_texts.insertIntoActiveEditor(canned_text);
        }
      });
  });
}

// Code extracted from insert module
// General Insert API functions.
Drupal.canned_texts = {
  /**
   * Insert content into the current (or last active) editor on the page. This
   * should work with most WYSIWYGs as well as plain textareas.
   *
   * @param content
   */
  insertIntoActiveEditor: function(content) {
    // Always work in normal text areas that currently have focus.
    if (insertTextarea && insertTextarea.insertHasFocus) {
      Drupal.insert.insertAtCursor(insertTextarea, content);
    }
    // Direct tinyMCE support.
    else if (typeof(tinyMCE) != 'undefined' && tinyMCE.activeEditor && Drupal.wysiwyg.instances[Drupal.wysiwyg.activeId].editor != "none") {
      tinyMCE.activeEditor.execCommand('mceInsertContent', false, content);
    }
    // WYSIWYG support, should work in all editors if available.
    else if (Drupal.wysiwyg && Drupal.wysiwyg.activeId && Drupal.wysiwyg.instances[Drupal.wysiwyg.activeId].field) {
      Drupal.wysiwyg.instances[Drupal.wysiwyg.activeId].insert(content)
    }
    // FCKeditor module support.
    else if (typeof(FCKeditorAPI) != 'undefined' && typeof(fckActiveId) != 'undefined') {
      FCKeditorAPI.Instances[fckActiveId].InsertHtml(content);
    }
    // Direct FCKeditor support (only body field supported).
    else if (typeof(FCKeditorAPI) != 'undefined') {
      // Try inserting into the body.
      if (FCKeditorAPI.Instances['edit-body']) {
        FCKeditorAPI.Instances['edit-body'].InsertHtml(content);
      }
      // Try inserting into the first instance we find (may occur with very
      // old versions of FCKeditor).
      else {
        for (var n in FCKeditorAPI.Instances) {
          FCKeditorAPI.Instances[n].InsertHtml(content);
          break;
        }
      }
    }
    // Direct CKeditor support (only body field supported).
    else if (typeof(CKEDITOR) != 'undefined' && CKEDITOR.instances['edit-body']) {
      CKEDITOR.instances['edit-body'].insertHtml(content);
    }
    else if (insertTextarea) {
      Drupal.canned_texts.insertAtCursor(insertTextarea, content);
    }

    return false;
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
      editor.value = editor.value.substring(0, startPos)+ content + editor.value.substring(endPos, editor.value.length);
    }

    // Fallback, just add to the end of the content.
    else {
      editor.value += content;
    }
  }
};
