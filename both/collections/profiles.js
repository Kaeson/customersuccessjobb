Profiles = new Mongo.Collection("experts"); //todo - rename underlying collection to reflect code refactor

Profiles.attachSchema(
  new SimpleSchema({
    userId: {
      type: String,
      autoValue: function() {
        if (this.isInsert) {
          return Meteor.userId();
        } else if (this.isUpsert) {
          return {
            $setOnInsert: Meteor.userId()
          };
        } else {
          this.unset();
        }
      },
      denyUpdate: true
    },
    userName: {
      type: String,
      label: "Användarnamn",
      autoValue: function() {
        if (this.isInsert) {
          return getUserName(Meteor.user());
        } else if (this.isUpsert) {
          return {
            $setOnInsert: getUserName(Meteor.user())
          };
        } else {
          this.unset();
        }
      }
    },
    customImageUrl: {
      type: String,
      optional: true
    },
    name: {
      type: String,
      label: "Namn",
      max: 128
    },
    type: {
      type: String,
      label: "Individual or Company",
      allowedValues: ["Individual", "Company"]
    },
    title: {
      type: String,
      label: "Titel",
      max: 128
    },
    location: {
      type: String,
      label: "Plats",
      max: 256
    },
    description: {
      type: String,
      label: "Beskrivning",
      max: 10000,
      autoform: {
        afFieldInput: SUMMERNOTE_OPTIONS
      }
    },
    // Automatically set HTML content based on markdown content
    // whenever the markdown content is set.
    htmlDescription: {
      type: String,
      optional: true,
      autoValue: function(doc) {
        var htmlContent = this.field("description");
        if (Meteor.isServer && htmlContent.isSet) {
          return cleanHtml(htmlContent.value);
        }
      }
    },
    availableForHire: {
      type: Boolean,
      label: "Öppen för nya utmaningar",
      defaultValue: false
    },
    interestedIn: {
      type: [String],
      label: "Intresserad av",
      allowedValues: JOB_TYPES,
      optional: true
    },
    contact: {
      type: String,
      label: "Kontaktinformation",
      max: 1024,
      optional: true
    },
    url: {
      type: String,
      label: "Personal URL",
      max: 1024,
      optional: true,
      regEx: SimpleSchema.RegEx.Url
    },
    resumeUrl: {
      type: String,
      label: "Resume URL",
      max: 1024,
      optional: true,
      regEx: SimpleSchema.RegEx.Url
    },
    githubUrl: {
      type: String,
      label: "GitHub URL",
      max: 1024,
      optional: true,
      regEx: SimpleSchema.RegEx.Url
    },
    linkedinUrl: {
      type: String,
      label: "LinkedIn URL",
      max: 1024,
      optional: true,
      regEx: SimpleSchema.RegEx.Url
    },
    stackoverflowUrl: {
      type: String,
      label: "Stackoverflow URL",
      max: 1024,
      optional: true,
      regEx: SimpleSchema.RegEx.Url
    },
    randomSorter: {
      type: Number,
      defaultValue: Math.floor(Math.random() * 10000)
    },
    status: {
      type: String,
      allowedValues: PROFILE_STATUSES,
      defaultValue: "active"
    },
    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    createdAt: {
      type: Date,
      autoValue: function() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return {
            $setOnInsert: new Date()
          };
        } else {
          this.unset();
        }
      },
      denyUpdate: true
    },
    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    updatedAt: {
      type: Date,
      autoValue: function() {
        if (this.isUpdate) {
          return new Date();
        }
      },
      denyInsert: true,
      optional: true
    }
  })
);

if (Meteor.isServer) {
  Profiles._ensureIndex({
    "userName": "text",
    "name": "text",
    "title": "text",
    "description": "text",
    "location": "text"
  });
}

Profiles.helpers({
  displayName: function() {
    return this.name || this.userName;
  },
  path: function() {
    return 'profiles/' + this._id + '/' + this.slug();
  },
  slug: function() {
    return getSlug(this.displayName() + ' ' + this.title);
  }
});

Profiles.allow({
  insert: function(userId, doc) {
    return userId && doc && userId === doc.userId;
  },
  update: function(userId, doc, fieldNames, modifier) {
    return Roles.userIsInRole(userId, ['admin']) || (!_.contains(fieldNames, 'randomSorter') && !_.contains(fieldNames, 'htmlDescription') && !_.contains(fieldNames, 'status') && userId && doc && userId === doc.userId);
  },
  remove: function(userId, doc) {
    return Roles.userIsInRole(userId, ['admin']) || (userId && doc && userId === doc.userId);
  },
  fetch: ['userId']
});
