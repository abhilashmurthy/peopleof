//Publish all users
Meteor.publish("members", function () {
  return Meteor.users.find();
});

//Public all places
Meteor.publish("places", function () {
	return Places.find();
});