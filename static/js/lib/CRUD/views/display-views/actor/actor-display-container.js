/*global define*/
// Author: Cormac McGuire
// ### Description
// Display the actor element and it's related content

define (
  [
    'backbone', 'underscore', 'lib/Data/collections',
    'lib/streams',
    'lib/CRUD/views/display-views/actor/actor-container',
    'lib/CRUD/views/display-views/bulletin/bulletin-container',
    'lib/CRUD/views/display-views/incident/incident-container',
    'lib/CRUD/views/search-views/revision/revision-view',
    'lib/CRUD/views/display-views/misc/entity-not-found',
    'lib/CRUD/templates/display-templates/actor-display.tpl',
    'i18n!lib/CRUD/nls/dict'
  ],
  function (Backbone, _, Collections, Streams, ActorListView, 
    BulletinListView, IncidentListView, RevisionView, EntityNotFoundView,
    actorDisplayTmp, i18n) {
    'use strict';

    var ActorDisplayView,
        crudBus = Streams.crudBus,
        actorCollection = Collections.ActorCollection;

    // ### ActorDisplayView
    // Display and actor and all its related fields
    ActorDisplayView = Backbone.View.extend({
      className: 'actor-display-view',
      template: actorDisplayTmp,
      childViews: [],
      expanded: false,
      initialize: function(options) {
        this.addi18n();
        if (options.entityDetails === undefined) {
          throw new Error('you must define entityDetails');
        }
        this.expanded = options.entityDetails.expanded === undefined ?
          false : options.entityDetails.expanded;
          
        this.model = actorCollection.getEntity(options.entityDetails.id, 'actor');
        this.listenTo(this.model, 'sync', this.displayView.bind(this));
        this.listenTo(this.model, 'sync-error', this.displayNotFoundView.bind(this));
        this.listenTo(this, 'expand', this.toggleExpanded.bind(this));
      },

      displayNotFoundView: function() {
        this.destroyChildren();
        var entityNotFoundView = new EntityNotFoundView({
          entity: i18n.actor_label
        });
        this.childViews.push(entityNotFoundView);
        this.$el.html(entityNotFoundView.$el);
        return this;
      },

      // set the small template
      displayView: function() {
        this.render()
            .renderRelatedActors()
            .renderRelatedBulletins()
            .renderRelatedIncidents()
            .renderRevisions();
      },

      onDestroy: function() {
        this.stopListening();
        this.destroyChildren();
      },

      toggleExpanded: function() {
        if (this.expanded === true) {
          this.expanded = false;
          this.displayView();
          this.$el.removeClass('span-60p');
        }
        else {
          this.expanded = true;
          this.displayView();
          this.$el.addClass('span-60p');
        }
      },
      requestEdit: function() {
        crudBus.push({
          type: 'edit_actor_request',
          content: {
            model: this.model,
            expanded: this.expanded
          }
        });
      },

      destroyChildren: function() {
        _.invoke(this.childViews, 'destroy');
        this.childViews = [];
      },

      // get the containing el for normal and expanded view
      getContainerEl: function(className) {
        var el;
        if (this.expanded === true) {
          el = this.$el.children()
                       .children('.body')
                       .children('.' + className);
        }
        else {
          el = this.$el.children()
                       .children('.body')
                       .children('.' + className);
        }
        return el;
      },

      // render the related Actors
      renderRelatedActors: function() {
        var actorsEl, content, roles_en, actorsContainer;
        actorsEl = this.getContainerEl('actors');
        content = this.model.get('actors');
        roles_en = this.model.get('actor_roles_status');
        actorsContainer = new ActorListView({
          el: actorsEl,
          content: content,
          roles: roles_en,
          expanded: this.expanded
        });
        return this;
      },

      renderRevisions: function() {
        if (!this.isList('actor_comments', this.model)) {
          return this;
        }
        var revisionView = new RevisionView({
          el: '#revision-container',
          content: this.model.get('actor_comments')
        });
        this.childViews.push(revisionView);
        return this;
      },

      isList: function(key, model) {
        var field = model.get(key);
        return field !== undefined && field.length > 0;
      },

      // render the related bulletins
      renderRelatedBulletins: function() {
        var bulletinsEl, content, bulletinsContainer;
        bulletinsEl = this.getContainerEl('bulletins');
        content = this.model.get('related_bulletins');
        bulletinsContainer = new BulletinListView({
          el: bulletinsEl,
          content: content,
          expanded: this.expanded
        });
        return this;
      },

      // render the related incidents
      renderRelatedIncidents: function() {
        var incidentsEl, content, incidentsContainer; 
        incidentsEl = this.getContainerEl('incidents');
        content = this.model.get('related_incidents');
        incidentsContainer = new IncidentListView({
          el: incidentsEl,
          content: content,
          expanded: this.expanded
        });
        return this;
      },

      render: function() {
        this.destroyChildren();
        var html = this.template({
          model: this.model.toJSON(),
          i18n: i18n
        });
        this.$el.html(html);
        return this;
      }
    });
    return ActorDisplayView;
});

