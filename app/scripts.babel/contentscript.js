'use strict';

const chromep = new ChromePromise();
let peopleArray = [];
//vex.defaultOptions.className = 'vex-theme-default';
vex.defaultOptions = {
  content: '',
  unsafeContent: '',
  showCloseButton: false,
  escapeButtonCloses: false,
  overlayClosesOnClick: false,
  appendLocation: 'body',
  className: 'vex-theme-default',
  overlayClassName: '',
  contentClassName: '',
  closeClassName: '',
  closeAllOnPopState: false
};
let secureEmailAddress, secureDomain;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  peopleArray = msg;
  console.log(msg);
});

console.log(peopleArray);

chrome.runtime.sendMessage('getContacts');

document.addEventListener('DOMContentLoaded',
  InboxSDK.load(2, 'sdk_securemail_c8bcce88ba')
    .then(function (sdk) {

      sdk.Compose.registerComposeViewHandler(async composeView => {

        let isSending = false;
        let PreventSend = await chromep.storage.sync.get('isPreventSend');
        let isPreventSend = PreventSend ? PreventSend.isPreventSend : PreventSend;

        secureEmailAddress = (await chromep.storage.sync.get('secureEmailAddress')).secureEmailAddress;
        secureDomain = secureEmailAddress.match(/@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);

        composeView.on('presending', event => {
          if (isPreventSend === true && !isSending && !(composeView.getToRecipients().find(item => item.emailAddress.includes('.at.') || item.emailAddress.includes(secureEmailAddress)))) {
            isSending = true;
            vex.dialog.confirm({
              showCloseButton: false,
              escapeButtonCloses: false,
              overlayClosesOnClick: false,
              message: 'Are you sure that you want to send this email unsecurely?',
              callback: function (value) {
                if (value) {
                  console.log('Message sent');
                  composeView.send();
                  isSending = false;
                } else {
                  console.log('Message cancelled');
                  isSending = false;
                  event.cancel();
                }
              }
            });
            event.cancel();
          }
        });
        // a compose view has come into existence, do something with it!
        composeView.addButton({
          title: 'SecureMail',
          iconUrl: chrome.extension.getURL('images/icon-48.png'),
          onClick: function (event) {
            openPopup(event.composeView);
          },
        });
      });

      async function openPopup(event) {

        const REGEX_EMAIL = '([a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@' +
          '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)';

        let isClose = false, isCancel = false, isCleanUp = false;

        let subject = '';
        let $select, checked = 'checked';
        let subj = event.getSubject();

        secureEmailAddress = (await chromep.storage.sync.get('secureEmailAddress')).secureEmailAddress;
        if (!secureEmailAddress || !secureEmailAddress.length) {
          vex.dialog.alert('Please, set your secure mail address!');
          return;
        }

        if (subj.search('#allow') + 1) {
          subj = subj.replace('#allow', '');
          checked = '';
        }
        subj = subj.trim().replace(/\s+/g, ' ');

        let vexInstance = vex.dialog.open({
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
            $.extend({}, vex.dialog.buttons.YES, {
              text: 'OK', click: function (event) {
                isClose = true;
              }
            }),
            $.extend({}, vex.dialog.buttons.YES, {
              text: 'Cancel', click: function (event) {
                isClose = true;
                isCancel = true;
              }
            })
          ],
          beforeClose: function () {
            return isClose;
          },
          callback: async function callback(data) {
            let arrayTo = [];

            secureEmailAddress = (await chromep.storage.sync.get('secureEmailAddress')).secureEmailAddress;
            secureDomain = secureEmailAddress.match(/@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);

            if (isCancel) data = undefined;
            if (!data) {
              if (isCleanUp) {
                console.log('Clean Up!');

                $select[0].selectize.items.forEach(item => {
                  let name = _.find($select[0].selectize.options, {email: item}).name;
                  if (name === item) name = null;
                  if (item.match(/\.at\./) && item.match(secureDomain)) {
                    arrayTo.push((name ? name + '<' : '')
                      + item.replace(secureDomain, '').replace(/^(.*)\.at\.(.*?)$/, '$1@$2') + (name ? '>' : ''));
                  } else {
                    arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                  }
                });

                event.setToRecipients(arrayTo);
                event.setSubject(subj);
              } else console.log('Cancelled');
            } else {

              arrayTo.push(secureEmailAddress);
              $select[0].selectize.items.forEach(item => {
                let name = _.find($select[0].selectize.options, {email: item}).name;
                if (name === item) name = undefined;
                if (item.match(secureDomain)) {
                  arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                } else {
                  arrayTo.push((name ? name + '<' : '') + item.replace('@', '.at.') + secureDomain + (name ? '>' : ''));
                }
              });

              event.setToRecipients(arrayTo);

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
              let label = item.name || item.email;
              let caption = item.name ? item.email : null;
              return '<div>' +
                '<span class="label">' + escape(label) + '</span>' +
                (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') +
                '</div>';
            }
          },
          createFilter: function (input) {
            let match, regex;

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
            let match = input.match(new RegExp('^([^<]*)\<' + REGEX_EMAIL + '\>$', 'i'));
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

        event.getToRecipients().forEach(function (value) {
          console.log(value);
          if (value.emailAddress !== secureEmailAddress) {
            //emails.push('#to ' + value.emailAddress);
            $select[0].selectize.addOption({
              name: value.name,
              email: value.emailAddress
            });
            $select[0].selectize.addItem(value.emailAddress);
          }
        });

        // if (emails) {
        //   emails.forEach(function (email) {
        //     $select[0].selectize.addOption({email: email.substr(4)});
        //     $select[0].selectize.addItem(email.substr(4));
        //   });
        // }
      }

    }));