Places = new Meteor.Collection("places");

//Insert SMU by default
Places.insert({
	name: "Singapore Management University",
	facebookId: "180428105317060"
});

var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

var ConvertedNumber = Match.Where(function (x) {
	check(x, String);
	return parseInt(x) !== NaN;
});

Meteor.methods({
	updateX: function(id, x) {
		Meteor.users.update(id, {
			$set: {x: x}
		});
	},
	updateY: function(id, y) {
		Meteor.users.update(id, {
			$set: {y: y}
		});
	}
});