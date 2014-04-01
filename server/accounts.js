ServiceConfiguration.configurations.remove({
	service: "facebook"
});

ServiceConfiguration.configurations.insert({
	service: "facebook",
	appId: Meteor.settings.fb.appId,
	secret: Meteor.settings.fb.secret
});

Accounts.onCreateUser(function(options, user) {
	Meteor.call('createMember', user.services.facebook, function(err, data) {
		if (err) console.log(err);
	})
	return user;
});