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
	createMember: function(fbData, friendId) {
		var existingMember = Members.find({id: fbData.id}).fetch();
		if (existingMember.length) return false;
		var friends = new Array();
		if (friendId) friends.push(friendId);
		Members.insert({
			id: fbData.id,
			name: fbData.name,
			username: fbData.username,
			friends: friends
		});
	},
	getMembers: function() {
		return Members.find().fetch();
	},
	buildNetwork: function(placeId) {
		if (Meteor.isServer) {
			var fbId = Meteor.user().services.facebook.id;
			var fbAccessToken = Meteor.user().services.facebook.accessToken;
			var query = "SELECT uid,name,username FROM user WHERE uid IN (SELECT uid1 FROM friend WHERE uid2=me()) AND placeId IN education";
			query = query.replace('placeId', placeId);
			var friendResult = null;
			try {
				friendResult = HTTP.get(
					"https://graph.facebook.com/fql",
					{"params": {"q": query, "access_token": fbAccessToken}}
				);
				var friendsInPlace = friendResult.data ? friendResult.data.data : null;
				console.log(friendsInPlace.length);
				if (!friendsInPlace) return false;
				for (var i = 0; i < 100; i++) {
					Meteor.call('createMember', {
						id: friendsInPlace[i].uid,
						name: friendsInPlace[i].name,
						username: friendsInPlace[i].username
					}, fbId);
				}
			} catch (e) {
				console.log(JSON.stringify(e));
				return false;
			}
			return true;
		}
	},
	resetNetwork: function(placeId) {
		var fbId = Meteor.user().services.facebook.id;
		Members.remove({
			id: {$ne: fbId}
		});
		return true;
	}
});