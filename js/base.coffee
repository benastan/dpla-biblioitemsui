url = 'api'
searchBox = false
resultsTarget = false
resultsContainer = false
noResultsMsg = false
SearchResult = Backbone.Model.extend
	toJSON: ->
		attributes: @parsedAttributes()
		title: @get('title')
		originalFields: @origFields()
	get: (attr) ->
		value = Backbone.Model.prototype.get.apply @, ['dpla.'+attr];
		value = if value then value else Backbone.Model.prototype.get.apply @, arguments
		if typeof value is 'string'
			value = value.replace(/\\\'/g, '\'').replace(/\\"/g, '"')
		value
	origFields: -> @parseFields (val, key) -> key.indexOf('dpla') is -1
	parsedAttributes: () -> @parseFields (val, key) -> key.indexOf('dpla') isnt -1
	parseFields: (filterFunction) ->
		fields = {};
		_.each @attributes, (val, key) ->
			if filterFunction val, key
				fields[key] = val
		fields
Search = Backbone.Collection.extend
	url: url
	model: SearchResult
	initialize: (keywords, id) ->
		@keywords = keywords;
		@id = 'search-result-'+id
	parse: (rsp) ->
		@page = Math.floor rsp.start / rsp.limit
		rsp.docs
	fetch: (options) ->
		options.data = {
			filter: 'dpla.keyword:'+@keywords
		}
		Backbone.Collection.prototype.fetch.apply @, [options]
SearchResultSet = Backbone.View.extend
	tagName: 'div'
	className: 'search-resultset'
	initialize: (collection) -> @collection = collection
	render: () ->
		_.each @collection.models, (model) =>
			view = new SearchResultView()
			view.render model
			view.$el.appendTo @$el
SearchResultView = Backbone.View.extend
	tagName: 'li'
	className: 'search-result'
	render: (model) ->
		template = document.getElementById('SearchResultViewTemplate').innerHTML
		text = 
			show: 'Hide fields'
			hide: 'Show fields'
		view = @;
		@el.innerHTML = _.template template, model.toJSON()
		toggleFields = @$('.toggle');
		originalFields = @$('.originalFields');
		originalFieldsShowing = originalFields.filter(':visible').length > 0
		@$('.toggle').click () ->
			originalFieldsShowing = if originalFieldsShowing then false else true
			method = if originalFieldsShowing then 'show' else 'hide'
			view.$('.toggle').hide().filter(() -> !$(@).hasClass method).show()
			originalFields[method]()
$ () ->
	container = $ '#container'
	resultsContainer = $ '#results-container'
	resultsTarget = resultsContainer.find '.results'
	noResultsMsg = resultsContainer.find '.no-results'
	searchBox = $ 'input[type="text"]'
	lastKeyTime = 0;
	searchBox.keyup (e) ->
		lastKeyTime = e.timeStamp
		query = searchBox.val()
		_.delay () ->
			if lastKeyTime isnt e.timeStamp
				return
			s = new Search query, e.timeStamp
			s.fetch
				success: () ->
					container.removeClass 'no-search'
					currentResults = resultsTarget.find '> div:visible'
					if s.models.length
						noResultsMsg.hide()
						view = new SearchResultSet s
						view.render()
						currentResults.hide()
						view.$el.appendTo resultsTarget
					else
						noResultsMsg.show();
		, 500