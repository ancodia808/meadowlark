// slightly modified version of the official W3C HTML5 email regex:
// https://html.spec.whatwg.org/multipage/forms.html#valid-mail-address
exports.VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z-0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
                                   '[a-zA-Z-0-9](?:[a-zA-Z-0-9]{0,61}[a-zA-Z-0-9])?' +
                                   '(?:\.[a-zA-Z-0-9](?:[a-zA-Z-0-9]{0,61}[a-zA-Z-0-9])?)+$');
