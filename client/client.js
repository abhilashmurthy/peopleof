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
  var selectorId = "#" + member._id;

  existing_circles = d3.select("#members").selectAll("g");
  console.log("current # of things = " + existing_circles.size());

  x_increment = (500 - 50) / ((existing_circles.size() ? existing_circles.size() : 1) + 2);
  x_next = x_increment + 50;

  Template.member._draw_existing(existing_circles, x_next, x_increment);

  x_next = x_next + (x_increment * existing_circles.size());

  setTimeout(function() {
    circle = d3.select("#members").selectAll(selectorId);
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

//////////////////////////////////////////////////////////////////////////////////////////////// DETAILS
Template.details.selected = function() {
  var member_id = Session.get('selected');
  if (member_id) return Members.findOne(member_id);
}

Template.details.events({
  'click button#build': function (e) {
    var placeId = Session.get('place');
    Meteor.call('testNetwork', placeId, function (err, data) {
      if (err) console.log(err);
    })
  },
  'click button#clear': function (e) {

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