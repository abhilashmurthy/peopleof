Members = new Meteor.Collection("members");
Places = new Meteor.Collection("places");

var NonEmptyString = Match.Where(function(x) {
	check(x, String);
	return x.length !== 0;
});

var ConvertedNumber = Match.Where(function(x) {
	check(x, String);
	return parseInt(x) !== NaN;
});

Meteor.methods({
	createMember: function(fbData) {
		Members.insert({
			id: fbData.id,
			name: fbData.name,
			username: fbData.username
		});
	}
});