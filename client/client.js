Meteor.subscribe("members");

//////////////////////////////////////////////////////////////////////////////////////////////////////////// DEFAULTS
Template.navbar.events = {
	'click .login-display-name': function(e) {
		window.open(Meteor.user().services.facebook.link, '_blank');
	}
}

Template.user_loggedout.events({
	'click #login': function(e) {
		$('.login2').show();
		Meteor.loginWithFacebook(function(err){
			if (err) console.log(err);
			else console.log('Logged in!');
		});
	}
});

Template.user_loggedin.events({
	'click #logout': function(e) {
		Meteor.logout(function(err){
			if (err) console.log(err);
		});
	}
});

//////////////////////////////////////////////////////////////////////////////////////////////// PLUGINS
//Pnotify settings
$.pnotify.defaults.history = false;
$.pnotify.defaults.delay = 3000;
function notify(title, message) {
	$.pnotify({
		title: title,
		text: message,
		type: "warning",
		icon: false,
		sticker: false,
		mouse_reset: false,
		animation: "fade",
		animate_speed: "fast",
		before_open: function(pnotify) {
			pnotify.css({
			  top: "52px",
			  left: ($(window).width() / 2) - (pnotify.width() / 2)
			});
		}
	});
}