Meteor.subscribe("memberData");
Meteor.subscribe("userData");
Meteor.subscribe("placeData");

//////////////////////////////////////////////////////////////////////////////////////////////////////////// DEFAULTS
Template.navbar.events = {
	'click .login-display-name': function(e) {
		window.open(Meteor.user().services.facebook.link, '_blank');
	}
}

Template.user_loggedout.events({
	'click #login': function(e) {
		$('.login2').show();
		Meteor.loginWithFacebook({
			requestPermissions: ['user_education_history', 'friends_education_history', 'user_work_history', 'friends_work_history']
		}, function(err) {
			if (err) console.log(err);
			else console.log('Logged in!');
		});
	}
});

Template.user_loggedin.events({
	'click #logout': function(e) {
		Meteor.logout(function(err) {
			if (err) console.log(err);
		});
	}
});

///////////////////////////////////////////////////////////////////////////////
// Place

Template.place.place = function() {
	var aPlace = Places.findOne();
	Session.set('place', aPlace && aPlace.facebookId);
	return Places.findOne();
}

///////////////////////////////////////////////////////////////////////////////
// Map display

Template.map.events({
	'click circle': function(event, template) {
		Session.set("selected", $(event.currentTarget).closest('g').attr('id'));
	},
});


Template.map.rendered = function() {
	var width = $('#mapPanel').width();
	var height = 300;
	var radius = 30;

	var svg = d3.select('#map').append("svg")
		.attr('width', width)
		.attr('height', height);

	var members = Members.find().fetch();

	var links = [];
	for (var i = members.length - 1; i >= 0; i--) {
		var sourceNode = members[i];
		for (var j = sourceNode.friends.length - 1; j >= 0; j--) {
			var targetNode = members.filter(function (n) { return n.id == sourceNode.friends[j]; })[0];
			links.push({
				source: sourceNode,
				target: targetNode
			});
		};
	};

	console.log('members:');
	console.log(members);
	console.log('links:');
	console.log(links);

	var force = d3.layout.force()
		.nodes(members)
		.links(links)
		.size([width, height])
		.linkDistance(120)
		.charge(-120)
		.on("tick", tick)
		.start();

	var link = svg.selectAll(".link")
		.data(force.links())
		.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", 3);

	var node = svg.selectAll(".node")
		.data(force.nodes())
		.enter()
		.append("g")
		.attr("class", "node")
		.attr("id", function(member) {
			return member.id;
		})
		.call(force.drag);

	node.append("defs")
		.append("pattern")
		.attr("id", function(member) {
			return "i_" + member.id;
		})
		.attr('patternUnits', 'userSpaceOnUse')
		.attr("x", radius)
		.attr("y", radius)
		.attr("height", radius * 2)
		.attr("width", radius * 2)
		.append("image")
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", radius * 2)
		.attr("width", radius * 2)
		.attr('xlink:href', function(member) {
			return "http://graph.facebook.com/" + member.id + "/picture" + "?type=square" + "&height=" + (radius * 2) + "&width=" + (radius * 2);
		});

	node.append("circle")
		.style("stroke", "gray")
		.style("fill", function(member) {
			return "url(#i_" + member.id + ")";
		})
		.attr("r", radius);

	node.append("title")
		.text(function(member) {
			return member.name;
		});

	function tick() {
		link
			.attr("x1", function(d) {
				return d.source.x;
			})
			.attr("y1", function(d) {
				return d.source.y;
			})
			.attr("x2", function(d) {
				return d.target.x;
			})
			.attr("y2", function(d) {
				return d.target.y;
			});

		node.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
	}
};

// Template.map.members = function() {
//   return Members.find();
// }

// Template.member.circle = function() {
//   var member = this; //cache this shit
//   var radius = 60;
//   var selectorId = "#" + member._id;

//   existing_circles = d3.select("#members").selectAll("g");
//   console.log("current # of things = " + existing_circles.size());

//   x_increment = (500 - 50) / ((existing_circles.size() ? existing_circles.size() : 1) + 2);
//   x_next = x_increment + 50;

//   Template.member._draw_existing(existing_circles, x_next, x_increment);

//   x_next = x_next + (x_increment * existing_circles.size());

//   setTimeout(function() {
//     circle = d3.select("#members").selectAll(selectorId);
//     circle_data = circle.data([member._id]);
//     g_container = circle_data.enter()
//       .append("g")
//       .classed("member", true)
//       .attr("id", function(d) {
//         return d;
//       })
//       .attr("transform", function(d) {
//         i = x_next;
//         x_next = x_next + x_increment;
//         return "translate(" + i + ",100)"
//       });

//     g_container.append("defs")
//       .append("pattern")
//       .attr("id", "i_" + member.id)
//       .attr('patternUnits', 'userSpaceOnUse')
//       .attr("x", radius)
//       .attr("y", radius)
//       .attr("height", 120)
//       .attr("width", 120)
//       .append("image")
//       .attr("x", 0)
//       .attr("y", 0)
//       .attr("height", 120)
//       .attr("width", 120)
//       .attr('xlink:href', "http://graph.facebook.com/" + member.id + "/picture?type=square&height=120&width=120");

//     g_container.append("circle")
//       .style("stroke", "gray")
//       .style("fill", "url(#i_" + member.id + ")")
//       .attr("r", radius);

//     g_container.append("text")
//       .text(member.name);
//   }, 0);
// }

// Template.member._draw_existing = function(existing_circles, x_next, x_increment) {
//   existing_circles
//     .transition()
//     .duration(750)
//     .style("stroke", "gray")
//     .attr("transform", function(d) {
//       i = x_next;
//       x_next = x_next + x_increment;
//       return "translate(" + i + ",100)"
//     });
// }

//////////////////////////////////////////////////////////////////////////////////////////////// DETAILS
Template.details.selected = function() {
	var member_id = Session.get('selected');
	if (member_id) return Members.findOne({id: member_id});
}

Template.details.events({
	'click button#build': function(e) {
		var placeId = Session.get('place');
		Meteor.call('testNetwork', placeId, function(err, data) {
			if (err) console.log(err);
		})
	},
	'click button#clear': function(e) {

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