(function(window, document) {
	var Observe = utilHelper.Observe;
	var BindEventsHelper = utilHelper.BindEventsHelper;

	var Paginate = function(options) {
		this.initialize(options);
	}

	Paginate.prototype = {
		constructor: Paginate,
		initialize: function(config){
			var DefaultOptions = {
				// 上一页 ，下一页文本.
				btns: ['上一页', '下一页'],
				// 总页数
				totalPage: 10,
				// 默认选中的页数
				currentPage: 1,
				// 当前页的最大紧邻前置页数（不包括最前面的显示页数）
				preposePagesCount: 2,
				// 当前页的最大紧邻后置页数
				postposePagesCount: 3,
				// 第一个"..."前显示的页数
				firstPagesCount: 2,
				// 第二个"..."后显示的页数
				lastPagesCount: 2
			};
			this.El = $('<div id="page_bar" class="paginate">');
			this.options = $.extend(true, DefaultOptions, config);
			this.render();
			this.setEvents();
		},

		addfn: function(obj) {
			var self = this;
			this.fnList = $.extend(self.fnList, obj, true);
		},

		setEvents: function() {
			var self = this;
			BindEventsHelper.setEvents({
				'click .page': 'turnPage',
				'click #page_button':'doSubmit'
				}, self, self.El, self, 345);
		},

		doSubmit: function() {
			var val = this.El.find('#page_input').val();
				num = Number(val);
			var totalPage = this.get('totalPage') > 0 ? this.get('totalPage') : 1;
			
			if (num <= totalPage && num >0){
				this._switchToPage(num);
			} else {
				this.trigger('errorSwitch', {page: val});
			}
		},

		turnPage: function(e) {
			if ($(e.target).hasClass('page-trigger-disable')) {
				return;
			}
			var target = $(e.target).closest('.page'),
				num = Number(target.attr('page'));
			this._switchToPage(num);
		},

		render: function(config) {
			var self = this;
			this.options = $.extend(self.options, config);
			this.renderUI();
		},

		renderUI: function() {
			this._resetPagination();
		},
		get: function(which){
			return this.options[which];
		},
		getBtnsContent: function(index) {
			if ($.type(index) != 'number') return '';
			if ($.type(this.options.btns) != 'array') {
				return '';
			}
			return this.options.btns[index] || '';
		},
		_resetPagination: function() {
			var paginationInner = '',
				totalPage = this.get('totalPage') > 0 ? this.get('totalPage') : 1,
				currPage = (this.get('currentPage') <= totalPage && this.get('currentPage')) > 0 ? this.get('currentPage') : 1,
				preposePagesCount = this.get('preposePagesCount') >= 0 ? this.get('preposePagesCount') : 2,
				postposePagesCount = this.get('postposePagesCount') >= 0 ? this.get('postposePagesCount') : 1,
				firstPagesCount = this.get('firstPagesCount') >= 0 ? this.get('firstPagesCount') : 2,
				lastPagesCount = this.get('lastPagesCount') >= 0 ? this.get('lastPagesCount') : 0,
				offset;

			// currPage前的页码展示
			var prevpage = currPage > 1 ? currPage - 1 : 1;
			if (currPage <= 1) {
				paginationInner += '<a class="page page-trigger page-trigger-prev page-trigger-disable">'+ this.getBtnsContent(0) +'</a>';				
			} else {
				paginationInner += '<a class="page page-trigger page-trigger-prev" page=' + 
									prevpage  + '>'+ this.getBtnsContent(0) +'</a>';	
			}


			if (currPage <= firstPagesCount + preposePagesCount + 1) {
				for(var i=1; i<currPage; i++) {
					paginationInner += this._renderActivePage(i);
				}

			} else {
				for(var i=1; i<=firstPagesCount; i++) {
					paginationInner += this._renderActivePage(i);
				}
				paginationInner += '<span class="page-breaker">...</span>';
				for(var i=currPage-preposePagesCount; i<=currPage-1; i++) {
					paginationInner += this._renderActivePage(i);
				}
			}

			// currPage的页码展示
			paginationInner += '<a class="page cur" page='+ currPage +'>' + currPage + '</a>';

			// currPage后的页码展示
			if (currPage >= totalPage - lastPagesCount - postposePagesCount) {
				offset = currPage + 1;
				for(var i=currPage+1; i<=totalPage; i++) {
					paginationInner += this._renderActivePage(i);
				}

			} else {
				for(var i=currPage+1; i<=currPage+postposePagesCount; i++) {
					paginationInner += this._renderActivePage(i);
				}
				paginationInner += '<span class="page-breaker">...</span>';
				for(var i=totalPage-lastPagesCount+1; i<=totalPage; i++) {
					paginationInner += this._renderActivePage(i);
				}
			}

			var houpage = currPage < totalPage ? currPage + 1 : totalPage;
			if (currPage >= totalPage) {
				paginationInner += '<a class="page page-trigger page-trigger-next page-trigger-disable">'+ this.getBtnsContent(1) +'</a>';
			} else {
				paginationInner += '<a class="page page-trigger page-trigger-next" page='+ houpage +'>'+ this.getBtnsContent(1) +'</a>';
			}

			paginationInner += '<span class="text marginbar">共'+ totalPage +'页  </span><span class="text">跳转到</span><input  id="page_input" type="text" ><span class="text">页</span> <a id="page_button" class="sure-btn" href="javascript:void(0)">确定</a>';

			this.El.html(paginationInner);
		},
		_renderActivePage: function(index) {
			return '<a class="page page-item-ui" page="' + index + '">' + index + '</a>';
		},
		destory: function() {
			var ele = this.El;
			this.El.remove();
			//this.undelegateEvents(ele);
			setEvents.undelegate(ele);
		},
		_switchToPage: function(page) {
			var self = this;
			if (self.has('switch')) { 
				// has subscribe 'switch' event.
				this.trigger('switch', {currentPage: page}, function(o){
					if (o && o.totalPage) {
						self.options.totalPage = o.totalPage;
					}
					self.options.currentPage = page;
					self._resetPagination();
				});
			} else {
				self.options.currentPage = page;
				self._resetPagination();
			}

		}		
	}

	Observe.make(Paginate.prototype);

	window.Paginate = Paginate;

})(window, document)