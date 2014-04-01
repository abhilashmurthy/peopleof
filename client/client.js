Meteor.subscribe("members");
Meteor.subscribe("places");

//////////////////////////////////////////////////////////////////////////////////////////////////////////// DEFAULTS
Template.navbar.events = {
	'click .login-display-name': function(e) {
		window.open(Meteor.user().services.facebook.link, '_blank');
	}
}

Template.user_loggedout.events({
	'click #login': function(e) {
		$('.login2').show();
		Meteor.loginWithFacebook(function(err){
			if (err) console.log(err);
			else console.log('Logged in!');
		});
	}
});

Template.user_loggedin.events({
	'click #logout': function(e) {
		Meteor.logout(function(err){
			if (err) console.log(err);
		});
	}
});

///////////////////////////////////////////////////////////////////////////////
// Place

Template.place.place = function() {
	return Places.findOne();
}

///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.map.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
});

Template.map.rendered = function () {
  var self = this;
  self.node = self.find("svg#memberCircles");
  self.pics = self.find("svg#profilePics");

  if (! self.handle) {
    self.handle = Deps.autorun(function () {
      var selected = Session.get('selected');
      var selectedMember = selected && Meteor.users.findOne(selected);
      var radius = 60;

      //Fill each circle with user's profile pic
      // var updatePatterns = function (group) {
      //   group
      //   .attr("id", function (member) { return "pattern_" + member._id; })
      //   .attr("heigth", 1)
      //   .attr("width", 1)
      //   .attr("patternUnits", "userSpaceOnUse")
      //   .append("image")
      //   .attr("id", function (member) {return member._id;})
      //   .attr("x", 0)
      //   .attr("y", 0)
      //   .attr("xlink:href", function (member) {return "http://graph.facebook.com/" + member.services.facebook.id + "/picture?type=large";})
      // };

      // var patterns = d3.select(self.pics).select("#picDefs").selectAll("pattern")
      //   .data(Meteor.users.find().fetch(), function (member) { return member._id; });

      // updatePatterns(patterns.enter().append("pattern"));
      // updatePatterns(patterns.transition().duration(250).ease("cubic-out"));
      // patterns.exit().remove();

      // Draw a circle for each member
      var updateCircles = function (group) {
        group
        .attr("id", function (member) { return member._id; })
        .attr("cx", function (member) {
        	if (member.x) {
        		return member.x;
        	} else {
        		var randX = Math.floor(Math.random() * $('#mapPanel').width()) + radius * 2;
        		Meteor.call("updateX", member._id, randX, function(err, data) {
        			if (err) console.log(err);
        		});
        		return randX;
        	}
        })        
        .attr("cy", function (member) {
        	if (member.y) {
        		return member.y;
        	} else {
        		var randY = Math.floor(Math.random() * $('#mapPanel').heigth()) + radius * 2;
        		Meteor.call("updateY", member._id, randY, function(err, data) {
        			if (err) console.log(err);
        		});
        		return randY;
        	}
        })
        .attr("r", radius)
        .style({
        	"opacity": function (member) {
          		return selected === member._id ? 1 : 0.6;
        	},
        	"fill": function (member) {
        		return "url(" + "#pattern_" + member._id + ")";
        	}
        });
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Meteor.users.find().fetch(), function (member) { return member._id; });
        
      updateCircles(circles.enter().append("circle"));
      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) {
        group.attr("id", function (member) { return member._id; })
        .text(function (member) {return member.services.facebook.name;})
        .attr("x", function (member) { return member.x; })
        .attr("y", function (member) { return member.y })
        .style('font-size', function (member) {
          return 14 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Meteor.users.find().fetch(), function (member) { return member._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();

      // Draw a dashed circle around the currently selected member, if any
      // var callout = d3.select(self.node).select("circle.callout")
      //   .transition().duration(250).ease("cubic-out");
      // if (selectedmember)
      //   callout.attr("cx", selectedmember.x)
      //   .attr("cy", selectedmember.y)
      //   .attr("r", 40)
      //   .attr("class", "callout")
      //   .attr("display", '');
      // else
      //   callout.attr("display", 'none');
    });
  }
};

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
};

//////////////////////////////////////////////////////////////////////////////////////////////// DETAILS
Template.details.selected = function() {
	var user_id = Session.get('selected');
	if (user_id) return Meteor.users.findOne(user_id);
}

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