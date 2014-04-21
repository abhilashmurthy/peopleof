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
		//Add new member
		Members.insert({
			id: fbData.id,
			name: fbData.name,
			username: fbData.username,
			friends: new Array()
		});
		//Update friend's friends
		Meteor.call('addFriend', friendId, fbData.id);
	},
	addFriend: function(userId, friendId) {
		Members.update({id: userId}, {
			$push: {friends: friendId}
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
				for (var i = 0; i < 20; i++) {
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
	},
	growNetwork: function(placeId) {
		//For each member, find friends and check if friends with others in network
		Meteor.call('getMembers', function (err, members){
			if (err) console.log(err);
			var batchRequests = new Array();
			for (var i = 0; i < members.length; i++) {
				if (i%50 === 0 && i > 0) {
					//Do stuff with the batch
					var mutualFriendsOfFriends = Meteor.call('getMutualFriendsBatched', batchRequests);
					console.log('Got mutual friends for ' + mutualFriendsOfFriends.length);
					updateMutualFriends(mutualFriendsOfFriends);
					batchRequests = new Array();
				}
				batchRequests.push({
					method: "GET",
					relative_url: members[i].id + "/mutualfriends",
					id: members[i].id
				});
				if (i === members.length - 1 && batchRequests.length > 0) {
					var mutualFriendsOfFriends = Meteor.call('getMutualFriendsBatched', batchRequests);
					console.log('Got mutual friends for ' + mutualFriendsOfFriends.length);
					updateMutualFriends(mutualFriendsOfFriends);
				}
			};
		});
		function updateMutualFriends(mutualFriendsOfFriends) {
			for (var j = mutualFriendsOfFriends.length - 1; j >= 0; j--) {
				var friendId = mutualFriendsOfFriends[j].id;
				var mutualFriends = mutualFriendsOfFriends[j].friends;
				console.log(friendId);
				console.log(mutualFriends);
				console.log("\n");
				for (var k = mutualFriends.length - 1; k >= 0; k--) {
					console.log('Adding friend ' + mutualFriends[k].name + ' to ' + friendId);
					Meteor.call('addFriend', friendId, mutualFriends[k].id);
				};
			};
		}
		return true;
	},
	getMutualFriendsBatched: function(requestsArray) {
		var fbAccessToken = Meteor.user().services.facebook.accessToken;
		var response = HTTP.post(
			"https://graph.facebook.com/",
			{"params": {"batch": JSON.stringify(requestsArray), "access_token": fbAccessToken}}
		);
		var dataChunk = response.data;
		var dataParts = new Array();
		for (var i = 0; i < dataChunk.length; i++) {
			var dataChunkBody = _.pick(dataChunk[i], "body");
			var bodyContent = JSON.parse(dataChunkBody.body);
			dataParts.push({
				id: requestsArray[i].id,
				friends: bodyContent.data
			});
		};
		return dataParts;
	}
});