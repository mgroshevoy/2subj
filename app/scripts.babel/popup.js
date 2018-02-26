'use strict';

const REGEX_EMAIL = '([a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@' +
  '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)';

function save_options() {
  let addressTo = document.getElementById('addressTo').value;
  let isPreventSend = document.getElementById('isPreventSend').checked;
  chrome.storage.sync.set({isPreventSend: isPreventSend});
  if (!addressTo.match(new RegExp('^' + REGEX_EMAIL + '$', 'i')) || (!addressTo.includes('.secure-comm.com') && !addressTo.includes('.stayprivate.com'))) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.extension.getURL('images/icon-48.png'),
      title: 'SecureMail',
      message: 'Error! Please, enter a valid email address!'
    });
    document.getElementById('addressTo').value = '';
    return;
  }

  // localStorage.setItem('secureEmailAddress', addressTo);
  chrome.storage.sync.set({
    secureEmailAddress: addressTo,
  }, function () {
    // Update status to let user know options were saved.
    //var status = document.getElementById('status');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.extension.getURL('images/icon-48.png'),
      title: 'SecureMail',
      message: 'Your secure address saved.'
    }, function() {window.close()});
    // status.textContent = 'Your secure address saved.';
    // setTimeout(function() {
    //   status.innerHTML = '&nbsp;';
    // }, 750);
  });
}

function restore_options() {
  // document.getElementById('addressTo').value = localStorage.getItem('secureEmailAddress')
  chrome.storage.sync.get(function (items) {
    console.log(items);
    document.getElementById('addressTo').value = items.secureEmailAddress || '';
    document.getElementById('isPreventSend').checked = items.isPreventSend;
  });
}

document.getElementById('isPreventSend').addEventListener('change', function (event) {
  chrome.storage.sync.set({
    isPreventSend: event.target.checked
  });
});

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);
