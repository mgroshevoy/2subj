'use strict';

var peopleArray = [];
vex.defaultOptions.className = 'vex-theme-os';

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  peopleArray = msg;
});

chrome.runtime.sendMessage('ReadyToRoll');

document.body.addEventListener('contextmenu', function (event) {
  if (event.ctrlKey || event.shiftKey) {
    console.log(event);
    if (event.target.tagName === 'INPUT') {
      event.preventDefault();
      openPopup(event);
    }
  }
});

function openPopup(event) {

  var subject = '';
  var $select, checked = 'checked';
  var subj = event.target.value.trim();
  var emails = subj.match(/(?:#to\s)([^\s]+)/g);
  if (emails) {
    emails.forEach(function (email) {
      subj = subj.replace(email, '');
      console.log(subj);
    });
  }
  if (subj.search('#allow') + 1) {
    subj = subj.replace('#allow', '');
    checked = '';
  }
  subj = subj.trim().replace(/\s+/g, ' ');

  var REGEX_EMAIL = '([a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@' +
    '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)';

  vex.dialog.open({
    showCloseButton: true,
    escapeButtonCloses: false,
    //message: 'Enter email addresses:',
    input: [
      '<label>Encrypt entire message (attachments are always encrypted): </label><input name="encrypt" type="checkbox" ' + checked + '><hr>',
      '<label>Subject:</label><input type="text" class="contacts" autofocus name="subject" value="' + subj + '">',
      '<label>Enter email addresses:</label><select id="select-to" class="contacts" placeholder="Pick some people..."></select>'
    ].join(''),
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, {text: 'OK'}),
      $.extend({}, vex.dialog.buttons.NO, {text: 'Cancel'})
    ],
    callback: function callback(data) {
      if (!data) {
        console.log('Cancelled');
      } else {
        console.log($select[0].selectize.items);
        $select[0].selectize.items.forEach(function (email) {
          if (subject !== '') subject = subject + ' ';
          subject += '#to ' + email;
        });
        if (!data.encrypt) subject = '#allow ' + subject;
        if (data.subject.length > 0) {
          subject = data.subject.trim().replace(/\s+/g, ' ')
            + ' ' + subject;
          // if(event.target.value.trim().search(subj) === 0) {
          //   subject = data.subject.trim() + ' ' + subject;
          // } else {
          //   subject += ' ' + data.subject.trim().replace(/\s+/g,' ');
          // }
        }
        event.target.value = subject;
      }
    }
  });

  $select = $('#select-to').selectize({
    persist: false,
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
      alert('Invalid email address.');
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

