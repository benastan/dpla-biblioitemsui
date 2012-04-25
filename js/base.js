;(function($, d, h, f, b) {
	var url = 'api',
		searchBox,
		resultsTarget,
		resultsContainer,
		noResultsMsg,
		SearchResult = b.Model.extend({
			toJSON: function() {
				var model = this,
					data = {};
				data.attributes = this.parsedAttributes();
				data.title = model.get('title');
				data.originalFields = this.origFields();
				return data;
			},
			get: function(attr) {
				var value = b.Model.prototype.get.apply(this, ['dpla.'+attr]);
				return value ? value : b.Model.prototype.get.apply(this, arguments);
			},
			origFields: function() {
				return this.parseFields(function(val, key) {
					return key.indexOf('dpla') === -1;
				});
			},
			parsedAttributes: function() {
				return this.parseFields(function(val, key) {
					return key.indexOf('dpla') !== -1;
				});
			},
			parseFields: function(filterFunction) {
				var fields = {};
				_.each(this.attributes, function(val, key) {
					if (filterFunction(val, key)) {
						fields[key] = val;
					}
				});
				return fields;
			}
		}),

		Search = b.Collection.extend({
			url: url,
			model: SearchResult,
			initialize: function(keywords, id) {
				this.keywords = keywords;
				this.id = 'search-result-'+id;
			},
			parse: function(rsp) {
				this.page = Math.floor(rsp.start / rsp.limit);
				return rsp.docs;
			},
			fetch: function(options) {
				options.data = {
					filter: 'dpla.keyword:'+this.keywords
				}
				return b.Collection.prototype.fetch.apply(this, [options])
			}
		}),

		SearchResultSet = b.View.extend({
			tagName: 'div',
			className: 'search-resultset',
			initialize: function(collection) {
				this.collection = collection;
			},
			render: function() {
				var tgt = this.$el,
					$ = this.$;
				_.each(this.collection.models, function(model) {
					console.log(model.origFields());
					var view = new SearchResultView();
					view.render(model);
					view.$el.appendTo(tgt);
				});
			}
		}),

		SearchResultView = b.View.extend({
			tagName: 'li',
			className: 'search-result',
			render: function(model) {
				var template = document.getElementById('SearchResultViewTemplate').innerHTML,
					originalFields,
					originalFieldsShowing,
					toggleFields,
					text = {
						'show': 'Hide fields',
						'hide': 'Show fields'
					},
					view = this;
				this.el.innerHTML = _.template(template, model.toJSON());
				toggleFields = this.$('.toggle');
				originalFields = this.$('.originalFields');
				originalFieldsShowing = originalFields.filter(':visible').length > 0;
				this.$('.toggle').click(function() {
					var method;
					originalFieldsShowing = originalFieldsShowing ? false : true;
					method = originalFieldsShowing ? 'show' : 'hide';
					view.$('.toggle').hide().filter(function() {
						return !$(this).hasClass(method);
					}).show();
					originalFields[method]();
				});
			}
		});
	$(function() {
		container = $('#container');
		resultsContainer = $('#results-container');
		resultsTarget = resultsContainer.find('.results');
		noResultsMsg = resultsContainer.find('.no-results');
		searchBox = $('input[type="text"]');
		var lastKeyTime = 0;
		searchBox.keyup(function(e) {
			lastKeyTime = e.timeStamp;
			var query = searchBox.val();
			_.delay(function() {
				if (lastKeyTime !== e.timeStamp) {
					return;
				}
				var s = new Search(query, e.timeStamp)
				s.fetch({
					success: function() {
						container.removeClass('no-search');
						var currentResults = resultsTarget.find('> div:visible');
						if (s.models.length) {
							noResultsMsg.hide();
							var view = new SearchResultSet(s);
							view.render();
							currentResults.hide()
							view.$el.appendTo(resultsTarget);
						} else {
							noResultsMsg.show();
						}
					}
				});
			}, 500);
		});
	});
})(jQuery, document, document.getElementsByTagName('head')[0], function() {}, Backbone)
