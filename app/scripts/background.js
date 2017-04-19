'use strict';

chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {
  googleOAuthContacts.onload();
});

chrome.runtime.onInstalled.addListener(function (details) {
  googleOAuthContacts.onload();
});


var googleOAuthContacts = function () {

  var STATE_START = 1;
  var STATE_ACQUIRING_AUTHTOKEN = 2;
  var STATE_AUTHTOKEN_ACQUIRED = 3;

  var state = STATE_START;

  var signin_button, revoke_button, asana_button;

  function disableButton(button) {
    button.setAttribute('disabled', 'disabled');
  }

  function enableButton(button) {
    button.removeAttribute('disabled');
  }

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

  // @corecode_begin getProtectedData
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

  var contacts = null;

  function onContacts(error, status, response) {
    contacts = [];
    var data = JSON.parse(response);
    console.log(data);
    for (var i = 0, entry; entry = data.feed.entry[i]; i++) {
      if (entry['gd$email']) {
          var emails = entry['gd$email'];
          for (var j = 0, email; email = emails[j]; j++) {
            contacts.push({
              name:entry['title']['$t'],
              email:email['address']});
          }
      }
      // if (entry['gd$email']) {
      //   var contact = {
      //     'name': entry['title']['$t'],
      //     'id': entry['id']['$t'],
      //     'emails': []
      //   };
      //   if (!contact['name']) {
      //     contact['name'] = contact['emails'][0] || '<Unknown>';
      //   }
      //   contacts.push(contact);
      // }
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, contacts, function(response) {
        //console.log(response);
      });
    });
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
    // 'https://www.googleapis.com/plus/v1/people/me',
    'https://www.google.com/m8/feeds/contacts/default/full?alt=json&max-results=999', interactive, onContacts);
  }
  // @corecode_end getProtectedData


  // Code updating the user interface, when the user information has been
  // fetched or displaying the error.
  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      changeState(STATE_AUTHTOKEN_ACQUIRED);
      sampleSupport.log(response);
      var user_info = JSON.parse(response);
      populateUserInfo(user_info);
    } else {
      changeState(STATE_START);
    }
  }

  // OnClick event handlers for the buttons.

  /**
   Retrieves a valid token. Since this is initiated by the user
   clicking in the Sign In button, we want it to be interactive -
   ie, when no token is found, the auth window is presented to the user.
   Observe that the token does not need to be cached by the app.
   Chrome caches tokens and takes care of renewing when it is expired.
   In that sense, getAuthToken only goes to the server if there is
   no cached token or if it is expired. If you want to force a new
   token (for example when user changes the password on the service)
   you need to call removeCachedAuthToken()
   **/
  function interactiveSignIn() {
    changeState(STATE_ACQUIRING_AUTHTOKEN);

    // @corecode_begin getAuthToken
    // @description This is the normal flow for authentication/authorization
    // on Google properties. You need to add the oauth2 client_id and scopes
    // to the app manifest. The interactive param indicates if a new window
    // will be opened when the user is not yet authenticated or not.
    // @see http://developer.chrome.com/apps/app_identity.html
    // @see http://developer.chrome.com/apps/identity.html#method-getAuthToken
    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
      if (chrome.runtime.lastError) {
        sampleSupport.log(chrome.runtime.lastError);
        changeState(STATE_START);
      } else {
        var messageStr = 'Token acquired:' + token + '. See chrome://identity-internals for details.';
        console.log(messageStr);
        //        addToLogger(messageStr);
        changeState(STATE_AUTHTOKEN_ACQUIRED);
      }
    });
    // @corecode_end getAuthToken
  }

  function revokeToken() {
    chrome.identity.getAuthToken({ 'interactive': false }, function (current_token) {
      if (!chrome.runtime.lastError) {

        // @corecode_begin removeAndRevokeAuthToken
        // @corecode_begin removeCachedAuthToken
        // Remove the local cached token
        chrome.identity.removeCachedAuthToken({ token: current_token }, function () {});
        // @corecode_end removeCachedAuthToken

        // Make a request to revoke token in the server
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + current_token);
        xhr.send();
        // @corecode_end removeAndRevokeAuthToken

        // Update the user interface accordingly
        changeState(STATE_START);
        // addToLogger('Token revoked and removed from cache. '+
        //   'Check chrome://identity-internals to confirm.');
      }
    });
  }


  return {
    onload: function onload() {
      interactiveSignIn().then(function () {
        getUserInfo(false);
      });
    }
  };
}();

