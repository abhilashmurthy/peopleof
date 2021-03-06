Meteor.subscribe("memberData");
Meteor.subscribe("userData");
Meteor.subscribe("placeData");

//////////////////////////////////////////////////////////////////////////////////////////////////////////// GLOBALS
var width = 1500;
var height = 1500;
var estMaxFriends = 750;
var radius = (width * height) / (100 * estMaxFriends);

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
			requestPermissions: Meteor.settings.public.fb.permissions
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

Template.map.rendered = function() {
	drawMap();
};

function clearMap() {
	d3.select("svg").remove();
}

function drawMap() {
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
				var targetNode = members.filter(function (n) { return n.id === sourceNode.friends[j]; })[0];
				if (targetNode) {
					links.push({
						source: sourceNode,
						target: targetNode
					});
				}
			};
		};

		//initialize force
		var force = d3.layout.force()
			.nodes(members)
			.links(links)
			.linkDistance(radius * 1.5)
			// .charge(function (d){
			// 	sourceLinks = links.filter(function (n) {return n.source.id === d.id});
			// 	return -1 * (1 - sourceLinks.length/members.length) * 500;
			// })
			.size([width *= 2 / 3, height *= 2 / 3])
			.on("tick", tick)
			.start();

		var link = svg.selectAll(".link")
			.data(force.links())
			.enter().append("line")
			.attr("class", "link")
			.style("stroke-width", 2);

		/*********************** Drag code ******************************/
	    var node_drag = d3.behavior.drag()
	        .on("dragstart", dragstart)
	        .on("drag", dragmove)
	        .on("dragend", dragend);

	    function dragstart(d, i) {
	        force.stop() // stops the force auto positioning before you start dragging
	    }

	    function dragmove(d, i) {
			node.attr("transform", function(d) {
				"translate(" + (d3.event.x - d.x) + "," + (d3.event.y - d.y) + ")"
			});
	        d.px += d3.event.dx;
	        d.py += d3.event.dy;
	        d.x += d3.event.dx;
	        d.y += d3.event.dy; 
	        tick(); // this is the key to make it work together with updating both px,py,x,y on d !
	    }

	    function dragend(d, i) {
	    	// force.resume();
	    }
	    /*********************** /Drag code ******************************/

		var node = svg.selectAll(".node")
			.data(force.nodes())
			.enter()
			.append("g")
			.attr("class", "node")
			.attr("id", function(member) {
				return member.id;
			})
			.on("click", function (d) {
				d3.event.stopPropagation();
				Session.set('selected', d.id);
				link
					.style("opacity", function (o) {
						return o.source.id === d.id || o.target.id === d.id ? 1 : 0.3;
					})
					.style("stroke", function (o) {
						return o.source.id === d.id || o.target.id === d.id ? "red" : "";
					})
			})
			.call(node_drag); //Switch between node_drag and force.drag

		/*********************** Force Tick code ******************************/
		function tick() {
			link.attr("x1", function(d) {
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

			node.attr("cx", function(d) { return d.x = Math.max(radius * 1.1, Math.min(width - radius * 1.1, d.x)); })
		   		.attr("cy", function(d) { return d.y = Math.max(radius * 1.1, Math.min(height - radius * 1.1, d.y)); });

			node.each(collide(0.15))
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
				});
		}

		// Resolves collisions between d and all other circles.
		function collide(alpha) {
		  var quadtree = d3.geom.quadtree(force.nodes());
		  return function(d) {
		    var r = radius * 4,
		        nx1 = d.x - r,
		        nx2 = d.x + r,
		        ny1 = d.y - r,
		        ny2 = d.y + r;
		    quadtree.visit(function(quad, x1, y1, x2, y2) {
		      if (quad.point && (quad.point !== d)) {
		        var x = d.x - quad.point.x,
		            y = d.y - quad.point.y,
		            l = Math.sqrt(x * x + y * y),
		            r = radius * 4;
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

		/*********************** /Force Tick code ******************************/

		svg.on("mousedown", function(){
			// force.start(); //Resume force on SVG click maybe?
			Session.set('selected', null);
			link
				.style("opacity", 1)
				.style("stroke", "")
		});

		//Append pictures
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

		//Append titles
		node.append("title")
			.text(function(member) {
				return member.name;
			});
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
	},
	'click button#grow': function(e) {
		var placeId = Session.get('place');
		$('.detailsMsg').show();
		Meteor.call('growNetwork', placeId, function(err, success) {
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