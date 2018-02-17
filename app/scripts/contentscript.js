'use strict';

var chromep = new ChromePromise();
var peopleArray = [];
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
var secureEmailAddress = void 0,
    secureDomain = void 0;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  peopleArray = msg;
  console.log(msg);
});

console.log(peopleArray);

chrome.runtime.sendMessage('getContacts');

document.addEventListener('DOMContentLoaded', InboxSDK.load(2, 'sdk_securemail_c8bcce88ba').then(function (sdk) {
  var _this = this;

  sdk.Compose.registerComposeViewHandler(function _callee(composeView) {
    var isSending, PreventSend, isPreventSend;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            isSending = false;
            _context.next = 3;
            return regeneratorRuntime.awrap(chromep.storage.sync.get('isPreventSend'));

          case 3:
            PreventSend = _context.sent;
            isPreventSend = PreventSend ? PreventSend.isPreventSend : PreventSend;
            _context.next = 7;
            return regeneratorRuntime.awrap(chromep.storage.sync.get('secureEmailAddress'));

          case 7:
            secureEmailAddress = _context.sent.secureEmailAddress;

            if (secureEmailAddress) secureDomain = secureEmailAddress.match(/@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);

            composeView.on('presending', function (event) {
              if (isPreventSend === true && !isSending && !composeView.getToRecipients().find(function (item) {
                return item.emailAddress.includes('.at.') || item.emailAddress.includes(secureEmailAddress);
              })) {
                isSending = true;
                vex.dialog.confirm({
                  showCloseButton: false,
                  escapeButtonCloses: false,
                  overlayClosesOnClick: false,
                  message: 'Are you sure that you want to send this email unsecurely?',
                  callback: function callback(value) {
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
              onClick: function onClick(event) {
                openPopup(event.composeView);
              }
            });

          case 11:
          case 'end':
            return _context.stop();
        }
      }
    }, null, _this);
  });

  function openPopup(event) {
    var REGEX_EMAIL, isClose, isCancel, isCleanUp, subject, $select, checked, subj, vexInstance, $selectcc, $selectbcc;
    return regeneratorRuntime.async(function openPopup$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            REGEX_EMAIL = '([a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@' + '(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)';
            isClose = false, isCancel = false, isCleanUp = false;
            subject = '';
            $select = void 0, checked = 'checked';
            subj = event.getSubject();
            _context3.next = 7;
            return regeneratorRuntime.awrap(chromep.storage.sync.get('secureEmailAddress'));

          case 7:
            secureEmailAddress = _context3.sent.secureEmailAddress;

            if (!(!secureEmailAddress || !secureEmailAddress.length)) {
              _context3.next = 11;
              break;
            }

            vex.dialog.alert('Please, set your secure mail address!');
            return _context3.abrupt('return');

          case 11:

            if (subj.search('#allow') + 1) {
              subj = subj.replace('#allow', '');
              checked = '';
            }
            subj = subj.trim().replace(/\s+/g, ' ');

            vexInstance = vex.dialog.open({
              showCloseButton: false,
              escapeButtonCloses: false,
              overlayClosesOnClick: false,
              input: ['<div><label style="position: relative;font-weight: 600;bottom: 20px;">Prepare Encrypted Email</label><input type="hidden"><button id="unencrypt" class="vex-dialog-button-primary vex-dialog-button">Unencrypt</button></div>', '<label>Subject:</label><input type="text" class="contacts" style="font-size: 0.75em;" autofocus name="subject" value="' + subj + '" placeholder="Please enter a subject">', '<label>To:</label><select id="select-to" class="contacts" placeholder="Recipient email addresses"></select>', '<label>Cc:</label><select id="cc-to" class="contacts" placeholder="Recipient email addresses"></select>', '<label>Bcc:</label><select id="bcc-to" class="contacts" placeholder="Recipient email addresses"></select>', '<label style="font-size: 0.75em;">Encrypt message content (attachments are always encrypted) &nbsp; </label><input name="encrypt" style="position: relative; top: 2px; left: 0;" type="checkbox" ' + checked + '>'].join(''),
              buttons: [$.extend({}, vex.dialog.buttons.YES, {
                text: 'OK', click: function click(event) {
                  isClose = true;
                }
              }), $.extend({}, vex.dialog.buttons.YES, {
                text: 'Cancel', click: function click(event) {
                  isClose = true;
                  isCancel = true;
                }
              })],
              beforeClose: function beforeClose() {
                return isClose;
              },
              callback: function callback(data) {
                var arrayTo;
                return regeneratorRuntime.async(function callback$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        arrayTo = [];
                        _context2.next = 3;
                        return regeneratorRuntime.awrap(chromep.storage.sync.get('secureEmailAddress'));

                      case 3:
                        secureEmailAddress = _context2.sent.secureEmailAddress;

                        secureDomain = secureEmailAddress.match(/@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);

                        if (isCancel) data = undefined;
                        if (!data) {
                          if (isCleanUp) {
                            console.log('Clean Up!');

                            arrayTo = [];
                            $select[0].selectize.items.forEach(function (item) {
                              var name = _.find($select[0].selectize.options, { email: item }).name;
                              name = name ? name.replace(',', '') : '';
                              if (name === item) name = null;
                              if (item.match(/\.at\./) && item.match(secureDomain)) {
                                arrayTo.push((name ? name + '<' : '') + item.replace(secureDomain, '').replace(/^(.*)\.at\.(.*?)$/, '$1@$2') + (name ? '>' : ''));
                              } else {
                                arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                              }
                            });

                            event.setToRecipients(arrayTo);
                            arrayTo = [];

                            $selectcc[0].selectize.items.forEach(function (item) {
                              var name = _.find($selectcc[0].selectize.options, { email: item }).name;
                              name = name && name.replace(',', '');
                              if (name === item) name = null;
                              if (item.match(/\.at\./) && item.match(secureDomain)) {
                                arrayTo.push((name ? name + '<' : '') + item.replace(secureDomain, '').replace(/^(.*)\.at\.(.*?)$/, '$1@$2') + (name ? '>' : ''));
                              } else {
                                arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                              }
                            });

                            event.setCcRecipients(arrayTo);
                            arrayTo = [];

                            $selectbcc[0].selectize.items.forEach(function (item) {
                              var name = _.find($selectbcc[0].selectize.options, { email: item }).name;
                              name = name && name.replace(',', '');
                              if (name === item) name = null;
                              if (item.match(/\.at\./) && item.match(secureDomain)) {
                                arrayTo.push((name ? name + '<' : '') + item.replace(secureDomain, '').replace(/^(.*)\.at\.(.*?)$/, '$1@$2') + (name ? '>' : ''));
                              } else {
                                arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                              }
                            });
                            event.setBccRecipients(arrayTo);

                            event.setSubject(subj);
                          } else console.log('Cancelled');
                        } else {

                          arrayTo = [];
                          $select[0].selectize.items.forEach(function (item) {
                            var name = _.find($select[0].selectize.options, { email: item }).name;
                            if (name === item) name = undefined;
                            if (item.match(secureDomain)) {
                              arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                            } else {
                              arrayTo.push((name ? name + '<' : '') + item.replace('@', '.at.') + secureDomain + (name ? '>' : ''));
                            }
                          });

                          event.setToRecipients(arrayTo);
                          arrayTo = [];

                          $selectcc[0].selectize.items.forEach(function (item) {
                            var name = _.find($selectcc[0].selectize.options, { email: item }).name;
                            name = name && name.replace(',', '');
                            if (name === item) name = undefined;
                            if (item.match(secureDomain)) {
                              arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                            } else {
                              arrayTo.push((name ? name + '<' : '') + item.replace('@', '.at.') + secureDomain + (name ? '>' : ''));
                            }
                          });

                          event.setCcRecipients(arrayTo);
                          arrayTo = [];

                          $selectbcc[0].selectize.items.forEach(function (item) {
                            var name = _.find($selectbcc[0].selectize.options, { email: item }).name;
                            name = name && name.replace(',', '');
                            if (name === item) name = undefined;
                            if (item.match(secureDomain)) {
                              arrayTo.push((name ? name + '<' : '') + item + (name ? '>' : ''));
                            } else {
                              arrayTo.push((name ? name + '<' : '') + item.replace('@', '.at.') + secureDomain + (name ? '>' : ''));
                            }
                          });

                          event.setBccRecipients(arrayTo);

                          if (!data.encrypt) subject = '#allow ' + subject;
                          if (data.subject && data.subject.length > 0) {
                            subject = data.subject.trim().replace(/\s+/g, ' ') + ' ' + subject;
                          }
                          event.setSubject(subject);
                        }

                      case 7:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, null, this);
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
              sortField: [{ field: 'name', direction: 'asc' }, { field: 'email', direction: 'asc' }],
              options: peopleArray,
              render: {
                item: function item(_item, escape) {
                  return '<div>' + (_item.name ? '<span class="name">' + escape(_item.name) + '</span>' : '') + (_item.email ? '<span class="email">' + escape(_item.email) + '</span>' : '') + '</div>';
                },
                option: function option(item, escape) {
                  var label = item.name || item.email;
                  var caption = item.name ? item.email : null;
                  return '<div>' + '<span class="label">' + escape(label) + '</span>' + (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') + '</div>';
                }
              },
              createFilter: function createFilter(input) {
                var match = void 0,
                    regex = void 0;

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
              create: function create(input) {
                if (new RegExp('^' + REGEX_EMAIL + '$', 'i').test(input)) {
                  return { email: input };
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

            $selectcc = $('#cc-to').selectize({
              plugins: ['remove_button'],
              //persist: false,
              maxItems: null,
              valueField: 'email',
              labelField: 'name',
              searchField: ['name', 'email'],
              sortField: [{ field: 'name', direction: 'asc' }, { field: 'email', direction: 'asc' }],
              options: peopleArray,
              render: {
                item: function item(_item2, escape) {
                  return '<div>' + (_item2.name ? '<span class="name">' + escape(_item2.name) + '</span>' : '') + (_item2.email ? '<span class="email">' + escape(_item2.email) + '</span>' : '') + '</div>';
                },
                option: function option(item, escape) {
                  var label = item.name || item.email;
                  var caption = item.name ? item.email : null;
                  return '<div>' + '<span class="label">' + escape(label) + '</span>' + (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') + '</div>';
                }
              },
              createFilter: function createFilter(input) {
                var match = void 0,
                    regex = void 0;

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
              create: function create(input) {
                if (new RegExp('^' + REGEX_EMAIL + '$', 'i').test(input)) {
                  return { email: input };
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
            $selectbcc = $('#bcc-to').selectize({
              plugins: ['remove_button'],
              //persist: false,
              maxItems: null,
              valueField: 'email',
              labelField: 'name',
              searchField: ['name', 'email'],
              sortField: [{ field: 'name', direction: 'asc' }, { field: 'email', direction: 'asc' }],
              options: peopleArray,
              render: {
                item: function item(_item3, escape) {
                  return '<div>' + (_item3.name ? '<span class="name">' + escape(_item3.name) + '</span>' : '') + (_item3.email ? '<span class="email">' + escape(_item3.email) + '</span>' : '') + '</div>';
                },
                option: function option(item, escape) {
                  var label = item.name || item.email;
                  var caption = item.name ? item.email : null;
                  return '<div>' + '<span class="label">' + escape(label) + '</span>' + (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') + '</div>';
                }
              },
              createFilter: function createFilter(input) {
                var match = void 0,
                    regex = void 0;

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
              create: function create(input) {
                if (new RegExp('^' + REGEX_EMAIL + '$', 'i').test(input)) {
                  return { email: input };
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

            event.getCcRecipients().forEach(function (value) {
              console.log(value);
              if (value.emailAddress !== secureEmailAddress) {
                //emails.push('#to ' + value.emailAddress);
                $selectcc[0].selectize.addOption({
                  name: value.name,
                  email: value.emailAddress
                });
                $selectcc[0].selectize.addItem(value.emailAddress);
              }
            });

            event.getBccRecipients().forEach(function (value) {
              console.log(value);
              if (value.emailAddress !== secureEmailAddress) {
                //emails.push('#to ' + value.emailAddress);
                $selectbcc[0].selectize.addOption({
                  name: value.name,
                  email: value.emailAddress
                });
                $selectbcc[0].selectize.addItem(value.emailAddress);
              }
            });

            // if (emails) {
            //   emails.forEach(function (email) {
            //     $select[0].selectize.addOption({email: email.substr(4)});
            //     $select[0].selectize.addItem(email.substr(4));
            //   });
            // }

          case 21:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, this);
  }
}));