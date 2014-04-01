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
    Meteor.loginWithFacebook(function(err) {
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
  return Places.findOne();
}

///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function(element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return {
    x: x,
    y: y
  };
};

Template.map.events({
  'mousedown circle, mousedown text': function(event, template) {
    Session.set("selected", $(event.currentTarget).closest('g').attr('id'));
  },
});

Template.map.members = function() {
  return Members.find();
}

Template.member.circle = function() {
  var member = this; //cache this shit
  var radius = 60;

  existing_circles = d3.select("#members").selectAll("g");
  console.log("current # of things = " + existing_circles.size());

  x_increment = (500 - 50) / ((existing_circles.size() ? existing_circles.size() : 1) + 2);
  x_next = x_increment + 50;

  Template.member._draw_existing(existing_circles, x_next, x_increment);

  x_next = x_next + (x_increment * existing_circles.size());

  setTimeout(function() {
    circle = d3.select("#members").selectAll("#" + member._id)
    circle_data = circle.data([member._id]);
    g_container = circle_data.enter()
      .append("g")
      .classed("member", true)
      .attr("id", function(d) {
        return d;
      })
      .attr("transform", function(d) {
        i = x_next;
        x_next = x_next + x_increment;
        return "translate(" + i + ",100)"
      });

    g_container.append("defs")
      .append("pattern")
      .attr("id", "i_" + member.id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr("x", radius)
      .attr("y", radius)
      .attr("height", 120)
      .attr("width", 120)
      .append("image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", 120)
      .attr("width", 120)
      .attr('xlink:href', "http://graph.facebook.com/" + member.id + "/picture?type=square&height=120&width=120");

    g_container.append("circle")
      .style("stroke", "gray")
      .style("fill", "url(#i_" + member.id + ")")
      .attr("r", radius);

    g_container.append("text")
      .text(member.name);
  }, 0);
}

Template.member._draw_existing = function(existing_circles, x_next, x_increment) {
  existing_circles
    .transition()
    .duration(750)
    .style("stroke", "gray")
    .attr("transform", function(d) {
      i = x_next;
      x_next = x_next + x_increment;
      return "translate(" + i + ",100)"
    });
}

d3.selection.prototype.size = function() {
  var n = 0;
  this.each(function() {
    ++n;
  });
  return n;
};

// Template.map.rendered = function () {
//   var self = this;
//   self.node = self.find("svg#memberCircles");
//   self.pics = self.find("svg#profilePics");

//   if (! self.handle) {
//     self.handle = Deps.autorun(function () {
//       var selected = Session.get('selected');
//       var selectedMember = selected && Meteor.users.findOne(selected);
//       var radius = 60;

//       //Fill each circle with user's profile pic
//       // var updatePatterns = function (group) {
//       //   group
//       //   .attr("id", function (member) { return "pattern_" + member._id; })
//       //   .attr("heigth", 1)
//       //   .attr("width", 1)
//       //   .attr("patternUnits", "userSpaceOnUse")
//       //   .append("image")
//       //   .attr("id", function (member) {return member._id;})
//       //   .attr("x", 0)
//       //   .attr("y", 0)
//       //   .attr("xlink:href", function (member) {return "http://graph.facebook.com/" + member.services.facebook.id + "/picture?type=large";})
//       // };

//       // var patterns = d3.select(self.pics).select("#picDefs").selectAll("pattern")
//       //   .data(Meteor.users.find().fetch(), function (member) { return member._id; });

//       // updatePatterns(patterns.enter().append("pattern"));
//       // updatePatterns(patterns.transition().duration(250).ease("cubic-out"));
//       // patterns.exit().remove();

//       // Draw a circle for each member
//       var updateCircles = function (group) {
//         group
//         .attr("id", function (member) { return member._id; })
//         .attr("cx", function (member) { return member.x})        
//         .attr("cy", function (member) { return member.y})
//         .attr("r", radius)
//         .style({
//          "opacity": function (member) {
//              return selected === member._id ? 1 : 0.6;
//          }
//         });
//       };

//       var circles = d3.select(self.node).select(".circles").selectAll("circle")
//         .data(Meteor.users.find().fetch(), function (member) { return member._id; });

//       updateCircles(circles.enter().append("circle"));
//       updateCircles(circles.transition().duration(250).ease("cubic-out"));
//       circles.exit().transition().duration(250).attr("r", 0).remove();

//       // Label each with the current attendance count
//       var updateLabels = function (group) {
//         group.attr("id", function (member) { return member._id; })
//         .text(function (member) {return member.services.facebook.name;})
//         .attr("x", function (member) { return member.x; })
//         .attr("y", function (member) { return member.y })
//         .style('font-size', function (member) {
//           return 14 + "px";
//         });
//       };

//       var labels = d3.select(self.node).select(".labels").selectAll("text")
//         .data(Meteor.users.find().fetch(), function (member) { return member._id; });

//       updateLabels(labels.enter().append("text"));
//       updateLabels(labels.transition().duration(250).ease("cubic-out"));
//       labels.exit().remove();

//       // Draw a dashed circle around the currently selected member, if any
//       // var callout = d3.select(self.node).select("circle.callout")
//       //   .transition().duration(250).ease("cubic-out");
//       // if (selectedmember)
//       //   callout.attr("cx", selectedmember.x)
//       //   .attr("cy", selectedmember.y)
//       //   .attr("r", 40)
//       //   .attr("class", "callout")
//       //   .attr("display", '');
//       // else
//       //   callout.attr("display", 'none');
//     });
//   }
// };
// 
// Template.map.destroyed = function () {
//   this.handle && this.handle.stop();
// };

//////////////////////////////////////////////////////////////////////////////////////////////// DETAILS
Template.details.selected = function() {
  var member_id = Session.get('selected');
  if (member_id) return Members.findOne(member_id);
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