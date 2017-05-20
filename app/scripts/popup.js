'use strict';

  function save_options() {
    var addressTo = document.getElementById('addressTo').value;
    // localStorage.setItem('secureEmailAddress', addressTo);
    chrome.storage.local.set({
      secureEmailAddress: addressTo,
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Your secure address saved.';
      setTimeout(function() {
        status.innerHTML = '&nbsp;';
      }, 750);
    });
  }

  function restore_options() {
    // document.getElementById('addressTo').value = localStorage.getItem('secureEmailAddress')
    chrome.storage.local.get({
      secureEmailAddress: ''
    }, function(items) {
      console.log(items);
      document.getElementById('addressTo').value = items.secureEmailAddress;
    });
  }

  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
    save_options);
