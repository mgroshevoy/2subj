'use strict';

var contacts = null;
var timerId;

// Get contacts
chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
  if (!contacts) {
    googleOAuthContacts.onload();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, contacts, function (response) {
        //console.log(response);
      });
    });
  }
});

// Periodic updates
timerId = setInterval(function () {
  googleOAuthContacts.onload();
}, 3600000);

// Get contacts on install event
chrome.runtime.onInstalled.addListener(function (details) {
  googleOAuthContacts.onload();
});

var googleOAuthContacts = function () {

  var STATE_START = 1;
  var STATE_ACQUIRING_AUTHTOKEN = 2;
  var STATE_AUTHTOKEN_ACQUIRED = 3;

  var state = STATE_START;

  function changeState(newState) {
    state = newState;
    switch (state) {
      case STATE_START:
        break;
      case STATE_ACQUIRING_AUTHTOKEN:
        var messageStr = 'Acquiring token...';
        console.log(messageStr);
        break;
      case STATE_AUTHTOKEN_ACQUIRED:
        break;
    }
  }

  function xhrWithAuth(method, url, interactive, callback) {
    var access_token;

    var retry = true;

    getToken();

    function getToken() {
      chrome.identity.getAuthToken({ interactive: interactive }, function (token) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }

        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: access_token }, getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function onContacts(error, status, response) {
    var data = JSON.parse(response);
    console.log(data);
    if (!data) return;
    contacts = [];
    for (var i = 0, entry; entry = data.feed.entry[i]; i++) {
      if (entry['gd$email']) {
        var emails = entry['gd$email'];
        if (!entry['title']['$t']) {
          entry['title']['$t'] = emails[0]['address'] || '<Unknown>';
        }
        for (var j = 0, email; email = emails[j]; j++) {
          contacts.push({
            name: entry['title']['$t'],
            email: email['address']
          });
        }
      }
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, contacts, function (response) {
        //console.log(response);
      });
    });
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET', 'https://www.google.com/m8/feeds/contacts/default/full?alt=json&max-results=999', interactive, onContacts);
  }

  /**
   Retrieves a valid token.
   **/
  function interactiveSignIn() {
    changeState(STATE_ACQUIRING_AUTHTOKEN);

    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError);
        changeState(STATE_START);
      } else {
        var messageStr = 'Token acquired:' + token + '. See chrome://identity-internals for details.';
        console.log(messageStr);
        changeState(STATE_AUTHTOKEN_ACQUIRED);
      }
    });
  }

  // function revokeToken() {
  //   chrome.identity.getAuthToken({'interactive': false}, function (current_token) {
  //     if (!chrome.runtime.lastError) {
  //
  //       chrome.identity.removeCachedAuthToken({token: current_token}, function () {
  //       });
  //       var xhr = new XMLHttpRequest();
  //       xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + current_token);
  //       xhr.send();
  //       changeState(STATE_START);
  //     }
  //   });
  // }


  return {
    onload: function onload() {
      interactiveSignIn();
      getUserInfo(false);
    }
  };
}();