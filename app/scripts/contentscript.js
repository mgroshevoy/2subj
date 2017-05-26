'use strict';


var peopleArray = [];
vex.defaultOptions.className = 'vex-theme-default';

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  peopleArray = msg;
  console.log(msg);
});

console.log(peopleArray);

chrome.runtime.sendMessage('ReadyToRoll');

document.addEventListener("DOMContentLoaded",
  InboxSDK.load(2, 'sdk_securemail_c8bcce88ba')
    .then(function(sdk) {

  sdk.Compose.registerComposeViewHandler(function(composeView){

    // a compose view has come into existence, do something with it!
    composeView.addButton({
      title: 'SecureMail',
      iconUrl: chrome.extension.getURL("images/icon-48.png"),
      onClick: function(event) {
        openPopup(event.composeView);
      },
    });
  });

  function openPopup(event) {

    var subject = '';
    var $select, checked = 'checked';
    var subj = event.getSubject();
    var emails = subj.match(/(?:#to\s)([^\s]+)/g);

    if (emails) {
      emails.forEach(function (email) {
        subj = subj.replace(email, '');
      });
    } else emails = [];

    chrome.storage.local.get({
      secureEmailAddress: '',
    }, function (items) {
      event.getToRecipients().forEach(function (value) {
        if (value.emailAddress !== items.secureEmailAddress) {
          emails.push('#to ' + value.emailAddress);
          $select[0].selectize.addOption({email: value.emailAddress});
          $select[0].selectize.addItem(value.emailAddress);
        }
      });
      //  event.setToRecipients([items.secureEmailAddress]);
    });
    console.log(emails);

    if (subj.search('#allow') + 1) {
      subj = subj.replace('#allow', '');
      checked = '';
    }
    subj = subj.trim().replace(/\s+/g, ' ');

    var REGEX_EMAIL = '([a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@' +
      '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)';

    var isClose = false, isCancel = false, isCleanUp = false;

    var vexInstance = vex.dialog.open({
      showCloseButton: false,
      escapeButtonCloses: false,
      overlayClosesOnClick: false,
      input: [
        '<div><label style="position: relative;font-weight: 600;bottom: 20px;">Prepare Encrypted Email</label><input type="hidden"><button id="unencrypt" class="vex-dialog-button-primary vex-dialog-button">Unencrypt</button></div>',
        '<label>Subject:</label><input type="text" class="contacts" style="font-size: 0.75em;" autofocus name="subject" value="' + subj + '" placeholder="Please enter a subject">',
        '<label>To:</label><select id="select-to" class="contacts" placeholder="Recipient email addresses"></select>',
        '<label style="font-size: 0.75em;">Encrypt message content (attachments are always encrypted) &nbsp; </label><input name="encrypt" style="position: relative; top: 2px;" type="checkbox" ' + checked + '>',
      ].join(''),
      buttons: [
        $.extend({}, vex.dialog.buttons.YES, {text: 'OK', click: function (event) {
          isClose = true;
        }}),
        $.extend({}, vex.dialog.buttons.YES, {text: 'Cancel', click: function (event) {
          isClose = true;
          isCancel = true;
        }})
      ],
      beforeClose: function () {
        return isClose;
      },
      callback: function callback(data) {
        if (isCancel) data = undefined;
        if (!data) {
          if(isCleanUp) {
            console.log('Clean Up!');
            console.log(emails);
            event.setToRecipients(emails.map(function (email) {
              console.log(email);
              return email.substring(4);
            }));
            event.setSubject(subj);
          } else console.log('Cancelled');
        } else {

          chrome.storage.local.get({
            secureEmailAddress: '',
          }, function (items) {
              event.setToRecipients([items.secureEmailAddress]);
          });

          $select[0].selectize.items.forEach(function (email) {
            if (subject !== '') subject = subject + ' ';
            subject += '#to ' + email;
          });
          if (!data.encrypt) subject = '#allow ' + subject;
          if (data.subject && data.subject.length > 0) {
            subject = data.subject.trim().replace(/\s+/g, ' ')
              + ' ' + subject;
          }
          event.setSubject(subject);
        }
      }
    });

    $('#unencrypt').click(function () {
      isClose = true;
      isCleanUp = true;
      isCancel = true;
    });

    $select = $('#select-to').selectize({
      plugins: ['remove_button'],
      //persist: false,
      maxItems: null,
      valueField: 'email',
      labelField: 'name',
      searchField: ['name', 'email'],
      sortField: [
        {field: 'name', direction: 'asc'},
        {field: 'email', direction: 'asc'}
      ],
      options: peopleArray,
      render: {
        item: function (item, escape) {
          return '<div>' +
            (item.name ? '<span class="name">' + escape(item.name) + '</span>' : '') +
            (item.email ? '<span class="email">' + escape(item.email) + '</span>' : '') +
            '</div>';
        },
        option: function (item, escape) {
          var label = item.name || item.email;
          var caption = item.name ? item.email : null;
          return '<div>' +
            '<span class="label">' + escape(label) + '</span>' +
            (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') +
            '</div>';
        }
      },
      createFilter: function (input) {
        var match, regex;

        // email@address.com
        regex = new RegExp('^' + REGEX_EMAIL + '$', 'i');
        match = input.match(regex);
        if (match) return !this.options.hasOwnProperty(match[0]);

        // name <email@address.com>
        regex = new RegExp('^([^<]*)\<' + REGEX_EMAIL + '\>$', 'i');
        match = input.match(regex);
        if (match) return !this.options.hasOwnProperty(match[2]);

        return false;
      },
      create: function (input) {
        if ((new RegExp('^' + REGEX_EMAIL + '$', 'i')).test(input)) {
          return {email: input};
        }
        var match = input.match(new RegExp('^([^<]*)\<' + REGEX_EMAIL + '\>$', 'i'));
        if (match) {
          return {
            email: match[2],
            name: $.trim(match[1])
          };
        }
        console.log('Invalid email address.');
        return false;
      }
    });

    if (emails) {
      emails.forEach(function (email) {
        $select[0].selectize.addOption({email: email.substr(4)});
        $select[0].selectize.addItem(email.substr(4));
      });
    }
  }

}));