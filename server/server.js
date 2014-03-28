//Publish all users
Meteor.publish("members", function () {
  return Meteor.users.find();
});