//Publish all members
Meteor.publish("memberData", function() {
	return Members.find();
});

//Publish all users
Meteor.publish("userData", function() {
	return Meteor.users.find();
})

//Public all places
Meteor.publish("placeData", function() {
	return Places.find();
});

Meteor.startup(function() {
	Places.remove();
	//Insert SMU by default
	Places.insert({
		name: "Singapore Management University",
		facebookId: "180428105317060"
	});
});