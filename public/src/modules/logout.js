'use strict';

define('logout', ['hooks', 'alerts'], function (hooks, alerts) {
return function logout(redirect) {
redirect = redirect === undefined ? true : redirect;
hooks.fire('action:app.logout');

$.ajax(config.relative_path + '/logout', {
type: 'POST',
headers: {
'x-csrf-token': config.csrf_token,
},
beforeSend: function () {
app.flags._logout = true;
},
success: function (data) {
hooks.fire('action:app.loggedOut', data);
if (redirect) {
if (data && typeof data === 'object' && data.next) {
window.location.href = data.next;
} else {
window.location.href = 'https://theflyingdutchmen.games/logout?redirect=' + encodeURIComponent(window.location.origin + '/');
}
}
},
error: function (jqXHR) {
window.location.href = 'https://theflyingdutchmen.games/logout?redirect=' + encodeURIComponent(window.location.origin + '/');
},
});
};
});
