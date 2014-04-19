Meteor.subscribe("memberData");
Meteor.subscribe("userData");
Meteor.subscribe("placeData");

//////////////////////////////////////////////////////////////////////////////////////////////////////////// GLOBALS
var height = 1000;
var radius = 30;

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
	drawMap();
};

function clearMap() {
	d3.select("svg").remove();
}

function drawMap() {
	var width = $('#mapPanel').width();

	var svg = d3.select('#map').append("svg")
		.attr('width', width)
		.attr('height', height);

	Meteor.call('getMembers', function (err, members){

		if (err) console.log(err);

		//generate links from nodes
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

			node
				// .each(collide(0.1))
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
		}

		// Resolves collisions between d and all other circles.
		function collide(alpha) {
		  var quadtree = d3.geom.quadtree(force.nodes());
		  return function(d) {
		    var r = radius * 2,
		        nx1 = d.x - r,
		        nx2 = d.x + r,
		        ny1 = d.y - r,
		        ny2 = d.y + r;
		    quadtree.visit(function(quad, x1, y1, x2, y2) {
		      if (quad.point && (quad.point !== d)) {
		        var x = d.x - quad.point.x,
		            y = d.y - quad.point.y,
		            l = Math.sqrt(x * x + y * y),
		            r = radius * 3;
		        if (l < r) {
		          l = (l - r) / l * alpha;
		          d.x -= x *= l;
		          d.y -= y *= l;
		          quad.point.x += x;
		          quad.point.y += y;
		        }
		      }
		      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
		    });
		  };
		}

	});
}

//////////////////////////////////////////////////////////////////////////////////////////////// DETAILS
Template.details.selected = function() {
	var member_id = Session.get('selected');
	if (member_id) return Members.findOne({id: member_id});
}

Template.details.events({
	'click button#build': function(e) {
		var placeId = Session.get('place');
		$('.detailsMsg').show();
		Meteor.call('buildNetwork', placeId, function(err, success) {
			if (err) console.log(err);
			if (success) {
				$('.detailsMsg').hide();
				clearMap();
				drawMap();
			}
		})
	},
	'click button#clear': function(e) {
		var placeId = Session.get('place');
		$('.detailsMsg').show();
		Meteor.call('resetNetwork', placeId, function(err, success) {
			if (err) console.log(err);
			if (success) {
				$('.detailsMsg').hide();
				clearMap();
				drawMap();
			}
		})
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